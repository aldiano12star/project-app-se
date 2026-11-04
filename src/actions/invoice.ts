"use server";

import { prisma } from "@/lib/prisma";
import { assertAuthenticated, assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { InvoiceStatus, InvoiceType, NotifType, Role, TransactionCategory, TransactionType } from "@prisma/client";
import { broadcastNotification } from "@/lib/web-push";

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Mengambil daftar tagihan (Invoices) milik pengguna yang sedang login.
 */
export async function getUserInvoices() {
  try {
    const user = await assertAuthenticated();

    const invoices = await prisma.invoice.findMany({
      where: { userId: user.id },
      orderBy: [
        { status: "asc" }, // UNPAID terlebih dahulu
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    return {
      success: true,
      invoices,
    };
  } catch (error) {
    console.error("[Invoice] getUserInvoices error:", error);
    return {
      success: false,
      invoices: [],
    };
  }
}

/**
 * Mengambil seluruh tagihan untuk dikelola oleh Bendahara / Admin.
 */
export async function getAllInvoices() {
  try {
    await assertRole([Role.BENDAHARA, Role.ADMIN, Role.OPERATOR]);

    const invoices = await prisma.invoice.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            mainDivision: true,
            classGrade: true,
          },
        },
      },
      take: 100,
    });

    return {
      success: true,
      invoices,
    };
  } catch (error) {
    console.error("[Invoice] getAllInvoices error:", error);
    return {
      success: false,
      invoices: [],
    };
  }
}

/**
 * Membuat Tagihan Baru (Invoice) untuk satu atau beberapa anggota.
 * Otomatis menerbitkan personal Notification bertipe BILLING.
 * Hanya dapat dilakukan oleh BENDAHARA, ADMIN, atau OPERATOR.
 */
export async function createInvoice({
  userIds,
  title,
  amount,
  type,
  dueDate,
}: {
  userIds: string[];
  title: string;
  amount: number;
  type: InvoiceType;
  dueDate?: string | null;
}): Promise<ActionResponse> {
  try {
    await assertRole([Role.BENDAHARA, Role.ADMIN, Role.OPERATOR]);

    if (!userIds || userIds.length === 0) {
      return {
        success: false,
        message: "Pilih minimal satu anggota target tagihan.",
      };
    }

    if (!title || title.trim() === "") {
      return {
        success: false,
        message: "Judul tagihan tidak boleh kosong.",
      };
    }

    const cleanAmount = Math.round(Number(amount));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      return {
        success: false,
        message: "Nominal tagihan harus berupa angka positif lebih dari Rp 0.",
      };
    }

    const parsedDueDate = dueDate ? new Date(dueDate) : null;

    // Buat invoice dan notifikasi penagihan secara atomik per user
    await prisma.$transaction(async (tx) => {
      for (const userId of userIds) {
        await tx.invoice.create({
          data: {
            userId,
            title: title.trim(),
            amount: cleanAmount,
            type,
            status: InvoiceStatus.UNPAID,
            dueDate: parsedDueDate,
          },
        });

        // Terbitkan notifikasi personal peringatan tagihan (BILLING)
        await tx.notification.create({
          data: {
            userId,
            title: `Tagihan Baru: ${title.trim()}`,
            message: `Tagihan sebesar Rp ${cleanAmount.toLocaleString("id-ID")} telah diterbitkan. Silakan periksa dompet kas Anda.`,
            type: NotifType.BILLING,
            actionUrl: "/kas",
          },
        });
      }
    });

    revalidatePath("/kas");
    revalidatePath("/kotak-masuk");

    // Trigger Web Push Notification ke anggota yang menerima tagihan
    try {
      await broadcastNotification(
        {
          title: `Tagihan Kas: ${title.trim()}`,
          body: `Tagihan sebesar Rp ${cleanAmount.toLocaleString("id-ID")} telah diterbitkan oleh Bendahara. Cek dompet kas Anda.`,
          url: "/kas",
          tag: `billing-invoice`,
        },
        userIds
      );
    } catch (pushErr) {
      console.error("[Invoice] Gagal mengirim Web Push tagihan:", pushErr);
    }

    return {
      success: true,
      message: `Berhasil menerbitkan tagihan untuk ${userIds.length} anggota.`,
    };
  } catch (error) {
    console.error("[Invoice] createInvoice error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menerbitkan tagihan.",
    };
  }
}

