"use client";

import { useRef } from "react";
import { NAV_LINKS } from "./content";
import { discsSpin, gsap, useMotion } from "./motion";
import { Disc, Lockup, useActiveSection } from "./ui";

const SECTION_IDS = NAV_LINKS.map((l) => l.href.slice(1));

/** Frame 68 — the glass pill nav: brand at x40, links centred, CTA flush right. */
export default function SpotlightNav() {
  const ref = useRef<HTMLElement>(null);
  const active = useActiveSection(SECTION_IDS);

  // The bar drops in, then its contents follow left to right. The brand and
  // link row are centred with CSS transforms, so their children move instead.
  useMotion(ref, (nav) => {
    const tl = gsap.timeline({ delay: 0.05, defaults: { ease: "expo.out" } });
    tl.fromTo(nav, { autoAlpha: 0, y: -28 }, { autoAlpha: 1, y: 0, duration: 1.2, clearProps: "transform" }, 0);
    tl.fromTo(
      nav.querySelectorAll(".sp-brand > *, .sp-links a, .sp-navcta"),
      { autoAlpha: 0, y: -12 },
      { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.05, clearProps: "transform" },
      0.18,
    );
    discsSpin(tl, nav, 0.55);
  });

  return (
    <header ref={ref} className="sp-nav" data-motion>
      <a className="sp-brand" href="#top" aria-label="AV Nirvana India — home">
        <Lockup />
      </a>

      <nav className="sp-links" aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} aria-current={active === link.href.slice(1) ? "true" : undefined}>
            {link.label}
          </a>
        ))}
      </nav>

      <a className="sp-navcta" href="#contact">
        Let’s talk
        <Disc size="nav" tone="dark" />
      </a>
    </header>
  );
}
