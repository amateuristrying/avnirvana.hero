"use client";

import type React from "react";
import LogoMark from "./LogoMark";
import { ArrowUpRight } from "./icons";

// Hash targets are intercepted by HeroAboutExperience and mapped to screens
const LINKS: { label: string; href: string; active?: boolean }[] = [
  { label: "About us", href: "#about" }, // Screen 2
  { label: "Products", href: "#products" }, // Screen 3
  { label: "Brands", href: "#brands" }, // Screen 4
  { label: "Domains", href: "#domains" }, // Screen 5
  { label: "Contact", href: "#contact" },
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
  menuId: _menuId = "hero-menu",
  tone = "onDark",
}: {
  menuId?: string;
  /** "onLight" for white pages: dark type, no text shadow. */
  tone?: "onDark" | "onLight";
}) {
  const light = tone === "onLight";

  return (
    <header
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
                className={`group inline-flex items-center gap-2 rounded-full bg-fg py-2 px-3.5 text-[12.5px] sm:py-2.5 sm:pl-5 sm:pr-4 sm:text-[13.5px] font-medium text-canvas [text-shadow:none] transition-colors duration-300 ${
                  light
                    ? "shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)] hover:bg-[#2a2a33]"
                    : "shadow-[0_8px_30px_-10px_rgba(0,0,0,0.6)] hover:bg-white"
                }`}
              >
                Talk to our expert
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
