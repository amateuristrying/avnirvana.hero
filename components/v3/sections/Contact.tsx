"use client";

import { useRef } from "react";
import { CONTACT } from "../content";
import { discsSpin, gsap, headDrift, headIn, once, riseIn, useMotion, wipeUp } from "../motion";
import { Disc, SectionHead } from "../ui";

export default function Contact() {
  const ref = useRef<HTMLElement>(null);

  useMotion(ref, (root) => {
    const head = root.querySelector(".v3-head");
    headIn(head);
    headDrift(root, head, 32);

    // The rules draw across, each row's label and value rise onto its line,
    // then the pills arrive with their discs spinning to rest.
    const rows = gsap.timeline({ scrollTrigger: once(root.querySelector(".ct-rows"), "top 90%") });
    // (The rules are the rows' ::before and the list's ::after, scaled by
    // --rule / --rule-end; see v3.css.)
    rows.fromTo(
      root.querySelectorAll(".ct-row"),
      { "--rule": 0 },
      { "--rule": 1, duration: 1.3, ease: "expo.inOut", stagger: 0.1 },
      0,
    );
    rows.fromTo(root.querySelector(".ct-rows"), { "--rule-end": 0 }, { "--rule-end": 1, duration: 1.3, ease: "expo.inOut" }, 0.3);
    riseIn(rows, root.querySelectorAll(".ct-row dt, .ct-row dd"), 0.25, { stagger: 0.06 }, 18);
    riseIn(rows, root.querySelectorAll(".ct-cta .sp-btn"), 0.55, { duration: 1.1, stagger: 0.1 }, 26);
    discsSpin(rows, root.querySelector(".ct-cta"), 0.55);

    // The map card wipes up and the map inside settles from a slight zoom.
    const map = root.querySelector<HTMLElement>(".ct-map");
    if (map) {
      const mt = gsap.timeline({ scrollTrigger: once(map, "top 90%") });
      wipeUp(mt, map, 0, { duration: 1.5 });
      mt.fromTo(
        map.querySelector(".ct-map-frame iframe"),
        { scale: 1.18 },
        { scale: 1, duration: 2, ease: "expo.out", clearProps: "transform" },
        0.25,
      );
      riseIn(mt, map.querySelectorAll(".ct-map-head > *, .ct-map-foot > *"), 0.5, { stagger: 0.07 }, 16);
      discsSpin(mt, map, 0.65);
    }
  });

  return (
    <section id="contact" ref={ref} className="v3-section ct" aria-labelledby="contact-title" data-motion>
      <div className="v3-wrap ct-grid">
        <div className="ct-copy">
          <SectionHead tag={CONTACT.tag} a={CONTACT.a} b={CONTACT.b} lead={CONTACT.lead} align="left" titleId="contact-title" />

          <dl className="ct-rows">
            <div className="ct-row">
              <dt>Phone</dt>
              <dd>
                {CONTACT.phones.map((p, i) => (
                  <span key={p.href}>
                    {i > 0 ? <span className="ct-sep"> / </span> : null}
                    <a className="ct-link" href={p.href}>
                      {p.label}
                    </a>
                  </span>
                ))}
              </dd>
            </div>
            <div className="ct-row">
              <dt>Email</dt>
              <dd>
                <a className="ct-link" href={`mailto:${CONTACT.email}`}>
                  {CONTACT.email}
                </a>
              </dd>
            </div>
            <div className="ct-row">
              <dt>Address</dt>
              <dd>
                <a className="ct-link" href={CONTACT.mapsLink} target="_blank" rel="noopener noreferrer">
                  {CONTACT.address[0]}
                  <br />
                  {CONTACT.address[1]}
                </a>
              </dd>
            </div>
          </dl>

          <div className="sp-cta ct-cta">
            <a className="sp-btn sp-btn-solid" href={CONTACT.phones[0].href}>
              Call us
              <Disc size="btn" />
            </a>
            <a className="sp-btn sp-btn-ghost" href={`mailto:${CONTACT.email}`}>
              Email us
            </a>
          </div>
        </div>

        <div className="v3-glass ct-map">
          <div className="ct-map-head">
            <h3>How to reach us?</h3>
            <span>{CONTACT.area}</span>
          </div>
          <div className="ct-map-frame">
            <iframe
              title="AV Nirvana experience centre location"
              src={CONTACT.mapEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <div className="ct-map-foot">
            <p>8-C, Laxmi Industrial Estate, Suresh Nagar, Andheri West</p>
            <a className="v3-pill" href={CONTACT.mapsLink} target="_blank" rel="noopener noreferrer">
              Get directions
              <Disc size="nav" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
