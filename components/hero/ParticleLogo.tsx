"use client";

import { useEffect, useRef } from "react";
import { AV_LOGO } from "@/lib/logo";
import { sampleOutline } from "@/lib/outline";
import { getPointer, subscribePointer } from "@/lib/pointer";
import { gaussian, mulberry32 } from "@/lib/prng";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * The AV Nirvana mark, reconstructed as a field of particles that trace the
 * *outline* of the three chevrons. The interiors stay empty by construction:
 * every home position comes from a point walked along the vector contour
 * (see `lib/outline.ts`), never from inside the filled shape.
 *
 * Three behaviours share one simulation:
 *
 *   intro — particles start as a scattered, lightly swirled cloud and sweep
 *           into the mark from the bottom up.
 *   live  — each particle is a damped spring on its home; the cursor adds a
 *           local repulsion with quadratic falloff, parting the field where it
 *           passes and leaving the rest of the mark readable.
 *   burst — hold the cursor in the field for four seconds and it gives way:
 *           an outward impulse throws the particles clear, then the springs
 *           re-engage and the mark reassembles.
 *
 * The whole system lives outside React: one effect, typed arrays, and a single
 * rAF loop writing to a canvas. React never re-renders during animation.
 */

/** Shading tiers. Particles are pre-sorted into these, so the draw loop walks
 *  five contiguous runs and never touches canvas state inside the inner loop. */
const TIERS = [
  { rgb: "22,25,31", alpha: 0.95, size: 1.5 },
  { rgb: "31,36,44", alpha: 0.8, size: 1.34 },
  { rgb: "46,53,63", alpha: 0.6, size: 1.2 },
  { rgb: "72,81,94", alpha: 0.36, size: 1.06 },
  { rgb: "103,112,126", alpha: 0.2, size: 0.94 },
];

const CORE_TIER_WEIGHTS = [0.3, 0.32, 0.24, 0.11, 0.03];
const HALO_TIER_WEIGHTS = [0, 0.03, 0.1, 0.37, 0.5];

/** Share of particles that sit tight on the contour. The rest form the halo. */
const CORE_SHARE = 0.87;

/** Stroke thickness of the particle outline, in viewBox units (width = 911). */
const STROKE_SIGMA = 8.5;
/** How far halo dust can stray from the contour, in viewBox units. */
const HALO_REACH = 150;
/** Direction the dust preferentially dissolves toward (up and to the left). */
const DUST_DIR_X = -0.79;
const DUST_DIR_Y = -0.61;

/** Fraction of the container the logo is fitted into, leaving room for halo. */
const FIT_INSET_X = 0.15;
const FIT_INSET_Y = 0.09;

const SPRING_BASE = 26;
const DAMPING_BASE = 4.2;

/**
 * Cursor repulsion, both expressed relative to the rendered width of the mark
 * so the effect scales with the logo rather than the screen.
 *
 * `REPEL_RADIUS` is the reach of the influence circle; `REPEL_STRENGTH` is the
 * peak outward acceleration. Together they settle particles roughly 0.43× the
 * mark's width clear of the cursor, which carves a clearly readable void.
 */
const REPEL_RADIUS = 0.63;
const REPEL_STRENGTH = 24.8;

/** Assembly: sweep delay from the bottom of the mark to the top, in seconds. */
const INTRO_SWEEP = 0.55;
const INTRO_JITTER = 0.2;
const INTRO_DUR_MIN = 1.15;
const INTRO_DUR_VAR = 0.5;

/** Seconds of unbroken disturbance before the field gives way. */
const DISTURB_TRIGGER = 4;
/** How fast the disturbance meter falls once the cursor leaves. */
const DISTURB_DECAY = 1.8;
/** The meter is driven this far negative after a burst, as a cooldown. */
const BURST_COOLDOWN = 2.5;
/** Free-flight window before the springs start pulling particles back. */
const BURST_FLY = 0.42;
/** Total burst duration, after which the field is fully back under spring control. */
const BURST_TOTAL = 2.15;
/**
 * Distance a particle covers per unit of launch velocity during free flight —
 * the integral of the drag decay over `BURST_FLY`. Used to turn a target
 * displacement into an impulse, so the bloom is sized to the frame.
 */
