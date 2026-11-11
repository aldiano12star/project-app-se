import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Ticket,
  Calendar,
  MapPin,
  Play,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldCheck,
  Radio,
  Cpu,
  Layers,
  Zap,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [ticketClaimed, setTicketClaimed] = useState(false);
  const [ticketOwner, setTicketOwner] = useState("FAUZAN // VIP-772");
  const [activeAct, setActiveAct] = useState(1);

  // 1. Lenis Smooth Scroll + GSAP Ticker Synchronization
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tickerCb = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCb);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCb);
      lenis.destroy();
    };
  }, []);

  // 2. Interactive Background Starfield Particle Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
    }> = [];

    const colors = ["#E11D2A", "#38BDF8", "#A855F7", "#FFFFFF"];

    for (let i = 0; i < 75; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.8 + 0.6,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.6 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(225, 29, 42, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // 3. GSAP Scrollytelling Timelines
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance Animation
      const heroTl = gsap.timeline({ defaults: { ease: "power4.out" } });

      heroTl
        .from(".hero-badge", {
          y: -25,
          opacity: 0,
          duration: 1,
        })
        .from(
          ".hero-title-letter",
          {
            yPercent: 120,
            opacity: 0,
            stagger: 0.04,
            duration: 1.2,
          },
          "-=0.6"
        )
        .from(
          ".hero-sub",
          {
            y: 30,
            opacity: 0,
            duration: 0.9,
          },
          "-=0.6"
        )
        .from(
          ".hero-actions",
          {
            scale: 0.9,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.5"
        );

      // Pinned Scrubbing Effect on Act Section
      gsap.to(".acts-track", {
        xPercent: -50,
        ease: "none",
        scrollTrigger: {
          trigger: ".acts-wrapper",
          start: "top top",
          end: "+=1600",
          scrub: 1,
          pin: true,
          onUpdate: (self) => {
            const act = self.progress < 0.4 ? 1 : self.progress < 0.8 ? 2 : 3;
            setActiveAct(act);
          },
        },
      });

      // Hologram Pass Scroll Scrub
      gsap.from(".ticket-container", {
        scale: 0.85,
        opacity: 0,
        rotationY: -15,
        scrollTrigger: {
          trigger: ".ticket-section",
          start: "top 75%",
          end: "top 35%",
          scrub: 1,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // 4. Interactive 3D Card Tilt Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ticketRef.current) return;
    const card = ticketRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    gsap.to(card, {
      rotateX,
      rotateY,
      duration: 0.3,
      ease: "power2.out",
      transformPerspective: 1000,
    });
  };

  const handleMouseLeave = () => {
    if (!ticketRef.current) return;
    gsap.to(ticketRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.7,
      ease: "elastic.out(1, 0.4)",
    });
  };

  const handleClaimTicket = () => {
    setTicketClaimed(true);
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#E11D2A", "#38BDF8", "#F59E0B", "#FFFFFF"],
    });
  };

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#07090E] text-slate-100">
      {/* Background Interactive Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 opacity-80"
      />

      {/* Ambient Lighting Gradients */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[600px] h-[600px] bg-sky-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Floating Top Navigation Bar */}
      <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-5xl rounded-full glass-panel px-5 py-3 flex items-center justify-between border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 flex items-center justify-center shadow-lg shadow-red-600/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-['Space_Grotesk'] font-bold text-sm tracking-wider uppercase">
            NEXUS <span className="text-red-500">// 2027</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <a href="#about" className="hover:text-red-400 transition-colors">Manifesto</a>
          <a href="#lineup" className="hover:text-red-400 transition-colors">Timeline</a>
          <a href="#pass" className="hover:text-red-400 transition-colors">Hologram Pass</a>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlayingAudio(!isPlayingAudio)}
            className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors text-slate-300 cursor-pointer"
            title="Ambient Audio Toggle"
          >
            {isPlayingAudio ? (
              <Volume2 className="w-4 h-4 text-red-400 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
          <a
            href="#pass"
            className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/30 active:scale-95 cursor-pointer"
          >
            Get Pass
          </a>
        </div>
      </header>

      {/* ========================================================= */}
      {/* SECTION 1: HERO SCROLLYTELLING TEASER                     */}
      {/* ========================================================= */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center z-10 overflow-hidden"
      >
        <div className="hero-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-red-500/30 text-red-400 text-xs font-mono font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>GLOBAL IMMERSIVE SUMMIT // BANDUNG &amp; METAVERSE</span>
        </div>

        {/* Cinematic Staggered Title */}
        <h1
          ref={titleRef}
          className="font-['Space_Grotesk'] text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase leading-none select-none"
        >
          {Array.from("NEXUS//27").map((char, index) => (
            <span
              key={index}
              className={`hero-title-letter inline-block ${
                char === "/" ? "text-red-500" : "text-white"
              }`}
            >
              {char}
            </span>
          ))}
        </h1>

        <p className="hero-sub max-w-xl mx-auto text-sm sm:text-base md:text-lg text-slate-400 font-light mt-6 leading-relaxed">
          Eksplorasi sinematik masa depan komputasi spasial, kecerdasan buatan kreatif, dan arsitektur web generatif 60 FPS.
        </p>

        <div className="hero-actions flex flex-wrap items-center justify-center gap-4 mt-10">
          <a
            href="#pass"
            className="px-7 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wide uppercase transition-all shadow-xl shadow-red-600/40 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Ticket className="w-4 h-4" />
            <span>Klaim Hologram Pass</span>
          </a>
          <a
            href="#lineup"
            className="px-7 py-3.5 rounded-full glass-panel hover:bg-white/10 text-slate-200 font-bold text-sm tracking-wide uppercase transition-all active:scale-95 flex items-center gap-2 cursor-pointer border border-white/20"
          >
            <Play className="w-4 h-4 text-red-500" />
            <span>Tonton Trailer</span>
          </a>
        </div>

        {/* Metadata Footer Teaser */}
        <div className="absolute bottom-6 left-0 right-0 max-w-5xl mx-auto px-6 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-white/5 pt-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-400" />
            <span>18–20 NOVEMBER 2027</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-400" />
            <span>SABA AUDITORIUM // SPATIAL CANVAS</span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 2: PINNED ACT TIMELINE (SCRUBBED HORIZONTAL SCROLL)*/}
      {/* ========================================================= */}
      <section id="lineup" className="acts-wrapper relative h-screen bg-[#090C14] overflow-hidden border-y border-white/10 z-10">
        <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <h2 className="font-['Space_Grotesk'] text-lg sm:text-2xl font-bold uppercase tracking-wider">
            SCENARIO SEQUENCE // ACT {activeAct} OF 3
          </h2>
        </div>

        {/* Horizontal Track pinned via ScrollTrigger */}
        <div className="acts-track h-full flex items-center w-[200vw] px-12 sm:px-24 gap-8">
          {/* Card Act 1 */}
          <div className="w-[85vw] max-w-xl p-8 rounded-3xl glass-panel glass-panel-hover shrink-0 flex flex-col justify-between h-[65vh]">
            <div>
              <span className="text-red-500 font-mono text-xs font-bold tracking-widest uppercase">
                ACT 01 // 09:00 WIB
              </span>
              <h3 className="font-['Space_Grotesk'] text-3xl sm:text-4xl font-bold text-white mt-2 leading-tight">
                The Spatial Operating Genesis
              </h3>
              <p className="text-sm text-slate-300 mt-4 leading-relaxed">
                Pembukaan keynote interaktif: bagaimana antarmuka digital bertransformasi dari layar kaca 2D menjadi ekosistem spasial 3D responsif.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5"><Cpu className="w-4 h-4 text-red-400" /> SPATIAL CORE</span>
              <span>KEYNOTE SPEAKER // DR. A. KINAN</span>
            </div>
          </div>

          {/* Card Act 2 */}
          <div className="w-[85vw] max-w-xl p-8 rounded-3xl glass-panel glass-panel-hover shrink-0 flex flex-col justify-between h-[65vh]">
            <div>
              <span className="text-sky-400 font-mono text-xs font-bold tracking-widest uppercase">
                ACT 02 // 13:30 WIB
              </span>
              <h3 className="font-['Space_Grotesk'] text-3xl sm:text-4xl font-bold text-white mt-2 leading-tight">
                Generative Cinema &amp; Realtime Shaders
              </h3>
              <p className="text-sm text-slate-300 mt-4 leading-relaxed">
                Bedah kode live: teknik komputasi WebGL, Three.js post-processing, dan bagaimana mengorkestrasi animasi 60 FPS layaknya film layar lebar.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-sky-400" /> REALTIME RENDER</span>
              <span>WORKSHOP LAB // EXPLOIT TEAM</span>
            </div>
          </div>

          {/* Card Act 3 */}
          <div className="w-[85vw] max-w-xl p-8 rounded-3xl glass-panel glass-panel-hover shrink-0 flex flex-col justify-between h-[65vh]">
            <div>
              <span className="text-purple-400 font-mono text-xs font-bold tracking-widest uppercase">
                ACT 03 // 19:00 WIB
              </span>
              <h3 className="font-['Space_Grotesk'] text-3xl sm:text-4xl font-bold text-white mt-2 leading-tight">
                Cybernetic Audio-Visual Showcase
              </h3>
              <p className="text-sm text-slate-300 mt-4 leading-relaxed">
                Malam puncak perayaan: instalasi seni generatif, peluncuran karya tahunan siswa, dan seremoni Hall of Fame penganugerahan anggota terbaik.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-purple-400" /> GALA CELEBRATION</span>
              <span>HALL OF FAME // CEREMONY</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 3: INTERACTIVE 3D HOLOGRAPHIC PASS                */}
      {/* ========================================================= */}
      <section id="pass" className="ticket-section relative py-32 px-4 flex flex-col items-center justify-center z-10">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold tracking-widest text-red-500 uppercase">
            // ACCESS CLEARANCE
          </span>
          <h2 className="font-['Space_Grotesk'] text-4xl sm:text-5xl font-bold mt-2">
            Holographic VIP Ticket
          </h2>
          <p className="text-sm text-slate-400 mt-3">
            Gerakkan kursor/sentuh tiket di bawah ini untuk melihat efek kilauan 3D holografik secara langsung.
          </p>
        </div>

        {/* 3D Tilting Card */}
        <div
          ref={ticketRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="ticket-container relative w-full max-w-md h-[520px] rounded-[32px] p-1 hologram-sheen shadow-2xl transition-shadow duration-300 hover:shadow-red-500/20 cursor-pointer"
        >
          <div className="w-full h-full rounded-[30px] bg-[#0E131F]/90 backdrop-blur-2xl border border-white/20 p-7 flex flex-col justify-between overflow-hidden relative">
            {/* Top Sheen Line */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header Ticket */}
            <div className="flex items-start justify-between border-b border-white/10 pb-5">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-red-400 uppercase font-bold">
                  OFFICIAL ACCESS PASS
                </span>
                <h3 className="font-['Space_Grotesk'] text-2xl font-black tracking-tight text-white mt-0.5">
                  NEXUS // 2027
                </h3>
              </div>
              <div className="px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-[11px] font-mono font-bold text-red-400">
                TIER-A VIP
              </div>
            </div>

            {/* Pass Identity Details */}
            <div className="space-y-4 py-4">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  ATTENDEE IDENTIFIER
                </span>
                <span className="text-base font-bold font-mono text-white tracking-wide">
                  {ticketOwner}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">ACCESS DATE</span>
                  <span className="text-slate-200 font-semibold">18–20 NOV 2027</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">SEAT SECTOR</span>
                  <span className="text-slate-200 font-semibold">ORBIT // ZONE-01</span>
                </div>
              </div>
            </div>

            {/* Barcode & Hologram Verification Strip */}
            <div className="border-t border-dashed border-white/20 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-6 w-36 bg-white/10 rounded flex items-center justify-around px-1 overflow-hidden">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <span
                        key={i}
                        className={`inline-block h-full bg-white/60 ${
                          i % 3 === 0 ? "w-1" : i % 2 === 0 ? "w-0.5" : "w-1.5"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 block tracking-widest">
                    ID-99201-NEXUS-SECURE
                  </span>
                </div>

                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 via-sky-400 to-purple-500 p-0.5 shadow-lg">
                  <div className="w-full h-full bg-[#0E131F] rounded-[10px] flex items-center justify-center font-mono font-bold text-xs text-white">
                    NX-27
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleClaimTicket}
                disabled={ticketClaimed}
                className={`w-full h-12 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                  ticketClaimed
                    ? "bg-emerald-600 text-white"
                    : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
                }`}
              >
                {ticketClaimed ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pass Terverifikasi &amp; Siap</span>
                  </>
                ) : (
                  <>
                    <Ticket className="w-4 h-4" />
                    <span>Konfirmasi Tiket Kehadiran</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 text-center text-xs font-mono text-slate-500 relative z-10">
        <p>&copy; 2027 NEXUS EXPERIMENTAL SUMMIT. POWERED BY SABA EXPLOIT LABS.</p>
        <p className="mt-1 text-[11px] text-slate-600">
          60 FPS GSAP SCROLLTRIGGER // LENIS SMOOTH SCROLL // GLASSMORPHISM V4
        </p>
      </footer>
    </div>
  );
}
