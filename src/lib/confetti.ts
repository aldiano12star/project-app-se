/**
 * Zero-dependency Lightweight Canvas Micro-Confetti
 * Menghasilkan semburan partikel mikro elegan saat transaksi sukses.
 * Otomatis membersihkan elemen canvas dari DOM setelah animasi tuntas.
 */

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export function triggerMicroConfetti(options?: {
  originX?: number; // 0..1 (default: 0.5)
  originY?: number; // 0..1 (default: 0.6)
  particleCount?: number;
}): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  // Hormati preferensi aksesibilitas
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "99999";

  document.body.appendChild(canvas);

  const startX = width * (options?.originX ?? 0.5);
  const startY = height * (options?.originY ?? 0.6);
  const count = options?.particleCount ?? 35;

  const colors = [
    "#E11D2A", // Saba Red
    "#E05355", // Muted Red
    "#FBBF24", // Gold
    "#34D399", // Emerald
    "#38BDF8", // Sky Blue
    "#FB7185", // Rose
  ];

  const particles: ConfettiParticle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5; // Menembak ke atas menyebar
    const speed = 7 + Math.random() * 9;
    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
    });
  }

  const gravity = 0.38;
  const drag = 0.96;
  const startTime = performance.now();
  const duration = 1200; // 1.2 detik

  const render = (now: number) => {
    const elapsed = now - startTime;
    if (elapsed > duration) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, width, height);

    // Fade out di sepertiga akhir durasi
    const fadeProgress = Math.max(0, (elapsed - 700) / (duration - 700));
    const globalAlpha = 1 - fadeProgress;

    for (const p of particles) {
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, globalAlpha);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
}
