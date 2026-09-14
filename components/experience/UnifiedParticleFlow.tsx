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

// About Color Tiers (Pure White & Neutral Greys — No Blues)
const ABOUT_TIERS = [
  { rgb: "255,255,255", alpha: 0.98, size: 1.55 }, // Pure Brilliant White
  { rgb: "240,242,246", alpha: 0.88, size: 1.38 }, // Soft White
  { rgb: "205,210,220", alpha: 0.78, size: 1.24 }, // Pale Silver Grey
  { rgb: "155,160,172", alpha: 0.62, size: 1.10 }, // Medium Mist Grey
  { rgb: "110,115,128", alpha: 0.40, size: 0.95 }, // Deep Slate Grey
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
  // Screen 3 Sound Wave Coordinates
  waveSide: Int8Array;
  waveBand: Uint8Array;
  waveAngle: Float32Array;
  waveRadialOffset: Float32Array;
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

  // Screen 3 Sound Wave Arrays
  const waveSide = new Int8Array(n);
  const waveBand = new Uint8Array(n);
  const waveAngle = new Float32Array(n);
  const waveRadialOffset = new Float32Array(n);

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

    // Symmetrical 50/50 distribution: left (-1) vs right (+1) sound waves
    waveSide[i] = i % 2 === 0 ? -1 : 1;

    // 4 concentric bands (0 = inner/biggest wave, 3 = outer/smallest tip)
    // Tapered distribution matching the acoustic cone:
    // Band 0 has the highest share (biggest wave), tapering down to Band 3 (smallest wave)
    const rBand = rng();
    let b = 0;
    if (rBand < 0.40) b = 0;      // 40% in innermost wave (biggest, thickest, brightest)
    else if (rBand < 0.68) b = 1; // 28% in second wave
    else if (rBand < 0.88) b = 2; // 20% in third wave
    else b = 3;                   // 12% in outermost wave (smallest tip)
    waveBand[i] = b;

    // Angular distribution across +-52 deg, concentrated towards equator
    const rawU = (rng() - 0.5) * 2;
    const u = rawU * 0.78 + rawU * rawU * rawU * 0.22;
    waveAngle[i] = u * 0.92;

    waveRadialOffset[i] = halo ? gaussian(rng) * 24 : gaussian(rng) * 9;
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
    waveSide,
    waveBand,
    waveAngle,
    waveRadialOffset,
  };
}

interface UnifiedParticleFlowProps {
  progress?: number;
  logoScale?: number;
  particleScale?: number;
  heroParticleScale?: number;
  waveArcLength?: number;
  waveDensity?: number;
  className?: string;
}

