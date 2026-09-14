import { ReactNode } from "react";

interface AboutContentBlockProps {
  tag: string;
  title: ReactNode;
  description: string;
  className?: string;
  align?: "left" | "right";
}

export default function AboutContentBlock({
  tag,
  title,
  description,
  className = "",
  align = "left",
}: AboutContentBlockProps) {
  return (
    <div
      className={`about-content-block group relative flex flex-col justify-center ${className}`}
    >
      {/* Subtle top divider line */}
      <div className="mb-3 flex items-center gap-3">
        <span className="block h-px w-8 bg-[linear-gradient(90deg,rgba(138,182,255,0.7),rgba(138,182,255,0.15))] transition-all duration-500 group-hover:w-12 group-hover:bg-[#8AB6FF]" />
        <span className="text-[11px] font-semibold tracking-[0.24em] text-fg-mute/90 uppercase sm:text-[11.5px]">
          — {tag}
        </span>
      </div>

      {/* Main heading */}
      <h3 className="text-[clamp(1.2rem,1.48vw,1.6rem)] font-bold leading-[1.25] tracking-[-0.025em] text-fg [text-shadow:0_1px_14px_rgba(16,21,36,0.95)]">
        {title}
      </h3>

      {/* Description copy */}
      <p className="mt-2.5 max-w-[37ch] text-[clamp(0.86rem,0.96vw,0.96rem)] font-light leading-[1.68] text-fg-mute [text-shadow:0_1px_16px_rgba(16,21,36,0.98)]">
        {description}
      </p>
    </div>
  );
}
