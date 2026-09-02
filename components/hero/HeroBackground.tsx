"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { getPointer, subscribePointer } from "@/lib/pointer";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Procedural atmosphere behind the hero.
 *
 * Every formation is its own compositor layer: the gradient and its blur are
 * rasterised once, and each frame only writes `transform`. That keeps a dozen
 * heavily blurred surfaces on the GPU's fast path instead of repainting them.
 *
 * Motion has two independent sources — a very slow ambient drift that never
 * stops, and a lagging pull toward the cursor. The pull is deliberately small
 * and heavily eased, so the field reads as *alive* rather than as something
 * chasing the mouse.
 */

interface Formation {
  /** Box geometry, in percentages of the hero. */
  x: number;
  y: number;
  w: number;
  h: number;
  rotate: number;
  blur: number;
  opacity: number;
  background: string;
  blend?: CSSProperties["mixBlendMode"];
  /** 0..1 — share of the maximum cursor displacement this formation takes. */
  parallax: number;
  /** Ambient drift: amplitude in px, period in seconds, phase in radians. */
  ax: number;
  ay: number;
  px: number;
  py: number;
  phase: number;
}

/** Maximum cursor-driven displacement, in CSS pixels. */
const MAX_SHIFT_X = 46;
const MAX_SHIFT_Y = 34;
/** Time constant of the lag behind the cursor, in seconds. */
const FOLLOW_TAU = 0.62;

const soft = (color: string, stop = 68) =>
  `radial-gradient(circle at 50% 50%, ${color} 0%, transparent ${stop}%)`;

/** A soft annulus — reads as a fold in fabric once blurred. */
const fold = (color: string, inner: number, peak: number, outer: number) =>
  `radial-gradient(closest-side, transparent ${inner}%, ${color} ${peak}%, transparent ${outer}%)`;

const FORMATIONS: Formation[] = [
  // Broad white bloom over the upper left — keeps the particle mark legible.
  {
    x: -22, y: -30, w: 95, h: 105, rotate: 0, blur: 24, opacity: 0.95,
    background: soft("rgba(255,255,255,0.98)", 66),
    parallax: 0.24, ax: 22, ay: 15, px: 41, py: 53, phase: 0.3,
  },
  // Cool grey mass on the right, the main source of depth.
  {
    x: 44, y: -22, w: 92, h: 118, rotate: -8, blur: 34, opacity: 0.9,
    background: soft("rgba(196,203,213,0.82)", 64),
    parallax: 0.72, ax: 34, ay: 22, px: 47, py: 61, phase: 1.9,
  },
  // Grey shoulder falling into the lower left.
  {
    x: -30, y: 34, w: 88, h: 92, rotate: 12, blur: 40, opacity: 0.8,
    background: soft("rgba(201,207,216,0.7)", 62),
    parallax: 0.5, ax: 26, ay: 30, px: 55, py: 38, phase: 3.4,
  },
  // Deepest cool shadow, bottom right.
  {
    x: 48, y: 42, w: 84, h: 90, rotate: -18, blur: 52, opacity: 0.72,
    background: soft("rgba(163,171,183,0.55)", 60),
    parallax: 0.85, ax: 30, ay: 26, px: 64, py: 44, phase: 5.1,
  },
  // Charcoal breath along the very bottom, anchors the composition.
  {
    x: 6, y: 62, w: 110, h: 70, rotate: 4, blur: 60, opacity: 0.5,
    background: soft("rgba(150,158,171,0.42)", 58),
    parallax: 0.34, ax: 18, ay: 12, px: 73, py: 49, phase: 2.2,
  },
  // Large white fold sweeping through the centre.
  {
    x: -38, y: -46, w: 150, h: 165, rotate: -14, blur: 44, opacity: 0.85,
    background: fold("rgba(255,255,255,0.92)", 52, 65, 79),
    parallax: 0.3, ax: 24, ay: 18, px: 58, py: 71, phase: 0.9,
  },
  // Counter fold, tighter and lower.
  {
    x: 8, y: 4, w: 145, h: 130, rotate: 9, blur: 50, opacity: 0.65,
    background: fold("rgba(255,255,255,0.85)", 58, 69, 82),
    parallax: 0.46, ax: 28, ay: 20, px: 51, py: 66, phase: 4.3,
  },
  // Grey fold — the darker crease that gives the surface its dimension.
  {
    x: 2, y: -54, w: 148, h: 160, rotate: 24, blur: 58, opacity: 0.55,
    background: fold("rgba(146,155,169,0.4)", 60, 70, 83),
    parallax: 0.62, ax: 32, ay: 24, px: 68, py: 43, phase: 2.7,
  },
  // Wide, very slow grey crease across the lower half.
  {
    x: -46, y: 12, w: 165, h: 145, rotate: -26, blur: 64, opacity: 0.45,
    background: fold("rgba(158,166,179,0.34)", 62, 72, 85),
    parallax: 0.4, ax: 20, ay: 28, px: 79, py: 57, phase: 5.8,
  },
  // Highlight lifting the top right corner.
  {
    x: 52, y: -40, w: 70, h: 80, rotate: 0, blur: 30, opacity: 0.8,
    background: soft("rgba(255,255,255,0.9)", 62),
    parallax: 0.55, ax: 24, ay: 16, px: 44, py: 59, phase: 1.2,
  },
  // Small close highlight behind the copy, for contrast under the headline.
  {
    x: 44, y: 18, w: 62, h: 62, rotate: 0, blur: 36, opacity: 0.62,
    background: soft("rgba(255,255,255,0.85)", 60),
    parallax: 0.22, ax: 14, ay: 12, px: 62, py: 47, phase: 3.9,
  },
];

