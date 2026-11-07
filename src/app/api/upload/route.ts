import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticated } from "@/lib/rbac";
import { handleUploadBuffer } from "./uploader";

export async function POST(req: NextRequest) {
  try {
    // 1. Verifikasi Otentikasi Pengguna
    await assertAuthenticated();

    // 2. Ambil berkas dari FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Tidak ada berkas yang diunggah." },
        { status: 400 }
      );
    }

    // 3. Konversi File ke Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Proses unggah melalui uploader
    const result = await handleUploadBuffer(
      buffer,
      file.name || "upload.webp",
      file.type || "image/webp"
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Upload Route Error]:", error);

    const isAuthError =
      error.message?.includes("UNAUTHORIZED") || error.message?.includes("Sesi Anda");

    return NextResponse.json(
      {
        success: false,
        message: isAuthError
          ? "Sesi Anda tidak valid. Silakan masuk terlebih dahulu."
          : error.message || "Gagal memproses unggahan gambar.",
      },
      { status: isAuthError ? 401 : 400 }
    );
  }
}
