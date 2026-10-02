# Architecture_and_SDD.md (System Design & Database Architecture)

## 1. System Topology & Directory Structure

```text
saba-exploit-app/
├── prisma/
│   ├── schema.prisma             # Skema Relasional Prisma (Updated)
│   └── seed.ts                   # Inisialisasi Operator, Admin, & SOP Default
├── src/
│   ├── actions/                  # Next.js Server Actions
│   │   ├── auth.actions.ts
│   │   ├── kas.actions.ts        # Mutasi Kas, Periode, & Advance Payment
│   │   ├── event.actions.ts      # Workspace, Seksi, Task SOP, & Notulensi Acara
│   │   ├── attendance.actions.ts # Sesi Rapat, Token Dinamis QR, & Scan Claim
│   │   ├── showcase.actions.ts   # Publikasi Karya 5 Divisi
│   │   ├── aspiration.actions.ts # Kotak Suara 3 Saluran & Multi-Vote Polling
│   │   └── admin.actions.ts      # Rollover Tahunan & Reset Podium Bulanan
│   ├── app/                      # App Router (5 Bottom Tabs + 1 Restricted Route)
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx        # Shell Navigasi 5 Tab Bawah
│   │   │   ├── page.tsx          # Tab 1: Beranda (QR, Kas Personal, 2 Gen Box, Podium)
│   │   │   ├── events/           # Tab 2: Acara (Kalender Mengular & Workspace)
│   │   │   │   ├── page.tsx
│   │   │   │   └── [eventId]/page.tsx
│   │   │   ├── showcase/page.tsx # Tab 3: Galeri Karya
│   │   │   ├── arsip/page.tsx    # Tab 4: Arsip & Belajar
│   │   │   ├── suara/page.tsx    # Tab 5: Kotak Suara (3 Saluran) & Polling
│   │   │   ├── kas/kelola/       # RESTRICTED: Panel Pembukuan Bendahara & Operator
│   │   │   │   └── page.tsx
│   │   │   └── profil/page.tsx   # Profil, Akumulasi Poin Tahunan, & Hall of Fame
│   ├── components/
│   │   ├── ui/                   # Button, Card, Badge, Modal, Input
│   │   ├── navigation/           # MobileBottomNav (5 Tab), DesktopSidebar
│   │   ├── home/                 # QRScannerModal, KasPersonalCard, GenComplianceCard, PodiumTop3
│   │   ├── events/               # SnakingCalendar, TaskBoard, EventNotulensiTab
│   │   ├── kas/                  # KasMatrixTable, AdvancePaymentModal
│   │   └── suara/                # TriChannelForm, DynamicPollCard
│   ├── lib/
│   │   ├── auth.ts               # Auth.js v5 Google OAuth Whitelist
│   │   ├── db.ts                 # Neon Serverless Pooler Singleton
│   │   └── rbac.ts               # Helper Validasi dengan Operator Bypass
│   └── middleware.ts             # Proteksi Rute Edge
```

---

## 2. Updated Prisma Relational Schema

