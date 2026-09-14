"use client";

import { useEffect, useRef } from "react";
import { AV_LOGO } from "@/lib/logo";
import { sampleOutline } from "@/lib/outline";
import { getPointer, subscribePointer } from "@/lib/pointer";
import { gaussian, mulberry32 } from "@/lib/prng";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * AV Nirvana Chevron Particle Logo — Cool Blue & Soft White Edition for About Section.
 *
 * Configured specifically to mirror the aesthetic in the reference:
 * - Highlight particles: Soft cool-white / ice-white
 * - Secondary particles: Light blue (#8AB6FF)
 * - Main particles: Vibrant mid-blue (#3A86FF)
 * - Halo particles: Deep ambient blue
 *
 * Full spring simulation, mouse repulsion void, and burst disturbance.
 */

const TIERS = [
  { rgb: "246,250,255", alpha: 0.98, size: 1.55 },
  { rgb: "214,230,255", alpha: 0.88, size: 1.38 },
  { rgb: "138,182,255", alpha: 0.78, size: 1.24 },
  { rgb: "58,134,255", alpha: 0.62, size: 1.10 },
  { rgb: "28,74,170", alpha: 0.32, size: 0.95 },
];

const CORE_TIER_WEIGHTS = [0.32, 0.30, 0.24, 0.11, 0.03];
const HALO_TIER_WEIGHTS = [0, 0.04, 0.14, 0.42, 0.40];

const CORE_SHARE = 0.86;
const STROKE_SIGMA = 8.5;
const HALO_REACH = 140;
const DUST_DIR_X = -0.79;
const DUST_DIR_Y = -0.61;

const FIT_INSET_X = 0.12;
const FIT_INSET_Y = 0.08;

const SPRING_BASE = 28;
const DAMPING_BASE = 4.4;

const REPEL_RADIUS = 0.65;
const REPEL_STRENGTH = 25.0;

const INTRO_SWEEP = 0.6;
const INTRO_JITTER = 0.22;
const INTRO_DUR_MIN = 1.1;
const INTRO_DUR_VAR = 0.45;

const DISTURB_TRIGGER = 4;
const DISTURB_DECAY = 1.8;
const BURST_COOLDOWN = 2.5;
const BURST_FLY = 0.42;
const BURST_TOTAL = 2.15;
const BURST_TRAVEL = 0.27;

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

type Phase = "intro" | "live" | "burst";

interface Field {
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
  introStart: Float32Array;
  introDur: Float32Array;
  introStartX: Float32Array;
  introStartY: Float32Array;
  tierStart: Int32Array;
  tierLen: Int32Array;
  tierSizes: Float32Array;
}

function computeParticleCount(width: number, height: number): number {
  const diag = Math.hypot(width, height);
  const count = Math.round(diag * 1.5);
  return Math.max(900, Math.min(count, 1850));
}

function buildField(count: number, width: number, height: number, seed = 20260913): Field {
  const rng = mulberry32(seed);
  const sample = sampleOutline(AV_LOGO, count, seed);
  const n = sample.count;

  const vb = AV_LOGO.viewBox;
  const vbCx = vb.x + vb.width * 0.5;
  const vbCy = vb.y + vb.height * 0.5;

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
  const introStart = new Float32Array(n);
  const introDur = new Float32Array(n);
  const introStartX = new Float32Array(n);
  const introStartY = new Float32Array(n);

  const tierStart = new Int32Array(TIERS.length);
  const tierLen = new Int32Array(TIERS.length);
  const tierSizes = new Float32Array(TIERS.length);
  for (let t = 0; t < TIERS.length; t++) {
    tierSizes[t] = TIERS[t].size * SPRITE_OVERDRAW;
  }

  for (let i = 0; i < n; i++) {
    const orig = perm[i];
    const t = tiers[orig];
    if (tierLen[t] === 0) tierStart[t] = i;
    tierLen[t]++;

    vx[i] = rawVx[orig];
    vy[i] = rawVy[orig];

    const halo = isHalo[orig] === 1;
    stiff[i] = SPRING_BASE * (halo ? 0.72 + rng() * 0.35 : 0.88 + rng() * 0.3);
    damp[i] = DAMPING_BASE * (halo ? 0.85 + rng() * 0.3 : 0.95 + rng() * 0.2);
    push[i] = halo ? 0.6 + rng() * 0.45 : 0.88 + rng() * 0.3;

    wobAX[i] = (rng() - 0.5) * 1.8;
    wobBX[i] = (rng() - 0.5) * 1.0;
    wobAY[i] = (rng() - 0.5) * 1.8;
    wobBY[i] = (rng() - 0.5) * 1.0;
    wobPhase[i] = rng() * Math.PI * 2;

    const relY = clamp(1 - (rawVy[orig] - vb.y) / vb.height, 0, 1);
    introStart[i] = relY * INTRO_SWEEP + rng() * INTRO_JITTER;
    introDur[i] = INTRO_DUR_MIN + rng() * INTRO_DUR_VAR;

    const angle = rng() * Math.PI * 2;
    const dist = 0.55 + rng() * 0.45;
    introStartX[i] = 0.5 + Math.cos(angle) * dist;
    introStartY[i] = 0.95 + Math.sin(angle) * dist * 0.35;
  }

  projectHomes(vx, vy, hx, hy, width, height);

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
    introStart,
    introDur,
    introStartX,
    introStartY,
    tierStart,
    tierLen,
    tierSizes,
  };
}

function projectHomes(
  vx: Float32Array,
  vy: Float32Array,
  hx: Float32Array,
  hy: Float32Array,
  width: number,
  height: number,
) {
  const vb = AV_LOGO.viewBox;
  const availW = width * (1 - FIT_INSET_X * 2);
  const availH = height * (1 - FIT_INSET_Y * 2);
  const scale = Math.min(availW / vb.width, availH / vb.height);

  const offX = (width - vb.width * scale) * 0.5 - vb.x * scale;
  const offY = (height - vb.height * scale) * 0.5 - vb.y * scale;

  for (let i = 0; i < vx.length; i++) {
    hx[i] = vx[i] * scale + offX;
    hy[i] = vy[i] * scale + offY;
  }
}

export default function AboutParticleLogo({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sprites = TIERS.map((t) => makeSprite(t.rgb, t.alpha));

    let width = 0;
    let height = 0;
    let dpr = 1;
    let bounds = host.getBoundingClientRect();
    let field: Field | null = null;
    let rebuildTimer: ReturnType<typeof setTimeout> | null = null;

    let phase: Phase = reduced ? "live" : "intro";
    let phaseTime = 0;
    let disturb = 0;
    let burstTime = 0;
    let running = false;
    let raf = 0;
    let last = performance.now();

    const releasePointer = subscribePointer();
    const pointer = getPointer();

    const measure = () => {
      bounds = host.getBoundingClientRect();
    };

    const resize = () => {
      measure();
      const rect = host.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      if (w === width && h === height) return;

      width = w;
      height = h;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      if (!field) {
        const count = computeParticleCount(width, height);
        field = buildField(count, width, height);
        if (reduced) {
          for (let i = 0; i < field.n; i++) {
            field.x[i] = field.hx[i];
            field.y[i] = field.hy[i];
          }
        }
      } else {
        projectHomes(field.vx, field.vy, field.hx, field.hy, width, height);
      }
    };

    const ro = new ResizeObserver(() => {
      if (rebuildTimer) clearTimeout(rebuildTimer);
      rebuildTimer = setTimeout(() => {
        resize();
        if (reduced) draw();
      }, 70);
    });
    ro.observe(host);
    resize();

    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });

    const step = (dt: number, totalTime: number) => {
      if (!field) return;
      phaseTime += dt;
      const n = field.n;

      const inside =
        pointer.active &&
        pointer.x >= bounds.left &&
        pointer.x <= bounds.right &&
        pointer.y >= bounds.top &&
        pointer.y <= bounds.bottom;

      const cursorX = inside ? pointer.x - bounds.left : -9999;
      const cursorY = inside ? pointer.y - bounds.top : -9999;

      const vb = AV_LOGO.viewBox;
      const markScale = Math.min(
        (width * (1 - FIT_INSET_X * 2)) / vb.width,
        (height * (1 - FIT_INSET_Y * 2)) / vb.height,
      );
      const markWidth = vb.width * markScale;
      const markHeight = vb.height * markScale;

      const rReach = markWidth * REPEL_RADIUS;
      const rReachSq = rReach * rReach;
      const repelAcc = markWidth * REPEL_STRENGTH;

      // Disturbance tracking for burst
      if (phase === "live" && !reduced) {
        if (inside) {
          disturb = Math.min(disturb + dt, DISTURB_TRIGGER);
          if (disturb >= DISTURB_TRIGGER) {
            phase = "burst";
            phaseTime = 0;
            burstTime = 0;

            const cx = width * 0.5;
            const cy = height * 0.5;
            const impulseMax = Math.hypot(width, height) * 0.45;

            for (let i = 0; i < n; i++) {
              const dx = field.hx[i] - cx;
              const dy = field.hy[i] - cy;
              const d = Math.hypot(dx, dy) || 1;
              const speed = (0.5 + field.push[i] * 0.7) * (impulseMax / BURST_TRAVEL);
              field.velX[i] += (dx / d) * speed;
              field.velY[i] += (dy / d) * speed;
            }
          }
        } else {
          disturb = Math.max(disturb - dt * DISTURB_DECAY, 0);
        }
      }

      if (phase === "burst") {
        burstTime += dt;
        if (burstTime >= BURST_TOTAL) {
          phase = "live";
          phaseTime = 0;
          disturb = -BURST_COOLDOWN;
        }
      }

      if (phase === "intro") {
        let allDone = true;
        for (let i = 0; i < n; i++) {
          const tStart = field.introStart[i];
          const tDur = field.introDur[i];
          const prog = clamp((phaseTime - tStart) / tDur, 0, 1);
          if (prog < 1) allDone = false;

          const ease = smoothstep(0, 1, prog);
          const startX = field.introStartX[i] * width;
          const startY = field.introStartY[i] * height;

          field.x[i] = startX + (field.hx[i] - startX) * ease;
          field.y[i] = startY + (field.hy[i] - startY) * ease;
          field.velX[i] = 0;
          field.velY[i] = 0;
        }
        if (allDone) {
          phase = "live";
          phaseTime = 0;
        }
        return;
      }

      // Live & Burst physics integration
      const burstFree = phase === "burst" && burstTime < BURST_FLY;
      const springBlend = phase === "burst" ? smoothstep(BURST_FLY, BURST_TOTAL, burstTime) : 1;

      for (let i = 0; i < n; i++) {
        let fx = 0;
        let fy = 0;

        if (!burstFree) {
          const targetX =
            field.hx[i] +
            Math.sin(totalTime * 1.3 + field.wobPhase[i]) * field.wobAX[i] +
            Math.cos(totalTime * 2.2 + field.wobPhase[i]) * field.wobBX[i];
          const targetY =
            field.hy[i] +
            Math.cos(totalTime * 1.4 + field.wobPhase[i]) * field.wobAY[i] +
            Math.sin(totalTime * 2.5 + field.wobPhase[i]) * field.wobBY[i];

          const diffX = targetX - field.x[i];
          const diffY = targetY - field.y[i];

          fx += diffX * field.stiff[i] * springBlend;
          fy += diffY * field.stiff[i] * springBlend;
        }

        // Cursor repulsion
        if (inside) {
          const dx = field.x[i] - cursorX;
          const dy = field.y[i] - cursorY;
          const dSq = dx * dx + dy * dy;
          if (dSq < rReachSq && dSq > 0.001) {
            const d = Math.sqrt(dSq);
            const factor = Math.max(0, 1 - d / rReach);
            const repForce = factor * factor * repelAcc * field.push[i];
            fx += (dx / d) * repForce;
            fy += (dy / d) * repForce;
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

      for (let t = 0; t < TIERS.length; t++) {
        const sprite = sprites[t];
        const start = field.tierStart[t];
        const len = field.tierLen[t];
        const half = field.tierSizes[t] * 0.5;

        for (let i = start; i < start + len; i++) {
          ctx.drawImage(
            sprite,
            field.x[i] - half,
            field.y[i] - half,
            field.tierSizes[t],
            field.tierSizes[t],
          );
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

    const start = () => {
      if (running || reduced) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        measure();
        if (entry.isIntersecting) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(host);

    if (reduced) draw();
    else start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      if (rebuildTimer) clearTimeout(rebuildTimer);
      releasePointer();
    };
  }, [reduced]);

  return (
    <div ref={hostRef} className={`relative ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
