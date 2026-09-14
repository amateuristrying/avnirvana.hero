"use client";

import Ferrofluid from "./Ferrofluid";

export default function AboutBackground({
  active = true,
  theme = "blue",
}: {
  active?: boolean;
  theme?: "blue" | "green";
}) {
  const isGreen = theme === "green";
  const ferrofluidColors = isGreen
    ? ["#22c55e", "#10b981", "#34d399", "#059669"]
    : ["#ffffff", "#ffffff", "#ffffff"];

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden transition-colors duration-700 ${
        isGreen ? "bg-[#06140f]" : "bg-[#0a0f1d]"
      }`}
    >
      <div className="absolute inset-0 pointer-events-auto">
        <Ferrofluid
          paused={!active}
          colors={ferrofluidColors}
          speed={0.5}
          scale={1}
          turbulence={1}
          fluidity={0.1}
          rimWidth={0.2}
          sharpness={3}
          shimmer={1}
          glow={isGreen ? 2.5 : 2}
          flowDirection="down"
          opacity={0.85}
          mouseInteraction={true}
          mouseStrength={1}
          mouseRadius={0.3}
        />
      </div>

      {/* Top transition gradient: blends smoothly from the hero's canvas color (#120a1e) */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-40 transition-opacity duration-700 ${
          isGreen
            ? "bg-[linear-gradient(180deg,#120a1e_0%,rgba(6,20,15,0.85)_40%,transparent_100%)]"
            : "bg-[linear-gradient(180deg,#120a1e_0%,rgba(10,15,29,0.85)_40%,transparent_100%)]"
        }`}
      />

      {/* Soft vignette around edges to frame the content */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          isGreen
            ? "bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(6,20,15,0.75)_100%)]"
            : "bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(10,15,29,0.75)_100%)]"
        }`}
      />

      {/* Subtle bottom gradient to ground the section */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-32 transition-opacity duration-700 ${
          isGreen
            ? "bg-[linear-gradient(0deg,#06140f_0%,transparent_100%)]"
            : "bg-[linear-gradient(0deg,#0a0f1d_0%,transparent_100%)]"
        }`}
      />
    </div>
  );
}

