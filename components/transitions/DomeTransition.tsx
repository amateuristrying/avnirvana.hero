"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import gsap from "gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";

const FILL = "#020403";
const STEP_S = 0.26;

/** "up" rises from the bottom and leaves through the top; "down" is its mirror. */
export type DomeDirection = "up" | "down";

export interface DomeTransitionHandle {
  /** A dome swells in from one edge, then flattens until the screen is covered. */
  cover: (dir: DomeDirection) => Promise<void>;
  /** The cover's trailing edge lifts away as an arch; `onSecondHalf` fires as it clears. */
  reveal: (dir: DomeDirection, onSecondHalf?: () => void) => Promise<void>;
}

/**
 * Curtain wipe after codrops' Barba "works" transition: one path in a
 * 100×100 viewBox, sliced to cover the screen. `s` is where the curved edge
 * meets the sides and `c` its control point, so a single quadratic describes
 * the flat line, the dome and the full cover alike.
 *
 * The viewBox is pinned to the edge the curtain enters from (YMin for "up",
 * YMax for "down"), so the two directions are exact mirrors on any aspect.
 */
const DomeTransition = forwardRef<DomeTransitionHandle>(function DomeTransition(_, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => () => void tlRef.current?.kill(), []);

  useImperativeHandle(
    ref,
    () => {
      const show = (dir: DomeDirection) => {
        svgRef.current?.setAttribute("preserveAspectRatio", `xMidY${dir === "up" ? "Min" : "Max"} slice`);
        gsap.set(rootRef.current, { autoAlpha: 1, pointerEvents: "auto" });
      };
      const hide = () => gsap.set(rootRef.current, { autoAlpha: 0, pointerEvents: "none" });

      /**
       * `anchor` is the edge the filled region hangs from; the curved edge
       * sits at `s` / `c`. Coordinates are written for "up" and mirrored.
       */
      const draw = (anchor: "bottom" | "top", s: number, c: number, dir: DomeDirection) => {
        const m = (v: number) => (dir === "up" ? v : 100 - v);
        const a = anchor === "bottom" ? 100 : 0;
        pathRef.current?.setAttribute("d", `M 0 ${m(a)} V ${m(s)} Q 50 ${m(c)} 100 ${m(s)} V ${m(a)} z`);
      };

      /** Flat → dome → full, with the dome held to the demo's sine timing. */
      const run = (anchor: "bottom" | "top", dir: DomeDirection, onSecondHalf?: () => void) =>
        new Promise<void>((resolve) => {
          tlRef.current?.kill();
          const st = { s: 100, c: 100 };
          draw(anchor, st.s, st.c, dir);
          const update = () => draw(anchor, st.s, st.c, dir);
          if (reduced) {
            // No sweep: a short cross-fade stands in for the curtain.
            draw(anchor, 0, 0, dir);
            gsap.set(pathRef.current, { opacity: anchor === "bottom" ? 0 : 1 });
            tlRef.current = gsap.timeline({ onComplete: resolve }).to(pathRef.current, {
              opacity: anchor === "bottom" ? 1 : 0,
              duration: 0.3,
              ease: "power1.inOut",
              onStart: onSecondHalf,
            });
            return;
          }
          gsap.set(pathRef.current, { opacity: 1 });
          tlRef.current = gsap
            .timeline({ onComplete: resolve })
            .to(st, { s: 50, c: 0, duration: STEP_S, ease: "sine.in", onUpdate: update })
            .to(st, { s: 0, c: 0, duration: STEP_S, ease: "sine.out", onUpdate: update, onStart: onSecondHalf });
        });

      return {
        cover: async (dir) => {
          show(dir);
          // Filled from the entry edge up to the rising dome.
          await run("bottom", dir);
        },
        reveal: async (dir, onSecondHalf) => {
          show(dir);
          // Filled from the far edge down to the lifting arch.
          await run("top", dir, onSecondHalf);
          hide();
        },
      };
    },
    [reduced],
  );

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[160]"
      style={{ visibility: "hidden", opacity: 0 }}
    >
      <svg ref={svgRef} className="block h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMin slice">
        <path ref={pathRef} fill={FILL} d="M 0 100 V 100 Q 50 100 100 100 V 100 z" />
      </svg>
    </div>
  );
});

export default DomeTransition;