const BURST_TRAVEL = 0.27;

/** Sprites are drawn larger than the nominal dot; only the inner part is solid. */
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

/** A soft round dot, baked with its tier colour so the draw loop is state-free. */
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
  /** Home position in viewBox units, jitter and halo offset already baked in. */
  vx: Float32Array;
  vy: Float32Array;
  /** Home position in canvas CSS pixels. */
  hx: Float32Array;
  hy: Float32Array;
  x: Float32Array;
  y: Float32Array;
  velX: Float32Array;
  velY: Float32Array;
  stiff: Float32Array;
  damp: Float32Array;
  /** How strongly this particle answers the cursor and the burst impulse. */
  push: Float32Array;
  /** Two-oscillator ambient wander weights, in CSS pixels. */
  wobAX: Float32Array;
  wobBX: Float32Array;
  wobAY: Float32Array;
  wobBY: Float32Array;
  size: Float32Array;
  /** Where the particle starts, as a fraction of the canvas box (0..1). */
  scatterU: Float32Array;
  scatterV: Float32Array;
  /** How far toward that scattered point the particle actually begins. */
  scatterMix: Float32Array;
  introDelay: Float32Array;
  introDur: Float32Array;
  /** Fixed per-particle noise, so a burst is varied but deterministic. */
  rndA: Float32Array;
  rndB: Float32Array;
  /** Index of the first particle of each tier, plus a terminating `n`. */
  tierStart: number[];
}

