import { v2 as cloudinary } from "cloudinary";

export interface UploadResult {
  success: boolean;
  url: string;
  fallback?: boolean;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

/**
 * Memproses buffer gambar untuk diunggah ke Cloudinary atau diubah menjadi Data URL fallback.
 */
export async function handleUploadBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<UploadResult> {
  // Validasi tipe berkas
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    throw new Error(
      "Tipe berkas tidak didukung. Harap unggah gambar JPG, PNG, atau WebP."
    );
  }

  // Jika CLOUDINARY_URL disetel, unggah ke Cloudinary
  if (process.env.CLOUDINARY_URL) {
    try {
      const uploadPromise = new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "se_app/uploads",
            resource_type: "image",
            format: "webp",
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error("Gagal mengunggah ke Cloudinary"));
            } else {
              resolve(result as { secure_url: string });
            }
          }
        );
        stream.end(buffer);
      });

      const uploadRes = await uploadPromise;
      return {
        success: true,
        url: uploadRes.secure_url,
      };
    } catch (error) {
      console.warn(
        "[Uploader] Gagal mengunggah ke Cloudinary, menggunakan fallback lokal:",
        error
      );
    }
  }

  // Fallback aman jika Cloudinary belum disetel atau gagal: Kembalikan Base64 Data URL
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  return {
    success: true,
    url: dataUrl,
    fallback: true,
  };
}