Simpan skema ini pada `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

enum Role {
  ADMIN
  BENDAHARA
  ANGGOTA
  OPERATOR // Pengembang aplikasi / God-Mode Debugger
}

enum ClassGrade {
  KELAS_10
  KELAS_11
  KELAS_12
}

enum MemberStatus {
  ACTIVE
  DEMISIONER
}

enum Division {
  PROGRAMMING
  DESIGN
  PHOTOGRAPHY
  CINEMATOGRAPHY
  TECHNOPRENEURSHIP
}

enum TransactionType {
  INCOME
  EXPENSE
}

enum IncomeCategory {
  KAS_RUTIN
  DANA_USAHA
  DONASI
  SPONSOR
  SALDO_AWAL
}

enum ExpenseCategory {
  ACARA
  KONSUMSI
  LOGISTIK
  KESEKRETARIATAN
  LAINNYA
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum AttendanceStatus {
  HADIR
  IZIN
  SAKIT
  ALPA
}

enum AspirationType {
  PUBLIC
  PRIVATE_MEMBER
  OPERATOR_SUPPORT // Laporan kendala teknis / fitur ke Operator
}

model User {
  id            String       @id @default(cuid())
  name          String
  email         String       @unique
  image         String?
  role          Role         @default(ANGGOTA)
  classGrade    ClassGrade   @default(KELAS_10)
  mainDivision  Division
  status        MemberStatus @default(ACTIVE)
  monthlyPoints Int          @default(0) // Direset tiap awal bulan untuk Podium
  totalPoints   Int          @default(0) // Akumulasi poin tahunan di profil
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  kasPayments           KasPayment[]
  createdTransactions   Transaction[]         @relation("TransactionCreator")
  assignedTasks         EventTask[]           @relation("TaskAssignee")
  verifiedTasks         EventTask[]           @relation("TaskVerifier")
  createdEvents         Event[]               @relation("EventCreator")
  attendances           Attendance[]
  createdMeetings       Meeting[]             @relation("MeetingCreator")
  readNotulensiLogs     NotulensiReadLog[]
  showcaseContributions ShowcaseContributor[]
  createdShowcases      Showcase[]            @relation("ShowcaseCreator")
  sentAspirations       Aspiration[]          @relation("AspirationSender")
  receivedAspirations   Aspiration[]          @relation("AspirationReceiver")
  pollVotes             PollVote[]

  @@index([email])
  @@index([role])
  @@index([status])
  @@index([monthlyPoints])
}

model AcademicYear {
  id          String        @id @default(cuid())
  name        String        @unique // Contoh: "2026/2027"
  isCurrent   Boolean       @default(false)
  startDate   DateTime
  endDate     DateTime
  createdAt   DateTime      @default(now())

  kasPeriods   KasPeriod[]
  transactions Transaction[]
  events       Event[]
  meetings     Meeting[]
  showcases    Showcase[]
  polls        Poll[]

  @@index([isCurrent])
}

model KasPeriod {
  id             String       @id @default(cuid())
  academicYearId String
  periodNumber   Int
  name           String       // Contoh: "Kas Periode 1 - Agustus"
  startDate      DateTime
  endDate        DateTime
  amount         Int          @default(5000)
  createdAt      DateTime     @default(now())

  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Cascade)
  payments       KasPayment[]

  @@unique([academicYearId, periodNumber])
  @@index([academicYearId])
}

model KasPayment {
  id          String    @id @default(cuid())
  kasPeriodId String
  userId      String
  amountPaid  Int       @default(5000)
  paidAt      DateTime  @default(now())
  recordedBy  String

  kasPeriod   KasPeriod @relation(fields: [kasPeriodId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([kasPeriodId, userId])
  @@index([userId])
}

model Transaction {
  id              String           @id @default(cuid())
  academicYearId  String
  type            TransactionType
  incomeCategory  IncomeCategory?
  expenseCategory ExpenseCategory?
  amount          Int
  description     String
  proofUrl        String?          // URL Google Drive Nota/Kuitansi
  date            DateTime         @default(now())
  createdById     String
  createdAt       DateTime         @default(now())

  academicYear    AcademicYear     @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  createdBy       User             @relation("TransactionCreator", fields: [createdById], references: [id])

  @@index([academicYearId])
  @@index([type])
}

model Event {
  id             String         @id @default(cuid())
  academicYearId String
  title          String
  description    String?
  startDate      DateTime
  endDate        DateTime
  driveUrl       String?        // Tautan Root Folder Google Drive Acara
  notulensiText  String?        // Notulensi terintegrasi khusus acara ini
  createdById    String
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  academicYear   AcademicYear   @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  createdBy      User           @relation("EventCreator", fields: [createdById], references: [id])
  sections       EventSection[]

  @@index([academicYearId])
  @@index([startDate])
}

model EventSection {
  id        String      @id @default(cuid())
  eventId   String
  name      String      // Seksi Acara, Korlap, Humas, Kesekretariatan
  createdAt DateTime    @default(now())

  event     Event       @relation(fields: [eventId], references: [id], onDelete: Cascade)
  tasks     EventTask[]

  @@index([eventId])
}

model EventTask {
  id             String       @id @default(cuid())
  sectionId      String
  title          String
  description    String?
  status         TaskStatus   @default(TODO)
  dueDate        DateTime?
  assigneeId     String?
  isSOP          Boolean      @default(false)
  verifiedById   String?
  pointsAwarded  Boolean      @default(false)
  createdAt      DateTime     @default(now())

  section        EventSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  assignee       User?        @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  verifiedBy     User?        @relation("TaskVerifier", fields: [verifiedById], references: [id], onDelete: SetNull)

  @@index([sectionId])
  @@index([assigneeId])
}

model SOPTemplate {
  id             String   @id @default(cuid())
  title          String
  defaultSection String
  order          Int      @default(0)
  createdAt      DateTime @default(now())
}

model Meeting {
  id             String             @id @default(cuid())
  academicYearId String
  title          String             // Rapat Pleno Umum
  date           DateTime           @default(now())
  qrToken        String?            // Token unik sesi QR dinamis
  qrExpiresAt    DateTime?          // Batas kedaluwarsa QR
  notes          String?            // Notulensi Rapat Pleno
  createdById    String
  createdAt      DateTime           @default(now())

  academicYear   AcademicYear       @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  createdBy      User               @relation("MeetingCreator", fields: [createdById], references: [id])
  attendances    Attendance[]
  readLogs       NotulensiReadLog[]

  @@index([academicYearId])
}

model Attendance {
  id          String           @id @default(cuid())
  meetingId   String
  userId      String
  status      AttendanceStatus @default(HADIR)
  checkedAt   DateTime         @default(now())
  isManual    Boolean          @default(false)

  meeting     Meeting          @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([meetingId, userId])
  @@index([meetingId])
}

model NotulensiReadLog {
  id        String   @id @default(cuid())
  meetingId String
  userId    String
  readAt    DateTime @default(now())

  meeting   Meeting  @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([meetingId, userId])
}

model Showcase {
  id              String                @id @default(cuid())
  academicYearId  String
  title           String
  description     String
  primaryDivision Division
  externalUrl     String
  thumbnailUrl    String
  isPinned        Boolean               @default(false)
  createdById     String
  createdAt       DateTime              @default(now())

  academicYear    AcademicYear          @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  createdBy       User                  @relation("ShowcaseCreator", fields: [createdById], references: [id])
  contributors    ShowcaseContributor[]

  @@index([academicYearId])
  @@index([primaryDivision])
}

model ShowcaseContributor {
  id         String   @id @default(cuid())
  showcaseId String
  userId     String

  showcase   Showcase @relation(fields: [showcaseId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([showcaseId, userId])
}

model Aspiration {
  id          String         @id @default(cuid())
  type        AspirationType @default(PUBLIC)
  content     String
  isAnonymous Boolean        @default(false)
  senderId    String?
  receiverId  String?        // ID anggota (jika PRIVATE_MEMBER) atau null
  createdAt   DateTime       @default(now())

  sender      User?          @relation("AspirationSender", fields: [senderId], references: [id], onDelete: SetNull)
  receiver    User?          @relation("AspirationReceiver", fields: [receiverId], references: [id], onDelete: SetNull)

  @@index([type])
  @@index([receiverId])
}

model Poll {
  id                 String       @id @default(cuid())
  academicYearId     String
  question           String
  isAnonymous        Boolean      @default(true)
  allowMultipleVotes Boolean      @default(false)
  expiresAt          DateTime
  createdAt          DateTime     @default(now())

  academicYear       AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  options            PollOption[]
  votes              PollVote[]

  @@index([academicYearId])
}

model PollOption {
  id         String     @id @default(cuid())
  pollId     String
  optionText String

  poll       Poll       @relation(fields: [pollId], references: [id], onDelete: Cascade)
  votes      PollVote[]

  @@index([pollId])
}

model PollVote {
  id        String     @id @default(cuid())
  pollId    String
  optionId  String
  userId    String
  votedAt   DateTime   @default(now())

  poll      Poll       @relation(fields: [pollId], references: [id], onDelete: Cascade)
  option    PollOption @relation(fields: [optionId], references: [id], onDelete: Cascade)
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([optionId, userId])
  @@index([pollId])
}

model ArchiveResource {
  id          String   @id @default(cuid())
  title       String
  category    String   // "Modul Belajar", "Template Dokumen", "Aset Brand"
  driveUrl    String
  description String?
  createdAt   DateTime @default(now())

  @@index([category])
}
```

---

## 3. RBAC Enforcement with Operator Bypass (`src/lib/rbac.ts`)

```typescript
import { auth } from "@/lib/auth";
import { Role, MemberStatus } from "@prisma/client";

export async function assertAuthenticated() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED: Sesi Anda tidak valid atau telah kedaluwarsa.");
  }
  return session.user;
}

export async function assertRole(allowedRoles: Role[]) {
  const user = await assertAuthenticated();
  // Bypass Otomatis untuk OPERATOR (Developer God-Mode)
  if (user.role === Role.OPERATOR) return user;

  if (!allowedRoles.includes(user.role as Role)) {
    throw new Error("FORBIDDEN: Anda tidak memiliki izin untuk aksi ini.");
  }
  return user;
}

export async function assertActiveMember() {
  const user = await assertAuthenticated();
  if (user.role === Role.OPERATOR) return user;

  if (user.status !== MemberStatus.ACTIVE) {
    throw new Error("FORBIDDEN: Akun demisioner/alumni hanya memiliki hak baca.");
  }
  return user;
}
```

---
