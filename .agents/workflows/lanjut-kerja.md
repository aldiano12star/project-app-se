# ⚡ Workflow: Lanjut Kerja di Akun / Sesi Baru (Fast-Start Protocol)

Gunakan alur kerja ini saat membuka sesi baru atau berganti akun AI. Protokol ini dirancang agar agen langsung bekerja produktif dalam hitungan detik tanpa membuang token dan waktu untuk audit ulang dari awal.

---

## 📋 Langkah-Langkah Wajib Bagi Agen:

### 1. Baca Sumber Kebenaran Utama (Fast Read)
Jangan menjelajahi seluruh folder proyek secara membabi buta. Cukup baca 3 berkas acuan:
1. [GEMINI.md](file:///home/fauzan/Documents/PELAJARAN/Belajar Coding/se_app/GEMINI.md) — Baca aturan sistem, gaya bahasa Mentor (Bahasa Indonesia), protokol blok skill, dan mandat desain Awwwards/Impeccable.
2. [docs/HANDOFF.md](file:///home/fauzan/Documents/PELAJARAN/Belajar Coding/se_app/docs/HANDOFF.md) — Baca status fase terkini dan instruksi langkah pertama di Bagian 4.
3. [docs/ui-ux/aturan-desain.md](file:///home/fauzan/Documents/PELAJARAN/Belajar Coding/se_app/docs/ui-ux/aturan-desain.md) — Baca aturan pewarnaan anti-silau (Apple Soft Neutral `#F5F5F7` & Warm Charcoal `#121214`), naked icons, dan responsivitas.

### 2. Aturan Larangan Keras (Strict Anti-Patterns):
- ❌ **DILARANG** melakukan audit ulang seluruh basis kode dari nol (*no redundant re-audits*). Percayai status yang tercatat di `docs/HANDOFF.md`.
- ❌ **DILARANG** menjalankan headless browser (`playwright`, `puppeteer`, Chromium daemons) di background. Penggunaan RAM headless browser (800MB–1.5GB) memicu Linux OOM Killer.
- 👁️ **Gunakan [ui-refs/](file:///home/fauzan/Documents/PELAJARAN/Belajar Coding/se_app/ui-refs/)** untuk membandingkan tampilan visual antarmuka terhadap perangkat nyata mobile Chrome.

### 3. Langsung Eksekusi Langkah Kerja
- Buka bagian **"🎯 4. Instruksi Langkah Pertama untuk Sesi Berikutnya"** di [docs/HANDOFF.md](file:///home/fauzan/Documents/PELAJARAN/Belajar Coding/se_app/docs/HANDOFF.md).
- Tampilkan blok skill aktif & relevan di baris paling atas respons (`awwwards`, `impeccable`, `vercel-react-best-practices`, dll.).
- Kerjakan perubahan kode secara terfokus (*surgical edits*), lalu verifikasi dengan:
  ```bash
  npm run build
  ```