function buildField(count: number, sizeBoost: number): Field | null {
  const core = Math.max(1, Math.round(count * CORE_SHARE));
  const outline = sampleOutline(AV_LOGO, core);
  if (outline.count === 0) return null;

  const n = Math.round(outline.count / CORE_SHARE);
  const rnd = mulberry32(9184233);

  const vb = AV_LOGO.viewBox;
  const cx = vb.x + vb.width / 2;
  const cy = vb.y + vb.height / 2;

  // Pass one: generate every particle, tagging its tier.
  const gvx = new Float32Array(n);
  const gvy = new Float32Array(n);
  const gsize = new Float32Array(n);
  const gstiff = new Float32Array(n);
  const gdamp = new Float32Array(n);
  const gpush = new Float32Array(n);
  const gwAX = new Float32Array(n);
  const gwBX = new Float32Array(n);
  const gwAY = new Float32Array(n);
  const gwBY = new Float32Array(n);
  const gsu = new Float32Array(n);
  const gsv = new Float32Array(n);
  const gsm = new Float32Array(n);
  const gdelay = new Float32Array(n);
  const gdur = new Float32Array(n);
  const grA = new Float32Array(n);
  const grB = new Float32Array(n);
  const gtier = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    const isHalo = i >= outline.count;
    const s = isHalo ? Math.floor(rnd() * outline.count) : i;

    const ox = outline.nx[s];
    const oy = outline.ny[s];
    // Tangent, for spreading along the contour rather than across it.
    const tx = -oy;
    const ty = ox;
    // How much this stretch of contour faces the dissolve direction.
    const facing = Math.max(0, ox * DUST_DIR_X + oy * DUST_DIR_Y);

    let px = outline.x[s];
    let py = outline.y[s];

    if (isHalo) {
      // Always pushed *outward* along the contour normal, so dust can never
      // wander into the hollow interior of a chevron.
      const out = 8 + Math.pow(rnd(), 2.1) * HALO_REACH;
      const along = gaussian(rnd) * 22;
      const stream = Math.pow(rnd(), 2) * 105 * facing;

      px += ox * (out + stream) + tx * along;
      py += oy * (out + stream) + ty * along;
    } else {
      px += ox * gaussian(rnd) * STROKE_SIGMA + tx * gaussian(rnd) * 4.2;
      py += oy * gaussian(rnd) * STROKE_SIGMA + ty * gaussian(rnd) * 4.2;
    }

    // Edges facing the dissolve read a little fainter, so the mark looks like
    // it is coming apart on one side rather than uniformly dotted.
    const bias = isHalo ? 0 : facing * 0.3;
    const tier = pickTier(
      clamp(rnd() + bias, 0, 0.999),
      isHalo ? HALO_TIER_WEIGHTS : CORE_TIER_WEIGHTS,
    );

    gvx[i] = px;
    gvy[i] = py;
    gtier[i] = tier;
    gsize[i] = TIERS[tier].size * (0.82 + rnd() * 0.43) * sizeBoost * SPRITE_OVERDRAW;
    // Halo particles are looser: they lag further, settle more slowly, and
    // answer the cursor more readily than the dense core does.
    gstiff[i] = SPRING_BASE * (isHalo ? 0.34 + rnd() * 0.3 : 0.72 + rnd() * 0.68);
    gdamp[i] = DAMPING_BASE * (isHalo ? 0.72 + rnd() * 0.3 : 0.85 + rnd() * 0.4);
    gpush[i] = isHalo ? 1.15 + rnd() * 0.4 : 0.78 + rnd() * 0.44;

    const wob = isHalo ? 2.1 : 0.62;
    gwAX[i] = (rnd() * 2 - 1) * wob;
    gwBX[i] = (rnd() * 2 - 1) * wob * 0.7;
    gwAY[i] = (rnd() * 2 - 1) * wob;
    gwBY[i] = (rnd() * 2 - 1) * wob * 0.7;

    // Starting cloud: the mark's own geometry, rotated and thrown outward,
    // then half-dissolved into noise. Kept in 0..1 of the canvas so the cloud
    // never gets clipped by the edges of the frame.
    const ux = (px - cx) / (vb.width * 0.5);
    const uy = (py - cy) / (vb.height * 0.5);
    const rot = 0.55 + rnd() * 0.5;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const spread = 1.15 + rnd() * 0.75;
    const swirlU = 0.5 + (ux * cos - uy * sin) * spread * 0.42;
    const swirlV = 0.5 + (ux * sin + uy * cos) * spread * 0.42;
    gsu[i] = clamp(swirlU * 0.5 + rnd() * 0.5, 0.02, 0.98);
    gsv[i] = clamp(swirlV * 0.5 + rnd() * 0.5, 0.02, 0.98);
    gsm[i] = 0.72 + rnd() * 0.28;

    // Sweep the assembly upward: the base of the mark lands first.
    gdelay[i] = INTRO_SWEEP * (1 - (py - vb.y) / vb.height) + rnd() * INTRO_JITTER;
    gdur[i] = INTRO_DUR_MIN + rnd() * INTRO_DUR_VAR;

    grA[i] = rnd();
    grB[i] = rnd();
  }

  // Pass two: sort by tier so the draw loop can batch by sprite.
  const counts = new Array(TIERS.length).fill(0) as number[];
  for (let i = 0; i < n; i++) counts[gtier[i]]++;

  const tierStart: number[] = [0];
  for (let t = 0; t < TIERS.length; t++) tierStart.push(tierStart[t] + counts[t]);
  const cursor = tierStart.slice(0, TIERS.length);

  const field: Field = {
    n,
    vx: new Float32Array(n),
    vy: new Float32Array(n),
    hx: new Float32Array(n),
    hy: new Float32Array(n),
    x: new Float32Array(n),
    y: new Float32Array(n),
    velX: new Float32Array(n),
    velY: new Float32Array(n),
    stiff: new Float32Array(n),
    damp: new Float32Array(n),
    push: new Float32Array(n),
    wobAX: new Float32Array(n),
    wobBX: new Float32Array(n),
    wobAY: new Float32Array(n),
    wobBY: new Float32Array(n),
    size: new Float32Array(n),
    scatterU: new Float32Array(n),
    scatterV: new Float32Array(n),
    scatterMix: new Float32Array(n),
    introDelay: new Float32Array(n),
    introDur: new Float32Array(n),
    rndA: new Float32Array(n),
    rndB: new Float32Array(n),
    tierStart,
  };

  for (let i = 0; i < n; i++) {
    const t = gtier[i];
    const j = cursor[t]++;
    field.vx[j] = gvx[i];
    field.vy[j] = gvy[i];
    field.size[j] = gsize[i];
    field.stiff[j] = gstiff[i];
    field.damp[j] = gdamp[i];
    field.push[j] = gpush[i];
    field.wobAX[j] = gwAX[i];
    field.wobBX[j] = gwBX[i];
    field.wobAY[j] = gwAY[i];
    field.wobBY[j] = gwBY[i];
    field.scatterU[j] = gsu[i];
    field.scatterV[j] = gsv[i];
    field.scatterMix[j] = gsm[i];
    field.introDelay[j] = gdelay[i];
    field.introDur[j] = gdur[i];
    field.rndA[j] = grA[i];
    field.rndB[j] = grB[i];
  }

  return field;
}

