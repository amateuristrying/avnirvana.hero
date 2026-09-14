"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AboutBackground from "./AboutBackground";
import AboutContentBlock from "./AboutContentBlock";
import AboutParticleLogo from "./AboutParticleLogo";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const leftBlock1Ref = useRef<HTMLDivElement>(null);
  const leftBlock2Ref = useRef<HTMLDivElement>(null);
  const rightBlock1Ref = useRef<HTMLDivElement>(null);
  const rightBlock2Ref = useRef<HTMLDivElement>(null);
  const centerLogoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          toggleActions: "play none none reverse",
        },
      });

      if (headerRef.current) {
        tl.fromTo(
          headerRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        );
      }

      // Pair 1: First text on both sides
      const pair1 = [leftBlock1Ref.current, rightBlock1Ref.current].filter(Boolean);
      if (pair1.length > 0) {
        tl.fromTo(
          pair1,
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0, ease: "power2.out" },
          "-=0.3",
        );
      }

      // Pair 2: Second text on both sides
      const pair2 = [leftBlock2Ref.current, rightBlock2Ref.current].filter(Boolean);
      if (pair2.length > 0) {
        tl.fromTo(
          pair2,
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0, ease: "power2.out" },
          "-=0.3",
        );
      }

      if (centerLogoRef.current) {
        tl.fromTo(
          centerLogoRef.current,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" },
          0.2,
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative flex min-h-svh w-full flex-col justify-center overflow-hidden py-16 sm:py-20 lg:py-16"
    >
      <AboutBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-[1380px] flex-col px-4 sm:px-6 lg:px-8">
        {/* Top Center: Compact Hierarchy Header */}
        <div ref={headerRef} className="mx-auto max-w-[760px] text-center will-change-transform">
          <div className="inline-flex items-center justify-center gap-2.5">
            <span className="h-px w-8 bg-[linear-gradient(90deg,transparent,rgba(138,182,255,0.85))]" />
            <span className="text-[11.5px] font-semibold tracking-[0.24em] text-fg-mute/95 uppercase sm:text-[12px]">
              ABOUT AV NIRVANA
            </span>
            <span className="h-px w-8 bg-[linear-gradient(90deg,rgba(138,182,255,0.85),transparent)]" />
          </div>

          <h2 className="mt-2 text-[clamp(1.6rem,2.5vw,2.45rem)] font-bold leading-[1.15] tracking-[-0.035em] text-fg drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]">
            Experience. Expertise. A More Connected World.
          </h2>

          <p className="mx-auto mt-2.5 max-w-[54ch] text-[clamp(0.88rem,0.98vw,1.02rem)] font-light leading-[1.62] text-fg-mute drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            For over 17 years, we’ve been at the forefront of audio-visual innovation, bringing
            the world’s finest technologies to India.
          </p>
        </div>

        {/* Symmetrical 3-Column Layout */}
        <div className="mt-8 grid grid-cols-1 items-center gap-y-8 lg:mt-6 lg:grid-cols-[1fr_minmax(280px,380px)_1fr] lg:gap-x-8 xl:gap-x-12">
          {/* Left Side: OUR VISION & OUR COMMITMENT */}
          <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
            <div ref={leftBlock1Ref} className="will-change-transform">
              <AboutContentBlock
                tag="OUR VISION"
                title="A Trusted Leader in AV"
                description="To be India’s most trusted and influential AV distribution company for path-breaking and converging technologies across the AV space."
              />
            </div>

            <div ref={leftBlock2Ref} className="will-change-transform">
              <AboutContentBlock
                tag="OUR COMMITMENT"
                title="With You at Every Stage"
                description="To support our partners at every stage, from pre-sales consultation and solution design to post-sales service and technical support, backed by pan-India reach, reliable logistics, in-house expertise and continuous training."
              />
            </div>
          </div>

          {/* Centre: Visual Focal Point (Chevron Particle Logo) */}
          <div
            ref={centerLogoRef}
            className="order-first flex justify-center py-1 lg:order-none will-change-transform"
          >
            <AboutParticleLogo className="h-[32vh] min-h-[240px] max-h-[400px] w-full max-w-[360px] sm:h-[36vh] lg:h-[42vh]" />
          </div>

          {/* Right Side: OUR STORY & OUR MISSION */}
          <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
            <div ref={rightBlock1Ref} className="will-change-transform">
              <AboutContentBlock
                tag="OUR STORY"
                title="17+ Years of Industry Expertise"
                description="Drawing on more than 17 years of industry expertise, we specialise in the distribution of world-class, premium audio-visual products and the delivery of advanced solutions for private cinemas, professional AV installations, and unique design-led environments."
              />
            </div>

            <div ref={rightBlock2Ref} className="will-change-transform">
              <AboutContentBlock
                tag="OUR MISSION"
                title="Redefining What’s Possible"
                description="To deliver the world’s most advanced technologies and redefine the AV landscape through innovation, technical expertise and uncompromising customer support."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
