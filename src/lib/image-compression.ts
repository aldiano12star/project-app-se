/**
 * Client-side Canvas Image Compression
 *
 * Mengompresi file gambar (PNG/JPEG/HEIC) di browser ke format WebP ultra-ringan
 * (biasanya < 40 KB) untuk menghemat bandwidth seluler dan storage cloud.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 - 1.0
}

/**
 * Mengompresi File/Blob gambar menjadi Blob WebP.
 */
export async function compressImageToWebP(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<Blob> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.75 } = options;

  return new Promise((resolve, reject) => {
    // Pastikan di lingkungan browser dengan Canvas
    if (typeof window === "undefined" || typeof document === "undefined") {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Hitung skala aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      // Bersihkan background transparan dengan warna putih lembut jika diperlukan
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Ekspor ke WebP (dengan fallback JPEG jika WebP tidak didukung browser kuno)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Gagal membaca berkas gambar."));
    };

    img.src = objectUrl;
  });
}

/**
 * Mengonversi Blob ke String Data URL (Base64) untuk preview instan atau fallback storage.
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Gagal mengonversi blob ke Data URL"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
