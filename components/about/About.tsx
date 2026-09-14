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
  const glassRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const centerLogoRef = useRef<HTMLDivElement>(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0, active: false });

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!glassRef.current) return;
    const rect = glassRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setMousePos((prev) => ({ ...prev, active: false }));
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Liquid glass chassis entrance
      if (glassRef.current) {
        gsap.fromTo(
          glassRef.current,
          { opacity: 0, y: 35, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 78%",
              toggleActions: "play none none reverse",
            },
          },
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
        {/*
          THE BIG RECTANGULAR LIQUID GLASS CHASSIS
          Contains all the text and central particle logo.
          Translucent with multi-layer fluid refraction, specular edges,
          and interactive caustic glow, revealing the animated SVG background behind it.
        */}
        <div
          ref={glassRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={{
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(138, 182, 255, 0.03) 30%, rgba(12, 18, 34, 0.62) 60%, rgba(10, 15, 28, 0.72) 100%)",
          }}
          className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[42px] border border-white/20 p-6 sm:p-10 lg:p-12 xl:p-14 shadow-[0_32px_90px_-20px_rgba(0,0,0,0.85),0_0_60px_-15px_rgba(58,134,255,0.18)]"
        >
          {/* Liquid Top Rim & Inner Highlight */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_1.5px_1.5px_0_rgba(255,255,255,0.4),inset_0_-1px_1px_0_rgba(138,182,255,0.18),inset_0_0_40px_0_rgba(138,182,255,0.06)]"
          />

          {/* Ambient Liquid Shimmer / Flowing Caustic Wave Layer */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-[50%] opacity-45 mix-blend-color-dodge"
          >
            <div className="animate-liquid-shimmer h-[200%] w-[200%] bg-[radial-gradient(ellipse_60%_50%_at_45%_45%,rgba(138,182,255,0.22)_0%,rgba(91,169,222,0.08)_35%,transparent_65%)]" />
          </div>

          {/* Liquid Glass Fluid Refraction Waves */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(255,255,255,0.12)_0%,transparent_60%),radial-gradient(ellipse_60%_30%_at_50%_100%,rgba(138,182,255,0.08)_0%,transparent_60%)]"
          />

          {/* Interactive Mouse Caustic Highlight (Real Liquid Glare) */}
          <div
            aria-hidden="true"
            style={{
              background: mousePos.active
                ? `radial-gradient(circle 380px at ${mousePos.x}px ${mousePos.y}px, rgba(138, 182, 255, 0.16), rgba(255, 255, 255, 0.05) 35%, transparent 70%)`
                : "none",
              opacity: mousePos.active ? 1 : 0,
            }}
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          />

          {/* Liquid Specular Diagonal Sheen */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.07)_0%,rgba(138,182,255,0.02)_25%,transparent_48%,rgba(255,255,255,0.02)_100%)]"
          />

          {/* All Text and Central Visuals Inside the Glass */}
          <div className="relative z-10">
            {/* Top Center: Compact Hierarchy Header */}
            <div
              ref={headerRef}
              className="mx-auto max-w-[760px] text-center"
            >
              <div className="inline-flex items-center justify-center gap-2.5">
                <span className="h-px w-8 bg-[linear-gradient(90deg,transparent,rgba(138,182,255,0.85))]" />
                <span className="text-[11.5px] font-semibold tracking-[0.24em] text-fg-mute/95 uppercase sm:text-[12px]">
                  ABOUT AV NIRVANA
                </span>
                <span className="h-px w-8 bg-[linear-gradient(90deg,rgba(138,182,255,0.85),transparent)]" />
              </div>

              <h2 className="mt-2 text-[clamp(1.6rem,2.5vw,2.45rem)] font-bold leading-[1.15] tracking-[-0.035em] text-fg drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
                Experience. Expertise. A More Connected World.
              </h2>

              <p className="mx-auto mt-2.5 max-w-[54ch] text-[clamp(0.88rem,0.98vw,1.02rem)] font-light leading-[1.62] text-fg-mute drop-shadow-[0_1px_10px_rgba(0,0,0,0.8)]">
                For over 17 years, we’ve been at the forefront of audio-visual innovation, bringing
                the world’s finest technologies to India.
              </p>
            </div>

            {/* Symmetrical 3-Column Layout */}
            <div className="mt-8 grid grid-cols-1 items-center gap-y-8 lg:mt-6 lg:grid-cols-[1fr_minmax(280px,380px)_1fr] lg:gap-x-8 xl:gap-x-12">
              {/* Left Side: OUR VISION & OUR COMMITMENT */}
              <div
                ref={leftColRef}
                className="flex flex-col gap-6 sm:gap-8 lg:gap-10"
              >
                <AboutContentBlock
                  tag="OUR VISION"
                  title={
                    <>
                      A <span className="text-[#8AB6FF]">Trusted</span> Leader in AV
                    </>
                  }
                  description="To be India’s most trusted and influential AV distribution company for path-breaking and converging technologies across the AV space."
                />

                <AboutContentBlock
                  tag="OUR COMMITMENT"
                  title={
                    <>
                      With You at <span className="text-[#B9AEE0]">Every Stage</span>
                    </>
                  }
                  description="To support our partners at every stage, from pre-sales consultation and solution design to post-sales service and technical support, backed by pan-India reach, reliable logistics, in-house expertise and continuous training."
                />
              </div>

              {/* Centre: Visual Focal Point (Chevron Particle Logo) */}
              <div
                ref={centerLogoRef}
                className="order-first flex justify-center py-1 lg:order-none"
              >
                <AboutParticleLogo className="h-[32vh] min-h-[240px] max-h-[400px] w-full max-w-[360px] sm:h-[36vh] lg:h-[42vh]" />
              </div>

              {/* Right Side: OUR STORY & OUR MISSION */}
              <div
                ref={rightColRef}
                className="flex flex-col gap-6 sm:gap-8 lg:gap-10"
              >
                <AboutContentBlock
                  tag="OUR STORY"
                  title={
                    <>
                      <span className="text-[#8AB6FF]">17+ Years</span> of Industry Expertise
                    </>
                  }
                  description="Drawing on more than 17 years of industry expertise, we specialise in the distribution of world-class, premium audio-visual products and the delivery of advanced solutions for private cinemas, professional AV installations, and unique design-led environments."
                />

                <AboutContentBlock
                  tag="OUR MISSION"
                  title={
                    <>
                      Redefining <span className="text-[#B9AEE0]">What’s Possible</span>
                    </>
                  }
                  description="To deliver the world’s most advanced technologies and redefine the AV landscape through innovation, technical expertise and uncompromising customer support."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
