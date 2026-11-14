import { chromium } from "playwright";
import { encode } from "next-auth/jwt";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const OUTPUT_DIR = path.join(process.cwd(), "audit-real");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface LogEntry {
  type: string;
  text: string;
  location?: string;
}

const consoleLogs: LogEntry[] = [];
const consoleErrors: LogEntry[] = [];

async function generateSessionToken() {
  const secret = process.env.AUTH_SECRET!;
  const token = {
    id: "cmuhx150n0000l2mqxmt6dbli",
    email: "fauzanarifaldiano12@gmail.com",
    name: "Fauzan Arif Aldiano",
    role: "OPERATOR",
    classGrade: "KELAS_12",
    mainDivision: "PROGRAMMING",
    status: "ACTIVE",
    isProfileCompleted: true,
    sub: "cmuhx150n0000l2mqxmt6dbli",
  };

  return await encode({
    token,
    secret,
    salt: "authjs.session-token",
  });
}

async function main() {
  console.log("🚀 Memulai Interactive Playwright Audit sebagai OPERATOR...");

  const sessionToken = await generateSessionToken();
  const browser = await chromium.launch({ headless: true });

  // ── MOBILE CONTEXT (iPhone 14/15 size: 390x844) ──────────────────────
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  await mobileContext.addCookies([
    {
      name: "authjs.session-token",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const page = await mobileContext.newPage();

  page.on("console", (msg) => {
    const entry: LogEntry = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location().url,
    };
    consoleLogs.push(entry);
    if (msg.type() === "error") {
      consoleErrors.push(entry);
      console.error(`🔴 [Browser Console Error]: ${msg.text()}`);
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push({ type: "pageerror", text: err.message });
    console.error(`💥 [Uncaught Exception]: ${err.message}`);
  });

  // Helper untuk menunggu splash screen menghilang
  async function waitForAppReady() {
    try {
      // Tunggu splash screen menghilang (unmount atau opacity-0)
      await page.waitForSelector("#se-custom-splash-screen", {
        state: "detached",
        timeout: 5000,
      });
    } catch {
      // Jika masih ada, tunggu sebentar
      await page.waitForTimeout(1000);
    }
    // Tunggu animasi stabil
    await page.waitForTimeout(600);
  }

  // Helper untuk cek horizontal overflow
  async function checkHorizontalOverflow(screenName: string) {
    const overflow = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      const docScrollWidth = document.documentElement.scrollWidth;
      const hasOverflow = bodyScrollWidth > docWidth || docScrollWidth > docWidth;
      return {
        hasOverflow,
        docWidth,
        bodyScrollWidth,
        docScrollWidth,
      };
    });

    if (overflow.hasOverflow) {
      console.warn(
        `⚠️ [Overflow Warning on ${screenName}]: docWidth=${overflow.docWidth}, bodyScrollWidth=${overflow.bodyScrollWidth}`
      );
    } else {
      console.log(`✅ [No Horizontal Overflow on ${screenName}]`);
    }
    return overflow;
  }

  // ── TEST 1: BERANDA / DASHBOARD ──────────────────────────────────────
  console.log("\n📱 1. Menguji Halaman Dashboard...");
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded" });
  await waitForAppReady();
  await checkHorizontalOverflow("Dashboard");

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "01-operator-dashboard-mobile.png"),
    fullPage: false,
  });
  console.log("📸 Screenshot tersimpan: 01-operator-dashboard-mobile.png");

  // ── TEST 2: NAVIGASI KE KAS & TEST MODAL ──────────────────────────────
  console.log("\n📱 2. Menguji Modul Kas & Modal Bendahara...");
  // Klik tab Kas pada BottomNav
  const kasNavLink = page.locator('nav[aria-label="Navigasi Utama Bawah"] a[href="/kas"]');
  await kasNavLink.click();
  await page.waitForURL("**/kas");
  await waitForAppReady();
  await checkHorizontalOverflow("Kas");

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "02-operator-kas-mobile.png"),
    fullPage: false,
  });
  console.log("📸 Screenshot tersimpan: 02-operator-kas-mobile.png");

  // Cari tombol aksi bendahara untuk membuka modal
  const catatBtn = page.locator('button:has-text("Catat Transaksi")').first();
  if (await catatBtn.isVisible()) {
    console.log("🔘 Mengklik tombol 'Catat Transaksi'...");
    await catatBtn.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "02b-operator-kas-modal-catat.png"),
      fullPage: false,
    });
    console.log("📸 Screenshot tersimpan: 02b-operator-kas-modal-catat.png");

    // Tutup modal
    const closeBtn = page.locator('button:has-text("Batal"), button[aria-label="Tutup"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // ── TEST 3: NAVIGASI KE ACARA & TEST EVENT DETAIL / MODAL ─────────────
  console.log("\n📱 3. Menguji Modul Acara...");
  const acaraNavLink = page.locator('nav[aria-label="Navigasi Utama Bawah"] a[href="/acara"]');
  await acaraNavLink.click();
  await page.waitForURL("**/acara");
  await waitForAppReady();
  await checkHorizontalOverflow("Acara");

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "03-operator-acara-mobile.png"),
    fullPage: false,
  });
  console.log("📸 Screenshot tersimpan: 03-operator-acara-mobile.png");

  // Cari tombol 'Buat Acara Baru' atau 'Tambah Rapat'
  const buatAcaraBtn = page.locator('button:has-text("Buat Acara"), button:has-text("Tambah")').first();
  if (await buatAcaraBtn.isVisible()) {
    console.log("🔘 Mengklik tombol Buat Acara...");
    await buatAcaraBtn.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "03b-operator-acara-modal.png"),
      fullPage: false,
    });
    console.log("📸 Screenshot tersimpan: 03b-operator-acara-modal.png");

    const closeBtn = page.locator('button:has-text("Batal"), button[aria-label="Tutup"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // ── TEST 4: NAVIGASI KE EKSPLORASI & MODAL KARYA ──────────────────────
  console.log("\n📱 4. Menguji Modul Eksplorasi...");
  const eksplorasiNavLink = page.locator('nav[aria-label="Navigasi Utama Bawah"] a[href="/eksplorasi"]');
  await eksplorasiNavLink.click();
  await page.waitForURL("**/eksplorasi");
  await waitForAppReady();
  await checkHorizontalOverflow("Eksplorasi");

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "04-operator-eksplorasi-mobile.png"),
    fullPage: false,
  });
  console.log("📸 Screenshot tersimpan: 04-operator-eksplorasi-mobile.png");

  // Cari tombol 'Submit Karya' atau 'Unggah Proyek'
  const submitKaryaBtn = page.locator('button:has-text("Submit Karya"), button:has-text("Unggah"), button:has-text("Tambah")').first();
  if (await submitKaryaBtn.isVisible()) {
    console.log("🔘 Mengklik tombol Submit Karya...");
    await submitKaryaBtn.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "04b-operator-eksplorasi-modal.png"),
      fullPage: false,
    });
    console.log("📸 Screenshot tersimpan: 04b-operator-eksplorasi-modal.png");

    const closeBtn = page.locator('button:has-text("Batal"), button[aria-label="Tutup"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // ── TEST 5: HALL OF FAME SEBAGAI OPERATOR ────────────────────────────
  console.log("\n📱 5. Menguji Hall of Fame...");
  await page.goto("http://localhost:3000/hall-of-fame", { waitUntil: "domcontentloaded" });
  await waitForAppReady();
  await checkHorizontalOverflow("Hall of Fame");

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "05-operator-hall-of-fame-mobile.png"),
    fullPage: false,
  });
  console.log("📸 Screenshot tersimpan: 05-operator-hall-of-fame-mobile.png");

  // Cek apakah tombol "Ganti Foto" muncul untuk operator
  const gantiFotoBtn = page.locator('button:has-text("Ganti Foto")').first();
  if (await gantiFotoBtn.isVisible()) {
    console.log("🔘 Mengklik tombol Ganti Foto pada Hall of Fame...");
    await gantiFotoBtn.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "05b-operator-hall-of-fame-modal-foto.png"),
      fullPage: false,
    });
    console.log("📸 Screenshot tersimpan: 05b-operator-hall-of-fame-modal-foto.png");

    const closeBtn = page.locator('button:has-text("Batal"), button[aria-label="Tutup"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // ── TEST 6: OPERATOR MANAJEMEN AKUN (DYNAMIC GEN TABS) ───────────────
  console.log("\n📱 6. Menguji Operator Manajemen Akun...");
  await page.goto("http://localhost:3000/operator/manajemen-akun", { waitUntil: "domcontentloaded" });
  await waitForAppReady();
  await checkHorizontalOverflow("Manajemen Akun");

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "06-operator-manajemen-akun-mobile.png"),
    fullPage: false,
  });
  console.log("📸 Screenshot tersimpan: 06-operator-manajemen-akun-mobile.png");

  // Klik tombol dropdown 'Lainnya' jika ada
  const lainnyaBtn = page.locator('button:has-text("Lainnya")').first();
  if (await lainnyaBtn.isVisible()) {
    console.log("🔘 Mengklik dropdown 'Lainnya'...");
    await lainnyaBtn.click();
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, "06b-operator-manajemen-akun-dropdown.png"),
      fullPage: false,
    });
    console.log("📸 Screenshot tersimpan: 06b-operator-manajemen-akun-dropdown.png");
  }

  await mobileContext.close();

  // ── DESKTOP AUDIT (1440x900) ─────────────────────────────────────────
  console.log("\n💻 7. Menguji Tampilan Desktop (1440x900)...");
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  await desktopContext.addCookies([
    {
      name: "authjs.session-token",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded" });
  await waitForAppReady();

  await desktopPage.screenshot({
    path: path.join(OUTPUT_DIR, "07-operator-dashboard-desktop.png"),
    fullPage: false,
  });
  console.log("📸 Screenshot tersimpan: 07-operator-dashboard-desktop.png");

  await desktopPage.goto("http://localhost:3000/kas", { waitUntil: "domcontentloaded" });
  await waitForAppReady();

  await desktopPage.screenshot({
    path: path.join(OUTPUT_DIR, "08-operator-kas-desktop.png"),
    fullPage: false,
  });
  console.log("📸 Screenshot tersimpan: 08-operator-kas-desktop.png");

  await desktopContext.close();
  await browser.close();

  // ── KESIMPULAN AUDIT LOGS ────────────────────────────────────────────
  console.log("\n📊 Ringkasan Log Konsol:");
  console.log(`Total Log: ${consoleLogs.length}`);
  console.log(`Total Error Konsol: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log("Daftar Error:", JSON.stringify(consoleErrors, null, 2));
  }

  console.log("\n✨ Selesai! Seluruh audit interaktif berhasil dijalankan.");
}

main().catch((err) => {
  console.error("FATAL ERROR saat QA script:", err);
  process.exit(1);
});
