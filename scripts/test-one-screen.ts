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

async function run() {
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

  const sessionToken = await encode({
    token,
    secret,
    salt: "authjs.session-token",
  });

  const browser = await chromium.launch({ headless: true });

  // Mobile Context
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  await context.addCookies([
    {
      name: "authjs.session-token",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();

  // Inject dark theme to avoid white screen
  await page.addInitScript(() => {
    localStorage.setItem("theme", "dark");
    sessionStorage.setItem("se_splash_shown", "true");
  });

  console.log("Navigating to /dashboard...");
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded" });

  // Wait 3 seconds for splash screen and any animations to completely finish
  console.log("Waiting 3.5s for splash screen to unmount...");
  await page.waitForTimeout(3500);

  // Check if splash screen element is in DOM
  const splashCount = await page.locator("#se-custom-splash-screen").count();
  console.log("Splash screen element count in DOM:", splashCount);

  // Take screenshot
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "real-01-dashboard.png"),
    fullPage: false,
  });
  console.log("Screenshot saved: real-01-dashboard.png");

  // Check overflow
  const overflow = await page.evaluate(() => {
    return {
      docWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
    };
  });
  console.log("Overflow check:", overflow);

  await browser.close();
}

run().catch(console.error);
