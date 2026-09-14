"use client";

import { useEffect, useRef } from "react";
import { AV_LOGO } from "@/lib/logo";
import { sampleOutline } from "@/lib/outline";
import { getPointer, subscribePointer } from "@/lib/pointer";
import { gaussian, mulberry32 } from "@/lib/prng";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Unified Flowing Particle System
 *
 * Smoothly bridges the Hero section and About section in one continuous simulation:
 * - At progress = 0: Settled at the Hero position (left column on desktop, lavender/soft-white palette).
 * - During scroll (0 < progress < 1): Particles enter an organic FLOW STATE, streaming and swirling
 *   across the viewport from the left to the center, smoothly transitioning in color (electric blue
 *   and ice white) and expanding in size.
 * - At progress = 1: Settled at the exact center of the About liquid glass chassis with enlarged scale.
 *
 * Features customizable logoScale and particleScale.
 */

// Hero Color Tiers (Lavender / Moonlight White)
const HERO_TIERS = [
  { rgb: "250,248,255", alpha: 0.95, size: 1.5 },
  { rgb: "238,234,248", alpha: 0.8, size: 1.34 },
  { rgb: "220,213,240", alpha: 0.6, size: 1.2 },
  { rgb: "190,180,222", alpha: 0.38, size: 1.06 },
  { rgb: "160,148,200", alpha: 0.22, size: 0.94 },
];

// About Color Tiers (Cool Electric Blue & Soft White)
const ABOUT_TIERS = [
  { rgb: "246,250,255", alpha: 0.98, size: 1.55 },
  { rgb: "214,230,255", alpha: 0.88, size: 1.38 },
  { rgb: "138,182,255", alpha: 0.80, size: 1.24 },
  { rgb: "58,134,255", alpha: 0.65, size: 1.10 },
  { rgb: "28,74,170", alpha: 0.35, size: 0.95 },
];

const CORE_TIER_WEIGHTS = [0.32, 0.30, 0.24, 0.11, 0.03];
const HALO_TIER_WEIGHTS = [0, 0.04, 0.14, 0.42, 0.40];

const CORE_SHARE = 0.86;
const STROKE_SIGMA = 8.5;
const HALO_REACH = 145;
const DUST_DIR_X = -0.79;
const DUST_DIR_Y = -0.61;

const SPRING_BASE = 28;
const DAMPING_BASE = 4.4;

const REPEL_RADIUS = 0.65;
const REPEL_STRENGTH = 25.0;

const SPRITE_RES = 16;
const SPRITE_SOLID = 0.58;
const SPRITE_OVERDRAW = 1 / SPRITE_SOLID;

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

