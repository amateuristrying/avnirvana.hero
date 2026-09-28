"use client";

import { useEffect, useRef, useState } from "react";
import DomainsScreen from "@/components/domains/DomainsScreen";
import FlowWave from "./FlowWave";
import SpotlightNav from "./SpotlightNav";
import SpotlightHero from "./SpotlightHero";
import About from "./sections/About";
import Products from "./sections/Products";
import Brands from "./sections/Brands";
import Contact from "./sections/Contact";
import SiteFooter from "./sections/SiteFooter";
import { gsap, useMotion } from "./motion";
import "./spotlight.css";
import "./v3.css";

declare global {
  interface Window {
    /** Set once the app has taken over the entry state (see app/layout.tsx). */
    __lkLive?: boolean;
  }
}

/**
 * The brief's hint: faint, bottom-centre, gone once the reader scrolls. The
 * wrapper fades out on scroll; the label inside drops in after the hero and
 * then bobs, pointing the way.
 */
function ScrollHint() {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => setHidden(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useMotion(ref, (el) => {
    const label = el.firstElementChild;
    gsap.fromTo(label, { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 1.2, delay: 1.3, ease: "expo.out" });
    gsap.to(label, { y: 6, duration: 1.3, delay: 2.5, ease: "sine.inOut", repeat: -1, yoyo: true });
  });

  return (
    <div ref={ref} className="sp-scroll-hint" data-hidden={hidden} aria-hidden="true" data-motion>
      <span>scroll ↓</span>
    </div>
  );
}

/**
 * AV Nirvana v3: the Spotlight composition over the Flow Wave scene, and the
 * site's sections floating on the same living ground.
 */
export default function SiteV3() {
  // The motion system reveals each component itself from here on.
  useEffect(() => {
    window.__lkLive = true;
  }, []);

  return (
    <>
      <FlowWave />
      <SpotlightNav />
      <main className="v3-main">
        <SpotlightHero />
        <About />
        <Products />
        <Brands />
        <DomainsScreen />
        <Contact />
      </main>
      <SiteFooter />
      <ScrollHint />
    </>
  );
}
