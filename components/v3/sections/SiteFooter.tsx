"use client";

import { useRef } from "react";
import { CONTACT, FOOTER, NAV_LINKS, SOCIALS } from "../content";
import { gsap, once, riseIn, useMotion } from "../motion";
import { Lockup } from "../ui";

/** A glass slab inset like the nav bar, so the page ends the way it starts. */
export default function SiteFooter() {
  const ref = useRef<HTMLElement>(null);

  // The slab rises, its columns fill in left to right, the rule draws across
  // and the social discs pop into place.
  useMotion(ref, (root) => {
    const tl = gsap.timeline({ scrollTrigger: once(root, "top 94%"), defaults: { ease: "expo.out" } });
    tl.fromTo(root, { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 1.3, clearProps: "transform" }, 0);
    riseIn(tl, root.querySelectorAll(".ft-col > :not(.ft-socials)"), 0.2, { stagger: 0.05 }, 22);
    tl.fromTo(
      root.querySelectorAll(".ft-social"),
      { autoAlpha: 0, scale: 0.4 },
      { autoAlpha: 1, scale: 1, duration: 0.8, ease: "back.out(2.2)", stagger: 0.07, clearProps: "transform" },
      0.55,
    );
    tl.fromTo(
      root.querySelector(".ft-rule"),
      { scaleX: 0 },
      { scaleX: 1, duration: 1.4, ease: "expo.inOut", clearProps: "transform" },
      0.35,
    );
    riseIn(tl, root.querySelectorAll(".ft-bottom > :not(.ft-rule)"), 0.75, { stagger: 0.08 }, 12);
  });

  return (
    <footer ref={ref} className="v3-glass ft" data-motion>
      <div className="ft-grid">
        <div className="ft-col">
          <a className="sp-brand ft-brand" href="#top" aria-label="AV Nirvana India — home">
            <Lockup />
          </a>
          <p className="ft-tagline">
            {FOOTER.tagline[0]}
            <br />
            {FOOTER.tagline[1]}
          </p>
        </div>

        <nav className="ft-col" aria-label="Footer">
          <h4>Explore</h4>
          <ul>
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ft-col">
          <h4>Contact</h4>
          <ul>
            <li>
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </li>
            {CONTACT.phones.map((p) => (
              <li key={p.href}>
                <a href={p.href}>{p.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="ft-col">
          <h4>Visit</h4>
          <p className="ft-address">
            {CONTACT.address[0]}
            <br />
            {CONTACT.address[1]}
          </p>
          <div className="ft-socials">
            {SOCIALS.map((s) => (
              <a key={s.label} className="ft-social" href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {s.svg}
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="ft-bottom">
        <span className="ft-rule" aria-hidden="true" />
        <p>{FOOTER.copyright}</p>
        <a href="#top" className="ft-top">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
