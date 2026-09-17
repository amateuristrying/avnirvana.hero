"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Navbar from "@/components/hero/Navbar";
import Ferrofluid from "@/components/about/Ferrofluid";

const MAPS_LINK = "https://maps.app.goo.gl/4qd2RCxQY5sjqoZY6";
const MAP_EMBED =
  "https://www.google.com/maps?q=" +
  encodeURIComponent("8-C, Laxmi Industrial Estate, Suresh Nagar, Andheri West, Mumbai, Maharashtra 400053") +
  "&z=16&output=embed";

// Light green ferrofluid hue (module-level so the WebGL program isn't rebuilt every render)
const FERRO_COLORS = ["#bbf7d0", "#86efac", "#a7f3d0", "#4ade80"];

// Contact copy block offset & scale (dialled in with tuning sliders)
const TEXT_LAYOUT = { x: 20, y: -4, scale: 0.82 };

const INTRO =
  "Our Mumbai experience centre is open for demos, design consultations and dealer training. Call ahead and we’ll set the room up for you.";

const ArrowUpRight = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

interface ContactScreenProps {
  active: boolean;
  /** Seconds to wait before the entrance plays (lets the cover transition start lifting first) */
  enterDelay?: number;
}

export default function ContactScreen({ active, enterDelay = 0.3 }: ContactScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const boxTitleRef = useRef<HTMLHeadingElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const boxFooterRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const headingLinesRef = useRef<(HTMLSpanElement | null)[]>([]);
  const introWordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rulesRef = useRef<(HTMLDivElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const box = boxRef.current;
    if (!root || !box) return;
    const lines = headingLinesRef.current.filter(Boolean);
    const words = introWordsRef.current.filter(Boolean);
    const rows = rowsRef.current.filter(Boolean);
    const rules = rulesRef.current.filter(Boolean);

    tlRef.current?.kill();

    // Hidden state (also applied instantly on exit, which happens under the cover transition)
    const hide = () => {
      gsap.set(navRef.current, { opacity: 0, y: -20 });
      gsap.set(box, { clipPath: "inset(100% 0% 0% 0% round 32px)", y: 60 });
      gsap.set(boxTitleRef.current, { opacity: 0, y: 24 });
      gsap.set(mapRef.current, { opacity: 0, scale: 1.08 });
      gsap.set(boxFooterRef.current, { opacity: 0, y: 16 });
      gsap.set(eyebrowRef.current, { opacity: 0, x: -20 });
      gsap.set(lines, { yPercent: 110 });
      gsap.set(words, { opacity: 0, y: 12, filter: "blur(6px)" });
      gsap.set(rules, { scaleX: 0 });
      gsap.set(rows, { opacity: 0, y: 22 });
    };

    if (!active) {
      hide();
      gsap.set(root, { autoAlpha: 0, pointerEvents: "none" });
      return;
    }

    hide();
    gsap.set(root, { autoAlpha: 1, pointerEvents: "auto" });
    root.scrollTop = 0;

    tlRef.current = gsap
      .timeline({ delay: enterDelay, defaults: { ease: "expo.out" } })
      // Map box rises and unmasks from the bottom
      .to(box, { clipPath: "inset(0% 0% 0% 0% round 32px)", y: 0, duration: 1.3, ease: "expo.inOut" })
      .to(mapRef.current, { opacity: 1, scale: 1, duration: 1.4 }, "-=0.55")
      .to(boxTitleRef.current, { opacity: 1, y: 0, duration: 0.9 }, "<0.05")
      .to(boxFooterRef.current, { opacity: 1, y: 0, duration: 0.8 }, "<0.15")
      // Right column copy
      .to(eyebrowRef.current, { opacity: 1, x: 0, duration: 0.8 }, 0.35)
      .to(lines, { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.12 }, 0.45)
      .to(words, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power2.out", stagger: 0.012 }, 0.8)
      .to(rules, { scaleX: 1, duration: 0.9, ease: "expo.inOut", stagger: 0.1 }, 1.0)
      .to(rows, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, 1.15)
      .to(navRef.current, { opacity: 1, y: 0, duration: 0.9 }, 0.6);
  }, [active, enterDelay]);

  useEffect(() => () => void tlRef.current?.kill(), []);

  const contacts: { label: string; content: React.ReactNode }[] = [
    {
      label: "Phone",
      content: (
        <>
          <a href="tel:+917400414691" className="contact-link">+91 74004 14691</a>
          <span className="mx-2 text-white/30">/</span>
          <a href="tel:+917400414093" className="contact-link">+91 74004 14093</a>
        </>
      ),
    },
    {
      label: "Email",
      content: (
        <a href="mailto:info@avnirvanaindia.com" className="contact-link">
          info@avnirvanaindia.com
        </a>
      ),
    },
    {
      label: "Address",
      content: (
        <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="contact-link leading-[1.55]">
          8-C, Laxmi Industrial Estate, Suresh Nagar,
          <br />
          Andheri West, Mumbai, Maharashtra 400053
        </a>
      ),
    },
  ];

  return (
    <div
      ref={rootRef}
      data-contact-scroll
      className="fixed inset-0 z-[120] overflow-x-hidden overflow-y-auto bg-[#050507] text-white"
      style={{ visibility: "hidden" }}
      aria-hidden={!active}
    >
      <style>{`
        .contact-link {
          background-image: linear-gradient(currentColor, currentColor);
          background-size: 0% 1px;
          background-position: 0 100%;
          background-repeat: no-repeat;
          transition: background-size 0.5s cubic-bezier(0.22, 1, 0.36, 1), color 0.3s;
        }
        .contact-link:hover { background-size: 100% 1px; color: #fff; }
      `}</style>

      {/* Light green ferrofluid background (fixed so it stays put while the page scrolls on mobile) */}
      <div className="pointer-events-none fixed inset-0 bg-[#03110b]">
        <Ferrofluid
          paused={!active}
          colors={FERRO_COLORS}
          speed={0.5}
          scale={1}
          turbulence={1}
          fluidity={0.1}
          rimWidth={0.2}
          sharpness={3}
          shimmer={1}
          glow={2.5}
          flowDirection="down"
          opacity={0.85}
          mouseInteraction={true}
          mouseStrength={1}
          mouseRadius={0.3}
        />
        {/* Vignette keeps the copy legible over the fluid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(3,17,11,0.8)_100%)]" />
      </div>

      {/* Own stacking layer: the GSAP transform on this wrapper would otherwise trap the navbar's z-index
          beneath the content grid that follows, swallowing every click */}
      <div ref={navRef} className="relative z-50">
        <Navbar menuId="contact-menu" />
      </div>

      <div className="relative mx-auto grid min-h-full w-full max-w-[1480px] grid-cols-1 items-center gap-10 px-5 pt-[104px] pb-10 sm:px-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-16 lg:px-12 lg:pb-12">
        {/* Left: white map card */}
        <div
          ref={boxRef}
          className="flex h-[62vh] min-h-[420px] flex-col rounded-[32px] bg-white p-3 text-[#0b0b0f] shadow-[0_40px_120px_-40px_rgba(125,211,252,0.18)] sm:p-4 lg:h-[min(74vh,720px)]"
        >
          <div className="flex items-end justify-between gap-4 px-3 pt-3 pb-4 sm:px-4 sm:pt-4 sm:pb-5">
            <h3 ref={boxTitleRef} className="text-[26px] leading-none font-bold tracking-[-0.03em] sm:text-[34px]">
              How to reach us?
            </h3>
            <span className="hidden text-[10px] font-semibold tracking-[0.24em] text-black/40 uppercase sm:block">
              Andheri West, Mumbai
            </span>
          </div>

          <div ref={mapRef} className="group relative flex-1 overflow-hidden rounded-[22px] bg-[#e9e9ec]">
            <iframe
              title="AV Nirvana experience centre location"
              src={MAP_EMBED}
              className="absolute inset-0 h-full w-full border-0 grayscale-[0.9] transition-[filter] duration-700 group-hover:grayscale-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <div ref={boxFooterRef} className="flex flex-wrap items-center justify-between gap-3 px-3 pt-4 pb-2 sm:px-4">
            <p className="text-[12.5px] leading-snug text-black/55">
              8-C, Laxmi Industrial Estate, Suresh Nagar, Andheri West
            </p>
            <a
              href={MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-[#0b0b0f] py-2.5 pr-4 pl-5 text-[12.5px] font-medium text-white transition-colors duration-300 hover:bg-black"
            >
              Get directions
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>

        {/* Right: copy */}
        <div
          className="flex flex-col lg:pr-4"
          style={{
            transform: `translate3d(${TEXT_LAYOUT.x}px, ${TEXT_LAYOUT.y}px, 0) scale(${TEXT_LAYOUT.scale})`,
            transformOrigin: "left center",
          }}
        >
          <div ref={eyebrowRef} className="mb-5 inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.34em] text-white/55 uppercase sm:mb-7">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-white/50" />
            Contact
          </div>

          <h2 className="text-[clamp(3rem,7.4vw,7.2rem)] leading-[0.92] font-bold tracking-[-0.045em]">
            {["Experience", "Excellence"].map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <span
                  ref={(el) => {
                    headingLinesRef.current[i] = el;
                  }}
                  className={`block will-change-transform ${i === 1 ? "text-white/35" : "text-white"}`}
                >
                  {line}
                </span>
              </span>
            ))}
          </h2>

          <p className="mt-6 max-w-[520px] text-[15px] leading-[1.7] font-light text-white/70 sm:mt-8 sm:text-[16.5px]">
            {INTRO.split(" ").map((w, i) => (
              <span
                key={i}
                ref={(el) => {
                  introWordsRef.current[i] = el;
                }}
                className="inline-block"
              >
                {w}
                {" "}
              </span>
            ))}
          </p>

          <dl className="mt-9 flex flex-col sm:mt-12">
            {contacts.map((c, i) => (
              <div key={c.label} className="relative">
                <div
                  ref={(el) => {
                    rulesRef.current[i] = el;
                  }}
                  className="h-px w-full origin-left bg-white/15"
                />
                <div
                  ref={(el) => {
                    rowsRef.current[i] = el;
                  }}
                  className="grid grid-cols-[92px_1fr] items-baseline gap-4 py-5 sm:grid-cols-[120px_1fr]"
                >
                  <dt className="text-[10.5px] font-semibold tracking-[0.26em] text-white/45 uppercase">{c.label}</dt>
                  <dd className="text-[15px] text-white/90 sm:text-[17px]">{c.content}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
