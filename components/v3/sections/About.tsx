"use client";

import { useRef } from "react";
import { ABOUT } from "../content";
import { gsap, headDrift, headIn, once, riseIn, useMotion, wipeUp } from "../motion";
import { SectionHead } from "../ui";

export default function About() {
  const ref = useRef<HTMLElement>(null);

  useMotion(ref, (root) => {
    const head = root.querySelector(".v3-head");
    const tl = headIn(head);
    headDrift(root, head);

    // The facts pop in after the lead, and the years count up as they land.
    if (tl) {
      tl.fromTo(
        root.querySelectorAll(".ab-fact"),
        { autoAlpha: 0, y: 14, scale: 0.92 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.07, clearProps: "transform" },
        0.55,
      );
      root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const end = Number(el.dataset.count) || 0;
        const n = { v: 0 };
        tl.fromTo(
          n,
          { v: 0 },
          {
            v: end,
            duration: 1.8,
            ease: "power3.out",
            onUpdate: () => {
              el.textContent = String(Math.round(n.v));
            },
          },
          0.6,
        );
      });
    }

    // Pillars wipe up out of their own rounded rects, one after another, and
    // their contents follow each one in.
    const cards = Array.from(root.querySelectorAll<HTMLElement>(".ab-card"));
    const ct = gsap.timeline({ scrollTrigger: once(root.querySelector(".ab-grid"), "top 90%") });
    cards.forEach((card, i) => {
      const at = i * 0.11;
      wipeUp(ct, card, at, { duration: 1.25 });
      riseIn(ct, card.querySelectorAll(".ab-card-top, .ab-card-title, .ab-card-desc"), at + 0.35, { stagger: 0.07 }, 18);
    });
  });

  return (
    <section id="about" ref={ref} className="v3-section ab" aria-labelledby="about-title" data-motion>
      <div className="v3-wrap">
        <SectionHead
          tag={ABOUT.tag}
          a={ABOUT.a}
          b={ABOUT.b}
          align="left"
          titleId="about-title"
          aside={
            <>
              <p className="v3-lead ab-lead">{ABOUT.lead}</p>
              <ul className="ab-facts">
                {ABOUT.facts.map((f) => (
                  <li key={f.value} className="ab-fact">
                    <span className="ab-fact-v">
                      {f.count ? <span data-count={f.value}>{f.value}</span> : f.value}
                      {f.suffix}
                    </span>
                    {f.label ? <span className="ab-fact-l">{f.label}</span> : null}
                  </li>
                ))}
              </ul>
            </>
          }
        />

        <div className="ab-grid">
          {ABOUT.pillars.map((p, i) => (
            <article key={p.tag} className="v3-glass ab-card">
              <div className="ab-card-top">
                <span className="ab-index">{String(i + 1).padStart(2, "0")}</span>
                <span>{p.tag}</span>
              </div>
              <div className="ab-card-body">
                <h3 className="ab-card-title">{p.title}</h3>
                <p className="ab-card-desc">{p.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