export default function UnifiedParticleFlow({
  progress = 0,
  logoScale = 1.0,
  particleScale = 2.5,
  heroParticleScale = 1.0,
  waveArcLength = 0.85,
  waveDensity = 0.8,
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

  const heroParticleScaleRef = useRef(heroParticleScale);
  heroParticleScaleRef.current = heroParticleScale;

  const waveArcLengthRef = useRef(waveArcLength);
  waveArcLengthRef.current = waveArcLength;

  const waveDensityRef = useRef(waveDensity);
  waveDensityRef.current = waveDensity;

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
        updateTargetHomes(
          field,
          0,
          1.0,
          1.0,
          waveArcLengthRef.current,
          waveDensityRef.current,
          width,
          height,
        );
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
    let lastArcLen = -1;
    let lastDensity = -1;

    const updateTargetHomes = (
      f: ParticleField,
      p: number,
      lScale: number,
      pScale: number,
      arcLen: number,
      density: number,
      w: number,
      h: number,
    ) => {
      const vb = AV_LOGO.viewBox;
      const vbCx = vb.x + vb.width * 0.5;
      const vbCy = vb.y + vb.height * 0.5;
      const isDesktop = w >= 1024;

      // Hero Coordinates (Stage 1, p = 0)
      let heroCx = w * 0.5;
      let heroCy = h * 0.35;
      let heroMarkScale = Math.min((w * 0.75) / vb.width, (h * 0.35) / vb.height);

      if (isDesktop) {
        const logoOffsetX = Math.max(-w * 0.0806, -116);
        heroCx = w * 0.285 + logoOffsetX;
        heroCy = h * 0.515 + 5;
        heroMarkScale = Math.min((w * 0.39) / vb.width, (h * 0.64) / vb.height);
      }

      // About Coordinates (Stage 2, p = 1)
      const aboutCx = w * 0.5;
      const aboutCy = isDesktop ? h * 0.575 : h * 0.46;
      const baseAboutScale = isDesktop
        ? Math.min((w * 0.32) / vb.width, (h * 0.48) / vb.height)
        : Math.min((w * 0.70) / vb.width, (h * 0.32) / vb.height);
      const aboutMarkScale = baseAboutScale * lScale;

      // Sound Wave Coordinates (Stage 3, p = 2)
      // Centered symmetrically around the speaker in Screen 3
      const speakerCx = w * 0.5;
      const speakerCy = isDesktop ? h * 0.49 : h * 0.48;

      // Concentric arc radii framing the speaker
      const baseR0 = isDesktop ? Math.min(w * 0.165, 245) : Math.min(w * 0.28, 130);
      const bandStep = isDesktop ? Math.min(w * 0.070, 105) : Math.min(w * 0.12, 55);

      if (p <= 1.0) {
        // Stage 1 -> Stage 2 (Hero -> About chevron mark)
        const easedP = easeInOutCubic(clamp(p, 0, 1));
        const curCx = heroCx + (aboutCx - heroCx) * easedP;
        const curCy = heroCy + (aboutCy - heroCy) * easedP;
        const curScale = heroMarkScale + (aboutMarkScale - heroMarkScale) * easedP;

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
      } else {
        // Stage 2 -> Stage 3 (About chevron mark -> Acoustic Sound Waves)
        const p23 = clamp(p - 1.0, 0, 1.0);
        const easedP23 = easeInOutCubic(p23);

        const isTransitioning2 = p23 > 0.001 && p23 < 0.999;
        const flowMagnitude2 = isTransitioning2 ? Math.sin(p23 * Math.PI) * (isDesktop ? 68 : 38) : 0;

        for (let i = 0; i < f.n; i++) {
          const aboutX = aboutCx + (f.vx[i] - vbCx) * aboutMarkScale;
          const aboutY = aboutCy + (f.vy[i] - vbCy) * aboutMarkScale;

          const b = f.waveBand[i];
          const side = f.waveSide[i];
          const curR = baseR0 + b * bandStep;

          // Tapered Wave Pattern: biggest wave closest to speaker, smallest wave furthest away
          // Angular arc span is scaled so physical arc height tapers:
          // Band 0 (100% height) -> Band 1 (74% height) -> Band 2 (50% height) -> Band 3 (30% height)
          const taperRatios = [1.0, 0.74, 0.50, 0.30];
          const bandAngleScale = (baseR0 / curR) * taperRatios[b];
          const angle = f.waveAngle[i] * arcLen * bandAngleScale;

          // Band thickness also tapers: Band 0 is a rich, thick diamond band, Band 3 is a crisp, single-file curve
          const radialOffsetMult = [1.25, 1.0, 0.75, 0.50][b];
          const radialOffset = (f.waveRadialOffset[i] / Math.max(0.1, density)) * radialOffsetMult;
          const r = curR + radialOffset;

          const waveX = speakerCx + side * (r * Math.cos(angle));
          const waveY = speakerCy + r * Math.sin(angle);

          if (isTransitioning2) {
            const theta2 = i * 0.143 + p23 * 4.9;
            const pushWeight = f.push[i] * 0.7 + 0.3;
            const streamX2 = Math.sin(theta2) * flowMagnitude2 * pushWeight;
            const streamY2 = Math.cos(theta2 * 1.15) * (flowMagnitude2 * 0.65) * pushWeight;
            f.hx[i] = aboutX + (waveX - aboutX) * easedP23 + streamX2;
            f.hy[i] = aboutY + (waveY - aboutY) * easedP23 + streamY2;
          } else {
            f.hx[i] = aboutX + (waveX - aboutX) * easedP23;
            f.hy[i] = aboutY + (waveY - aboutY) * easedP23;
          }
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
      const arcLen = waveArcLengthRef.current;
      const density = waveDensityRef.current;
      const n = field.n;

      // Only recompute target coordinates when position or dimensions change
      if (
        p !== lastP ||
        width !== lastW ||
        height !== lastH ||
        lScale !== lastLScale ||
        arcLen !== lastArcLen ||
        density !== lastDensity
      ) {
        updateTargetHomes(field, p, lScale, pScale, arcLen, density, width, height);
        lastP = p;
        lastW = width;
        lastH = height;
        lastLScale = lScale;
        lastArcLen = arcLen;
        lastDensity = density;
      }

      const vb = AV_LOGO.viewBox;
      const isDesktop = width >= 1024;
      const baseScale = isDesktop ? 0.34 : 0.7;
      const markWidth = vb.width * Math.min((width * baseScale) / vb.width, (height * 0.5) / vb.height) * lScale;
      const rReach = markWidth * REPEL_RADIUS;
      const rReachSq = rReach * rReach;
      const repelAcc = markWidth * REPEL_STRENGTH;

      const baseR0 = isDesktop ? Math.min(width * 0.165, 245) : Math.min(width * 0.28, 130);
      const bandStep = isDesktop ? Math.min(width * 0.070, 105) : Math.min(width * 0.12, 55);
      const taperRatios = [1.0, 0.74, 0.50, 0.30];

      // Mouse repulsion
      const inside = pointer.active;
      const cursorX = pointer.x;
      const cursorY = pointer.y;

      for (let i = 0; i < n; i++) {
        let targetX = field.hx[i] + Math.sin(totalTime * 1.3 + field.wobPhase[i]) * field.wobAX[i];
        let targetY = field.hy[i] + Math.cos(totalTime * 1.4 + field.wobPhase[i]) * field.wobAY[i];

        // Screen 3 Harmonic Sound Wave Acoustic Pulse
        if (p > 0.7) {
          const soundInfluence = clamp((p - 0.7) / 0.3, 0, 1);
          const b = field.waveBand[i];
          const side = field.waveSide[i];
          const curR = baseR0 + b * bandStep;
          const bandAngleScale = (baseR0 / curR) * taperRatios[b];
          const angle = field.waveAngle[i] * arcLen * bandAngleScale;
          // Wave pulse propagating outward:
          const pulse = Math.sin(totalTime * 3.4 - b * 0.95) * 5.0 * soundInfluence;
          targetX += side * Math.cos(angle) * pulse;
          targetY += Math.sin(angle) * pulse;
        }

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

      const p = clamp(progressRef.current, 0, 2);
      const pScale = particleScaleRef.current;
      const heroPScale = heroParticleScaleRef.current;

      for (let t = 0; t < HERO_TIERS.length; t++) {
        const start = field.tierStart[t];
        const len = field.tierLen[t];

        const heroSize = HERO_TIERS[t].size * SPRITE_OVERDRAW * heroPScale;
        const aboutSize = ABOUT_TIERS[t].size * SPRITE_OVERDRAW * pScale;
        const density = waveDensityRef.current;
        const waveSize = ABOUT_TIERS[t].size * SPRITE_OVERDRAW * (pScale * (0.80 + 0.10 * Math.min(density, 2.5)));

        let currentSize = 0;
        let sprite = aboutSprites[t];

        if (p <= 1.0) {
          const easedP = easeInOutCubic(p);
          currentSize = heroSize + (aboutSize - heroSize) * easedP;
          sprite = easedP < 0.5 ? heroSprites[t] : aboutSprites[t];
        } else {
          const p23 = p - 1.0;
          const easedP23 = easeInOutCubic(p23);
          currentSize = aboutSize + (waveSize - aboutSize) * easedP23;
          sprite = aboutSprites[t];
        }

        for (let i = start; i < start + len; i++) {
          let size = currentSize;
          if (p > 1.0) {
            const b = field.waveBand[i];
            const bandSizeMult = [1.22, 1.04, 0.90, 0.78][b];
            size = currentSize * bandSizeMult;
          }
          const half = size * 0.5;
          ctx.drawImage(sprite, field.x[i] - half, field.y[i] - half, size, size);
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
