/**
 * Google Drive URL Parser & Direct CDN Converter
 *
 * Mengonversi link berbagi Google Drive (dari berbagai format) menjadi
 * link langsung via Google High-Speed CDN (lh3.googleusercontent.com/d/{ID}).
 */

export function parseGoogleDriveUrl(url: string): string {
  if (!url || typeof url !== "string") {
    return "";
  }

  const trimmed = url.trim();
  if (!trimmed.includes("drive.google.com")) {
    return trimmed;
  }

  // Pola 1: /d/<FILE_ID> (mencakup /file/d/..., /file/u/0/d/..., /d/...)
  const fileDMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
  }

  // Pola 2: id=<FILE_ID> pada query parameter (?id=... atau &id=...)
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idParamMatch[1]}`;
  }

  return trimmed;
}
