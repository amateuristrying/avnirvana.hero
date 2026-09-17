"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

const STRIP_COUNT = 10;

interface Brand {
  name: string;
  tag: string;
  mark: ReactNode;
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Placeholder brands — swap for real client logos later
const BRANDS: Brand[] = [
  { name: "AURALIS", tag: "Loudspeakers", mark: <><circle cx="16" cy="16" r="11" {...stroke} /><circle cx="16" cy="16" r="5" fill="currentColor" /></> },
  { name: "KORVEN", tag: "Amplification", mark: <path d="M5 26 16 6l11 20Z" {...stroke} /> },
  { name: "LUMENTA", tag: "Projection", mark: <><rect x="6" y="6" width="20" height="20" rx="3" transform="rotate(45 16 16)" {...stroke} /><circle cx="16" cy="16" r="3" fill="currentColor" /></> },
  { name: "SONIQ", tag: "Acoustics", mark: <path d="M3 16c3-8 6-8 9 0s6 8 9 0 6-8 8 0" {...stroke} /> },
  { name: "VERTEX", tag: "Displays", mark: <><path d="M8 24V12M13 24V6M19 24V10M24 24V15" {...stroke} /></> },
  { name: "HALCYON", tag: "Home Cinema", mark: <><circle cx="16" cy="16" r="11" {...stroke} /><path d="M16 5v22M5 16h22" {...stroke} /></> },
  { name: "NOVASTAGE", tag: "Pro Audio", mark: <path d="M16 4l3.5 8 8.5.8-6.5 5.6 2 8.6L16 22.6 8.5 27l2-8.6L4 12.8l8.5-.8Z" {...stroke} /> },
  { name: "ORBITAL", tag: "Control Systems", mark: <><ellipse cx="16" cy="16" rx="12" ry="5" {...stroke} /><circle cx="16" cy="16" r="4" fill="currentColor" /></> },
  { name: "ECHELON", tag: "Architectural", mark: <path d="M6 22l10-10 10 10M6 15l10-10 10 10" {...stroke} /> },
  { name: "PRISMA", tag: "Video Walls", mark: <><rect x="5" y="7" width="22" height="18" rx="2" {...stroke} /><path d="M5 16h22M16 7v18" {...stroke} /></> },
  { name: "TERRAWAVE", tag: "Outdoor Audio", mark: <><path d="M4 20c4-4 8-4 12 0s8 4 12 0" {...stroke} /><path d="M4 13c4-4 8-4 12 0s8 4 12 0" {...stroke} /></> },
  { name: "MONOLITH", tag: "Subwoofers", mark: <><rect x="8" y="4" width="16" height="24" rx="2" {...stroke} /><circle cx="16" cy="18" r="5" {...stroke} /></> },
];

interface BrandsScreenProps {
  active: boolean;
  /** Another screen is sweeping over this one: dissolve the content away */
  covered?: boolean;
  onEntered?: () => void;
  onExited?: () => void;
}

export default function BrandsScreen({ active, covered = false, onEntered, onExited }: BrandsScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stripsRef = useRef<(HTMLDivElement | null)[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const cbRef = useRef({ onEntered, onExited });
  cbRef.current = { onEntered, onExited };
  const mountedRef = useRef(false);
  const shownRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    const strips = stripsRef.current.filter(Boolean) as HTMLDivElement[];
    const header = headerRef.current;
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!root || !header) return;

    // Initial state on first mount: fully hidden, no callbacks
    if (!mountedRef.current) {
      mountedRef.current = true;
      gsap.set(strips, { scaleY: 0 });
      gsap.set(header, { opacity: 0, y: 30 });
      gsap.set(cards, { opacity: 0, y: 40, scale: 0.85, filter: "blur(8px)" });
      gsap.set(root, { visibility: "hidden", pointerEvents: "none" });
      if (!active) return;
    }

    if (active === shownRef.current) return;
    shownRef.current = active;

    tlRef.current?.kill();
    const tl = gsap.timeline();
    tlRef.current = tl;

    if (active) {
      tl.set(root, { visibility: "visible", pointerEvents: "auto" })
        // White strips sweep in one by one, left → right
        .to(strips, {
          scaleY: 1,
          duration: 0.42,
          ease: "power3.inOut",
          stagger: 0.05,
        })
        .to(header, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.05")
        // Unlock scrolling as soon as the title lands; logos keep animating in
        .call(() => cbRef.current.onEntered?.())
        .to(
          cards,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.8,
            ease: "back.out(1.4)",
            stagger: { each: 0.045, from: "start" },
          },
          "-=0.45"
        );
    } else {
      tl.to(cards, {
        opacity: 0,
        y: 24,
        scale: 0.9,
        filter: "blur(6px)",
        duration: 0.3,
        ease: "power2.in",
        stagger: { each: 0.02, from: "end" },
      })
        .to(header, { opacity: 0, y: 20, duration: 0.3, ease: "power2.in" }, "<0.1")
        // Strips retract right → left
        .to(strips, {
          scaleY: 0,
          duration: 0.38,
          ease: "power3.inOut",
          stagger: { each: 0.045, from: "end" },
        })
        .set(root, { visibility: "hidden", pointerEvents: "none" })
        .call(() => cbRef.current.onExited?.());
    }
  }, [active]);

  // Content dissolves left → right in sync with the next screen's strip sweep
  const coveredInitRef = useRef(false);
  useEffect(() => {
    if (!coveredInitRef.current) {
      coveredInitRef.current = true;
      return;
    }
    const header = headerRef.current;
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!header) return;
    const byX = [...cards].sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    gsap.killTweensOf([header, ...cards]);
    if (covered) {
      gsap.to(header, { opacity: 0, y: -24, filter: "blur(6px)", duration: 0.45, ease: "power2.in" });
      gsap.to(byX, { opacity: 0, y: -20, scale: 0.92, filter: "blur(8px)", duration: 0.4, ease: "power2.in", stagger: 0.03 });
    } else {
      gsap.to(header, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "power3.out", delay: 0.1 });
      gsap.to(byX, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.7, ease: "back.out(1.4)", stagger: 0.035, delay: 0.2 });
    }
  }, [covered]);

  useEffect(() => () => void tlRef.current?.kill(), []);

  return (
    <div ref={rootRef} className="fixed inset-0 z-[80] overflow-hidden" style={{ visibility: "hidden" }}>
      <style>{`
        @keyframes brandFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -9px, 0); }
        }
      `}</style>

      {/* White strips */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: STRIP_COUNT }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              stripsRef.current[i] = el;
            }}
            className="h-full flex-1 bg-white will-change-transform"
            style={{
              transformOrigin: i % 2 === 0 ? "top" : "bottom",
              marginLeft: i === 0 ? 0 : -1, // avoid hairline seams
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative flex h-full w-full flex-col items-center justify-center overflow-y-auto px-5 py-10 sm:px-8">
        <div ref={headerRef} className="mb-8 flex flex-col items-center text-center sm:mb-12 lg:mb-14">
          <div className="mb-3 inline-flex items-center gap-3 sm:mb-4">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#120a1e]/40 sm:w-10" />
            <span className="text-[10px] font-semibold tracking-[0.34em] text-[#120a1e]/55 uppercase sm:text-[11px]">
              Our Partners
            </span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#120a1e]/40 sm:w-10" />
          </div>
          <h2 className="text-[34px] leading-[1.05] font-bold tracking-[-0.02em] text-[#120a1e] sm:text-5xl lg:text-6xl">
            Brands We&rsquo;ve Worked With
          </h2>
          <p className="mt-3 max-w-md text-[13px] font-light text-[#120a1e]/55 sm:mt-4 sm:text-[15px]">
            A curated portfolio of the world&rsquo;s most respected names in audio-visual engineering.
          </p>
        </div>

        <div className="grid w-full max-w-[1180px] grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6 lg:gap-5">
          {BRANDS.map((brand, i) => (
            <div
              key={brand.name}
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
            >
              <div
                style={{
                  animation: `brandFloat ${4.2 + (i % 4) * 0.55}s ease-in-out ${-(i * 0.37)}s infinite`,
                }}
              >
                <div className="group relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border border-transparent text-[#120a1e]/45 transition-all duration-500 ease-out hover:-translate-y-1.5 hover:scale-[1.06] hover:border-[#120a1e]/10 hover:bg-white hover:text-[#120a1e] hover:shadow-[0_22px_50px_-18px_rgba(18,10,30,0.35)]">
                  <svg viewBox="0 0 32 32" className="h-8 w-8 transition-transform duration-500 group-hover:rotate-[8deg] sm:h-9 sm:w-9">
                    {brand.mark}
                  </svg>
                  <span className="text-[13px] font-bold tracking-[0.18em] sm:text-sm">{brand.name}</span>
                  <span className="absolute bottom-3 text-[9px] font-medium tracking-[0.22em] text-[#120a1e]/0 uppercase transition-colors duration-500 group-hover:text-[#120a1e]/50">
                    {brand.tag}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
