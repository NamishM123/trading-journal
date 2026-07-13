"use client";

import { useEffect, useRef } from "react";

/**
 * Rolls-Royce "starlight headliner" backdrop. Every star is placed
 * individually with a randomized position, size, brightness, and colour
 * temperature — no repeating pattern. The brightest few get a soft halo, and
 * ~15% shimmer very slowly, each on its own cycle, so nothing pulses in sync.
 * Honors prefers-reduced-motion by rendering a single static frame.
 */
export function StarField() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let stars: {
      x: number; y: number; r: number; a: number; hue: string; tw: number; ph: number;
    }[] = [];
    let W = 0;
    let H = 0;
    let raf = 0;

    // Deterministic PRNG so the sky is stable across re-renders within a session.
    const mulberry = (seed: number) => () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    function build() {
      const rnd = mulberry(20260706);
      W = cv!.width = Math.round(window.innerWidth * dpr);
      H = cv!.height = Math.round(window.innerHeight * dpr);
      cv!.style.width = window.innerWidth + "px";
      cv!.style.height = window.innerHeight + "px";
      const n = Math.min(460, Math.round((window.innerWidth * window.innerHeight) / 4800));
      stars = [];
      for (let i = 0; i < n; i++) {
        const depth = rnd(); // most stars far & faint, a few near & bright
        const temp = rnd();
        stars.push({
          x: rnd() * W,
          y: rnd() * H,
          r: (0.35 + Math.pow(depth, 3.2) * 1.5) * dpr,
          a: 0.1 + Math.pow(depth, 2.2) * 0.8,
          hue: temp < 0.12 ? "255,238,214" : temp < 0.34 ? "190,214,255" : "230,238,252",
          tw: rnd() < 0.15 ? 3.5 + rnd() * 6 : 0, // shimmer period (s), 0 = steady
          ph: rnd() * Math.PI * 2,
        });
      }
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, W, H);
      for (const s of stars) {
        let a = s.a;
        if (s.tw) a *= 0.74 + 0.26 * Math.sin((t / 1000) * ((2 * Math.PI) / s.tw) + s.ph);
        if (s.r > 1.15 * dpr) {
          const g = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4.5);
          g.addColorStop(0, `rgba(${s.hue},${a * 0.45})`);
          g.addColorStop(1, `rgba(${s.hue},0)`);
          ctx!.fillStyle = g;
          ctx!.beginPath();
          ctx!.arc(s.x, s.y, s.r * 4.5, 0, 7);
          ctx!.fill();
        }
        ctx!.fillStyle = `rgba(${s.hue},${a})`;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, 7);
        ctx!.fill();
      }
    }

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    build();
    if (still) {
      draw(0);
    } else {
      const loop = (t: number) => {
        draw(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    let rT: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rT);
      rT = setTimeout(() => {
        build();
        if (still) draw(0);
      }, 120);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(rT);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} className="starfield" aria-hidden="true" />;
}