/**
 * Membayar Tagihan menggunakan Saldo Dompet Digital anggota (kasBalance).
 * Dapat dieksekusi mandiri oleh pemilik tagihan (self-service) atau oleh Bendahara / Admin / Operator.
 * Internal transfer murni: memotong dompet & status PAID tanpa menyuntikkan INCOME ke buku kas riil.
 */
export async function payInvoiceWithWallet(invoiceId: string): Promise<ActionResponse> {
  try {
    const currentUser = await assertAuthenticated();

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { user: true },
    });

    if (!invoice) {
      return {
        success: false,
        message: "Tagihan tidak ditemukan.",
      };
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return {
        success: false,
        message: "Tagihan ini sudah lunas sebelumnya.",
      };
    }

    const isOfficer =
      currentUser.role === Role.BENDAHARA ||
      currentUser.role === Role.ADMIN ||
      currentUser.role === Role.OPERATOR;

    // Proteksi Otorisasi: Hanya pemilik tagihan atau pengurus yang berwenang
    if (invoice.userId !== currentUser.id && !isOfficer) {
      return {
        success: false,
        message: "Akses ditolak: Anda tidak memiliki izin untuk membayar tagihan ini.",
      };
    }

    if (invoice.user.kasBalance < invoice.amount) {
      return {
        success: false,
        message: `Saldo dompet tidak mencukupi (Saldo: Rp ${invoice.user.kasBalance.toLocaleString("id-ID")}, Tagihan: Rp ${invoice.amount.toLocaleString("id-ID")}). Silakan lakukan setoran ke Bendahara terlebih dahulu.`,
      };
    }

    // Ambil tahun ajaran aktif jika ada
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
      select: { id: true },
    });

    const now = new Date();

    // Transaksi Atomik: Potong Saldo Dompet & Update Invoice (Internal Transfer Murni)
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: invoice.userId },
        data: {
          kasBalance: { decrement: invoice.amount },
        },
      });

      await tx.ledgerTransaction.create({
        data: {
          academicYearId: currentAcademicYear?.id || null,
          userId: invoice.userId,
          type: TransactionType.BILL_DEDUCTION,
          category:
            invoice.type === InvoiceType.KAS
              ? TransactionCategory.TAGIHAN_RUTIN
              : TransactionCategory.TAGIHAN_INSIDENTAL,
          amount: invoice.amount,
          description: `Pelunasan: ${invoice.title}`,
          createdById: currentUser.id,
          date: now,
        },
      });

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.PAID,
        },
      });

      // Kirim konfirmasi notifikasi pelunasan
      await tx.notification.create({
        data: {
          userId: invoice.userId,
          title: "Tagihan Berhasil Dilunasi",
          message: `Pembayaran "${invoice.title}" sebesar Rp ${invoice.amount.toLocaleString("id-ID")} berhasil diselesaikan melalui dompet Anda.`,
          type: NotifType.BILLING,
          actionUrl: "/kas",
          createdAt: now,
        },
      });
    });

    revalidatePath("/kas");
    revalidatePath("/kotak-masuk");
    revalidatePath("/dashboard");
    return {
      success: true,
      message: `Tagihan "${invoice.title}" berhasil dilunasi.`,
    };
  } catch (error) {
    console.error("[Invoice] payInvoiceWithWallet error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal memproses pembayaran tagihan.",
    };
  }
}

/**
 * Bendahara menandai tagihan sebagai lunas manual (misal: pembayaran tunai/transfer langsung).
 */
