"use client";

import { useReducedMotion } from "@/lib/useReducedMotion";

export default function AboutBackground() {
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[#101524]"
    >
      <div className="absolute inset-0">
        <picture className="block h-full w-full">
          <source
            media="(prefers-reduced-motion: reduce)"
            srcSet="/about/stipple-background-static.svg"
          />
          <img
            src={reduced ? "/about/stipple-background-static.svg" : "/about/stipple-background.svg"}
            alt=""
            width={1600}
            height={900}
            decoding="async"
            draggable={false}
            className="block h-full w-full select-none object-cover object-center opacity-85"
          />
        </picture>
      </div>

      {/* Top transition gradient: blends smoothly from the hero's canvas color (#120a1e) */}
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,#120a1e_0%,rgba(16,21,36,0.85)_40%,transparent_100%)]" />

      {/* Soft vignette around edges to frame the content */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(16,21,36,0.65)_100%)]" />

      {/* Subtle bottom gradient to ground the section */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(0deg,#101524_0%,transparent_100%)]" />
    </div>
  );
}