export default function HeroBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<Array<HTMLDivElement | null>>([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const layers = layersRef.current;
    const n = FORMATIONS.length;
    const curX = new Float64Array(n);
    const curY = new Float64Array(n);

    if (reduced) {
      for (let i = 0; i < n; i++) {
        const el = layers[i];
        if (el) el.style.transform = `translate3d(0,0,0) rotate(${FORMATIONS[i].rotate}deg)`;
      }
      return;
    }

    const releasePointer = subscribePointer();
    const pointer = getPointer();

    let bounds = root.getBoundingClientRect();
    const measure = () => {
      bounds = root.getBoundingClientRect();
    };
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });

    let raf = 0;
    let last = performance.now();
    let running = true;

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);

      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;

      const t = now / 1000;
      // Frame-rate independent exponential approach.
      const k = 1 - Math.exp(-dt / FOLLOW_TAU);

      // The cursor only has a say while it is actually over the hero; outside
      // it, formations ease back to where they started.
      const inside =
        pointer.active &&
        pointer.y >= bounds.top &&
        pointer.y <= bounds.bottom &&
        pointer.x >= bounds.left &&
        pointer.x <= bounds.right;

      const targetNX = inside ? pointer.nx : 0;
      const targetNY = inside ? pointer.ny : 0;

      for (let i = 0; i < n; i++) {
        const el = layers[i];
        if (!el) continue;
        const f = FORMATIONS[i];

        const wantX = targetNX * f.parallax * MAX_SHIFT_X;
        const wantY = targetNY * f.parallax * MAX_SHIFT_Y;
        curX[i] += (wantX - curX[i]) * k;
        curY[i] += (wantY - curY[i]) * k;

        const driftX = Math.sin((t / f.px) * Math.PI * 2 + f.phase) * f.ax;
        const driftY = Math.cos((t / f.py) * Math.PI * 2 + f.phase * 0.7) * f.ay;

        el.style.transform = `translate3d(${(curX[i] + driftX).toFixed(2)}px, ${(
          curY[i] + driftY
        ).toFixed(2)}px, 0) rotate(${f.rotate}deg)`;
      }
    };

    raf = requestAnimationFrame(frame);

    // Stop entirely once the hero scrolls away.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          last = performance.now();
          raf = requestAnimationFrame(frame);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 },
    );
    io.observe(root);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
      releasePointer();
    };
  }, [reduced]);

  return (
    <div ref={rootRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base wash. Everything else is layered over this. */}
      <div className="absolute inset-0 bg-[linear-gradient(158deg,#fdfdfe_0%,#f6f7f9_34%,#eceef2_66%,#e4e7ec_100%)]" />

      {FORMATIONS.map((f, i) => (
        <div
          key={i}
          ref={(el) => {
            layersRef.current[i] = el;
          }}
          className="absolute"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: `${f.w}%`,
            height: `${f.h}%`,
            background: f.background,
            filter: `blur(${f.blur}px)`,
            opacity: f.opacity,
            mixBlendMode: f.blend,
            transform: `translate3d(0,0,0) rotate(${f.rotate}deg)`,
            willChange: "transform",
          }}
        />
      ))}

      {/* Grain, then a whisper of vignette to seat the composition. */}
      <div className="bg-grain absolute inset-0 opacity-[0.28] mix-blend-soft-light" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_95%_at_50%_38%,transparent_52%,rgba(120,129,142,0.16)_100%)]" />
    </div>
  );
}
