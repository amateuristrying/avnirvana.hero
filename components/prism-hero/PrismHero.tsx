"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import Prism from "@/components/prism/Prism";
import ParticleLogo from "@/components/hero/ParticleLogo";
import LogoMark from "@/components/hero/LogoMark";
import { ArrowUpRight } from "@/components/hero/icons";
import { useReducedMotion } from "@/lib/useReducedMotion";

const PHRASES = [
  "Technology that blends in nature",
  "Designed for performance, built for scale",
  "Seamless technology for smarter workspaces",
  "Technology for memorable hospitality experiences",
  "Elevating everyday living through technology",
];

/** Exit duration in seconds; the commit timer is keyed to it. */
const EXIT_S = 0.42;

/** Full cycle per phrase, in milliseconds. */
const CYCLE_MS = 3210;

const LINKS = [
  { label: "About us", href: "#about" },
  { label: "Products", href: "#products" },
  { label: "Brands", href: "#brands" },
  { label: "Domains", href: "#domains" },
  { label: "Contact", href: "#contact" },
];

export default function PrismHero() {
  return (
    <section className="relative isolate flex min-h-svh w-full flex-col overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0">
        <Prism
          animationType="hover"
          timeScale={0.7}
          height={3.4}
          baseWidth={5.5}
          scale={4.2}
          hueShift={0}
          colorFrequency={0.8}
          noise={0.5}
          glow={1}
        />
      </div>

      {/* Keeps the header and the headline legible over the brightest bands */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.12)_28%,rgba(0,0,0,0)_55%)]" />

      <PrismHeader />

      <div className="relative z-10 flex min-h-svh flex-col items-center justify-center px-5 pb-[104px] pt-[116px] sm:px-8 lg:pb-[140px]">
        <ParticleLogo className="h-[32vh] max-h-[400px] min-h-[200px] w-full max-w-[560px] sm:h-[36vh]" />
        <CyclingHeadline />
      </div>
    </section>
  );
}

