"use server";

import { prisma } from "@/lib/prisma";
import { assertAuthenticated, assertRole, assertActiveMember } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { Role, TaskStatus } from "@prisma/client";

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startDate: string; // ISO date or string
  endDate: string;
  driveUrl?: string;
  notulensiText?: string;
  autoGenerateSOP?: boolean;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  driveUrl?: string;
  notulensiText?: string;
}

export interface CreateTaskInput {
  sectionId: string;
  title: string;
  description?: string;
  dueDate?: string;
  isSOP?: boolean;
  assigneeId?: string;
}

/**
 * Membuat kegiatan baru beserta seksi & SOP otomatis (jika dipilih)
 * Wewenang: OPERATOR, ADMIN
 */
export async function createEvent(
  input: CreateEventInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await assertRole([Role.ADMIN, Role.OPERATOR]);

    if (!input.title || input.title.trim() === "") {
      return {
        success: false,
        message: "Nama kegiatan wajib diisi.",
      };
    }

    if (!input.startDate || !input.endDate) {
      return {
        success: false,
        message: "Tanggal mulai dan selesai kegiatan wajib ditentukan.",
      };
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {
        success: false,
        message: "Format tanggal tidak valid.",
      };
    }

    if (endDate < startDate) {
      return {
        success: false,
        message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
      };
    }

    // Ambil tahun ajaran aktif saat ini
    let academicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
    });

    if (!academicYear) {
      academicYear = await prisma.academicYear.findFirst({
        orderBy: { createdAt: "desc" },
      });
    }

    if (!academicYear) {
      return {
        success: false,
        message: "Tahun ajaran aktif belum dikonfigurasi dalam sistem.",
      };
    }

    // Buat event baru di database
    const newEvent = await prisma.event.create({
      data: {
        academicYearId: academicYear.id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        startDate,
        endDate,
        driveUrl: input.driveUrl?.trim() || null,
        notulensiText: input.notulensiText?.trim() || null,
        createdById: user.id,
      },
    });

    // Inisialisasi Seksi & SOP Standar secara otomatis jika diaktifkan
    if (input.autoGenerateSOP !== false) {
      // 1. Seksi Kesekretariatan & Logistik
      const secLogistik = await prisma.eventSection.create({
        data: {
          eventId: newEvent.id,
          name: "Seksi Kesekretariatan & Logistik",
        },
      });

      await prisma.eventTask.createMany({
        data: [
          {
            sectionId: secLogistik.id,
            title: "Penyusunan Proposal Kegiatan & Anggaran",
            description: "Membuat draft proposal dan koordinasi dengan Bendahara.",
            isSOP: true,
            status: TaskStatus.TODO,
          },
          {
            sectionId: secLogistik.id,
            title: "Surat Peminjaman Lab Komputer / Tempat ke Waka Sarpras",
            description: "Pengajuan surat perizinan tempat dan fasilitas.",
            isSOP: true,
            status: TaskStatus.TODO,
          },
          {
            sectionId: secLogistik.id,
            title: "Pengadaan Snack Peserta & Piagam Sertifikat",
            description: "Pemesanan konsumsi dan pencetakan sertifikat.",
            isSOP: false,
            status: TaskStatus.TODO,
          },
        ],
      });

      // 2. Seksi Acara & Pemateri
      const secAcara = await prisma.eventSection.create({
        data: {
          eventId: newEvent.id,
          name: "Seksi Acara & Pemateri",
        },
      });

      await prisma.eventTask.createMany({
        data: [
          {
            sectionId: secAcara.id,
            title: "Finalisasi Rundown Acara & Materi Studio",
            description: "Penyusunan timeline menit-ke-menit dan slide pemateri.",
            isSOP: true,
            status: TaskStatus.TODO,
          },
          {
            sectionId: secAcara.id,
            title: "Briefing Ice Breaking & Gladi Bersih Pembukaan",
            description: "Uji coba mic, sound, dan kesiapan MC/Pemandu.",
            isSOP: false,
            status: TaskStatus.TODO,
          },
        ],
      });

      // 3. Seksi Humas & Publikasi
      const secHumas = await prisma.eventSection.create({
        data: {
          eventId: newEvent.id,
          name: "Seksi Humas & Publikasi",
        },
      });

      await prisma.eventTask.createMany({
        data: [
          {
            sectionId: secHumas.id,
            title: "Distribusi Poster Feed IG Saba ExploIT",
            description: "Publikasi poster ke media sosial organisasi.",
            isSOP: true,
            status: TaskStatus.TODO,
          },
          {
            sectionId: secHumas.id,
            title: "Reminder H-1 Peserta via WhatsApp Blast",
            description: "Kirim pesan pengingat ke grup WhatsApp.",
            isSOP: false,
            status: TaskStatus.TODO,
          },
        ],
      });
    }

    revalidatePath("/acara");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Kegiatan baru dan struktur kepanitiaan berhasil dibuat.",
      data: { id: newEvent.id },
    };
  } catch (error) {
    console.error("Gagal membuat kegiatan:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Memperbarui data kegiatan
 * Wewenang: OPERATOR, ADMIN
 */
export async function updateEvent(
  eventId: string,
  input: UpdateEventInput
): Promise<ActionResponse> {
  try {
    await assertRole([Role.ADMIN, Role.OPERATOR]);

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return {
        success: false,
        message: "Kegiatan tidak ditemukan.",
      };
    }

    const updateData: {
      title?: string;
      description?: string | null;
      startDate?: Date;
      endDate?: Date;
      driveUrl?: string | null;
      notulensiText?: string | null;
    } = {};

    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.description !== undefined)
      updateData.description = input.description.trim() || null;
    if (input.startDate) updateData.startDate = new Date(input.startDate);
    if (input.endDate) updateData.endDate = new Date(input.endDate);
    if (input.driveUrl !== undefined)
      updateData.driveUrl = input.driveUrl.trim() || null;
    if (input.notulensiText !== undefined)
      updateData.notulensiText = input.notulensiText.trim() || null;

    await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    revalidatePath("/acara");
    revalidatePath(`/acara/${eventId}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Data kegiatan berhasil diperbarui.",
    };
  } catch (error) {
    console.error("Gagal memperbarui kegiatan:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Menambahkan seksi panitia baru ke kegiatan
 * Wewenang: OPERATOR, ADMIN
 */
export async function addEventSection(
  eventId: string,
  name: string,
  pjId?: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    await assertRole([Role.ADMIN, Role.OPERATOR]);

    if (!name || name.trim() === "") {
      return {
        success: false,
        message: "Nama seksi wajib diisi.",
      };
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return {
        success: false,
        message: "Kegiatan tidak ditemukan.",
      };
    }

    const section = await prisma.eventSection.create({
      data: {
        eventId,
        name: name.trim(),
        pjId: pjId || null,
        members: pjId ? { connect: { id: pjId } } : undefined,
      },
    });

    revalidatePath("/acara");
    revalidatePath(`/acara/${eventId}`);

    return {
      success: true,
      message: `Seksi "${section.name}" berhasil ditambahkan.`,
      data: { id: section.id },
    };
  } catch (error) {
    console.error("Gagal menambahkan seksi:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Menunjuk atau mengganti Penanggung Jawab (PJ) Seksi
 * Aturan Bisnis: PJ HANYA DAPAT DIPILIH DARI ANGGOTA YANG SUDAH BERGABUNG DI SEKSI TERSEBUT
 * Wewenang: OPERATOR, ADMIN
 */
export async function assignSectionPJ(
  sectionId: string,
  userId: string | null
): Promise<ActionResponse> {
  try {
    await assertRole([Role.ADMIN, Role.OPERATOR]);

    const section = await prisma.eventSection.findUnique({
      where: { id: sectionId },
      include: { members: true },
    });

    if (!section) {
      return {
        success: false,
        message: "Seksi kepanitiaan tidak ditemukan.",
      };
    }

    if (userId) {
      // Validasi ketat: User harus sudah termasuk dalam relasi members seksi ini
      const isMember = section.members.some((m) => m.id === userId);
      if (!isMember) {
        return {
          success: false,
          message:
            "Penanggung Jawab (PJ) harus dipilih dari anggota yang sudah bergabung di seksi ini.",
        };
      }

      await prisma.eventSection.update({
        where: { id: sectionId },
        data: {
          pjId: userId,
        },
      });
    } else {
      await prisma.eventSection.update({
        where: { id: sectionId },
        data: {
          pjId: null,
        },
      });
    }

    revalidatePath("/acara");
    revalidatePath(`/acara/${section.eventId}`);

    return {
      success: true,
      message: userId
        ? "Penanggung Jawab (PJ) seksi berhasil ditunjuk."
        : "Penanggung Jawab (PJ) seksi telah dikosongkan.",
    };
  } catch (error) {
    console.error("Gagal menunjuk PJ seksi:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Menambahkan anggota ke dalam seksi panitia (Mendukung multi-seksi)
 * Wewenang: OPERATOR, ADMIN, atau PJ Seksi terkait
 */
export async function addSectionMember(
  sectionId: string,
  userId: string
): Promise<ActionResponse> {
  try {
    const currentUser = await assertActiveMember();

    const section = await prisma.eventSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return {
        success: false,
        message: "Seksi kepanitiaan tidak ditemukan.",
      };
    }

    // Otorisasi: Hanya Admin, Operator, atau PJ Seksi yang dapat menambah anggota
    const isOfficer =
      currentUser.role === Role.ADMIN || currentUser.role === Role.OPERATOR;
    const isSectionPJ = section.pjId === currentUser.id;

    if (!isOfficer && !isSectionPJ) {
      return {
        success: false,
        message:
          "Hanya Penanggung Jawab (PJ) seksi ini atau Pengurus yang dapat menambahkan anggota.",
      };
    }

    await prisma.eventSection.update({
      where: { id: sectionId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
    });

    revalidatePath("/acara");
    revalidatePath(`/acara/${section.eventId}`);

    return {
      success: true,
      message: "Anggota berhasil ditambahkan ke dalam seksi.",
    };
  } catch (error) {
    console.error("Gagal menambahkan anggota seksi:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Menghapus anggota dari seksi panitia
 * Wewenang: OPERATOR, ADMIN, atau PJ Seksi terkait
 */
export async function removeSectionMember(
  sectionId: string,
  userId: string
): Promise<ActionResponse> {
  try {
    const currentUser = await assertActiveMember();

    const section = await prisma.eventSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return {
        success: false,
        message: "Seksi kepanitiaan tidak ditemukan.",
      };
    }

    const isOfficer =
      currentUser.role === Role.ADMIN || currentUser.role === Role.OPERATOR;
    const isSectionPJ = section.pjId === currentUser.id;

    if (!isOfficer && !isSectionPJ) {
      return {
        success: false,
        message:
          "Hanya Penanggung Jawab (PJ) seksi ini atau Pengurus yang dapat mengeluarkan anggota.",
      };
    }

    await prisma.eventSection.update({
      where: { id: sectionId },
      data: {
        members: {
          disconnect: { id: userId },
        },
        pjId: section.pjId === userId ? null : section.pjId,
      },
    });

    revalidatePath("/acara");
    revalidatePath(`/acara/${section.eventId}`);

    return {
      success: true,
      message: "Anggota berhasil dikeluarkan dari seksi.",
    };
  } catch (error) {
    console.error("Gagal mengeluarkan anggota seksi:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Menambahkan tugas baru ke suatu seksi panitia
 * Wewenang: Anggota aktif
 */
export async function addEventTask(
  input: CreateTaskInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    await assertActiveMember();

    if (!input.title || input.title.trim() === "") {
      return {
        success: false,
        message: "Judul tugas wajib diisi.",
      };
    }

    const section = await prisma.eventSection.findUnique({
      where: { id: input.sectionId },
    });

    if (!section) {
      return {
        success: false,
        message: "Seksi kepanitiaan tidak ditemukan.",
      };
    }

    const task = await prisma.eventTask.create({
      data: {
        sectionId: input.sectionId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        isSOP: input.isSOP || false,
        assigneeId: input.assigneeId || null,
        status: input.assigneeId ? TaskStatus.IN_PROGRESS : TaskStatus.TODO,
      },
    });

    revalidatePath("/acara");
    revalidatePath(`/acara/${section.eventId}`);

    return {
      success: true,
      message: "Tugas berhasil ditambahkan ke seksi.",
      data: { id: task.id },
    };
  } catch (error) {
    console.error("Gagal menambahkan tugas:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Mengambil / mengklaim tugas yang belum memiliki penanggung jawab (Self-Assign)
 * Wewenang: Anggota aktif
 */
export async function claimEventTask(taskId: string): Promise<ActionResponse> {
  try {
    const user = await assertActiveMember();

    const task = await prisma.eventTask.findUnique({
      where: { id: taskId },
      include: { assignee: true, section: true },
    });

    if (!task) {
      return {
        success: false,
        message: "Tugas tidak ditemukan.",
      };
    }

    if (task.assigneeId && task.assigneeId !== user.id) {
      return {
        success: false,
        message: `Tugas ini sudah diambil oleh ${task.assignee?.name || "anggota lain"}.`,
      };
    }

    await prisma.eventTask.update({
      where: { id: taskId },
      data: {
        assigneeId: user.id,
        status: task.status === TaskStatus.TODO ? TaskStatus.IN_PROGRESS : task.status,
      },
    });

    revalidatePath("/acara");
    revalidatePath(`/acara/${task.section.eventId}`);

    return {
      success: true,
      message: "Tugas berhasil diambil. Semangat berkontribusi!",
    };
  } catch (error) {
    console.error("Gagal mengambil tugas:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

export const claimTask = claimEventTask;

/**
 * Menandai tugas telah selesai dikerjakan oleh pelaksana dan siap diverifikasi oleh PJ
 * Wewenang: Anggota pelaksana (assignee) atau Pengurus
 */
export async function submitTaskCompletion(taskId: string): Promise<ActionResponse> {
  try {
    const user = await assertActiveMember();

    const task = await prisma.eventTask.findUnique({
      where: { id: taskId },
      include: { section: true },
    });

    if (!task) {
      return {
        success: false,
        message: "Tugas tidak ditemukan.",
      };
    }

    if (
      task.assigneeId &&
      task.assigneeId !== user.id &&
      user.role !== Role.ADMIN &&
      user.role !== Role.OPERATOR
    ) {
      return {
        success: false,
        message: "Hanya pelaksana tugas yang dapat menandai tugas selesai.",
      };
    }

    await prisma.eventTask.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.DONE,
        assigneeId: task.assigneeId || user.id,
      },
    });

    revalidatePath("/acara");
    revalidatePath(`/acara/${task.section.eventId}`);

    return {
      success: true,
      message: "Tugas ditandai selesai & siap diverifikasi oleh Penanggung Jawab (PJ).",
    };
  } catch (error) {
    console.error("Gagal menandai tugas selesai:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Mengubah status penyelesaian tugas (TODO -> IN_PROGRESS -> DONE)
 * Wewenang: Anggota aktif
 */
export async function updateTaskStatus(
  taskId: string,
  newStatus: TaskStatus
): Promise<ActionResponse> {
  try {
    const user = await assertActiveMember();

    const task = await prisma.eventTask.findUnique({
      where: { id: taskId },
      include: { section: true },
    });

    if (!task) {
      return {
        success: false,
        message: "Tugas tidak ditemukan.",
      };
    }

    // Jika belum ada assignee dan diubah ke IN_PROGRESS atau DONE, jadikan user sebagai assignee
    const updateData: { status: TaskStatus; assigneeId?: string } = {
      status: newStatus,
    };

    if (!task.assigneeId && newStatus !== TaskStatus.TODO) {
      updateData.assigneeId = user.id;
    }

    await prisma.eventTask.update({
      where: { id: taskId },
      data: updateData,
    });

    revalidatePath("/acara");
    revalidatePath(`/acara/${task.section.eventId}`);

    return {
      success: true,
      message: `Status tugas diperbarui menjadi ${newStatus}.`,
    };
  } catch (error) {
    console.error("Gagal mengubah status tugas:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Memverifikasi penyelesaian tugas oleh Penanggung Jawab (PJ) Seksi (+20 XP)
 * Aturan Otorisasi: HANYA PJ Seksi yang boleh memverifikasi tugas di seksinya (OPERATOR / ADMIN memiliki bypass).
 */
export async function verifyEventTask(taskId: string): Promise<ActionResponse> {
  try {
    const currentUser = await assertAuthenticated();

    const task = await prisma.eventTask.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        section: {
          include: {
            pj: true,
          },
        },
      },
    });

    if (!task) {
      return {
        success: false,
        message: "Tugas tidak ditemukan.",
      };
    }

    // VALIDASI OTORISASI: Hanya PJ Seksi terkait atau OPERATOR / ADMIN yang berhak memverifikasi
    const isOfficer =
      currentUser.role === Role.ADMIN || currentUser.role === Role.OPERATOR;
    const isSectionPJ = task.section.pjId === currentUser.id;

    if (!isOfficer && !isSectionPJ) {
      return {
        success: false,
        message: `Hanya Penanggung Jawab (PJ) seksi "${task.section.name}" atau Pengurus yang dapat memverifikasi tugas ini.`,
      };
    }

    // Update status tugas menjadi DONE dan catat verifier
    await prisma.eventTask.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.DONE,
        verifiedById: currentUser.id,
      },
    });

    // Berikan reward 20 XP kepada assignee jika belum pernah diberikan poin untuk tugas ini
    if (task.assigneeId && !task.pointsAwarded) {
      await prisma.user.update({
        where: { id: task.assigneeId },
        data: {
          monthlyPoints: { increment: 20 },
          totalPoints: { increment: 20 },
        },
      });

      await prisma.eventTask.update({
        where: { id: taskId },
        data: {
          pointsAwarded: true,
        },
      });
    }

    revalidatePath("/acara");
    revalidatePath(`/acara/${task.section.eventId}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Tugas berhasil diverifikasi! ${
        task.assignee ? `+20 XP diberikan kepada ${task.assignee.name}.` : ""
      }`,
    };
  } catch (error) {
    console.error("Gagal memverifikasi tugas:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

export const verifyTaskCompletion = verifyEventTask;

/**
 * Menandai notulensi rapat/kegiatan telah dibaca dan memberikan reward (+5 XP)
 * Wewenang: Anggota aktif
 */
export async function markNotulensiRead(meetingId: string): Promise<ActionResponse> {
  try {
    const user = await assertActiveMember();

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      return {
        success: false,
        message: "Sesi rapat/notulensi tidak ditemukan.",
      };
    }

    const existingLog = await prisma.notulensiReadLog.findUnique({
      where: {
        meetingId_userId: {
          meetingId,
          userId: user.id,
        },
      },
    });

    if (existingLog) {
      return {
        success: true,
        message: "Anda sudah pernah membaca notulensi ini sebelumnya.",
      };
    }

    // Catat log pembacaan
    await prisma.notulensiReadLog.create({
      data: {
        meetingId,
        userId: user.id,
      },
    });

    // Berikan 5 XP ke pengguna
    await prisma.user.update({
      where: { id: user.id },
      data: {
        monthlyPoints: { increment: 5 },
        totalPoints: { increment: 5 },
      },
    });

    revalidatePath("/acara");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Notulensi berhasil ditandai dibaca! (+5 XP ditambahkan)",
    };
  } catch (error) {
    console.error("Gagal menandai notulensi dibaca:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

export interface AddBudgetItemInput {
  name: string;
  quantity: number;
  unit?: string;
  estimatedPrice: number;
}

/**
 * Menambahkan rincian item Rancangan Anggaran Biaya (RAB) ke suatu acara.
 * Wewenang: ADMIN, OPERATOR
 */
export async function addBudgetItem(
  eventId: string,
  input: AddBudgetItemInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    await assertRole([Role.ADMIN, Role.OPERATOR]);

    if (!input.name || input.name.trim() === "") {
      return {
        success: false,
        message: "Nama barang/kebutuhan anggaran wajib diisi.",
      };
    }

    const quantity = Math.max(1, input.quantity || 1);
    const estimatedPrice = Math.max(0, input.estimatedPrice || 0);
    const totalPrice = quantity * estimatedPrice;
    const unit = input.unit?.trim() || "pcs";

    const newItem = await prisma.eventBudgetItem.create({
      data: {
        eventId,
        name: input.name.trim(),
        quantity,
        unit,
        estimatedPrice,
        totalPrice,
      },
    });

    revalidatePath("/acara");
    revalidatePath(`/acara/${eventId}`);

    return {
      success: true,
      message: "Item anggaran berhasil ditambahkan ke RAB acara.",
      data: { id: newItem.id },
    };
  } catch (error) {
    console.error("Gagal menambahkan item RAB:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal menambahkan item RAB.",
    };
  }
}

/**
 * Menghapus rincian item Rancangan Anggaran Biaya (RAB) dari suatu acara.
 * Wewenang: ADMIN, OPERATOR
 */
export async function deleteBudgetItem(
  itemId: string,
  eventId: string
): Promise<ActionResponse> {
  try {
    await assertRole([Role.ADMIN, Role.OPERATOR]);

    await prisma.eventBudgetItem.delete({
      where: { id: itemId },
    });

    revalidatePath("/acara");
    revalidatePath(`/acara/${eventId}`);

    return {
      success: true,
      message: "Item anggaran berhasil dihapus dari RAB.",
    };
  } catch (error) {
    console.error("Gagal menghapus item RAB:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal menghapus item RAB.",
    };
  }
}

