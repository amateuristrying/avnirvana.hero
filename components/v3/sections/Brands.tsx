"use client";

import { useRef } from "react";
import { BRANDS, BRANDS_HEAD } from "../content";
import { gsap, headDrift, headIn, once, ScrollTrigger, useMotion } from "../motion";
import { SectionHead } from "../ui";

const ROWS = [BRANDS.slice(0, 6), BRANDS.slice(6)];
/** Copies per track: one copy wider than the widest screen keeps the loop seamless. */
const COPIES = 3;
/** Seconds for a row to drift the length of one copy. */
const LOOP_S = 46;

function Chip({ brand }: { brand: (typeof BRANDS)[number] }) {
  return (
    <span className="br-chip">
      <svg viewBox="0 0 32 32" className="br-mark" aria-hidden="true">
        {brand.mark}
      </svg>
      <span className="br-text">
        <span className="br-name">{brand.name}</span>
        <span className="br-tag">{brand.tag}</span>
      </span>
    </span>
  );
}

export default function Brands() {
  const ref = useRef<HTMLElement>(null);

  useMotion(ref, (root) => {
    const head = root.querySelector(".v3-head");
    headIn(head);
    headDrift(root, head);

    const rowsEl = root.querySelector<HTMLElement>(".br-rows");
    const rows = Array.from(root.querySelectorAll<HTMLElement>(".br-marquee"));

    // The rows sweep in from opposite sides and settle into their drift.
    gsap.fromTo(
      rows,
      { autoAlpha: 0, x: (i: number) => (i % 2 ? -1 : 1) * 220 },
      {
        autoAlpha: 1,
        x: 0,
        duration: 1.7,
        ease: "expo.out",
        stagger: 0.12,
        clearProps: "transform",
        scrollTrigger: once(rowsEl, "top 90%"),
      },
    );

    // Each row loops by exactly one copy (a third of its track); the second
    // row runs the other way.
    const loops = rows.map((row, i) => {
      const track = row.querySelector(".br-track");
      const [from, to] = i % 2 ? [-100 / COPIES, 0] : [0, -100 / COPIES];
      return gsap.fromTo(track, { xPercent: from }, { xPercent: to, duration: LOOP_S, ease: "none", repeat: -1, paused: true });
    });

    // Scrolling shears the rows apart: the first leads, the second trails.
    gsap.fromTo(
      root.querySelectorAll(".br-shift"),
      { x: (i: number) => (i % 2 ? -1 : 1) * 80 },
      {
        x: (i: number) => (i % 2 ? 1 : -1) * 80,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.8 },
      },
    );

    // A flick of the wheel speeds the drift up before it eases back; a
    // pointer over the rows slows it to a crawl. The loops only run while the
    // section is on screen.
    const boost = { v: 1 };
    const hover = { v: 1 };
    const apply = () => loops.forEach((l) => l.timeScale(boost.v * hover.v));
    ScrollTrigger.create({
      trigger: root,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => loops.forEach((l) => (self.isActive ? l.play() : l.pause())),
      onUpdate: (self) => {
        const kick = Math.min(Math.abs(self.getVelocity()) / 400, 5);
        if (kick < 0.4) return;
        gsap.to(boost, {
          v: 1 + kick,
          duration: 0.25,
          ease: "power2.out",
          overwrite: true,
          onUpdate: apply,
          onComplete: () => {
            gsap.to(boost, { v: 1, duration: 1.6, ease: "power2.out", onUpdate: apply });
          },
        });
      },
    });

    const slow = () => gsap.to(hover, { v: 0.18, duration: 0.8, ease: "power2.out", overwrite: true, onUpdate: apply });
    const resume = () => gsap.to(hover, { v: 1, duration: 0.9, ease: "power2.inOut", overwrite: true, onUpdate: apply });
    rowsEl?.addEventListener("pointerenter", slow);
    rowsEl?.addEventListener("pointerleave", resume);
    return () => {
      rowsEl?.removeEventListener("pointerenter", slow);
      rowsEl?.removeEventListener("pointerleave", resume);
      gsap.killTweensOf([boost, hover]);
    };
  });

  return (
    <section id="brands" ref={ref} className="v3-section br" aria-labelledby="brands-title" data-motion>
      <div className="v3-wrap">
        <SectionHead tag={BRANDS_HEAD.tag} a={BRANDS_HEAD.a} b={BRANDS_HEAD.b} lead={BRANDS_HEAD.lead} titleId="brands-title" />
      </div>

      {/* One list for assistive tech; the drifting rows below are its picture. */}
      <ul className="sr-only">
        {BRANDS.map((b) => (
          <li key={b.name}>
            {b.name} — {b.tag}
          </li>
        ))}
      </ul>

      <div className="br-rows" aria-hidden="true">
        {ROWS.map((row, r) => (
          <div key={r} className="br-marquee">
            <div className="br-shift">
              <div className="br-track">
                {Array.from({ length: COPIES }, (_, c) => (
                  <div key={c} className="br-copy">
                    {row.map((b) => (
                      <Chip key={b.name} brand={b} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
