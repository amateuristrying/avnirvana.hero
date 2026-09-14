"use client";

import Ferrofluid from "./Ferrofluid";

export default function AboutBackground({ active = true }: { active?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[#0a0f1d]"
    >
      <div className="absolute inset-0 pointer-events-auto">
        <Ferrofluid
          paused={!active}
          colors={["#ffffff", "#ffffff", "#ffffff"]}
          speed={0.5}
          scale={1}
          turbulence={1}
          fluidity={0.1}
          rimWidth={0.2}
          sharpness={3}
          shimmer={1}
          glow={2}
          flowDirection="down"
          opacity={0.85}
          mouseInteraction={true}
          mouseStrength={1}
          mouseRadius={0.3}
        />
      </div>

      {/* Top transition gradient: blends smoothly from the hero's canvas color (#120a1e) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,#120a1e_0%,rgba(10,15,29,0.85)_40%,transparent_100%)]" />

      {/* Soft vignette around edges to frame the content */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(10,15,29,0.75)_100%)]" />

      {/* Subtle bottom gradient to ground the section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(0deg,#0a0f1d_0%,transparent_100%)]" />
    </div>
  );
}

