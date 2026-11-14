import { calculateGenFromGrade, getAcademicYear } from "../../src/lib/academic-year";

function runTests() {
  console.log("🧪 Menjalankan pengujian unit Auto-Gen Algorithm...");

  // 1. Uji Tahun Ajaran Default Operasional (TA 2025/2026)
  const defaultTA = getAcademicYear();
  if (defaultTA.label !== "2025/2026") {
    throw new Error(`Gagal Default: Harusnya 2025/2026, didapat: ${defaultTA.label}`);
  }
  const defaultK10 = calculateGenFromGrade("KELAS_10");
  if (defaultK10.gen !== 21 || defaultK10.kelasLabel !== "X") {
    throw new Error(`Gagal Default Kelas 10: Harusnya Gen 21, didapat ${defaultK10.gen}`);
  }

  // 2. Uji Tahun Ajaran 2025/2026 Eksplisit (Nov 2025)
  const nov2025 = new Date("2025-11-10T12:00:00Z");
  const ta2025 = getAcademicYear(nov2025);
  if (ta2025.label !== "2025/2026") {
    throw new Error(`Gagal: Harusnya 2025/2026, didapat: ${ta2025.label}`);
  }

  const k10_2025 = calculateGenFromGrade("KELAS_10", nov2025);
  if (k10_2025.gen !== 21 || k10_2025.kelasLabel !== "X") {
    throw new Error(`Gagal Kelas 10 TA 2025/2026: Harusnya Gen 21, didapat ${k10_2025.gen}`);
  }

  const k11_2025 = calculateGenFromGrade("KELAS_11", nov2025);
  if (k11_2025.gen !== 20 || k11_2025.kelasLabel !== "XI") {
    throw new Error(`Gagal Kelas 11 TA 2025/2026: Harusnya Gen 20, didapat ${k11_2025.gen}`);
  }

  const k12_2025 = calculateGenFromGrade("KELAS_12", nov2025);
  if (k12_2025.gen !== 19 || k12_2025.kelasLabel !== "XII") {
    throw new Error(`Gagal Kelas 12 TA 2025/2026: Harusnya Gen 19, didapat ${k12_2025.gen}`);
  }

  // 3. Uji Semester Genap TA 2025/2026 (contoh: Maret 2026 sebelum pergantian ajaran di Juli)
  const mar2026 = new Date("2026-03-15T08:00:00Z");
  const taMar2026 = getAcademicYear(mar2026);
  if (taMar2026.label !== "2025/2026") {
    throw new Error(`Gagal: Maret 2026 harusnya tetap TA 2025/2026, didapat: ${taMar2026.label}`);
  }
  const k10_mar2026 = calculateGenFromGrade(10, mar2026);
  if (k10_mar2026.gen !== 21) {
    throw new Error(`Gagal Maret 2026 Kelas 10: Harusnya Gen 21, didapat ${k10_mar2026.gen}`);
  }

  // 4. Uji Pergantian Tahun Ajaran Baru ke 2026/2027 (contoh: 15 Juli 2026)
  const jul2026 = new Date("2026-07-15T08:00:00Z");
  const taJul2026 = getAcademicYear(jul2026);
  if (taJul2026.label !== "2026/2027") {
    throw new Error(`Gagal: Juli 2026 harusnya masuk TA 2026/2027, didapat: ${taJul2026.label}`);
  }
  const k10_jul2026 = calculateGenFromGrade(10, jul2026);
  if (k10_jul2026.gen !== 22) {
    throw new Error(`Gagal Juli 2026 Kelas 10: Harusnya Gen 22, didapat ${k10_jul2026.gen}`);
  }
  const k11_jul2026 = calculateGenFromGrade(11, jul2026);
  if (k11_jul2026.gen !== 21) {
    throw new Error(`Gagal Juli 2026 Kelas 11: Harusnya Gen 21, didapat ${k11_jul2026.gen}`);
  }
  const k12_jul2026 = calculateGenFromGrade(12, jul2026);
  if (k12_jul2026.gen !== 20) {
    throw new Error(`Gagal Juli 2026 Kelas 12: Harusnya Gen 20, didapat ${k12_jul2026.gen}`);
  }

  // 5. Uji Fleksibilitas String Input ("10", "XI", "Kelas 12")
  if (calculateGenFromGrade("10", nov2025).gen !== 21) throw new Error("Gagal parsing '10'");
  if (calculateGenFromGrade("XI", nov2025).gen !== 20) throw new Error("Gagal parsing 'XI'");
  if (calculateGenFromGrade("Kelas 12", nov2025).gen !== 19) throw new Error("Gagal parsing 'Kelas 12'");

  console.log("✅ Semua pengujian unit Auto-Gen Algorithm berhasil 100%!");
}

runTests();
