# TRD.md (Technical Requirements Document)

## 1. Engineering Specifications & Environment

* **Runtime & Framework:** Node.js 20 LTS / Next.js 14.2+ (App Router, RSC default)[].
* **Database & Driver:** PostgreSQL via Neon Serverless (`@neondatabase/serverless` WebSocket pooler adapter)[].
* **Authentication:** Auth.js v5 (Google OAuth Provider, Whitelist Verification, Role Injection)[].
* **Camera / QR Scanner:** `html5-qrcode` library (Sangat ringan, client-only dynamic import, zero canvas heavy overhead).

---

## 2. Low-Spec Hardware Performance Budget

* **Target Device:** Ponsel Android berspesifikasi rendah dan OS Linux ringan (Lubuntu / antiX)[].
* **Initial JavaScript Bundle:** $\le 160\text{ KB}$ (gzipped) pada rute Beranda `/(dashboard)`[].
* **Larangan Efek Berat:**
  * DILARANG menggunakan utilitas Tailwind `backdrop-blur-*` dan bayangan kabur lebar `shadow-2xl`[].
  * Seluruh modal dan drawer wajib menggunakan latar solid transparan sederhana (`bg-black/60`) dengan garis tepi solid 1px (`border border-slate-200 dark:border-slate-800`)[].
* **Optimasi Pemindai QR:**
  * Kamera hanya aktif saat modal scanner dibuka dan stream video langsung dimatikan (*stream track stop*) saat pemindaian berhasil atau modal ditutup untuk menghemat baterai HP.

---

## 3. Storage & Concurrency Architecture

* **Zero-Byte Internal Storage Policy:** Database Neon tidak menyimpan file fisik. Semua lampiran nota kas, berkas proposal, dan modul diarahkan ke URL Google Drive resmi[].
* **Atomic DB Isolation:** Mutasi pembayaran kas multi-periode wajib dibungkus dalam `prisma.$transaction()` guna mencegah galat parsial[].

---
