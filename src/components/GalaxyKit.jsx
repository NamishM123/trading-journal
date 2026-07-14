"use client";

/**
 * GalaxyKit.jsx — drop-in front-page galaxy (3-D starfield + shooting stars)
 * and glow container boxes. Copy this single file into your new project.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  DEPENDENCIES
 *    npm install three @react-three/fiber @react-three/drei
 * ────────────────────────────────────────────────────────────────────────
 *  FONT (Montserrat)
 *    Add to your global CSS (index.css) or <head>:
 *
 *      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
 *
 *    Font stack:   'Montserrat', 'Helvetica Neue', system-ui, sans-serif
 *    Weights used: 300 (light headings), 400 (body), 700 (labels/buttons)
 *    Sizes from the original design:
 *      • Big heading:  font-size: clamp(2rem, 5vw, 4.4rem);  weight 300;  letter-spacing: 0.06em;
 *      • Label/button: font-size: 1rem;    weight 700;  letter-spacing: 0.18em;
 *      • Small caps:   font-size: 0.75rem;              letter-spacing: 0.18em;
 *
 *    Page background color: #02050d
 * ────────────────────────────────────────────────────────────────────────
 *  USAGE
 *
 *    import { GalaxyBackground, GlowCard } from './GalaxyKit';
 *
 *    // Full-screen galaxy behind everything:
 *    <GalaxyBackground />
 *    <div style={{ position: 'relative', zIndex: 1 }}>
 *      ...your page content...
 *    </div>
 *
 *    // A glowing container box (blue glow that follows the cursor):
 *    <GlowCard glowColor="blue" style={{ padding: 24, width: 320 }}>
 *      ...your content...
 *    </GlowCard>
 * ────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';

/* ========================================================================
 *  STARFIELD — two rotating layers of drei <Stars>
 * ===================================================================== */
function StarField() {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.008;
      ref.current.rotation.x += delta * 0.003;
    }
  });
  return (
    <group ref={ref}>
      <Stars radius={100} depth={50} count={2200}  factor={9}   saturation={0.25} fade speed={0.4} />
      <Stars radius={140} depth={70} count={11000} factor={4.5} saturation={0.4}  fade speed={0.6} />
    </group>
  );
}

/* ========================================================================
 *  SHOOTING STARS — canvas overlay that streaks stars horizontally
 * ===================================================================== */