export async function markInvoiceAsPaidManually(invoiceId: string): Promise<ActionResponse> {
  try {
    const officer = await assertRole([Role.BENDAHARA, Role.ADMIN, Role.OPERATOR]);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { user: true },
    });

    if (!invoice) {
      return {
        success: false,
        message: "Tagihan tidak ditemukan.",
      };
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return {
        success: false,
        message: "Tagihan ini sudah berstatus lunas.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.PAID,
        },
      });

      // Catat sebagai kas masuk riil
      await tx.ledgerTransaction.create({
        data: {
          userId: invoice.userId,
          type: TransactionType.INCOME,
          category:
            invoice.type === InvoiceType.KAS
              ? TransactionCategory.TAGIHAN_RUTIN
              : TransactionCategory.TAGIHAN_INSIDENTAL,
          amount: invoice.amount,
          description: `Pelunasan Manual (${invoice.title}) oleh ${officer.name || "Bendahara"}`,
        },
      });

      await tx.notification.create({
        data: {
          userId: invoice.userId,
          title: "Tagihan Diverifikasi Lunas",
          message: `Tagihan ${invoice.title} telah diverifikasi dan ditandai lunas oleh bendahara.`,
          type: NotifType.BILLING,
          actionUrl: "/kas",
        },
      });
    });

    revalidatePath("/kas");
    revalidatePath("/kotak-masuk");
    return {
      success: true,
      message: `Tagihan berhasil ditandai lunas.`,
    };
  } catch (error) {
    console.error("[Invoice] markInvoiceAsPaidManually error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal memproses status tagihan.",
    };
  }
}

/**
 * Pelunasan Kilat Tagihan oleh Bendahara via Dompet Anggota:
 * Memotong saldo dompet anggota secara langsung untuk melunasi tagihan (Internal Transfer).
 * TIDAK MENYUNTIKKAN INCOME GANDA: Jika saldo anggota kurang, bendahara WAJIB mencatat
 * uang fisik riil terlebih dahulu via "Catat Setoran".
 */
export async function quickSettleInvoice(invoiceId: string): Promise<ActionResponse> {
  try {
    const officer = await assertRole([Role.BENDAHARA, Role.ADMIN, Role.OPERATOR]);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            kasBalance: true,
          },
        },
      },
    });

    if (!invoice) {
      return {
        success: false,
        message: "Tagihan tidak ditemukan.",
      };
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return {
        success: false,
        message: "Tagihan ini sudah berstatus lunas.",
      };
    }

    // Proteksi Saldo: Mencegah uang hantu atau saldo negatif
    if (invoice.user.kasBalance < invoice.amount) {
      return {
        success: false,
        message: `Saldo anggota tidak mencukupi (Saldo: Rp ${invoice.user.kasBalance.toLocaleString("id-ID")}, Tagihan: Rp ${invoice.amount.toLocaleString("id-ID")}). Harap catat setoran uang riil terlebih dahulu via tombol "Catat Setoran".`,
      };
    }

    // Ambil tahun ajaran aktif jika ada
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
      select: { id: true },
    });

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Potong saldo dompet anggota sesuai nominal tagihan (BILL_DEDUCTION)
      await tx.user.update({
        where: { id: invoice.userId },
        data: {
          kasBalance: { decrement: invoice.amount },
        },
      });

      // 2. Catat mutasi internal sebagai pemotongan tagihan (Bukan pemasukan riil / kas baru)
      await tx.ledgerTransaction.create({
        data: {
          academicYearId: currentAcademicYear?.id || null,
          userId: invoice.userId,
          type: TransactionType.BILL_DEDUCTION,
          category:
            invoice.type === InvoiceType.KAS
              ? TransactionCategory.TAGIHAN_RUTIN
              : TransactionCategory.TAGIHAN_INSIDENTAL,
          amount: invoice.amount,
          description: `Pelunasan: ${invoice.title}`,
          createdById: officer.id,
          date: now,
        },
      });

      // 3. Update status invoice menjadi PAID
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.PAID,
        },
      });

      // 4. Terbitkan notifikasi konfirmasi pelunasan
      await tx.notification.create({
        data: {
          userId: invoice.userId,
          title: "Tagihan Berhasil Dilunasi",
          message: `Tagihan "${invoice.title}" sebesar Rp ${invoice.amount.toLocaleString(
            "id-ID"
          )} telah dilunasi dari dompet Anda dan diverifikasi oleh bendahara.`,
          type: NotifType.BILLING,
          actionUrl: "/kas",
          createdAt: now,
        },
      });
    });

    revalidatePath("/kas");
    revalidatePath("/kotak-masuk");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Tagihan "${invoice.title}" milik ${invoice.user.name} berhasil dilunasi.`,
    };
  } catch (error) {
    console.error("[Invoice] quickSettleInvoice error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal memproses pelunasan kilat.",
    };
  }
}
