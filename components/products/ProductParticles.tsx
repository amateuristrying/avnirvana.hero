"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gaussian, mulberry32 } from "@/lib/prng";
import { getPointer, subscribePointer } from "@/lib/pointer";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Particle field drawn around a product on a light page.
 *
 * Each product has a motif — a target position per particle that moves over
 * time — and every particle springs toward its target, so switching motif
 * morphs the field from one shape into the next instead of cutting. Two
 * canvases sandwich the product image: particles with negative depth draw
 * behind it, the rest in front, which lets ribbons and helices wrap around it.
 *
 * Unlike the dark-screen systems this draws with normal blending in deep,
 * saturated tones, since additive light vanishes on white.
 */

export type Motif = "waves" | "ribbon" | "inward" | "helix";

/** [x0, y0, x1, y1] of the visible artwork inside the image, as fractions. */
export type ContentBox = [number, number, number, number];

interface Props {
  /** Runs the simulation; on each activation the field gathers in from the sides. */
  active: boolean;
  motif: Motif;
  /** Four colours, deep → light, then a neutral. Hex. */
  palette: [string, string, string, string];
  /** The product image the motif is built around. */
  anchorRef: RefObject<HTMLElement | null>;
  contentBox: ContentBox;
  /** z-index of the back canvas; the front canvas sits two above it. */
  zBase?: number;
  /** Burst the field outward past the screen edges; false gathers it back. */
  scattered?: boolean;
  /** Freeze the field in place (another screen fully covers it). */
  paused?: boolean;
}

