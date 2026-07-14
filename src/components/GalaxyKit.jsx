"use client";

/**
 * GalaxyKit.jsx — drop-in galaxy background + glow container boxes.
 *
 * Copy this single file into your new project (e.g. src/GalaxyKit.jsx).
 *
 * ────────────────────────────────────────────────────────────────────────
 *  DEPENDENCY
 *    npm install three
 * ────────────────────────────────────────────────────────────────────────
 *  FONT (Montserrat)
 *    Add this to your global CSS (index.css) or <head>:
 *
 *      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
 *
 *    Font stack:   'Montserrat', 'Helvetica Neue', system-ui, sans-serif
 *    Weights used: 300 (light headings), 400 (body), 700 (labels/buttons)
 *    Sizes used in the original design:
 *      • Big heading:  font-size: clamp(2rem, 5vw, 4.4rem);  weight 300;  letter-spacing: 0.06em;
 *      • Label/button: font-size: 1rem;    weight 700;  letter-spacing: 0.18em;
 *      • Small caps:   font-size: 0.75rem;              letter-spacing: 0.18em;
 *
 *    Suggested page background color: #02050d
 * ────────────────────────────────────────────────────────────────────────
 *  USAGE
 *
 *    import { CelestialSphere, GlowCard } from './GalaxyKit';
 *
 *    // Full-screen galaxy behind everything:
 *    <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
 *      <CelestialSphere />
 *    </div>
 *
 *    // A glowing container box (blue glow that follows the cursor):
 *    <GlowCard glowColor="blue" style={{ padding: 24, width: 320 }}>
 *      ...your content...
 *    </GlowCard>
 * ────────────────────────────────────────────────────────────────────────
 */

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

/* ========================================================================
 *  GALAXY BACKGROUND
 * ===================================================================== */
export function CelestialSphere({
  hue = 220.0,
  speed = 0.3,
  zoom = 1.5,
  className = '',
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;
    let scene, camera, renderer, material, mesh;
    let animationFrameId;

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_hue;
      uniform float u_zoom;

      vec3 hsl2rgb(vec3 c) {
        vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
        return c.z * mix(vec3(1.0), rgb, c.y);
      }

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
      }

      float fbm(vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 6; i++) {
          value += amplitude * noise(st);
          st *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
        uv *= u_zoom;

        vec2 mouse_normalized = u_mouse / u_resolution;
        uv += (mouse_normalized - 0.5) * 0.8;

        float f = fbm(uv + vec2(u_time * 0.1, u_time * 0.05));
        float t = fbm(uv + f + vec2(u_time * 0.05, u_time * 0.02));

        float nebula = pow(t, 2.0);
        vec3 color = hsl2rgb(vec3(u_hue / 360.0 + nebula * 0.2, 0.7, 0.5));
        color *= nebula * 2.5;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2() },
        u_mouse: { value: new THREE.Vector2(0, 0) },
        u_hue: { value: hue },
        u_zoom: { value: zoom },
      },
    });

    mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => {
      const { clientWidth, clientHeight } = currentMount;
      renderer.setSize(clientWidth, clientHeight);
      material.uniforms.u_resolution.value.set(clientWidth, clientHeight);
      camera.updateProjectionMatrix();
    };

    const onMouseMove = (event) => {
      const rect = currentMount.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      material.uniforms.u_mouse.value.set(x, currentMount.clientHeight - y);
    };

    const animate = () => {
      material.uniforms.u_time.value += 0.005 * speed;
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [hue, speed, zoom]);

  return <div ref={mountRef} className={className} style={{ width: '100%', height: '100%' }} />;
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

export default CelestialSphere;
