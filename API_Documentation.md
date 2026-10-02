# API_Documentation.md (API & Data Routing Specification)

## 1. Overview & Response Protocol

Mutasi data dikelola menggunakan **Next.js Server Actions** terproteksi dengan skema respon konsisten:[]

```typescript
type ActionResponse<T null> = {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: "UNAUTHORIZED" | "FORBIDDEN" | "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_ERROR";
    details?: Record<string, string[]>;
  };
};
```

---

## 2. Server Actions: Keuangan & Kas

### 2.1. `recordKasPayment(payload)`

Mencatat pelunasan uang kas oleh bendahara/operator dengan alokasi *advance payment*[].

* **Akses:** `BENDAHARA`, `ADMIN`, `OPERATOR`[].
* **Payload:** `{ userId: string; totalAmountPaid: number; }`[]
* **Logika:** Kuota periode = `totalAmountPaid / 5000`. Catat `KasPayment` per periode belum lunas secara atomik (`prisma.$transaction`), rekam 1 baris `Transaction` (INCOME, KAS_RUTIN), dan tambahkan +10 poin per periode tertunggak yang dilunasi[].

### 2.2. `createTransaction(payload)`

Mencatat pemasukan non-kas atau pengeluaran kas dengan kewajiban URL bukti Google Drive[].

* **Akses:** `BENDAHARA`, `ADMIN`, `OPERATOR`[].
* **Payload:** `{ academicYearId: string; type: "INCOME" | "EXPENSE"; incomeCategory?: IncomeCategory; expenseCategory?: ExpenseCategory; amount: number; description: string; proofUrl?: string; }`[]

---

## 3. Server Actions: Presensi QR Code & Notulensi

### 3.1. `generateMeetingQR(meetingId)`

Membuka sesi presensi rapat dan menghasilkan token QR dinamis[].

* **Akses:** `ADMIN`, `OPERATOR`, atau Pembuat Rapat[].
* **Logika:** Buat token acak `qrToken`, set `qrExpiresAt = now() + 15 menit`[]. Token ini diproyeksikan menjadi gambar QR Code di layar proyektor[].

### 3.2. `claimQRAttendance(payload)`

Memvalidasi pemindaian QR Code oleh kamera anggota[].

* **Akses:** Anggota Aktif & Operator[].
* **Payload:** `{ meetingId: string; scannedToken: string; }`
* **Logika:** Validasi token cocok dan `now() <= qrExpiresAt`[]. Catat `Attendance` (status: `HADIR`, `isManual: false`), beri reward +10 poin bulanan dan tahunan[]. Galat `FORBIDDEN` jika waktu habis atau token palsu[].

### 3.3. `updateManualAttendance(payload)`

Penyelarasan manual oleh sekretaris jika gawai anggota bermasalah[].

* **Payload:** `{ meetingId: string; userId: string; status: "HADIR" | "IZIN" | "SAKIT" | "ALPA"; }`[]

---

## 4. Server Actions: Acara & Workspace

### 4.1. `createEvent(payload)`

Membuat acara baru dan otomatis menyuntikkan template SOP[].

* **Payload:** `{ academicYearId: string; title: string; description?: string; startDate: Date; endDate: Date; driveUrl?: string; }`[]

* **Logika:** Buat `Event`, buat seksi bawaan "Kesekretariatan & Logistik", dan gandakan seluruh `SOPTemplate` menjadi `EventTask` di bawah seksi tersebut (`isSOP = true`)[].

### 4.2. `saveEventNotulensi(eventId, notulensiText)`

Menyimpan notulensi khusus koordinasi acara pada workspace acara terkait[].

### 4.3. `verifyTaskCompletion(taskId)`

Verifikasi penyelesaian tugas oleh Ketua Acara/Operator untuk memberikan +15 poin anti-farming[].

---

## 5. Server Actions: Kotak Suara & Polling

### 5.1. `submitAspiration(payload)`

Mengirim suara ke salah satu dari 3 saluran:[]

* **Payload:**

  ```typescript

  type SubmitAspirationPayload = {
    type: "PUBLIC" | "PRIVATE_MEMBER" | "OPERATOR_SUPPORT";
    content: string;
    isAnonymous?: boolean;
    receiverId?: string; // Wajib jika type === PRIVATE_MEMBER
  };
  ```

* **Aturan:**
  * `PUBLIC`: `receiverId` null, `isAnonymous` boleh true/false[].
  * `PRIVATE_MEMBER`: `receiverId` wajib diisi, `isAnonymous` dipaksa FALSE demi pertanggungjawaban etika[].
  * `OPERATOR_SUPPORT`: Ditujukan langsung ke Operator untuk tiket bug/usulan fitur[].

### 5.2. `votePoll(payload)`

Memberikan suara pada sesi polling[].

* **Payload:** `{ pollId: string; optionIds: string[]; }`

* **Logika:** Jika `poll.allowMultipleVotes === false`, panjang `optionIds` wajib 1[]. Validasi unik `(optionId, userId)`[].

---

## 6. Server Actions: Administrasi Tahunan & Bulanan

### 6.1. `resetMonthlyLeaderboard()`

Cron job otomatis atau tombol pemicu manual awal bulan: Mereset kolom `User.monthlyPoints = 0` untuk menyegarkan papan podium tanpa menghapus `User.totalPoints`[].

### 6.2. `executeAnnualRollover(payload)`

Tutup buku tahunan oleh Admin/Operator: Hitung sisa kas -> suntik sebagai `SALDO_AWAL` tahun ajaran baru -> naikkan kelas 10 ke 11, dan kelas 11 ke 12 (`DEMISIONER`)[].

---
