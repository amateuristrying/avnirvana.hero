export function ArrowUpRight({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4.75 11.25 11.25 4.75" />
      <path d="M5.9 4.75h5.35v5.35" />
    </svg>
  );
}

export function MouseGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 30" fill="none" className={className} aria-hidden="true">
      <rect
        x="0.75"
        y="0.75"
        width="18.5"
        height="28.5"
        rx="9.25"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.55"
      />
      <circle cx="10" cy="8.5" r="1.7" fill="currentColor" className="animate-scroll-dot" />
    </svg>
  );
}