function ShootingStars() {
  const overlayRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = overlayRef.current;
    const ctx = canvas.getContext('2d');
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const stars = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn() {
      const p = Math.random();
      let tail, spd, life, lw;
      // Speeds kept gentle so no star feels "super fast"
      if      (p < 0.45) { tail = 40 + Math.random() * 50;  spd = 2.2 + Math.random() * 1.2; life = 55 + Math.random() * 30;  lw = 0.75; }
      else if (p < 0.85) { tail = 70 + Math.random() * 80;  spd = 1.6 + Math.random() * 1.0; life = 90 + Math.random() * 70;  lw = 1.0;  }
      else               { tail = 180 + Math.random() * 140; spd = 0.9 + Math.random() * 0.7; life = 240 + Math.random() * 160; lw = 1.2;  }
      // Left or right only — within ±15° of horizontal
      const spread = Math.PI / 12; // 15°
      const base = Math.random() < 0.5 ? 0 : Math.PI; // rightward or leftward
      const angle = base + (Math.random() * 2 - 1) * spread;
      stars.push({
        x: -50 + Math.random() * (W + 100),
        y: -50 + Math.random() * (H * 0.75 + 100),
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        tail, life: 0, maxLife: life, lw,
        hue: Math.random() < 0.7 ? 'rgba(255,245,225,' : 'rgba(220,230,255,',
      });
    }

    let lastSpawn = performance.now() - 1000;
    let nextIn = 400 + Math.random() * 600;

    function frame(now) {
      ctx.clearRect(0, 0, W, H);

      if (now - lastSpawn > nextIn) {
        spawn();
        if (Math.random() < 0.3) setTimeout(spawn, 200 + Math.random() * 400);
        lastSpawn = now;
        nextIn = 600 + Math.random() * 1800;
      }

      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.x += s.vx; s.y += s.vy; s.life++;
        const lr = s.life / s.maxLife;
        const fade = lr < 0.12 ? lr / 0.12 : lr > 0.7 ? Math.max(0, 1 - (lr - 0.7) / 0.3) : 1;
        const sp = Math.hypot(s.vx, s.vy) || 1;
        const ux = s.vx / sp, uy = s.vy / sp;
        const tx = s.x - ux * s.tail, ty = s.y - uy * s.tail;
        const g = ctx.createLinearGradient(tx, ty, s.x, s.y);
        g.addColorStop(0, s.hue + '0)');
        g.addColorStop(0.6, s.hue + (0.18 * fade) + ')');
        g.addColorStop(1, s.hue + (0.95 * fade) + ')');
        ctx.strokeStyle = g; ctx.lineWidth = s.lw; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(s.x, s.y); ctx.stroke();
        const hg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 3);
        hg.addColorStop(0, s.hue + (0.7 * fade) + ')');
        hg.addColorStop(1, s.hue + '0)');
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, Math.PI * 2); ctx.fill();
        if (s.life >= s.maxLife || s.x < -200 || s.x > W + 200 || Math.abs(s.y) > H + 200) stars.splice(i, 1);
      }

      animRef.current = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    animRef.current = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={overlayRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

/* ========================================================================
 *  GALAXY BACKGROUND — full-screen starfield + shooting stars
 * ===================================================================== */
export function GalaxyBackground({ style = {}, fixed = true }) {
  return (
    <div
      style={{
        position: fixed ? 'fixed' : 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#02050d',
        zIndex: 0,
        ...style,
      }}
    >
      {/* Three.js starfield — transparent canvas; the div supplies the dark bg */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 68 }}
        gl={{ antialias: true, alpha: true }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
        onCreated={({ gl }) => gl.setClearColor(0, 0, 0, 0)}
      >
        <StarField />
      </Canvas>

      {/* Shooting-star overlay */}
      <ShootingStars />
    </div>
  );
}

/* ========================================================================
 *  GLOW CONTAINER BOX (blue cursor-follow glow + glowing border ring)
 * ===================================================================== */
const COLOR_MAP = {
  blue:   { hue: 210 },
  purple: { hue: 280 },
  green:  { hue: 140 },
  red:    { hue: 0 },
  orange: { hue: 30 },
};

let injected = false;
function injectStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
    .glow-card {
      position: relative;
      isolation: isolate;
      background-color: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: border-color 0.25s ease;
    }
    .glow-card:hover {
      border-color: rgba(255, 255, 255, 0.18);
    }
    .glow-card::before,
    .glow-card::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      opacity: var(--glow-active, 0);
      transition: opacity 0.35s ease;
    }
    /* Inner soft spotlight on the card surface */
    .glow-card::before {
      background: radial-gradient(
        var(--glow-size, 220px) var(--glow-size, 220px) at var(--glow-x, 50%) var(--glow-y, 50%),
        hsla(var(--glow-hue, 210), 95%, 70%, 0.22),
        hsla(var(--glow-hue, 210), 95%, 70%, 0.08) 35%,
        transparent 70%
      );
      z-index: 0;
    }
    /* Glowing border ring — built with mask-composite: exclude */
    .glow-card::after {
      padding: var(--glow-border, 2px);
      background: radial-gradient(
        var(--glow-size, 220px) var(--glow-size, 220px) at var(--glow-x, 50%) var(--glow-y, 50%),
        hsla(var(--glow-hue, 210), 100%, 75%, 1),
        hsla(var(--glow-hue, 210), 100%, 70%, 0.5) 30%,
        transparent 70%
      );
      -webkit-mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
      mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      z-index: 1;
      filter: brightness(1.15);
    }
    .glow-card > * {
      position: relative;
      z-index: 2;
    }
  `;
  const style = document.createElement('style');
  style.setAttribute('data-glow-card-styles', '');
  style.textContent = css;
  document.head.appendChild(style);
}

export function GlowCard({
  children,
  className = '',
  style = {},
  glowColor = 'blue',
  radius = 14,
  border = 2,
  size = 220,
  as: Tag = 'div',
  ...rest
}) {
  const cardRef = useRef(null);

  useEffect(() => {
    injectStyles();
    const el = cardRef.current;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--glow-x', `${x}px`);
      el.style.setProperty('--glow-y', `${y}px`);
      el.style.setProperty('--glow-active', '1');
    };
    const onLeave = () => {
      el.style.setProperty('--glow-active', '0');
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerenter', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerenter', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const { hue } = COLOR_MAP[glowColor] || COLOR_MAP.blue;

  const inlineVars = {
    '--glow-hue': hue,
    '--glow-size': `${size}px`,
    '--glow-border': `${border}px`,
    '--glow-active': 0,
    '--glow-x': '50%',
    '--glow-y': '50%',
    borderRadius: `${radius}px`,
    ...style,
  };

  return (
    <Tag
      ref={cardRef}
      style={inlineVars}
      className={`glow-card ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default GalaxyBackground;
