"use client";

import { useEffect, useRef, useState } from "react";
import type React from "react";
import LogoMark from "./LogoMark";
import { ArrowUpRight } from "./icons";

// Hash targets are intercepted by HeroAboutExperience and mapped to screens
const LINKS: { label: string; href: string; active?: boolean }[] = [
  { label: "About us", href: "#about" }, // Screen 2
  { label: "Products", href: "#products" }, // Screen 3
  { label: "Brands", href: "#brands" }, // Screen 4
  { label: "Domains", href: "#domains" }, // Screen 5
  { label: "Contact", href: "#contact" }, // TODO: hook up once the contact screen exists
];

/** Theme tokens re-pointed for a white page, so every token-based class flips with them. */
const ON_LIGHT = {
  "--color-fg": "#0d0d12",
  "--color-fg-soft": "#26262e",
  "--color-fg-mute": "#5c5c68",
  "--color-canvas": "#ffffff",
  "--color-line": "rgba(13,13,18,0.10)",
  "--color-line-strong": "rgba(13,13,18,0.22)",
} as React.CSSProperties;

export default function Navbar({
  menuId = "hero-menu",
  tone = "onDark",
}: {
  menuId?: string;
  /** "onLight" for white pages: dark type, no text shadow. */
  tone?: "onDark" | "onLight";
}) {
  const light = tone === "onLight";
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <header
      ref={headerRef}
      className="absolute inset-x-0 top-0 z-40 px-5 pt-4 sm:px-8 sm:pt-5 lg:px-12 lg:pt-6"
      style={light ? ON_LIGHT : undefined}
    >
      <div className="mx-auto max-w-[1600px]">
        {/* No container box: the nav floats directly over the ferrofluid */}
        <nav
          aria-label="Primary"
          className={`relative ${light ? "" : "[text-shadow:0_1px_14px_rgba(0,0,0,0.55)]"}`}
        >
          <div className="flex h-[58px] items-center gap-4 sm:h-[64px]">
            {/* Brand */}
            <a
              href="#"
              className="flex shrink-0 items-center gap-2.5 text-fg transition-opacity duration-300 hover:opacity-75"
              aria-label="AV Nirvana India — home"
            >
              <LogoMark className="h-[26px] w-auto sm:h-[30px]" />
              {/* Divider from the brand lockup. */}
              <span className="h-[26px] w-px shrink-0 bg-line-strong sm:h-[30px]" aria-hidden="true" />
              <span className="flex flex-col items-center leading-none">
                <span className="block text-[15px] font-semibold tracking-[0.02em] sm:text-[17px]">
                  AV NIRVANA
                </span>
                {/* pl offsets the trailing letter-spacing so the word sits optically centred */}
                <span className="mt-[4px] block pl-[0.46em] text-[8px] font-medium tracking-[0.46em] text-brand sm:text-[9px]">
                  INDIA
                </span>
              </span>
            </a>

            {/* Desktop links */}
            <ul className="ml-auto hidden items-center gap-7 lg:flex xl:gap-9">
              {LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    data-active={link.active ? "true" : undefined}
                    aria-current={link.active ? "page" : undefined}
                    className={`nav-underline relative text-[14.5px] transition-colors duration-300 hover:text-fg ${
                      link.active ? "font-medium text-fg" : "text-fg-mute"
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="ml-auto flex items-center gap-2 lg:ml-8 lg:gap-3">
              <a
                href="#contact"
                className={`group hidden items-center gap-2 rounded-full bg-fg py-2.5 pl-5 pr-4 text-[13.5px] font-medium text-canvas [text-shadow:none] transition-colors duration-300 sm:inline-flex ${
                  light
                    ? "shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)] hover:bg-[#2a2a33]"
                    : "shadow-[0_8px_30px_-10px_rgba(0,0,0,0.6)] hover:bg-white"
                }`}
              >
                Talk to our expert
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={menuId}
                aria-label={open ? "Close menu" : "Open menu"}
                className="flex h-10 w-10 items-center justify-center rounded-full text-fg transition-colors duration-300 hover:bg-fg/10"
              >
                <span className="relative block h-[13px] w-[19px]">
                  <span
                    className={`absolute left-0 block h-[1.5px] w-full origin-center rounded-full bg-current transition-all duration-300 ease-out ${
                      open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-1/2 block h-[1.5px] w-full -translate-y-1/2 rounded-full bg-current transition-all duration-200 ${
                      open ? "scale-x-0 opacity-0" : "opacity-100"
                    }`}
                  />
                  <span
                    className={`absolute left-0 block h-[1.5px] w-full origin-center rounded-full bg-current transition-all duration-300 ease-out ${
                      open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          {/* Menu panel: floating glass card, since the bar itself no longer has a box */}
          <div
            id={menuId}
            className={`absolute top-full right-0 mt-2 grid w-[min(100%,440px)] overflow-hidden rounded-2xl border border-line bg-canvas/70 backdrop-blur-xl ${
              light ? "shadow-[0_20px_50px_-24px_rgba(0,0,0,0.35)]" : "shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]"
            } [text-shadow:none] transition-[grid-template-rows,opacity,visibility] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              open ? "grid-rows-[1fr] opacity-100" : "pointer-events-none invisible grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="min-h-0">
              <div className="px-3 pb-3 pt-3">
                <ul className="grid gap-0.5 sm:grid-cols-2">
                  {LINKS.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        tabIndex={open ? 0 : -1}
                        onClick={() => setOpen(false)}
                        className="block rounded-lg px-3 py-2.5 text-[15px] text-fg-soft transition-colors duration-200 hover:bg-fg/[0.07]"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  tabIndex={open ? 0 : -1}
                  onClick={() => setOpen(false)}
                  className={`group mt-3 flex items-center justify-center gap-2 rounded-full bg-fg py-3 text-[14px] font-medium text-canvas transition-colors duration-300 sm:hidden ${
                    light ? "hover:bg-[#2a2a33]" : "hover:bg-white"
                  }`}
                >
                  Talk to our expert
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