const SPRITE_RES = 32;
const TIER_WEIGHTS = [0.3, 0.36, 0.2, 0.14];
const DUST_SHARE = 0.16;
const REPEL_RADIUS = 110;

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function smoothstep(e0: number, e1: number, v: number) {
  const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function bakeSprite(sprite: HTMLCanvasElement, rgb: [number, number, number]) {
  const g = sprite.getContext("2d");
  if (!g) return;
  const r = SPRITE_RES / 2;
  g.clearRect(0, 0, SPRITE_RES, SPRITE_RES);
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  const c = `${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0}`;
  grad.addColorStop(0, `rgba(${c},1)`);
  grad.addColorStop(0.45, `rgba(${c},0.9)`);
  grad.addColorStop(1, `rgba(${c},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, SPRITE_RES, SPRITE_RES);
}

export default function ProductParticles({
  active,
  motif,
  palette,
  anchorRef,
  contentBox,
  zBase = 0,
  scattered = false,
  paused = false,
}: Props) {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  const motifRef = useRef(motif);
  motifRef.current = motif;
  const paletteRef = useRef(palette);
  paletteRef.current = palette;
  const boxRef = useRef(contentBox);
  boxRef.current = contentBox;
  const activeRef = useRef(active);
  activeRef.current = active;
  const scatterRef = useRef(scattered);
  scatterRef.current = scattered;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  // Bumped on each activation so the running loop restarts its gather-in.
  const activationRef = useRef(0);

  useEffect(() => {
    if (active) activationRef.current++;
  }, [active]);

  useEffect(() => {
    const back = backRef.current;
    const front = frontRef.current;
    const host = back?.parentElement;
    if (!back || !front || !host) return;
    const bctx = back.getContext("2d");
    const fctx = front.getContext("2d");
    if (!bctx || !fctx) return;

    // --- Field ---------------------------------------------------------
    const small = window.innerWidth < 768;
    const n = small ? 760 : 1500;
    const rnd = mulberry32(7342211);
    const x = new Float32Array(n);
    const y = new Float32Array(n);
    const vx = new Float32Array(n);
    const vy = new Float32Array(n);
    const u = new Float32Array(n); // position along the motif
    const band = new Uint8Array(n); // wavefront / strand index
    const side = new Int8Array(n);
    const cross = new Float32Array(n); // offset across the stroke
    const size = new Float32Array(n);
    const tier = new Uint8Array(n);
    const dust = new Uint8Array(n);
    const r1 = new Float32Array(n);
    const stiff = new Float32Array(n);
    const lastTravel = new Float32Array(n).fill(-1);
    const depth = new Float32Array(n);
    const alpha = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      const isDust = rnd() < DUST_SHARE;
      dust[i] = isDust ? 1 : 0;
      u[i] = rnd();
      band[i] = Math.floor(rnd() * 4);
      side[i] = i % 2 === 0 ? -1 : 1;
      cross[i] = gaussian(rnd) * (isDust ? 2.4 : 1);
      r1[i] = rnd();
      const sparkle = rnd() < 0.08;
      size[i] = (sparkle ? 2.3 + rnd() * 0.9 : 1.05 + rnd() * 1.05) * (small ? 0.9 : 1);
      let acc = 0;
      const pick = rnd();
      let t = 3;
      const weights = isDust ? [0.05, 0.2, 0.4, 0.35] : TIER_WEIGHTS;
      for (let k = 0; k < 4; k++) {
        acc += weights[k];
        if (pick < acc) {
          t = k;
          break;
        }
      }
      tier[i] = t;
      stiff[i] = 9 + rnd() * 7;
    }

    // --- Colour ----------------------------------------------------------
    const sprites = Array.from({ length: 4 }, () => {
      const c = document.createElement("canvas");
      c.width = c.height = SPRITE_RES;
      return c;
    });
    const cur = paletteRef.current.map(hexToRgb);
    cur.forEach((rgb, k) => bakeSprite(sprites[k], rgb));

    // --- Geometry ----------------------------------------------------------
    let W = 0;
    let H = 0;
    let dpr = 1;
    let hostRect = host.getBoundingClientRect();
    // Visible product artwork, in host CSS px.
    let cx = 0;
    let cy = 0;
    let pw = 1;
    let ph = 1;

    const measure = () => {
      hostRect = host.getBoundingClientRect();
      const a = anchorRef.current?.getBoundingClientRect();
      if (!a || a.width === 0) return;
      const [x0, y0, x1, y1] = boxRef.current;
      const left = a.left + a.width * x0 - hostRect.left;
      const right = a.left + a.width * x1 - hostRect.left;
      const top = a.top + a.height * y0 - hostRect.top;
      const bottom = a.top + a.height * y1 - hostRect.top;
      cx = (left + right) / 2;
      cy = (top + bottom) / 2;
      pw = Math.max(40, right - left);
      ph = Math.max(40, bottom - top);
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = host.clientWidth;
      H = host.clientHeight;
      for (const c of [back, front]) {
        c.width = Math.max(1, Math.round(W * dpr));
        c.height = Math.max(1, Math.round(H * dpr));
      }
      measure();
    };

    // --- Motifs: target position, depth (-1 back … 1 front) and alpha ------
    let tx = 0;
    let ty = 0;
    let td = 0;
    let ta = 1;
    let travel = -1;

    const target = (i: number, t: number, m: Motif) => {
      motifTarget(i, t, m);
      if (scatterRef.current) {
        // Fly out along the line from the product through the particle's own
        // spot in the motif, well past the edge of the page.
        const a = Math.atan2(ty - cy, tx - cx) + (r1[i] - 0.5) * 0.5;
        const reach = Math.hypot(W, H) * (0.6 + r1[i] * 0.5);
        tx = cx + Math.cos(a) * reach;
        ty = cy + Math.sin(a) * reach;
        travel = -1;
      }
    };

    const motifTarget = (i: number, t: number, m: Motif) => {
      travel = -1;
      if (dust[i]) {
        // Slow drifting haze around the product, shared by every motif.
        const phi = r1[i] * Math.PI * 2 + t * 0.045 * side[i];
        const rho = (0.62 + u[i] * 0.95) * Math.max(pw, ph);
        tx = cx + Math.cos(phi) * rho * 1.35 + cross[i] * 8;
        ty = cy + Math.sin(phi) * rho * 0.62;
        td = -0.6;
        ta = 0.55;
        return;
      }
      const s = side[i];
      if (m === "waves") {
        // Wavefronts radiating out of both sides of the speaker: ((( ● ))).
        travel = (band[i] / 4 + t * 0.085 + cross[i] * 0.006) % 1;
        const r0 = pw * 0.5 + 26;
        const reach = Math.min(W * 0.34, 470);
        const r = r0 + travel * reach;
        const span = 0.7 - travel * 0.18;
        const a = (u[i] * 2 - 1) * span;
        tx = cx + s * Math.cos(a) * r + cross[i] * 3;
        ty = cy + Math.sin(a) * r * 1.08 + cross[i] * 3;
        td = -1;
        ta = smoothstep(0, 0.12, travel) * Math.pow(1 - travel, 1.1);
      } else if (m === "inward") {
        // Reversed arcs travelling in toward the product from both sides.
        travel = (band[i] / 4 + t * 0.075 + cross[i] * 0.006) % 1;
        const r0 = pw * 0.5 + 22;
        const reach = Math.min(W * 0.32, 440);
        const r = r0 + (1 - travel) * reach;
        const span = 0.55;
        const a = (u[i] * 2 - 1) * span;
        tx = cx + s * (r + (1 - Math.cos(a)) * r * 0.55) + cross[i] * 3;
        ty = cy + Math.sin(a) * r * 0.95 + cross[i] * 3;
        td = -1;
        ta = smoothstep(0, 0.14, travel) * smoothstep(1, 0.8, travel);
      } else if (m === "ribbon") {
        // Two strands of a ribbon flowing across the page, weaving round it.
        travel = (u[i] + t * 0.03) % 1;
        const px = -0.06 * W + travel * W * 1.12;
        const k = (Math.PI * 2 * 1.15) / Math.max(1, W);
        const off = s < 0 ? 0 : Math.PI * 0.7;
        const amp = ph * (s < 0 ? 0.2 : 0.14);
        tx = px;
        ty = cy + ph * 0.1 + Math.sin(px * k + t * 0.55 + off) * amp + Math.sin(px * k * 0.45 - t * 0.35) * ph * 0.07 + cross[i] * 9;
        td = Math.sin(px * k * 0.5 + t * 0.3 + off);
        ta = smoothstep(0, 0.07, travel) * smoothstep(1, 0.93, travel);
      } else {
        // Helix wrapping the product on a vertical axis.
        const turns = 3.1;
        const theta = u[i] * turns * Math.PI * 2 + t * 0.75 + (s < 0 ? 0 : Math.PI);
        const radius = pw * 0.56 + 22 + cross[i] * 3;
        tx = cx + Math.cos(theta) * radius;
        ty = cy + (u[i] - 0.5) * ph * 1.2 + Math.sin(theta) * radius * 0.16 + cross[i] * 2;
        td = Math.sin(theta);
        ta = 0.45 + 0.55 * ((td + 1) / 2);
      }
    };

    // --- Loop ----------------------------------------------------------------
    let raf = 0;
    let last = 0;
    let t = 0;
    let gather = 0;
    let seenActivation = -1;
    const pointer = { x: -1e4, y: -1e4 };
    const releasePointer = subscribePointer();

    const scatter = () => {
      // Start just past the side each particle belongs to, like the hero.
      for (let i = 0; i < n; i++) {
        x[i] = side[i] < 0 ? -40 - r1[i] * W * 0.25 : W + 40 + r1[i] * W * 0.25;
        y[i] = H * (0.1 + u[i] * 0.8);
        vx[i] = vy[i] = 0;
        lastTravel[i] = -1;
      }
      gather = 0;
    };

    const step = (dt: number) => {
      t += dt;
      gather += dt;
      const m = motifRef.current;

      const p = getPointer();
      pointer.x = p.active ? p.x - hostRect.left : -1e4;
      pointer.y = p.active ? p.y - hostRect.top : -1e4;

      for (let i = 0; i < n; i++) {
        target(i, t, m);
        // A wavefront that wrapped round would fly back across the page;
        // jump it instead (it is transparent at that point anyway).
        if (travel >= 0 && lastTravel[i] >= 0 && travel < lastTravel[i] - 0.5) {
          x[i] = tx;
          y[i] = ty;
          vx[i] = vy[i] = 0;
        }
        lastTravel[i] = travel;
        depth[i] += (td - depth[i]) * Math.min(1, dt * 8);
        alpha[i] += (ta - alpha[i]) * Math.min(1, dt * 6);

        // Staggered gather-in after each activation.
        const g = smoothstep(r1[i] * 0.7, r1[i] * 0.7 + 1.1, gather);
        const k = stiff[i] * (0.15 + 0.85 * g);
        let ax = (tx - x[i]) * k - vx[i] * 5.2;
        let ay = (ty - y[i]) * k - vy[i] * 5.2;

        const dx = x[i] - pointer.x;
        const dy = y[i] - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < REPEL_RADIUS * REPEL_RADIUS && d2 > 1) {
          const d = Math.sqrt(d2);
          const f = (1 - d / REPEL_RADIUS) * 2600;
          ax += (dx / d) * f;
          ay += (dy / d) * f;
        }

        vx[i] += ax * dt;
        vy[i] += ay * dt;
        x[i] += vx[i] * dt;
        y[i] += vy[i] * dt;
      }
    };

    const settleStatic = () => {
      const m = motifRef.current;
      for (let i = 0; i < n; i++) {
        target(i, 6, m);
        x[i] = tx;
        y[i] = ty;
        depth[i] = td;
        alpha[i] = ta;
      }
    };

    const syncPalette = (dt: number) => {
      const want = paletteRef.current;
      const k = Math.min(1, dt * 3.2);
      for (let c = 0; c < 4; c++) {
        const w = hexToRgb(want[c]);
        const rgb = cur[c];
        let moved = false;
        for (let ch = 0; ch < 3; ch++) {
          const d = w[ch] - rgb[ch];
          if (Math.abs(d) > 0.5) {
            rgb[ch] += d * k;
            moved = true;
          } else rgb[ch] = w[ch];
        }
        if (moved) bakeSprite(sprites[c], rgb);
      }
    };

    const draw = () => {
      for (const ctx of [bctx, fctx]) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, back.width, back.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      for (let i = 0; i < n; i++) {
        const a = alpha[i] * (0.62 + 0.38 * ((depth[i] + 1) / 2));
        if (a < 0.02) continue;
        const px = x[i];
        const py = y[i];
        if (px < -10 || py < -10 || px > W + 10 || py > H + 10) continue;
        const ctx = depth[i] < 0 ? bctx : fctx;
        const s = size[i] * (1 + depth[i] * 0.22) * 2.2;
        ctx.globalAlpha = a;
        ctx.drawImage(sprites[tier[i]], px - s / 2, py - s / 2, s, s);
      }
      bctx.globalAlpha = 1;
      fctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!activeRef.current || pausedRef.current) {
        last = now;
        return;
      }
      if (seenActivation !== activationRef.current) {
        seenActivation = activationRef.current;
        measure();
        scatter();
      }
      let dt = (now - last) / 1000;
      last = now;
      if (!(dt > 0)) return;
      if (dt > 0.05) dt = 0.05;
      measure();
      syncPalette(dt);
      step(dt);
      draw();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    if (anchorRef.current) ro.observe(anchorRef.current);

    if (reduced) {
      // Static composition: no travel, no gather.
      const redraw = () => {
        measure();
        syncPalette(1);
        settleStatic();
        draw();
      };
      redraw();
      const id = setInterval(redraw, 400);
      return () => {
        clearInterval(id);
        ro.disconnect();
        releasePointer();
      };
    }

    last = performance.now();
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      releasePointer();
    };
  }, [anchorRef, reduced]);

  return (
    <>
      <canvas
        ref={backRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ zIndex: zBase }}
      />
      <canvas
        ref={frontRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ zIndex: zBase + 2 }}
      />
    </>
  );
}
