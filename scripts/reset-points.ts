import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";

// Pasang WebSocket constructor agar adapter Neon stabil saat dijalankan di Node.js CLI
neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

/**
 * Skrip CLI Mandiri untuk mereset 'totalPoints' dan 'monthlyPoints' seluruh User ke 0
 * Dijalankan dengan: npx tsx scripts/reset-points.ts
 */
async function main() {
  console.log("🌱 Memulai proses reset poin musim baru...");

  const result = await prisma.user.updateMany({
    data: {
      totalPoints: 0,
      monthlyPoints: 0,
    },
  });

  console.log(`✅ Berhasil mereset poin untuk ${result.count} pengguna menjadi 0.`);
  console.log("🏁 Papan peringkat dan podium siap untuk musim baru!");
}

main()
  .catch((error) => {
    console.error("❌ Gagal mereset poin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
