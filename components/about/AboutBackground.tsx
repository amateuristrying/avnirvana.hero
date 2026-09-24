"use client";

import Prism from "@/components/prism/Prism";

/**
 * Shared screen background.
 *
 * Each theme keeps its own colour identity by rotating the prism palette
 * (`hueShift`, in turns) rather than swapping the effect, so the per-product
 * colours survive the move off the ferrofluid.
 */
const THEME = {
  blue: { hue: 0, tint: "bg-[#05070f]", rgb: "5,7,15" },
  "light-blue": { hue: 0.08, tint: "bg-[#040d1a]", rgb: "4,13,26" },
  aqua: { hue: 0.45, tint: "bg-[#03121a]", rgb: "3,18,26" },
  green: { hue: 0.35, tint: "bg-[#06140f]", rgb: "6,20,15" },
  purple: { hue: 0.75, tint: "bg-[#0d0517]", rgb: "13,5,23" },
} as const;

export default function AboutBackground({
  active = true,
  theme = "blue",
}: {
  active?: boolean;
  theme?: keyof typeof THEME;
}) {
  const t = THEME[theme] ?? THEME.blue;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden transition-colors duration-700 ${t.tint}`}
    >
      <div className="absolute inset-0 pointer-events-auto">
        <Prism
          paused={!active}
          animationType="hover"
          timeScale={0.7}
          height={3.4}
          baseWidth={5.5}
          scale={4.2}
          hueShift={t.hue}
          colorFrequency={0.8}
          noise={0.5}
          glow={1}
        />
      </div>

      {/* Top transition gradient: blends from the hero's canvas colour */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{
          background: `linear-gradient(180deg, rgba(${t.rgb},1) 0%, rgba(${t.rgb},0.85) 40%, transparent 100%)`,
        }}
      />

      {/* Soft vignette to frame the content */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 45%, rgba(${t.rgb},0.75) 100%)`,
        }}
      />

      {/* Bottom gradient grounds the section */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{ background: `linear-gradient(0deg, rgba(${t.rgb},1) 0%, transparent 100%)` }}
      />
    </div>
  );
}
