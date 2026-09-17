"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);
if (!CustomEase.get("hop")) CustomEase.create("hop", "0.56, 0, 0.35, 0.98");

const TEXT = "AV NIRVANA";
const BG = "#050507";

export interface BandTransitionHandle {
  /** Thin band sweeps left → right through the text line, then opens to full black */
  cover: () => Promise<void>;
  /** Text flicks up out of its masks, then the black lifts upward off the screen */
  reveal: () => Promise<void>;
}

const polygon = (p: [number, number][]) => `polygon(${p.map(([x, y]) => `${x}% ${y}%`).join(", ")})`;

/**
 * Full-screen band wipe (after codrops' Barba "team" transition):
 * zero-width band at the left edge → full-width text-height band → full cover → lift away.
 */
const BandTransition = forwardRef<BandTransitionHandle>(function BandTransition(_, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const charsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Band half-height as a % of the viewport so the band hugs the text line exactly
  const bandPct = useCallback(() => {
    const h = titleRef.current?.getBoundingClientRect().height ?? 60;
    return ((h / 2) / (window.innerHeight / 2)) * 50;
  }, []);

  useEffect(() => {
    gsap.set(rootRef.current, { autoAlpha: 0, pointerEvents: "none" });
    return () => void tlRef.current?.kill();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      cover: () =>
        new Promise<void>((resolve) => {
          const root = rootRef.current;
          const chars = charsRef.current.filter(Boolean);
          if (!root) return resolve();
          const b = bandPct();
          tlRef.current?.kill();
          gsap.set(chars, { yPercent: 0 });
          gsap.set(root, {
            autoAlpha: 1,
            pointerEvents: "auto",
            clipPath: polygon([[0, 50 - b], [0, 50 - b], [0, 50 + b], [0, 50 + b]]),
          });
          tlRef.current = gsap
            .timeline({ defaults: { duration: 0.85, ease: "expo.inOut" }, onComplete: resolve })
            .to(root, { clipPath: polygon([[0, 50 - b], [100, 50 - b], [100, 50 + b], [0, 50 + b]]) })
            .to(root, { clipPath: polygon([[0, 0], [100, 0], [100, 100], [0, 100]]), duration: 0.8 });
        }),

      reveal: () =>
        new Promise<void>((resolve) => {
          const root = rootRef.current;
          const chars = charsRef.current.filter(Boolean);
          if (!root) return resolve();
          tlRef.current?.kill();
          tlRef.current = gsap
            .timeline({
              defaults: { duration: 1, ease: "hop" },
              onComplete: () => {
                gsap.set(root, { autoAlpha: 0, pointerEvents: "none" });
                resolve();
              },
            })
            .to(chars, { yPercent: -120, duration: 0.5, stagger: { amount: 0.25 }, ease: "elastic.in(1, 1)" })
            .to(root, { clipPath: polygon([[0, 0], [100, 0], [100, 0], [0, 0]]) }, "<0.25");
        }),
    }),
    [bandPct]
  );

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="fixed inset-0 z-[150] will-change-[clip-path]"
      style={{ background: BG, visibility: "hidden" }}
    >
      <h2
        ref={titleRef}
        className="absolute top-1/2 left-0 w-full -translate-y-1/2 py-[0.3em] pl-[0.32em] text-center text-[clamp(1.1rem,3.4vw,2.2rem)] leading-none font-semibold tracking-[0.32em] text-[#ece9e4]"
      >
        {TEXT.split("").map((ch, i) => (
          <span key={i} className="inline-block overflow-hidden align-bottom">
            <span
              ref={(el) => {
                charsRef.current[i] = el;
              }}
              className="inline-block will-change-transform"
            >
              {ch === " " ? " " : ch}
            </span>
          </span>
        ))}
      </h2>
    </div>
  );
});

export default BandTransition;
