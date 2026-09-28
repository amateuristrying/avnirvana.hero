"use client";

import { useRef } from "react";
import { discsSpin, gsap, linesUp, riseIn, SplitText, useMotion } from "./motion";
import { Disc, Lockup } from "./ui";

/**
 * Frame 67 — the hero: the AV Nirvana India lockup over a two-line display
 * headline and the pill CTA pair, centred on the canvas. The line is AV
 * Nirvana's own ("Engineered for better spaces"). On load the logo assembles
 * itself, both headline lines rise out of their masks and the pills follow;
 * as the hero scrolls away, each lifts off at its own pace.
 */
export default function SpotlightHero() {
  const ref = useRef<HTMLElement>(null);

  useMotion(ref, (hero) => {
    const tl = gsap.timeline({ delay: 0.25, defaults: { ease: "expo.out" } });

    // The logo first: the mark rises in, the rule draws down, the name rises
    // letter by letter and INDIA settles in from wide tracking.
    const brand = hero.querySelector<HTMLElement>(".sp-hero-brand");
    if (brand) {
      tl.fromTo(
        brand.querySelector(".sp-mark"),
        { autoAlpha: 0, y: 26, scale: 0.85 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1.3, clearProps: "transform" },
        0,
      );
      tl.fromTo(
        brand.querySelector(".sp-brand-rule"),
        { scaleY: 0 },
        { scaleY: 1, duration: 1.1, ease: "expo.inOut", clearProps: "transform" },
        0.1,
      );
      const name = brand.querySelector(".sp-word-main");
      if (name) {
        const split = SplitText.create(name, { type: "words,chars", mask: "words" });
        tl.fromTo(
          split.chars,
          { yPercent: 110 },
          { yPercent: 0, duration: 1.1, stagger: 0.035, onComplete: () => split.revert() },
          0.2,
        );
      }
      tl.fromTo(
        brand.querySelector(".sp-word-sub"),
        { autoAlpha: 0, letterSpacing: "1.2em", paddingLeft: "1.2em" },
        { autoAlpha: 1, letterSpacing: "0.46em", paddingLeft: "0.46em", duration: 1.5, clearProps: "letterSpacing,paddingLeft" },
        0.4,
      );
    }

    linesUp(tl, hero.querySelectorAll(".sp-h1, .sp-h2"), 0.45, { duration: 1.4, stagger: 0.14 });
    riseIn(tl, hero.querySelectorAll(".sp-cta .sp-btn"), 0.95, { duration: 1.1, stagger: 0.1 }, 30);
    discsSpin(tl, hero.querySelector(".sp-cta"), 0.95);

    gsap
      .timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 } })
      .to(brand, { yPercent: -150, autoAlpha: 0, ease: "none" }, 0)
      .to(hero.querySelector(".sp-head"), { yPercent: -45, autoAlpha: 0, ease: "none" }, 0)
      .to(hero.querySelector(".sp-cta"), { yPercent: -140, autoAlpha: 0, ease: "none" }, 0);
  });

  return (
    <section ref={ref} id="top" className="lk-stage" aria-label="AV Nirvana India" data-motion>
      <div className="uip-layer lk lk-spotlight">
        <div className="sp-hero">
          <div className="sp-hero-brand" role="img" aria-label="AV Nirvana India">
            <Lockup />
          </div>

          <h1 className="sp-head">
            <span className="sp-mask sp-mask-a">
              <span className="sp-h1">Engineered for</span>
            </span>{" "}
            <span className="sp-mask sp-mask-b">
              <span className="sp-h2">Better spaces</span>
            </span>
          </h1>

          <div className="sp-cta">
            <a className="sp-btn sp-btn-solid" href="#contact">
              Let’s talk
              <Disc size="btn" />
            </a>
            <a className="sp-btn sp-btn-ghost" href="#contact">
              Book a demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
