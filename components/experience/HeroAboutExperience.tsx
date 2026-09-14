"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import HeroBackground from "@/components/hero/HeroBackground";
import HeroContent from "@/components/hero/HeroContent";
import Navbar from "@/components/hero/Navbar";
import ScrollIndicator from "@/components/hero/ScrollIndicator";
import AboutBackground from "@/components/about/AboutBackground";
import AboutContentBlock from "@/components/about/AboutContentBlock";
import UnifiedParticleFlow from "./UnifiedParticleFlow";

const LOGO_SCALE = 1.0;
const PARTICLE_SCALE = 2.5;

export default function HeroAboutExperience() {
  const viewportRef = useRef<HTMLDivElement>(null);

  // Background refs
  const heroBgRef = useRef<HTMLDivElement>(null);
  const aboutBgRef = useRef<HTMLDivElement>(null);

  // Content layers
  const heroContentRef = useRef<HTMLDivElement>(null);
  const aboutContentRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);

  // Timeline reference
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Screen tracking: 0 = Hero, 1 = About
  const [currentScreen, setCurrentScreen] = useState(0);
  const currentScreenRef = useRef(0);
  const animatingRef = useRef(false);
  const progressProxy = useRef({ value: 0 });

  // Realtime scroll progress passed to the unified canvas (0.0 to 1.0)
  const [scrollProgress, setScrollProgress] = useState(0);

  // Liquid glass mouse reflection
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, active: false });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!glassRef.current) return;
    const rect = glassRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  };

  const handlePointerLeave = () => {
    setMousePos((prev) => ({ ...prev, active: false }));
  };

  const goToScreen = useCallback((target: number) => {
    if (animatingRef.current || target === currentScreenRef.current) return;
    animatingRef.current = true;

    gsap.killTweensOf(progressProxy.current);
    gsap.to(progressProxy.current, {
      value: target,
      duration: 0.72,
      ease: "power2.inOut",
      onUpdate: () => {
        const p = progressProxy.current.value;
        setScrollProgress(p);
        tlRef.current?.progress(p);
      },
      onComplete: () => {
        progressProxy.current.value = target;
        setScrollProgress(target);
        tlRef.current?.progress(target);
        currentScreenRef.current = target;
        setCurrentScreen(target);
        setTimeout(() => {
          animatingRef.current = false;
        }, 220);
      },
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true });
      tlRef.current = tl;

      // 1. Hero text fade-out
      if (heroContentRef.current) {
        tl.to(
          heroContentRef.current,
          {
            opacity: 0,
            y: -35,
            pointerEvents: "none",
            ease: "power1.in",
            duration: 0.32,
          },
          0,
        );
      }

      // 2. Background crossfade: Hero filament -> About stipple matrix
      if (heroBgRef.current && aboutBgRef.current) {
        tl.to(
          heroBgRef.current,
          {
            opacity: 0,
            ease: "none",
            duration: 0.45,
          },
          0.12,
        );
        tl.to(
          aboutBgRef.current,
          {
            opacity: 1,
            ease: "none",
            duration: 0.45,
          },
          0.12,
        );
      }

      // 3. About Liquid Glass chassis entrance
      if (aboutContentRef.current && glassRef.current) {
        tl.fromTo(
          aboutContentRef.current,
          {
            opacity: 0,
            pointerEvents: "none",
          },
          {
            opacity: 1,
            pointerEvents: "auto",
            ease: "power2.out",
            duration: 0.45,
          },
          0.55,
        );

        tl.fromTo(
          glassRef.current,
          {
            scale: 0.94,
            y: 35,
          },
          {
            scale: 1,
            y: 0,
            ease: "power2.out",
            duration: 0.45,
          },
          0.55,
        );
      }

      tl.progress(0);
    }, viewport);

    // Hijack mouse wheel: any scroll triggers full instant transition to the next screen
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (animatingRef.current) return;
      if (Math.abs(e.deltaY) < 3) return;

      if (e.deltaY > 0 && currentScreenRef.current === 0) {
        goToScreen(1);
      } else if (e.deltaY < 0 && currentScreenRef.current === 1) {
        goToScreen(0);
      }
    };

    // Mobile / Trackpad touch gestures
    let touchStartY = 0;
    let touchStartX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (animatingRef.current || e.changedTouches.length === 0) return;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      const diffY = touchStartY - touchEndY;
      const diffX = touchStartX - touchEndX;

      if (Math.abs(diffY) > 25 && Math.abs(diffY) > Math.abs(diffX)) {
        if (diffY > 0 && currentScreenRef.current === 0) {
          goToScreen(1);
        } else if (diffY < 0 && currentScreenRef.current === 1) {
          goToScreen(0);
        }
      }
    };

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (animatingRef.current) return;
      if (["ArrowDown", "PageDown", " "].includes(e.key) && !e.shiftKey) {
        if (currentScreenRef.current === 0) {
          e.preventDefault();
          goToScreen(1);
        }
      } else if (["ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey)) {
        if (currentScreenRef.current === 1) {
          e.preventDefault();
          goToScreen(0);
        }
      }
    };

    // Global anchor link handler
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (href === "#about") {
        e.preventDefault();
        goToScreen(1);
      } else if (href === "#" || href === "#home") {
        e.preventDefault();
        goToScreen(0);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleAnchorClick);

    return () => {
      ctx.revert();
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleAnchorClick);
    };
  }, [goToScreen]);

  return (
    <div
      ref={viewportRef}
      className="relative h-svh w-full overflow-hidden bg-[#120a1e]"
    >
        {/* Background 1: Hero Filament loop artwork */}
        <div ref={heroBgRef} className="absolute inset-0 z-0">
          <HeroBackground active={currentScreen === 0 || scrollProgress < 0.95} />
        </div>

        {/* Background 2: About Stipple matrix artwork */}
        <div ref={aboutBgRef} className="absolute inset-0 z-0 opacity-0">
          <AboutBackground />
        </div>

        {/*
          THE SINGLE UNIFIED PARTICLE CANVAS:
          Starts at Hero position (left column), fluidly flows into the center of the About screen,
          morphs colors from lavender/white to electric blue/white, and scales up to LOGO_SCALE (1.0x) & PARTICLE_SCALE (2.50x).
        */}
        <UnifiedParticleFlow
          progress={scrollProgress}
          logoScale={LOGO_SCALE}
          particleScale={PARTICLE_SCALE}
        />

        {/* ============================================================ */}
        {/* LAYER 1: HERO SCREEN CONTENT                                 */}
        {/* ============================================================ */}
        <div
          ref={heroContentRef}
          className="absolute inset-0 z-30 flex flex-col"
        >
          <Navbar />

          <div className="relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-5 sm:px-8 lg:px-14">
            <div className="grid flex-1 grid-cols-1 items-center gap-y-7 pb-24 pt-[98px] sm:pt-[112px] lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-x-[7vw] lg:gap-y-0 lg:pb-24 lg:pt-[104px]">
              {/* Space reserved for hero particle mark on the left */}
              <div className="h-[29vh] min-h-[180px] w-full sm:h-[32vh] sm:min-h-[230px] md:h-[38vh] lg:h-[68vh] lg:min-h-[400px]" />

              {/* Right column: Typography & CTA */}
              <div className="pointer-events-auto lg:translate-x-[max(-18.2vw,-262px)] lg:translate-y-[24px]">
                <HeroContent />
              </div>
            </div>
          </div>

          <ScrollIndicator />
        </div>

        {/* ============================================================ */}
        {/* LAYER 2: ABOUT SCREEN CONTENT (LIQUID GLASS CHASSIS)         */}
        {/* ============================================================ */}
        <div
          id="about"
          ref={aboutContentRef}
          className="absolute inset-0 z-20 flex flex-col justify-center px-4 opacity-0 sm:px-6 lg:px-8 py-10"
        >
          <div className="mx-auto w-full max-w-[1400px]">
            {/* The Big Rectangular Liquid Glass Chassis */}
            <div
              ref={glassRef}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              style={{
                backdropFilter: "blur(20px) saturate(160%)",
                WebkitBackdropFilter: "blur(20px) saturate(160%)",
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
                className="pointer-events-none absolute -inset-[50%] opacity-40 mix-blend-screen"
              >
                <div className="animate-liquid-shimmer will-change-transform h-[200%] w-[200%] bg-[radial-gradient(ellipse_60%_50%_at_45%_45%,rgba(138,182,255,0.22)_0%,rgba(91,169,222,0.08)_35%,transparent_65%)]" />
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

              {/* Content Structure inside the Liquid Glass */}
              <div className="relative z-10">
                {/* Top Center: Compact Hierarchy Header */}
                <div className="mx-auto max-w-[760px] text-center">
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

                {/* Symmetrical 3-Column Layout framing the flowing central particle mark */}
                <div className="mt-8 grid grid-cols-1 items-center gap-y-8 lg:mt-6 lg:grid-cols-[1fr_minmax(320px,460px)_1fr] lg:gap-x-8 xl:gap-x-12">
                  {/* Left Side: OUR VISION & OUR COMMITMENT */}
                  <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
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

                  {/* Centre: Focal Frame for the Centered Particles */}
                  <div className="order-first flex h-[34vh] min-h-[260px] max-h-[480px] w-full items-center justify-center lg:order-none lg:h-[48vh]" />

                  {/* Right Side: OUR STORY & OUR MISSION */}
                  <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
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
        </div>
      </div>
  );
}