function smoothstep(edge0: number, edge1: number, v: number) {
  const t = clamp((v - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function pickTier(r: number, weights: number[]) {
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (r < acc) return i;
  }
  return weights.length - 1;
}

function makeSprite(rgb: string, alpha: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = SPRITE_RES;
  c.height = SPRITE_RES;
  const g = c.getContext("2d");
  if (g) {
    const r = SPRITE_RES / 2;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, `rgba(${rgb},${alpha})`);
    grad.addColorStop(SPRITE_SOLID, `rgba(${rgb},${alpha})`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, SPRITE_RES, SPRITE_RES);
  }
  return c;
}

interface ParticleField {
  n: number;
  vx: Float32Array;
  vy: Float32Array;
  hx: Float32Array;
  hy: Float32Array;
  x: Float32Array;
  y: Float32Array;
  velX: Float32Array;
  velY: Float32Array;
  stiff: Float32Array;
  damp: Float32Array;
  push: Float32Array;
  wobAX: Float32Array;
  wobBX: Float32Array;
  wobAY: Float32Array;
  wobBY: Float32Array;
  wobPhase: Float32Array;
  tierStart: Int32Array;
  tierLen: Int32Array;
  tier: Uint8Array;
}

function buildField(count: number, seed = 20260913): ParticleField {
  const rng = mulberry32(seed);
  const sample = sampleOutline(AV_LOGO, count, seed);
  const n = sample.count;

  const rawVx = new Float32Array(n);
  const rawVy = new Float32Array(n);
  const isHalo = new Uint8Array(n);
  const tiers = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    const halo = rng() > CORE_SHARE;
    isHalo[i] = halo ? 1 : 0;

    let sx = sample.x[i];
    let sy = sample.y[i];
    const nx = sample.nx[i];
    const ny = sample.ny[i];

    if (!halo) {
      const off = gaussian(rng) * STROKE_SIGMA;
      sx += nx * off;
      sy += ny * off;
      tiers[i] = pickTier(rng(), CORE_TIER_WEIGHTS);
    } else {
      const r = Math.pow(rng(), 1.6) * HALO_REACH;
      const wander = (rng() - 0.5) * 0.9;
      const dirX = DUST_DIR_X + -DUST_DIR_Y * wander;
      const dirY = DUST_DIR_Y + DUST_DIR_X * wander;
      const len = Math.hypot(dirX, dirY) || 1;
      sx += (dirX / len) * r + gaussian(rng) * 4;
      sy += (dirY / len) * r + gaussian(rng) * 4;
      tiers[i] = pickTier(rng(), HALO_TIER_WEIGHTS);
    }

    rawVx[i] = sx;
    rawVy[i] = sy;
  }

  const perm = new Int32Array(n);
  for (let i = 0; i < n; i++) perm[i] = i;
  perm.sort((a, b) => tiers[a] - tiers[b]);

  const vx = new Float32Array(n);
  const vy = new Float32Array(n);
  const hx = new Float32Array(n);
  const hy = new Float32Array(n);
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const velX = new Float32Array(n);
  const velY = new Float32Array(n);
  const stiff = new Float32Array(n);
  const damp = new Float32Array(n);
  const push = new Float32Array(n);
  const wobAX = new Float32Array(n);
  const wobBX = new Float32Array(n);
  const wobAY = new Float32Array(n);
  const wobBY = new Float32Array(n);
  const wobPhase = new Float32Array(n);
  const finalTier = new Uint8Array(n);

  const tierStart = new Int32Array(HERO_TIERS.length);
  const tierLen = new Int32Array(HERO_TIERS.length);

  for (let i = 0; i < n; i++) {
    const orig = perm[i];
    const t = tiers[orig];
    if (tierLen[t] === 0) tierStart[t] = i;
    tierLen[t]++;

    vx[i] = rawVx[orig];
    vy[i] = rawVy[orig];
    finalTier[i] = t;

    const halo = isHalo[orig] === 1;
    stiff[i] = SPRING_BASE * (halo ? 0.72 + rng() * 0.35 : 0.88 + rng() * 0.3);
    damp[i] = DAMPING_BASE * (halo ? 0.85 + rng() * 0.3 : 0.95 + rng() * 0.2);
    push[i] = halo ? 0.6 + rng() * 0.45 : 0.88 + rng() * 0.3;

    wobAX[i] = (rng() - 0.5) * 1.8;
    wobBX[i] = (rng() - 0.5) * 1.0;
    wobAY[i] = (rng() - 0.5) * 1.8;
    wobBY[i] = (rng() - 0.5) * 1.0;
    wobPhase[i] = rng() * Math.PI * 2;
  }

  return {
    n,
    vx,
    vy,
    hx,
    hy,
    x,
    y,
    velX,
    velY,
    stiff,
    damp,
    push,
    wobAX,
    wobBX,
    wobAY,
    wobBY,
    wobPhase,
    tierStart,
    tierLen,
    tier: finalTier,
  };
}

interface UnifiedParticleFlowProps {
  progress?: number;
  logoScale?: number;
  particleScale?: number;
  className?: string;
}

