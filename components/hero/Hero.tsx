"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroBackground from "./HeroBackground";
import HeroContent from "./HeroContent";
import Navbar from "./Navbar";
import ParticleLogo from "./ParticleLogo";
import ScrollIndicator from "./ScrollIndicator";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const logoWrapperRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Content fade & lift on scroll down
      if (contentWrapperRef.current) {
        gsap.to(contentWrapperRef.current, {
          y: -40,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "50% top",
            scrub: true,
          },
        });
      }

      // Indicator fades out quickly on scroll
      if (indicatorRef.current) {
        gsap.to(indicatorRef.current, {
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "18% top",
            scrub: true,
          },
        });
      }

      // Particle logo subtly migrates towards the center as user scrolls into the next section
      if (logoWrapperRef.current && window.innerWidth >= 1024) {
        gsap.to(logoWrapperRef.current, {
          x: "6.5vw",
          opacity: 0.35,
          ease: "power1.inOut",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-svh w-full flex-col overflow-hidden"
    >
      <HeroBackground />
      <Navbar />

      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-5 sm:px-8 lg:px-14">
        <div className="grid flex-1 grid-cols-1 items-center gap-y-7 pb-24 pt-[98px] sm:pt-[112px] lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-x-[7vw] lg:gap-y-0 lg:pb-24 lg:pt-[104px]">
          {/* Tuned placement: logo X -116px / Y 5px, text X -262px / Y 24px. */}
          <div ref={logoWrapperRef} className="w-full">
            <ParticleLogo className="h-[29vh] min-h-[180px] w-full sm:h-[32vh] sm:min-h-[230px] md:h-[38vh] lg:h-[68vh] lg:min-h-[400px] lg:max-h-[720px] lg:translate-x-[max(-8.06vw,-116px)] lg:translate-y-[5px]" />
          </div>
          <div
            ref={contentWrapperRef}
            className="lg:translate-x-[max(-18.2vw,-262px)] lg:translate-y-[24px]"
          >
            <HeroContent />
          </div>
        </div>
      </div>

      <div ref={indicatorRef}>
        <ScrollIndicator />
      </div>
    </section>
  );
}
