import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// Usage:
// <BirthdayScreen name="Lan" message="Chúc mừng sinh nhật, em yêu!"/>

export default function BirthdayScreen({
  name = "Loan",
  message = "Chúc mừng sinh nhật!",
  accent = ["#FF7AB6", "#FFD36E", "#7AE7C7"],
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 800);
  const [height, setHeight] = useState(typeof window !== "undefined" ? window.innerHeight : 600);
  const [showConfetti, setShowConfetti] = useState(true);
  // blessing typing toggle
  const blessingFull = "Chúc Loan ngày mai sinh nhật thật vui vẻ và ngập tràn hạnh phúc nha. Mong rằng trong tuổi mới, Loan sẽ nhận được thật nhiều yêu thương… và hy vọng một phần trong đó đến từ mình. Đừng buồn nữa nha cô gái! Người viết Thiện, kkk";
  const [blessingVisible, setBlessingVisible] = useState(false);
  const [blessingTyped, setBlessingTyped] = useState("");
  const blessingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const onResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // clear blessing timer on unmount
  useEffect(() => {
    return () => {
      if (blessingTimerRef.current !== null) clearInterval(blessingTimerRef.current);
    };
  }, []);

  // canvas animation: fireworks + meteor shower + hearts/circles particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    // vibrant palette to highlight bursts on dark sky
    const vibrantPalette = Array.from(new Set([
      ...accent,
      "#FF3B3B", // vivid red
      "#FFD93B", // bright yellow
      "#3B82F6", // blue
      "#22D3EE", // cyan
      "#A78BFA", // purple
      "#34D399", // emerald
      "#FB7185", // pink
    ]));

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      life: number;
      born: number;
      color: string;
      rotate: number;
      spin: number;
      shape: "heart" | "circle" | "star";
    };

    type Rocket = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      explodeHeight: number;
      born: number;
    };

    // meteor removed

    type Petal = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      rotate: number;
      spin: number;
      hue: number;
    };

    type Butterfly = {
      x: number;
      y: number;
      vx: number;
      amp: number; // wing and path amplitude
      t: number;   // phase
      color: string;
    };

    type Bird = {
      x: number;
      y: number;
      vx: number;
      flap: number;
      color: string;
    };

    type Firefly = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      phase: number;
      color: string;
    };

    type Star = {
      x: number;
      y: number;
      base: number; // base brightness 0..1
      phase: number;
      size: number;
    };

    type Sparkle = {
      x: number;
      y: number;
      life: number;
      born: number;
      size: number;
    };

    let raf: number | null = null;
    const particles: Particle[] = [];
    const rockets: Rocket[] = [];
    // meteors removed
    const petals: Petal[] = [];
    const butterflies: Butterfly[] = [];
    const birds: Bird[] = [];
    const fireflies: Firefly[] = [];
    const stars: Star[] = [];
    const sparkles: Sparkle[] = [];

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.scale(dpr, dpr);

    // seed starfield
    const starCount = Math.max(80, Math.floor((width * height) / 18000));
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        base: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
        size: Math.random() * 1.2 + 0.6,
      });
    }

    function randomBetween(a: number, b: number): number {
      return a + Math.random() * (b - a);
    }

    function makeHeartPath(x: number, y: number, size: number): Path2D {
      const path = new Path2D();
      const top = size * 0.5;
      path.moveTo(x, y + top);
      path.bezierCurveTo(x + size, y - size * 0.2, x + size * 1.2, y + size, x, y + size * 1.6);
      path.bezierCurveTo(x - size * 1.2, y + size, x - size, y - size * 0.2, x, y + top);
      return path;
    }

    function makeStarPath(x: number, y: number, outer: number, points: number = 5): Path2D {
      const path = new Path2D();
      const inner = outer * 0.5;
      const step = Math.PI / points;
      path.moveTo(x, y - outer);
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = -Math.PI / 2 + i * step;
        path.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      path.closePath();
      return path;
    }

    function spawnBurst(cx: number, cy: number, count: number = 26): void {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = randomBetween(1.5, 5.2);
        const size = randomBetween(6, 16);
        const life = randomBetween(1200, 2200);
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.8,
          size,
          life,
          born: performance.now(),
          color: vibrantPalette[Math.floor(Math.random() * vibrantPalette.length)],
          rotate: Math.random() * Math.PI * 2,
          spin: randomBetween(-0.08, 0.08),
          shape: Math.random() > 0.6 ? "star" : Math.random() > 0.5 ? "heart" : "circle",
        });
      }
      // add bright sparks for extra vibrance
      for (let s = 0; s < Math.floor(count * 0.4); s++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = randomBetween(2.5, 6.5);
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: randomBetween(2, 4),
          life: randomBetween(600, 1100),
          born: performance.now(),
          color: Math.random() > 0.5 ? "#FFFFFF" : "#FFD93B",
          rotate: 0,
          spin: 0,
          shape: "circle",
        });
      }
    }

    function spawnRocket(): void {
      const x = randomBetween(width * 0.1, width * 0.9);
      const y = height + 20;
      const vx = randomBetween(-0.6, 0.6);
      const vy = randomBetween(-9.2, -7.2);
      const color = accent[Math.floor(Math.random() * accent.length)];
      const explodeHeight = randomBetween(height * 0.2, height * 0.55);
      rockets.push({ x, y, vx, vy, color, explodeHeight, born: performance.now() });
    }

    // spawnMeteor removed

    function spawnPetal(): void {
      const size = randomBetween(8, 16);
      petals.push({
        x: randomBetween(-40, width + 40),
        y: -20,
        vx: randomBetween(-0.4, 0.6),
        vy: randomBetween(0.8, 1.6),
        size,
        rotate: Math.random() * Math.PI * 2,
        spin: randomBetween(-0.02, 0.02),
        hue: randomBetween(330, 360), // pinkish
      });
    }

    function spawnButterfly(): void {
      butterflies.push({
        x: -20,
        y: randomBetween(height * 0.2, height * 0.6),
        vx: randomBetween(1.0, 1.8),
        amp: randomBetween(10, 26),
        t: Math.random() * Math.PI * 2,
        color: vibrantPalette[Math.floor(Math.random() * vibrantPalette.length)],
      });
    }

    function spawnBird(): void {
      birds.push({
        x: -30,
        y: randomBetween(height * 0.1, height * 0.5),
        vx: randomBetween(1.4, 2.4),
        flap: Math.random() * Math.PI * 2,
        color: "#e5e7eb",
      });
    }

    function spawnFirefly(): void {
      fireflies.push({
        x: randomBetween(0, width),
        y: randomBetween(height * 0.55, height * 0.95),
        vx: randomBetween(-0.3, 0.3),
        vy: randomBetween(-0.15, 0.15),
        phase: Math.random() * Math.PI * 2,
        color: "#fde68a",
      });
    }

    function drawFrame(): void {
      ctx.clearRect(0, 0, width, height);
      const now = performance.now();

      // starfield twinkle background
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.phase += 0.02 + s.base * 0.02;
        const alpha = Math.min(1, s.base + (Math.sin(s.phase) + 1) * 0.25);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(s.x, s.y, s.size, s.size);
        ctx.restore();
      }

      // rockets update and render (trail + explode)
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.vy += 0.06;
        r.x += r.vx;
        r.y += r.vy;
        // crisp trail and head (no blur/soft gradient)
        const tailX = r.x - r.vx * 10;
        const tailY = r.y - r.vy * 10;
        ctx.save();
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(r.x, r.y);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (r.vy >= 0 || r.y <= r.explodeHeight) {
          spawnBurst(r.x, r.y, Math.floor(randomBetween(24, 44)));
          rockets.splice(i, 1);
        }
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const age = now - p.born;
        if (age > p.life) {
          particles.splice(i, 1);
          continue;
        }
        // physics
        p.vy += 0.03; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rotate += p.spin;
        const alpha = 1 - age / p.life;
        ctx.save();
        // keep crisp visuals (no soft fade); clamp alpha high
        ctx.globalAlpha = Math.max(0.85, alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotate);
        if (p.shape === "heart") {
          ctx.fillStyle = p.color;
          ctx.fill(makeHeartPath(0, 0, p.size * 0.6));
        } else if (p.shape === "star") {
          ctx.fillStyle = p.color;
          ctx.fill(makeStarPath(0, 0, p.size * 0.7, 5));
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // meteors removed

      // petals (floating down)
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        p.x += p.vx + Math.sin(p.rotate) * 0.2;
        p.y += p.vy;
        p.rotate += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotate);
        ctx.fillStyle = `hsl(${p.hue},85%,70%)`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(p.size * 0.8, -p.size * 0.4, 0, -p.size);
        ctx.quadraticCurveTo(-p.size * 0.8, -p.size * 0.4, 0, 0);
        ctx.fill();
        ctx.restore();
        if (p.y > height + 40) petals.splice(i, 1);
      }

      // butterflies (sine path with flapping wings)
      for (let i = butterflies.length - 1; i >= 0; i--) {
        const b = butterflies[i];
        b.t += 0.12;
        b.x += b.vx;
        b.y += Math.sin(b.t) * (b.amp / 10);
        ctx.save();
        ctx.translate(b.x, b.y);
        const wing = 6 + (Math.sin(b.t * 2) + 1) * 4;
        ctx.fillStyle = b.color;
        // left wing
        ctx.beginPath();
        ctx.ellipse(-5, 0, wing, wing * 0.6, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        // right wing
        ctx.beginPath();
        ctx.ellipse(5, 0, wing, wing * 0.6, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        // body
        ctx.strokeStyle = "#111827";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.lineTo(2, 0);
        ctx.stroke();
        ctx.restore();
        if (b.x > width + 30) butterflies.splice(i, 1);
      }

      // birds (small V shape)
      for (let i = birds.length - 1; i >= 0; i--) {
        const b = birds[i];
        b.flap += 0.2;
        b.x += b.vx;
        b.y += Math.sin(b.flap * 0.6) * 0.4;
        const span = 9 + Math.sin(b.flap) * 4;
        ctx.save();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(b.x - span, b.y);
        ctx.lineTo(b.x, b.y - 2);
        ctx.lineTo(b.x + span, b.y);
        ctx.stroke();
        ctx.restore();
        if (b.x > width + 40) birds.splice(i, 1);
      }

      // fireflies (twinkle and drift)
      for (let i = fireflies.length - 1; i >= 0; i--) {
        const f = fireflies[i];
        f.phase += 0.08;
        f.x += f.vx;
        f.y += f.vy + Math.sin(f.phase) * 0.1;
        const brightness = 0.4 + (Math.sin(f.phase) + 1) * 0.3;
        ctx.save();
        ctx.fillStyle = f.color;
        ctx.globalAlpha = brightness;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (f.x < -20 || f.x > width + 20 || f.y > height + 20) fireflies.splice(i, 1);
      }

      // ambient sparkles (short-lived twinkles)
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const sp = sparkles[i];
        const age = now - sp.born;
        if (age > sp.life) {
          sparkles.splice(i, 1);
          continue;
        }
        const alpha = 1 - age / sp.life;
        ctx.save();
        ctx.globalAlpha = Math.max(0.2, alpha);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(sp.x, sp.y, sp.size, sp.size);
        ctx.restore();
      }
      raf = requestAnimationFrame(drawFrame);
    }

    // timers
    let rocketTimer: number | null = null;
    let natureTimer: number | null = null;
    let sparkleTimer: number | null = null;
    let autoBurstTimer: number | null = null;
    if (showConfetti) {
      for (let i = 0; i < 3; i++) spawnRocket();
      rocketTimer = window.setInterval(() => {
        if (Math.random() < 0.9) spawnRocket();
      }, 700);
      // periodic nature spawns (petals, butterflies, birds, fireflies)
      natureTimer = window.setInterval(() => {
        if (Math.random() < 0.7) spawnPetal();
        if (Math.random() < 0.25) spawnButterfly();
        if (Math.random() < 0.18) spawnBird();
        if (Math.random() < 0.8) spawnFirefly();
      }, 900);
      // ambient sparkles
      sparkleTimer = window.setInterval(() => {
        if (Math.random() < 0.8) {
          sparkles.push({
            x: Math.random() * width,
            y: Math.random() * height * 0.9,
            life: 500 + Math.random() * 800,
            born: performance.now(),
            size: Math.random() * 1.5 + 0.5,
          });
        }
      }, 250);
      // occasional auto bursts at random positions
      autoBurstTimer = window.setInterval(() => {
        const cx = Math.random() * (width * 0.8) + width * 0.1;
        const cy = Math.random() * (height * 0.5) + height * 0.2;
        spawnBurst(cx, cy, Math.floor(randomBetween(20, 40)));
      }, 1800);
    }

    if (showConfetti) {
      raf = requestAnimationFrame(drawFrame);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    const onBigBurst = () => {
      spawnBurst(width / 2, height / 2, 56);
      spawnRocket();
    };
    window.addEventListener("big-burst", onBigBurst as EventListener);

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      if (rocketTimer !== null) clearInterval(rocketTimer);
      if (natureTimer !== null) clearInterval(natureTimer);
      if (sparkleTimer !== null) clearInterval(sparkleTimer);
      if (autoBurstTimer !== null) clearInterval(autoBurstTimer);
      window.removeEventListener("big-burst", onBigBurst as EventListener);
    };
  }, [width, height, accent, showConfetti]);

  // typewriter for the message
  const [typed, setTyped] = useState("");
  useEffect(() => {
    let i = 0;
    const full = `${message}`;
    const speed = 45;
    const t = setInterval(() => {
      i++;
      setTyped(full.slice(0, i));
      if (i >= full.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [message]);

  // small little floating hearts behind
  const FloatingHearts = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 10 }).map((_, idx) => {
        const left = Math.floor(Math.random() * 100);
        const delay = Math.random() * 6;
        const size = Math.floor(18 + Math.random() * 36);
        const col = accent[idx % accent.length];
        return (
          <div
            key={idx}
            className="absolute animate-float"
            style={{
              left: `${left}%`,
              bottom: `${-10 - Math.random() * 30}px`,
              width: size,
              height: size,
              opacity: 0.85,
              animationDelay: `${delay}s`,
            }}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <path fill={col} d="M12 21s-7.2-4.9-9.2-7.3C1.4 11.8 2.2 7.9 5.8 6.1 8.1 4.9 10.4 6 12 8.2c1.6-2.2 3.9-3.3 6.2-2.1 3.6 1.8 4.4 5.7 2.9 7.6C19.2 16.1 12 21 12 21z" />
            </svg>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black text-white overflow-hidden">
      {/* night sky background: solid black for high contrast */}
      <div className="absolute inset-0 pointer-events-none" />

      {/* canvas for confetti */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      <FloatingHearts />

      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "backOut" }}
        className="relative z-10 max-w-3xl w-[92%] sm:w-3/4 lg:w-2/3 p-6 sm:p-10 rounded-3xl bg-[rgba(20,20,20,0.75)] border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative flex-shrink-0 w-36 h-36 sm:w-48 sm:h-48">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#ff8cc6] via-[#ffd36e] to-[#7AE7C7] opacity-90" />
            <div className="absolute -inset-1 rounded-full bg-[conic-gradient(from_0deg,rgba(255,255,255,0.8),rgba(255,255,255,0.15),rgba(255,255,255,0.8))] opacity-40" />
            <div className="relative w-full h-full rounded-full p-[6px] bg-[linear-gradient(135deg,rgba(255,255,255,0.55),rgba(255,255,255,0.08))]">
              <img src="/loan.jpg" alt={name} className="w-full h-full rounded-full object-cover border border-white/20 shadow-inner" />
            </div>
            <div className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.6),transparent_70%)]" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <motion.h1
              className="text-[2rem] sm:text-[2.6rem] leading-tight font-extrabold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
              animate={{ x: [0, -4, 0, 4, 0], y: [0, -2, 0, 2, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            >
              Happy Birthday, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7AB6] to-[#7AE7C7]">{name}</span> 🎉🎉🎉
            </motion.h1>

            <p className="mt-3 text-[1.075rem] sm:text-xl text-white italic leading-relaxed">
              {typed}
            </p>

            <div className="mt-4 flex flex-wrap gap-3 items-center justify-center sm:justify-start">
              <button
                onClick={() => {
                  // trigger a big burst
                  const evt = new CustomEvent("big-burst");
                  window.dispatchEvent(evt);
                }}
                className="group px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur hover:scale-[1.03] transition shadow hover:shadow-[0_0_24px_rgba(255,122,182,0.25)] flex items-center gap-2"
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FF7AB6] group-hover:animate-ping" />
                Bắn tim ❤
              </button>

              <a
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF7AB6] to-[#7AE7C7] shadow-lg font-medium hover:shadow-[0_0_28px_rgba(122,231,199,0.35)] transition flex items-center gap-2"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // quick sparkle animation by toggling confetti
                  setShowConfetti((s) => !s);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-7.2-4.9-9.2-7.3C1.4 11.8 2.2 7.9 5.8 6.1 8.1 4.9 10.4 6 12 8.2c1.6-2.2 3.9-3.3 6.2-2.1 3.6 1.8 4.4 5.7 2.9 7.6C19.2 16.1 12 21 12 21z" fill="currentColor"/></svg>
                Rung tim
              </a>

              <button
                onClick={() => {
                  if (!blessingVisible) {
                    setBlessingVisible(true);
                    setBlessingTyped("");
                    if (blessingTimerRef.current !== null) clearInterval(blessingTimerRef.current);
                    let i = 0;
                    blessingTimerRef.current = window.setInterval(() => {
                      i++;
                      setBlessingTyped(blessingFull.slice(0, i));
                      if (i >= blessingFull.length && blessingTimerRef.current !== null) {
                        clearInterval(blessingTimerRef.current);
                        blessingTimerRef.current = null;
                      }
                    }, 35);
                  } else {
                    setBlessingVisible(false);
                    setBlessingTyped("");
                    if (blessingTimerRef.current !== null) {
                      clearInterval(blessingTimerRef.current);
                      blessingTimerRef.current = null;
                    }
                  }
                }}
                className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/5 transition"
              >
                {blessingVisible ? "Ẩn lời chúc" : "Xem lời chúc"}
              </button>
            </div>

            {blessingVisible && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="mt-4 relative p-4 sm:p-5 rounded-xl bg-black/40 border border-white/10 shadow-lg overflow-hidden"
              >
                <div className="pointer-events-none absolute -inset-1 opacity-30">
                  <div className="w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(255,122,182,0.35),transparent_50%)]" />
                </div>
                <p className="relative z-10 text-base sm:text-lg leading-relaxed">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-amber-200 to-teal-200">
                    {blessingTyped}
                  </span>
                  <span className="ml-1 align-baseline caret-blink">|</span>
                </p>
              </motion.div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-white/60">
          <span hidden>Thiết kế bởi bạn — chỉnh code để thêm nhạc, ảnh, và lời chúc cá nhân hóa.</span>
        </div>
      </motion.div>

      {/* tiny CSS for float animation (Tailwind + extra) */}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.98); opacity: 0}
          10% { opacity: 0.5 }
          50% { transform: translateY(-40vh) scale(1); opacity: 0.9 }
          100% { transform: translateY(-80vh) scale(0.8); opacity: 0 }
        }
        @keyframes caretBlink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
        .caret-blink { display: inline-block; width: 1ch; color: #fff; animation: caretBlink 1s step-end infinite }
        .animate-float {
          animation-name: floatUp;
          animation-duration: 8s;
          animation-timing-function: cubic-bezier(.2,.8,.2,1);
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}

/*
Notes / Integration tips:
- Make sure to install framer-motion: `npm i framer-motion`.
- Add a handwritten font (e.g., "Dancing Script") in your index.html or tailwind config for a more romantic look.
  Example in index.html: <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet"> and then use `font-family: 'Dancing Script', cursive;` on headings.
- To capture a PNG of the component use html2canvas or dom-to-image.
- If you want background music, add an <audio> element with controls hidden and autoplay (be mindful of browser autoplay policies).
- To convert to plain HTML/CSS, remove framer-motion parts and keep the layout + canvas logic.
*/
