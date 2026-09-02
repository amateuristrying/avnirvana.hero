"use client";

import { useEffect, useRef, useState } from "react";
import LogoMark from "./LogoMark";
import { ArrowUpRight } from "./icons";

const LINKS = [
  { label: "Home", href: "#", active: true },
  { label: "Brands", href: "#brands" },
  { label: "Services", href: "#services" },
  { label: "Events", href: "#events" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
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
      // Tuned offset, desktop only: below `lg` the top padding is 16–20px, so
      // the same -15px would leave the bar flush against the screen edge (and
      // under the notch on a phone).
      className="absolute inset-x-0 top-0 z-40 px-4 pt-4 sm:px-6 sm:pt-5 lg:-translate-y-[15px] lg:px-10 lg:pt-6"
    >
      <div className="mx-auto max-w-[1600px]">
        <nav
          aria-label="Primary"
          className="relative rounded-[18px] border border-white/60 bg-white/40 shadow-[0_10px_36px_-22px_rgba(23,26,32,0.35)] ring-1 ring-hairline backdrop-blur-xl backdrop-saturate-150"
        >
          <div className="flex h-[58px] items-center gap-4 px-3.5 sm:h-[64px] sm:px-5">
            {/* Brand */}
            <a
              href="#"
              className="flex shrink-0 items-center gap-2.5 text-ink transition-opacity duration-300 hover:opacity-70"
              aria-label="AV Nirvana India — home"
            >
              <LogoMark className="h-[26px] w-auto sm:h-[30px]" />
              {/* Divider from the brand lockup. */}
              <span className="h-[26px] w-px shrink-0 bg-hairline-strong sm:h-[30px]" aria-hidden="true" />
              <span className="leading-none">
                <span className="block text-[15px] font-semibold tracking-[0.02em] sm:text-[17px]">
                  AV NIRVANA
                </span>
                <span className="mt-[3px] block text-[8px] font-medium tracking-[0.46em] text-brand-deep sm:text-[9px]">
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
                    className={`nav-underline relative text-[14.5px] transition-colors duration-300 hover:text-ink ${
                      link.active ? "font-medium text-ink" : "text-mute"
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
                className="group hidden items-center gap-2 rounded-full bg-ink py-2.5 pl-5 pr-4 text-[13.5px] font-medium text-white transition-colors duration-300 hover:bg-ink-soft sm:inline-flex"
              >
                Talk to our expert
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="hero-menu"
                aria-label={open ? "Close menu" : "Open menu"}
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors duration-300 hover:bg-ink/[0.06]"
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

          {/* Menu panel */}
          <div
            id="hero-menu"
            className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="min-h-0">
              <div className="border-t border-hairline px-3.5 pb-4 pt-3 sm:px-5">
                <ul className="grid gap-0.5 sm:grid-cols-2 lg:grid-cols-3">
                  {LINKS.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        tabIndex={open ? 0 : -1}
                        onClick={() => setOpen(false)}
                        className="block rounded-lg px-3 py-2.5 text-[15px] text-ink-soft transition-colors duration-200 hover:bg-ink/[0.05]"
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
                  className="group mt-3 flex items-center justify-center gap-2 rounded-full bg-ink py-3 text-[14px] font-medium text-white transition-colors duration-300 hover:bg-ink-soft sm:hidden"
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
