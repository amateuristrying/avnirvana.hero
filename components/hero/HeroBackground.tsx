"use client";

import { useEffect, useRef } from "react";
import { getPointer, subscribePointer } from "@/lib/pointer";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Animated filament artwork behind the hero.
 *
 * The SVG is loaded as an `<img>` rather than inlined: its ~1,500 elements
 * then live in their own isolated document instead of the page DOM, it caches
 * like any image, and its SMIL animation still runs. `object-fit: cover`
 * scales it to any viewport; `object-position` shifts the focal point per
 * breakpoint because the artwork's filaments sit on its right-hand side, which
 * a centred crop would push out of frame on a portrait phone.
 *
 * SMIL inside an `<img>` cannot be paused from CSS or script, so
 * `prefers-reduced-motion` is honoured by swapping in a copy with the
 * `<animate>` elements stripped (`filament-loop-static.svg`, frame zero).
 *
 * The layer also drifts a few pixels toward the cursor with a heavy lag — the
 * same restrained "alive, not following" behaviour as before. It is oversized
 * by 24px on every side, more than the maximum drift, so no edge ever shows.
 */

/** Maximum cursor-driven displacement, in CSS pixels. Must stay below the 24px overscan. */
const MAX_SHIFT_X = 18;
const MAX_SHIFT_Y = 12;
/** Time constant of the lag behind the cursor, in seconds. */
const FOLLOW_TAU = 0.9;

export default function HeroBackground({ active = true }: { active?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    const layer = layerRef.current;
    if (!root || !layer) return;

    if (reduced || !active) {
      layer.style.transform = "";
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

    let curX = 0;
    let curY = 0;
    let raf = 0;
    let last = performance.now();
    let running = true;

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);

      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      const k = 1 - Math.exp(-dt / FOLLOW_TAU);

      const inside =
        pointer.active &&
        pointer.y >= bounds.top &&
        pointer.y <= bounds.bottom &&
        pointer.x >= bounds.left &&
        pointer.x <= bounds.right;

      const wantX = inside ? pointer.nx * MAX_SHIFT_X : 0;
      const wantY = inside ? pointer.ny * MAX_SHIFT_Y : 0;
      const nextX = curX + (wantX - curX) * k;
      const nextY = curY + (wantY - curY) * k;

      // Skip the style write once settled, so an idle page does no work.
      if (Math.abs(nextX - curX) > 0.01 || Math.abs(nextY - curY) > 0.01) {
        curX = nextX;
        curY = nextY;
        layer.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0)`;
      }
    };

    raf = requestAnimationFrame(frame);

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
  }, [reduced, active]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-canvas"
    >
      <div ref={layerRef} className="absolute -inset-6 will-change-transform">
        <picture className="block h-full w-full">
          <source media="(prefers-reduced-motion: reduce)" srcSet="/hero/filament-loop-static.svg" />
          <img
            src="/hero/filament-loop.svg"
            alt=""
            width={1700}
            height={956}
            decoding="async"
            loading="eager"
            draggable={false}
            // Desktop anchors the artwork's left edge, which pushes the
            // filament ribbon as far right — away from the copy — as the
            // crop allows. Narrow screens do the opposite to keep it in frame.
            className="block h-full w-full select-none object-cover object-[84%_50%] md:object-[74%_50%] lg:object-[0%_50%]"
          />
        </picture>
      </div>

      {/* Legibility scrims. The artwork is busiest exactly where the copy
          sits, so soften it there rather than dimming the whole piece. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,10,30,0.55)_0%,rgba(18,10,30,0)_22%)]" />
      <div className="absolute inset-0 bg-canvas/45 lg:bg-transparent" />
      <div className="absolute inset-0 hidden bg-[radial-gradient(48%_58%_at_64%_56%,rgba(18,10,30,0.78)_0%,rgba(18,10,30,0.5)_48%,rgba(18,10,30,0)_100%)] lg:block" />
    </div>
  );
}
