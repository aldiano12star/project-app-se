/**
 * Utilitas Normalisasi & Validasi Nomor WhatsApp Indonesia
 *
 * Mengubah input mentah berbagai format pengguna menjadi format standar E.164 / WA URI.
 * Contoh:
 * - "0812-3456-7890" -> "6281234567890"
 * - "+62 812 3456 7890" -> "6281234567890"
 * - "81234567890" -> "6281234567890"
 */

export function normalizeWhatsAppNumber(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;

  // 1. Bersihkan semua karakter non-digit (menghilangkan spasi, strip, tanda kurung, dsb.)
  const digits = raw.replace(/\D/g, "");

  // 2. Validasi panjang dasar (nomor seluler Indonesia umumnya 10 - 15 digit)
  if (digits.length < 10 || digits.length > 15) {
    return null;
  }

  // 3. Konversi format awalan ke kode negara 62
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("62")) {
    return digits;
  }

  // Jika user langsung mengetik "812..."
  if (digits.startsWith("8")) {
    return `62${digits}`;
  }

  return digits;
}