function PrismHeader() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <header
      ref={headerRef}
      className="absolute inset-x-0 top-0 z-40 px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pt-6"
    >
      <div className="mx-auto max-w-[1220px]">
        <nav
          aria-label="Primary"
          className="relative rounded-[26px] border border-white/12 bg-white/[0.07] shadow-[0_20px_60px_-28px_rgba(0,0,0,0.9)] backdrop-blur-2xl backdrop-saturate-150"
        >
          <div className="flex h-[62px] items-center gap-4 px-4 sm:h-[72px] sm:px-6">
            <a
              href="#"
              aria-label="AV Nirvana India — home"
              className="flex shrink-0 items-center gap-2.5 text-white transition-opacity duration-300 hover:opacity-80"
            >
              <LogoMark className="h-[28px] w-auto sm:h-[32px]" />
              <span className="h-[26px] w-px shrink-0 bg-white/20 sm:h-[30px]" aria-hidden="true" />
              <span className="leading-none">
                <span className="block text-[16px] font-semibold tracking-[0.01em] sm:text-[18px]">
                  AV NIRVANA
                </span>
                <span className="mt-[3px] block text-[8px] font-medium tracking-[0.46em] text-brand sm:text-[9px]">
                  INDIA
                </span>
              </span>
            </a>

            <ul className="ml-auto hidden items-center gap-8 lg:flex">
              {LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-[15px] text-white/65 transition-colors duration-300 hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="ml-auto flex items-center gap-2 lg:ml-8">
              <a
                href="#contact"
                className="group hidden items-center gap-2 rounded-full bg-white py-3 pl-6 pr-5 text-[14px] font-semibold text-black transition-transform duration-300 hover:-translate-y-px sm:inline-flex"
              >
                Talk to our expert
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="prism-menu"
                aria-label={open ? "Close menu" : "Open menu"}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors duration-300 hover:bg-white/10 lg:hidden"
              >
                <span className="relative block h-[13px] w-[19px]">
                  <span
                    className={`absolute left-0 block h-[1.5px] w-full origin-center rounded-full bg-current transition-all duration-300 ${
                      open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-1/2 block h-[1.5px] w-full -translate-y-1/2 rounded-full bg-current transition-all duration-200 ${
                      open ? "scale-x-0 opacity-0" : "opacity-100"
                    }`}
                  />
                  <span
                    className={`absolute left-0 block h-[1.5px] w-full origin-center rounded-full bg-current transition-all duration-300 ${
                      open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          <div
            id="prism-menu"
            className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
              open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="min-h-0">
              <div className="border-t border-white/10 px-4 pb-4 pt-3 sm:px-6">
                <ul className="grid gap-0.5 sm:grid-cols-2">
                  {LINKS.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        tabIndex={open ? 0 : -1}
                        onClick={() => setOpen(false)}
                        className="block rounded-lg px-3 py-2.5 text-[15px] text-white/80 transition-colors duration-200 hover:bg-white/10"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  tabIndex={open ? 0 : -1}
                  onClick={() => setOpen(false)}
                  className="mt-3 flex items-center justify-center gap-2 rounded-full bg-white py-3 text-[14px] font-semibold text-black sm:hidden"
                >
                  Talk to our expert
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

/**
 * Cycles the phrase list on a fixed interval.
 *
 * `index` drives the schedule and `shown` drives the DOM: bumping the index
 * plays the exit, and only when that finishes does `shown` change — so the
 * incoming words never overwrite the outgoing ones mid-flight.
 */
function CyclingHeadline() {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const wrapRef = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % PHRASES.length), CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  // Exit the current phrase, then hand over to the enter effect below.
  useEffect(() => {
    if (index === shown) return;
    const words = wrapRef.current?.querySelectorAll<HTMLElement>("[data-word]");
    if (!words?.length || reduced) {
      setShown(index);
      return;
    }
    const tl = gsap.to(words, {
      yPercent: -110,
      opacity: 0,
      filter: "blur(10px)",
      duration: EXIT_S,
      ease: "power2.in",
      stagger: 0.028,
    });
    // Commit on a timer rather than the tween's onComplete. GSAP runs on
    // requestAnimationFrame, which a backgrounded tab pauses while the cycle
    // interval keeps firing — gating the swap on it strands the text.
    const commit = setTimeout(() => setShown(index), EXIT_S * 1000 + 60);
    return () => {
      tl.kill();
      clearTimeout(commit);
    };
  }, [index, shown, reduced]);

  // Enter whenever the rendered phrase changes (including first paint).
  useLayoutEffect(() => {
    const words = wrapRef.current?.querySelectorAll<HTMLElement>("[data-word]");
    if (!words?.length) return;
    if (reduced) {
      gsap.set(words, { yPercent: 0, opacity: 1, filter: "blur(0px)" });
      return;
    }
    const tl = gsap.fromTo(
      words,
      { yPercent: 110, opacity: 0, filter: "blur(12px)" },
      {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.78,
        ease: "power3.out",
        stagger: 0.05,
      },
    );
    return () => {
      tl.kill();
    };
  }, [shown, reduced]);

  return (
    <div className="mt-10 w-full sm:mt-12">
      <p
        ref={wrapRef}
        aria-live="polite"
        className="mx-auto flex max-w-[20ch] flex-wrap items-baseline justify-center gap-x-[0.28em] text-center text-[clamp(1.75rem,4.4vw,3.35rem)] font-bold leading-[1.12] tracking-[-0.032em] text-white [text-shadow:0_2px_30px_rgba(0,0,0,0.55)]"
      >
        {PHRASES[shown].split(" ").map((word, i) => (
          // The clipping span gives the words an edge to slide out of.
          <span key={`${shown}-${i}`} className="inline-block overflow-hidden pb-[0.12em]">
            <span data-word className="inline-block will-change-transform">
              {word}
            </span>
          </span>
        ))}
      </p>

      <div className="mt-8 flex items-center justify-center gap-2" aria-hidden="true">
        {PHRASES.map((_, i) => (
          <span
            key={i}
            className={`block h-[3px] rounded-full transition-all duration-500 ${
              i === shown ? "w-7 bg-white/85" : "w-[10px] bg-white/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
