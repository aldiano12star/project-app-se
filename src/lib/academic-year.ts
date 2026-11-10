/**
 * Helper Perhitungan Tahun Ajaran & Nomor Angkatan Dinamis (Auto-Gen Algorithm)
 * Saba ExploIT Digital Operating System
 *
 * Konteks Acuan:
 * - Tahun Ajaran berjalan dari 1 Juli (bulan ke-7) hingga 30 Juni (bulan ke-6) tahun berikutnya.
 * - Pada Tahun Ajaran 2026/2027:
 *     - Kelas 10 = Gen 21
 *     - Kelas 11 = Gen 20
 *     - Kelas 12 = Gen 19
 *
 * Rumus Umum:
 *   academicStartYear = bulan >= 7 ? tahun : tahun - 1
 *   offset = academicStartYear - 2026
 *   Gen = 21 - (gradeNum - 10) + offset
 */

export interface AcademicYearInfo {
  academicStartYear: number;
  academicEndYear: number;
  label: string; // Misal: "2026/2027"
}

export interface GenCalculationResult {
  gen: number;
  generationNumber: number;
  academicYear: string;
  classGrade: "KELAS_10" | "KELAS_11" | "KELAS_12";
  kelasLabel: "X" | "XI" | "XII";
  gradeNumber: 10 | 11 | 12;
}

/**
 * Mengambil informasi Tahun Ajaran berdasarkan kalender pendidikan Indonesia.
 */
export function getAcademicYear(currentDate: Date = new Date()): AcademicYearInfo {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1 - 12 (Jan - Des)

  // Jika bulan Juli (7) ke atas, masuk tahun ajaran baru (contoh: Juli 2026 -> TA 2026/2027)
  // Jika Januari - Juni, masih bagian semester genap tahun ajaran sebelumnya (contoh: Feb 2027 -> TA 2026/2027)
  const academicStartYear = month >= 7 ? year : year - 1;
  const academicEndYear = academicStartYear + 1;

  return {
    academicStartYear,
    academicEndYear,
    label: `${academicStartYear}/${academicEndYear}`,
  };
}

/**
 * Menghitung nomor generasi (Gen) secara dinamis tanpa meminta input manual dari pengguna.
 */
export function calculateGenFromGrade(
  grade: "KELAS_10" | "KELAS_11" | "KELAS_12" | 10 | 11 | 12 | string,
  currentDate: Date = new Date()
): GenCalculationResult {
  const { academicStartYear, label: academicYear } = getAcademicYear(currentDate);

  // Basis acuan: TA 2026/2027 (academicStartYear = 2026) -> Kelas 10 adalah Gen 21
  const BASE_YEAR = 2026;
  const BASE_GEN_10 = 21;
  const offset = academicStartYear - BASE_YEAR;

  // Normalisasi tingkat kelas
  let gradeNumber: 10 | 11 | 12 = 10;
  let classGrade: "KELAS_10" | "KELAS_11" | "KELAS_12" = "KELAS_10";
  let kelasLabel: "X" | "XI" | "XII" = "X";

  if (typeof grade === "number") {
    if (grade === 11) gradeNumber = 11;
    else if (grade === 12) gradeNumber = 12;
    else gradeNumber = 10;
  } else {
    const raw = String(grade).toUpperCase().trim();
    if (raw.includes("12") || raw.includes("XII")) {
      gradeNumber = 12;
    } else if (raw.includes("11") || raw.includes("XI")) {
      gradeNumber = 11;
    } else {
      gradeNumber = 10;
    }
  }

  if (gradeNumber === 11) {
    classGrade = "KELAS_11";
    kelasLabel = "XI";
  } else if (gradeNumber === 12) {
    classGrade = "KELAS_12";
    kelasLabel = "XII";
  } else {
    classGrade = "KELAS_10";
    kelasLabel = "X";
  }

  // Kelas 10: BASE_GEN_10 + offset
  // Kelas 11: BASE_GEN_10 - 1 + offset
  // Kelas 12: BASE_GEN_10 - 2 + offset
  const gen = BASE_GEN_10 - (gradeNumber - 10) + offset;

  return {
    gen,
    generationNumber: gen,
    academicYear,
    classGrade,
    kelasLabel,
    gradeNumber,
  };
}
