/**
 * Prisma Seed Script - Saba ExploIT Super App
 *
 * Menginisialisasi basis data dengan:
 * 1. Akun OPERATOR (Developer God-Mode) dari env INITIAL_OPERATOR_EMAIL
 * 2. Akun ADMIN Resmi (admin@saba.id) dengan kata sandi default 'saba2026'
 * 3. Seeding Akun Massal Anggota 5 Divisi (Programming, Technopreneur, Desain, Fotografi, Sinematografi)
 *    berbasis NISN dengan kata sandi terenkripsi bcrypt dan flag mustChangePassword: true
 * 4. Tahun Ajaran Aktif 2026/2027, Kas Periods, Event Sampel, & Arsip Dokumen
 */

import "dotenv/config";
import { PrismaClient, Role, ClassGrade, Division, MemberStatus, TransactionType, IncomeCategory, ExpenseCategory } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

// Pasang WebSocket constructor untuk eksekusi skrip tsx di runtime Node.js CLI
neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Memulai proses seeding data Saba ExploIT...");

  // Enkripsi kata sandi bawaan default (saba2026) dengan salt 10 rounds
  const defaultPasswordHash = await bcrypt.hash("saba2026", 10);

  // ============================================
  // 1. Akun OPERATOR (Developer / God-Mode)
  // ============================================
  const operatorEmail = process.env.INITIAL_OPERATOR_EMAIL || "fauzan@saba.id";

  const operator = await prisma.user.upsert({
    where: { email: operatorEmail.toLowerCase() },
    update: {
      role: Role.OPERATOR,
      status: MemberStatus.ACTIVE,
    },
    create: {
      email: operatorEmail.toLowerCase(),
      name: "Fauzan Arif Aldiano",
      role: Role.OPERATOR,
      mainDivision: Division.PROGRAMMING,
      classGrade: ClassGrade.KELAS_11,
      status: MemberStatus.ACTIVE,
      nisn: "0071230001",
      password: defaultPasswordHash,
      mustChangePassword: false,
    },
  });

  console.log(`✅ Verified/Created OPERATOR: ${operator.email}`);

  // ============================================
  // 2. Akun ADMIN Resmi (admin@saba.id)
  // ============================================
  const adminEmail = "admin@saba.id";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.ADMIN,
      status: MemberStatus.ACTIVE,
    },
    create: {
      email: adminEmail,
      name: "Pengurus Inti Saba ExploIT",
      role: Role.ADMIN,
      mainDivision: Division.PROGRAMMING,
      classGrade: ClassGrade.KELAS_11,
      status: MemberStatus.ACTIVE,
      nisn: "0071230002",
      password: defaultPasswordHash,
      mustChangePassword: true,
      noWhatsapp: "081234567890",
    },
  });

  console.log(`✅ Verified/Created ADMIN: ${admin.email}`);

  // ============================================
  // 3. Seeding Anggota 5 Divisi Berbasis NISN
  // ============================================
  interface SeedMember {
    nisn: string;
    name: string;
    division: Division;
    classGrade: ClassGrade;
    totalPoints: number;
    monthlyPoints: number;
    noWhatsapp?: string;
  }

  const sampleMembers: SeedMember[] = [
    // Divisi Programming
    {
      nisn: "0081010001",
      name: "Muhammad Rizky Pratama",
      division: Division.PROGRAMMING,
      classGrade: ClassGrade.KELAS_11, // Gen 20
      totalPoints: 120,
      monthlyPoints: 30,
      noWhatsapp: "081298765431",
    },
    {
      nisn: "0091010002",
      name: "Ahmad Dani Setiawan",
      division: Division.PROGRAMMING,
      classGrade: ClassGrade.KELAS_10, // Gen 21
      totalPoints: 60,
      monthlyPoints: 20,
      noWhatsapp: "081298765432",
    },
    // Divisi Technopreneurship
    {
      nisn: "0082020003",
      name: "Siti Nurhaliza",
      division: Division.TECHNOPRENEURSHIP,
      classGrade: ClassGrade.KELAS_11, // Gen 20
      totalPoints: 95,
      monthlyPoints: 25,
      noWhatsapp: "081298765433",
    },
    {
      nisn: "0092020004",
      name: "Bima Arya Kusuma",
      division: Division.TECHNOPRENEURSHIP,
      classGrade: ClassGrade.KELAS_10, // Gen 21
      totalPoints: 40,
      monthlyPoints: 10,
      noWhatsapp: "081298765434",
    },
    // Divisi Desain Grafis & UI/UX
    {
      nisn: "0083030005",
      name: "Anisa Rahmawati",
      division: Division.DESIGN,
      classGrade: ClassGrade.KELAS_11, // Gen 20
      totalPoints: 140,
      monthlyPoints: 45,
      noWhatsapp: "081298765435",
    },
    {
      nisn: "0093030006",
      name: "Nabila Zahra Putri",
      division: Division.DESIGN,
      classGrade: ClassGrade.KELAS_10, // Gen 21
      totalPoints: 75,
      monthlyPoints: 35,
      noWhatsapp: "081298765436",
    },
    // Divisi Fotografi
    {
      nisn: "0084040007",
      name: "Dimas Aditya Wardhana",
      division: Division.PHOTOGRAPHY,
      classGrade: ClassGrade.KELAS_11, // Gen 20
      totalPoints: 85,
      monthlyPoints: 20,
      noWhatsapp: "081298765437",
    },
    {
      nisn: "0094040008",
      name: "Kurniawan Dwi Santoso",
      division: Division.PHOTOGRAPHY,
      classGrade: ClassGrade.KELAS_10, // Gen 21
      totalPoints: 30,
      monthlyPoints: 10,
      noWhatsapp: "081298765438",
    },
    // Divisi Sinematografi
    {
      nisn: "0085050009",
      name: "Farhan Maulana Ghifari",
      division: Division.CINEMATOGRAPHY,
      classGrade: ClassGrade.KELAS_11, // Gen 20
      totalPoints: 110,
      monthlyPoints: 40,
      noWhatsapp: "081298765439",
    },
    {
      nisn: "0095050010",
      name: "Gita Larasati",
      division: Division.CINEMATOGRAPHY,
      classGrade: ClassGrade.KELAS_10, // Gen 21
      totalPoints: 50,
      monthlyPoints: 15,
      noWhatsapp: "081298765440",
    },
  ];

  let createdMembersCount = 0;

  for (const m of sampleMembers) {
    const email = `${m.nisn}@saba.internal`;
    await prisma.user.upsert({
      where: { nisn: m.nisn },
      update: {
        name: m.name,
        mainDivision: m.division,
        classGrade: m.classGrade,
        noWhatsapp: m.noWhatsapp,
      },
      create: {
        nisn: m.nisn,
        email,
        name: m.name,
        role: Role.ANGGOTA,
        mainDivision: m.division,
        classGrade: m.classGrade,
        status: MemberStatus.ACTIVE,
        password: defaultPasswordHash,
        mustChangePassword: true,
        totalPoints: m.totalPoints,
        monthlyPoints: m.monthlyPoints,
        noWhatsapp: m.noWhatsapp,
      },
    });
    createdMembersCount++;
  }

  console.log(`✅ Seeded ${createdMembersCount} anggota ekskul lintas 5 divisi (Gen 20 & 21) dengan password default 'saba2026'`);

  // ============================================
  // 4. Tahun Ajaran Aktif 2026/2027
  // ============================================
  const academicYear = await prisma.academicYear.upsert({
    where: { name: "2026/2027" },
    update: { isCurrent: true },
    create: {
      name: "2026/2027",
      isCurrent: true,
      startDate: new Date("2026-07-15"),
      endDate: new Date("2027-06-30"),
    },
  });

  console.log(`✅ Verified/Created Academic Year: ${academicYear.name}`);

  // ============================================
  // 5. Periode Kas Organisasi
  // ============================================
  const period1 = await prisma.kasPeriod.upsert({
    where: {
      academicYearId_periodNumber: {
        academicYearId: academicYear.id,
        periodNumber: 1,
      },
    },
    update: {},
    create: {
      academicYearId: academicYear.id,
      periodNumber: 1,
      name: "Kas Periode 1 - Juli 2026",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-31"),
      amount: 5000,
    },
  });

  const period2 = await prisma.kasPeriod.upsert({
    where: {
      academicYearId_periodNumber: {
        academicYearId: academicYear.id,
        periodNumber: 2,
      },
    },
    update: {},
    create: {
      academicYearId: academicYear.id,
      periodNumber: 2,
      name: "Kas Periode 2 - Agustus 2026",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-08-31"),
      amount: 5000,
    },
  });

  console.log("✅ Verified/Created Kas Periods (Juli & Agustus 2026)");

  console.log("\n🎉 Seeding selesai dengan sukses!");
  console.log("📋 Catatan Akun Login Default:");
  console.log("   - OPERATOR: " + operator.email);
  console.log("   - ADMIN: admin@saba.id (Password: saba2026)");
  console.log("   - ANGGOTA CONTOH: 0081010001@saba.internal (Password: saba2026)");
}

main()
  .catch((e) => {
    console.error("❌ Seeding gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
