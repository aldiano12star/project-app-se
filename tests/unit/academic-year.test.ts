import { calculateGenFromGrade, getAcademicYear } from "../../src/lib/academic-year";

function runTests() {
  console.log("🧪 Menjalankan pengujian unit Auto-Gen Algorithm...");

  // 1. Uji Tahun Ajaran 2026/2027 (Konteks Saat Ini: Nov 2026)
  const nov2026 = new Date("2026-11-10T12:00:00Z");
  const ta2026 = getAcademicYear(nov2026);
  if (ta2026.label !== "2026/2027") {
    throw new Error(`Gagal: Harusnya 2026/2027, didapat: ${ta2026.label}`);
  }

  const k10_2026 = calculateGenFromGrade("KELAS_10", nov2026);
  if (k10_2026.gen !== 21 || k10_2026.kelasLabel !== "X") {
    throw new Error(`Gagal Kelas 10 TA 2026/2027: Harusnya Gen 21, didapat ${k10_2026.gen}`);
  }

  const k11_2026 = calculateGenFromGrade("KELAS_11", nov2026);
  if (k11_2026.gen !== 20 || k11_2026.kelasLabel !== "XI") {
    throw new Error(`Gagal Kelas 11 TA 2026/2027: Harusnya Gen 20, didapat ${k11_2026.gen}`);
  }

  const k12_2026 = calculateGenFromGrade("KELAS_12", nov2026);
  if (k12_2026.gen !== 19 || k12_2026.kelasLabel !== "XII") {
    throw new Error(`Gagal Kelas 12 TA 2026/2027: Harusnya Gen 19, didapat ${k12_2026.gen}`);
  }

  // 2. Uji Semester Genap TA 2026/2027 (contoh: Maret 2027 sebelum pergantian ajaran di Juli)
  const mar2027 = new Date("2027-03-15T08:00:00Z");
  const taMar2027 = getAcademicYear(mar2027);
  if (taMar2027.label !== "2026/2027") {
    throw new Error(`Gagal: Maret 2027 harusnya tetap TA 2026/2027, didapat: ${taMar2027.label}`);
  }
  const k10_mar2027 = calculateGenFromGrade(10, mar2027);
  if (k10_mar2027.gen !== 21) {
    throw new Error(`Gagal Maret 2027 Kelas 10: Harusnya Gen 21, didapat ${k10_mar2027.gen}`);
  }

  // 3. Uji Pergantian Tahun Ajaran Baru ke 2027/2028 (contoh: 15 Juli 2027)
  const jul2027 = new Date("2027-07-15T08:00:00Z");
  const taJul2027 = getAcademicYear(jul2027);
  if (taJul2027.label !== "2027/2028") {
    throw new Error(`Gagal: Juli 2027 harusnya masuk TA 2027/2028, didapat: ${taJul2027.label}`);
  }
  const k10_jul2027 = calculateGenFromGrade(10, jul2027);
  if (k10_jul2027.gen !== 22) {
    throw new Error(`Gagal Juli 2027 Kelas 10: Harusnya Gen 22, didapat ${k10_jul2027.gen}`);
  }
  const k11_jul2027 = calculateGenFromGrade(11, jul2027);
  if (k11_jul2027.gen !== 21) {
    throw new Error(`Gagal Juli 2027 Kelas 11: Harusnya Gen 21, didapat ${k11_jul2027.gen}`);
  }
  const k12_jul2027 = calculateGenFromGrade(12, jul2027);
  if (k12_jul2027.gen !== 20) {
    throw new Error(`Gagal Juli 2027 Kelas 12: Harusnya Gen 20, didapat ${k12_jul2027.gen}`);
  }

  // 4. Uji Fleksibilitas String Input ("10", "XI", "Kelas 12")
  if (calculateGenFromGrade("10", nov2026).gen !== 21) throw new Error("Gagal parsing '10'");
  if (calculateGenFromGrade("XI", nov2026).gen !== 20) throw new Error("Gagal parsing 'XI'");
  if (calculateGenFromGrade("Kelas 12", nov2026).gen !== 19) throw new Error("Gagal parsing 'Kelas 12'");

  console.log("✅ Semua pengujian unit Auto-Gen Algorithm berhasil 100%!");
}

runTests();