export default function UnifiedParticleFlow({
  progress = 0,
  logoScale = 1.0,
  particleScale = 2.5,
  className = "",
}: UnifiedParticleFlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  // Keep references to dynamic values without tearing down WebGL/Canvas state
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const logoScaleRef = useRef(logoScale);
  logoScaleRef.current = logoScale;

  const particleScaleRef = useRef(particleScale);
  particleScaleRef.current = particleScale;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Pre-bake Hero and About sprites
    const heroSprites = HERO_TIERS.map((t) => makeSprite(t.rgb, t.alpha));
    const aboutSprites = ABOUT_TIERS.map((t) => makeSprite(t.rgb, t.alpha));

    let width = 0;
    let height = 0;
    let dpr = 1;
    let field: ParticleField | null = null;
    let running = true;
    let raf = 0;
    let last = performance.now();

    const releasePointer = subscribePointer();
    const pointer = getPointer();

    const resize = () => {
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      if (w === width && h === height && field) return;

      width = w;
      height = h;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      if (!field) {
        const isDesktop = width >= 1024;
        const clampedCount = isDesktop ? 800 : 450;
        field = buildField(clampedCount);

        // Initial positions at Hero home
        updateTargetHomes(field, 0, 1.0, 1.0, width, height);
        for (let i = 0; i < field.n; i++) {
          field.x[i] = field.hx[i];
          field.y[i] = field.hy[i];
        }
      }
    };

    let lastP = -999;
    let lastW = -1;
    let lastH = -1;
    let lastLScale = -1;

    const updateTargetHomes = (
      f: ParticleField,
      p: number,
      lScale: number,
      pScale: number,
      w: number,
      h: number,
    ) => {
      const vb = AV_LOGO.viewBox;
      const vbCx = vb.x + vb.width * 0.5;
      const vbCy = vb.y + vb.height * 0.5;
      const isDesktop = w >= 1024;

      // Hero Coordinates
      let heroCx = w * 0.5;
      let heroCy = h * 0.35;
      let heroMarkScale = Math.min((w * 0.75) / vb.width, (h * 0.35) / vb.height);

      if (isDesktop) {
        const logoOffsetX = Math.max(-w * 0.0806, -116);
        heroCx = w * 0.285 + logoOffsetX;
        heroCy = h * 0.515 + 5;
        heroMarkScale = Math.min((w * 0.39) / vb.width, (h * 0.64) / vb.height);
      }

      // About Coordinates (Centered within the liquid glass chassis with breathing room under header)
      const aboutCx = w * 0.5;
      const aboutCy = isDesktop ? h * 0.575 : h * 0.46;
      const baseAboutScale = isDesktop
        ? Math.min((w * 0.32) / vb.width, (h * 0.48) / vb.height)
        : Math.min((w * 0.70) / vb.width, (h * 0.32) / vb.height);
      const aboutMarkScale = baseAboutScale * lScale;

      // Eased progress for smooth spatial transition
      const easedP = easeInOutCubic(clamp(p, 0, 1));
      const curCx = heroCx + (aboutCx - heroCx) * easedP;
      const curCy = heroCy + (aboutCy - heroCy) * easedP;
      const curScale = heroMarkScale + (aboutMarkScale - heroMarkScale) * easedP;

      // FLOW STATE TURBULENCE:
      // When transitioning (0 < p < 1), inject organic swirling streamline vectors
      const isTransitioning = p > 0.001 && p < 0.999;
      const flowMagnitude = isTransitioning ? Math.sin(p * Math.PI) * (isDesktop ? 55 : 32) : 0;

      for (let i = 0; i < f.n; i++) {
        if (isTransitioning) {
          const theta = i * 0.173 + p * 5.2;
          const pushWeight = f.push[i] * 0.7 + 0.3;
          const streamX = Math.sin(theta) * flowMagnitude * pushWeight;
          const streamY = Math.cos(theta * 1.25) * (flowMagnitude * 0.6) * pushWeight;
          f.hx[i] = curCx + (f.vx[i] - vbCx) * curScale + streamX;
          f.hy[i] = curCy + (f.vy[i] - vbCy) * curScale + streamY;
        } else {
          f.hx[i] = curCx + (f.vx[i] - vbCx) * curScale;
          f.hy[i] = curCy + (f.vy[i] - vbCy) * curScale;
        }
      }
    };

    window.addEventListener("resize", resize);
    resize();

    const step = (dt: number, totalTime: number) => {
      if (!field) return;
      const p = progressRef.current;
      const lScale = logoScaleRef.current;
      const pScale = particleScaleRef.current;
      const n = field.n;

      // Only recompute target coordinates when position or dimensions change
      if (p !== lastP || width !== lastW || height !== lastH || lScale !== lastLScale) {
        updateTargetHomes(field, p, lScale, pScale, width, height);
        lastP = p;
        lastW = width;
        lastH = height;
        lastLScale = lScale;
      }

      const vb = AV_LOGO.viewBox;
      const isDesktop = width >= 1024;
      const baseScale = isDesktop ? 0.34 : 0.7;
      const markWidth = vb.width * Math.min((width * baseScale) / vb.width, (height * 0.5) / vb.height) * lScale;
      const rReach = markWidth * REPEL_RADIUS;
      const rReachSq = rReach * rReach;
      const repelAcc = markWidth * REPEL_STRENGTH;

      // Mouse repulsion
      const inside = pointer.active;
      const cursorX = pointer.x;
      const cursorY = pointer.y;

      for (let i = 0; i < n; i++) {
        const targetX = field.hx[i] + Math.sin(totalTime * 1.3 + field.wobPhase[i]) * field.wobAX[i];
        const targetY = field.hy[i] + Math.cos(totalTime * 1.4 + field.wobPhase[i]) * field.wobAY[i];

        const diffX = targetX - field.x[i];
        const diffY = targetY - field.y[i];

        let fx = diffX * field.stiff[i];
        let fy = diffY * field.stiff[i];

        if (inside) {
          const dx = field.x[i] - cursorX;
          if (Math.abs(dx) < rReach) {
            const dy = field.y[i] - cursorY;
            if (Math.abs(dy) < rReach) {
              const dSq = dx * dx + dy * dy;
              if (dSq < rReachSq && dSq > 0.001) {
                const d = Math.sqrt(dSq);
                const factor = 1 - d / rReach;
                const repForce = factor * factor * repelAcc * field.push[i];
                fx += (dx / d) * repForce;
                fy += (dy / d) * repForce;
              }
            }
          }
        }

        const drag = field.damp[i];
        fx -= field.velX[i] * drag;
        fy -= field.velY[i] * drag;

        field.velX[i] += fx * dt;
        field.velY[i] += fy * dt;
        field.x[i] += field.velX[i] * dt;
        field.y[i] += field.velY[i] * dt;
      }
    };

    const draw = () => {
      if (!field) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const p = clamp(progressRef.current, 0, 1);
      const pScale = particleScaleRef.current;
      const easedP = easeInOutCubic(p);

      for (let t = 0; t < HERO_TIERS.length; t++) {
        const sprite = easedP < 0.5 ? heroSprites[t] : aboutSprites[t];
        const start = field.tierStart[t];
        const len = field.tierLen[t];

        // Base size scaled up by particleScale as we move into the second screen
        const heroSize = HERO_TIERS[t].size * SPRITE_OVERDRAW;
        const aboutSize = ABOUT_TIERS[t].size * SPRITE_OVERDRAW * pScale;
        const currentSize = heroSize + (aboutSize - heroSize) * easedP;
        const half = currentSize * 0.5;

        for (let i = start; i < start + len; i++) {
          ctx.drawImage(sprite, field.x[i] - half, field.y[i] - half, currentSize, currentSize);
        }
      }
    };

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      let dt = (now - last) / 1000;
      last = now;
      if (!(dt > 0)) return;
      if (dt > 0.05) dt = 0.05;
      step(dt, now / 1000);
      draw();
    };

    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      releasePointer();
    };
  }, [reduced]);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none fixed inset-0 z-20 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