function desiredCount(w: number, h: number, coarse: boolean) {
  let n = Math.round((w * h) / 85);
  const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 8 : 8;
  if (cores <= 4) n = Math.round(n * 0.65);
  return clamp(n, 1100, coarse ? 2600 : 6000);
}

export default function ParticleLogo({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const releasePointer = subscribePointer();
    const pointer = getPointer();
    const sprites = TIERS.map((t) => makeSprite(t.rgb, t.alpha));

    let field: Field | null = null;
    let width = 0;
    let height = 0;
    let scale = 0;
    let offX = 0;
    let offY = 0;
    let drawW = 0;
    let drawH = 0;
    let rect = host.getBoundingClientRect();
    let rebuildTimer: ReturnType<typeof setTimeout> | null = null;

    let phase: Phase = reduced ? "live" : "intro";
    let introT = 0;
    let introEnd = 0;
    let burstT = 0;
    let disturb = 0;

    const measure = () => {
      rect = host.getBoundingClientRect();
    };

    /** Fit the mark inside the host, preserving aspect and leaving halo room. */
    const applyFit = (prevScale: number, prevOffX: number, prevOffY: number) => {
      const vb = AV_LOGO.viewBox;
      const availW = width * (1 - FIT_INSET_X * 2);
      const availH = height * (1 - FIT_INSET_Y * 2);
      scale = Math.min(availW / vb.width, availH / vb.height);
      drawW = vb.width * scale;
      drawH = vb.height * scale;
      offX = (width - drawW) / 2;
      offY = (height - drawH) / 2;

      if (!field) return;
      const remap = prevScale > 0;
      const ratio = remap ? scale / prevScale : 1;

      for (let i = 0; i < field.n; i++) {
        field.hx[i] = offX + (field.vx[i] - vb.x) * scale;
        field.hy[i] = offY + (field.vy[i] - vb.y) * scale;
        if (remap) {
          field.x[i] = offX + (field.x[i] - prevOffX) * ratio;
          field.y[i] = offY + (field.y[i] - prevOffY) * ratio;
          field.velX[i] *= ratio;
          field.velY[i] *= ratio;
        } else if (phase === "intro") {
          field.x[i] = field.hx[i] + (field.scatterU[i] * width - field.hx[i]) * field.scatterMix[i];
          field.y[i] =
            field.hy[i] + (field.scatterV[i] * height - field.hy[i]) * field.scatterMix[i];
        } else {
          field.x[i] = field.hx[i];
          field.y[i] = field.hy[i];
        }
      }
    };

    const draw = () => {
      if (!field) return;
      ctx.clearRect(0, 0, width, height);
      const x = field.x;
      const y = field.y;
      const size = field.size;
      for (let t = 0; t < TIERS.length; t++) {
        const from = field.tierStart[t];
        const to = field.tierStart[t + 1];
        if (from === to) continue;
        const sprite = sprites[t];
        for (let i = from; i < to; i++) {
          const s = size[i];
          ctx.drawImage(sprite, x[i] - s * 0.5, y[i] - s * 0.5, s, s);
        }
      }
    };

    /** Throw every particle clear of `ox, oy`, then let the springs recover. */
    const detonate = (ox: number, oy: number) => {
      if (!field) return;
      phase = "burst";
      burstT = 0;
      disturb = -BURST_COOLDOWN;

      // Size the impulse to the room actually left inside the canvas, per
      // axis, so the field blooms to fill the frame rather than blowing past
      // it and clipping into a rectangle at the edges.
      const roomX = Math.max(60, (width - drawW) * 0.5 + drawW * 0.1);
      const roomY = Math.max(60, (height - drawH) * 0.5 + drawH * 0.1);
      const launchX = roomX / BURST_TRAVEL;
      const launchY = roomY / BURST_TRAVEL;
      const reach = Math.max(drawW * 0.5, 1);

      for (let i = 0; i < field.n; i++) {
        let dx = field.x[i] - ox;
        let dy = field.y[i] - oy;
        let d = Math.hypot(dx, dy);
        if (d < 1) {
          const a = field.rndA[i] * Math.PI * 2;
          dx = Math.cos(a);
          dy = Math.sin(a);
          d = 1;
        }
        const inv = 1 / d;
        const nx = dx * inv;
        const ny = dy * inv;
        // Near the origin the kick is hardest, but everything moves — the
        // whole mark should come apart, not just the patch under the cursor.
        const falloff = 1 / (1 + d / reach);
        const mag = Math.min(
          1,
          (0.45 + 0.55 * falloff) * (0.6 + field.rndA[i] * 0.8) * field.push[i] * 0.7,
        );
        // A little tangential swirl, so the field blooms instead of spiking.
        const swirl = (field.rndB[i] * 2 - 1) * 0.28;

        field.velX[i] += (nx - ny * swirl) * mag * launchX;
        field.velY[i] += (ny + nx * swirl) * mag * launchY;
      }
    };

    const stepIntro = (dt: number, t: number) => {
      if (!field) return;
      introT += dt;

      const o1 = Math.sin(t * 0.29);
      const o2 = Math.sin(t * 0.47 + 1.7);
      const o3 = Math.cos(t * 0.23 + 0.6);
      const o4 = Math.cos(t * 0.38 + 2.4);
      const invDt = 1 / dt;

      for (let i = 0; i < field.n; i++) {
        const p = clamp((introT - field.introDelay[i]) / field.introDur[i], 0, 1);
        // Quartic ease-out: a decisive move that settles gently.
        const inv = 1 - p;
        const e = 1 - inv * inv * inv * inv;

        const hx = field.hx[i];
        const hy = field.hy[i];
        const sx = hx + (field.scatterU[i] * width - hx) * field.scatterMix[i];
        const sy = hy + (field.scatterV[i] * height - hy) * field.scatterMix[i];

        // Ambient wander fades in with arrival, so the cloud does not shimmer
        // while it is still travelling.
        const wx = (o1 * field.wobAX[i] + o2 * field.wobBX[i]) * e;
        const wy = (o3 * field.wobAY[i] + o4 * field.wobBY[i]) * e;

        const nx = sx + (hx - sx) * e + wx;
        const ny = sy + (hy - sy) * e + wy;

        // Carry the arrival momentum into the spring phase.
        field.velX[i] = (nx - field.x[i]) * invDt;
        field.velY[i] = (ny - field.y[i]) * invDt;
        field.x[i] = nx;
        field.y[i] = ny;
      }

      if (introT >= introEnd) phase = "live";
    };

    const stepPhysics = (dt: number, t: number) => {
      if (!field) return;

      // Two shared oscillators drive every particle's ambient wander, so the
      // per-particle cost is a pair of multiply-adds instead of a sin().
      const o1 = Math.sin(t * 0.29);
      const o2 = Math.sin(t * 0.47 + 1.7);
      const o3 = Math.cos(t * 0.23 + 0.6);
      const o4 = Math.cos(t * 0.38 + 2.4);

      const radius = clamp(drawW * REPEL_RADIUS, 110, 340);
      const radius2 = radius * radius;
      const px = pointer.x - rect.left;
      const py = pointer.y - rect.top;

      const onCanvas =
        pointer.active &&
        pointer.x >= rect.left - 120 &&
        pointer.x <= rect.right + 120 &&
        pointer.y >= rect.top - 120 &&
        pointer.y <= rect.bottom + 120;

      // "Disturbing" means the cursor is close enough to the mark itself to be
      // moving particles — not merely somewhere over the canvas.
      const nearMark =
        onCanvas &&
        px >= offX - radius &&
        px <= offX + drawW + radius &&
        py >= offY - radius &&
        py <= offY + drawH + radius;

      let springGain = 1;
      let dampMul = 1;
      let repelGain = 1;

      if (phase === "burst") {
        burstT += dt;
        if (burstT < BURST_FLY) {
          // Free flight: springs almost off, low drag, particles travel.
          springGain = 0.05;
          dampMul = 0.55;
          repelGain = 0;
        } else {
          const back = smoothstep(BURST_FLY, BURST_TOTAL * 0.8, burstT);
          springGain = 0.05 + back * 0.95;
          // Extra damping on the way home keeps the reassembly composed
          // instead of elastic, relaxing to normal as it completes.
          dampMul = 1 + (1 - back) * 1.4;
          repelGain = back;
        }
        if (burstT >= BURST_TOTAL) phase = "live";
      } else {
        disturb = nearMark
          ? disturb + dt
          : Math.max(disturb - dt * DISTURB_DECAY, -BURST_COOLDOWN);
        if (disturb >= DISTURB_TRIGGER) {
          detonate(px, py);
          return;
        }
      }

      // Fast movement pushes a little harder — the field feels like it has
      // mass — but a resting cursor still carves a clear void.
      const gust = clamp(0.85 + pointer.speed * 0.018, 0.85, 1.5);
      const strength = drawW * REPEL_STRENGTH * gust * repelGain;
      const repel = onCanvas && repelGain > 0.01;

      const damp = field.damp;
      const stiff = field.stiff;
      const push = field.push;

      for (let i = 0; i < field.n; i++) {
        const homeX = field.hx[i] + o1 * field.wobAX[i] + o2 * field.wobBX[i];
        const homeY = field.hy[i] + o3 * field.wobAY[i] + o4 * field.wobBY[i];

        const x = field.x[i];
        const y = field.y[i];

        const k = stiff[i] * springGain;
        let ax = (homeX - x) * k;
        let ay = (homeY - y) * k;

        if (repel) {
          const dx = x - px;
          const dy = y - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < radius2) {
            const d = Math.sqrt(d2) || 0.0001;
            // Inverse-square-of-normalised-distance: stays near full strength
            // across most of the radius and tapers only at the rim, which
            // clears a round void instead of nudging a narrow spot.
            const falloff = 1 - d2 / radius2;
            const f = (falloff * strength * push[i]) / d;
            ax += dx * f;
            ay += dy * f;
          }
        }

        let vx = field.velX[i] + ax * dt;
        let vy = field.velY[i] + ay * dt;
        const decay = Math.exp(-damp[i] * dampMul * dt);
        vx *= decay;
        vy *= decay;

        field.velX[i] = vx;
        field.velY[i] = vy;
        field.x[i] = x + vx * dt;
        field.y[i] = y + vy * dt;
      }
    };

    const step = (dt: number, t: number) => {
      if (phase === "intro") stepIntro(dt, t);
      else stepPhysics(dt, t);
    };

    const noteIntroLength = () => {
      if (!field) return;
      let longest = 0;
      for (let i = 0; i < field.n; i++) {
        const end = field.introDelay[i] + field.introDur[i];
        if (end > longest) longest = end;
      }
      introEnd = longest;
    };

    const resize = () => {
      const r = host.getBoundingClientRect();
      const nextW = Math.max(1, Math.round(r.width));
      const nextH = Math.max(1, Math.round(r.height));
      if (nextW === width && nextH === height) return;

      const prevScale = scale;
      const prevOffX = offX;
      const prevOffY = offY;

      width = nextW;
      height = nextH;
      rect = r;

      const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      if (!field) {
        field = buildField(desiredCount(width, height, pointer.coarse), dpr >= 2 ? 1 : 1.14);
        noteIntroLength();
      } else {
        // Only regenerate when the viewport has changed enough to matter.
        const want = desiredCount(width, height, pointer.coarse);
        if (Math.abs(want - field.n) / field.n > 0.3) {
          if (rebuildTimer) clearTimeout(rebuildTimer);
          rebuildTimer = setTimeout(() => {
            const dpr2 = clamp(window.devicePixelRatio || 1, 1, 2);
            const rebuilt = buildField(want, dpr2 >= 2 ? 1 : 1.14);
            if (rebuilt) {
              field = rebuilt;
              noteIntroLength();
              // A rebuilt field has no history to preserve; drop straight to
              // the settled state rather than replaying the assembly.
              if (phase !== "intro") phase = "live";
              applyFit(0, 0, 0);
              if (reduced) draw();
            }
          }, 260);
        }
      }

      applyFit(prevScale, prevOffX, prevOffY);
      if (reduced) draw();
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    let raf = 0;
    let running = false;
    let last = 0;

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
