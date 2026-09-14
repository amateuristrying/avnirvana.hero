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

  // About Screen Text Block refs for sequential GSAP animation
  const headerRef = useRef<HTMLDivElement>(null);
  const leftBlock1Ref = useRef<HTMLDivElement>(null);
  const leftBlock2Ref = useRef<HTMLDivElement>(null);
  const rightBlock1Ref = useRef<HTMLDivElement>(null);
  const rightBlock2Ref = useRef<HTMLDivElement>(null);

  // Timeline reference
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Screen tracking: 0 = Hero, 1 = About
  const [currentScreen, setCurrentScreen] = useState(0);
  const currentScreenRef = useRef(0);
  const animatingRef = useRef(false);
  const progressProxy = useRef({ value: 0 });

  // Realtime scroll progress passed to the unified canvas (0.0 to 1.0)
  const [scrollProgress, setScrollProgress] = useState(0);

  // Top header Y-axis slider offset
  const [headerYOffset, setHeaderYOffset] = useState(0);

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
            duration: 0.28,
          },
          0,
        );
      }

      // 2. Background crossfade: Hero filament -> About Ferrofluid
      if (heroBgRef.current && aboutBgRef.current) {
        tl.to(
          heroBgRef.current,
          {
            opacity: 0,
            ease: "power1.inOut",
            duration: 0.36,
          },
          0.08,
        );
        tl.to(
          aboutBgRef.current,
          {
            opacity: 1,
            ease: "power1.inOut",
            duration: 0.36,
          },
          0.08,
        );
      }

      // 3. About layer container fade & pointer activation
      if (aboutContentRef.current) {
        tl.to(
          aboutContentRef.current,
          {
            opacity: 1,
            pointerEvents: "auto",
            duration: 0.1,
          },
          0.2,
        );
      }

      // 4. Header entrance
      if (headerRef.current) {
        tl.fromTo(
          headerRef.current,
          {
            opacity: 0,
            y: 24,
          },
          {
            opacity: 1,
            y: 0,
            ease: "power2.out",
            duration: 0.3,
          },
          0.25,
        );
      }

      // 5. First text on both sides animated transition (OUR VISION & OUR STORY)
      if (leftBlock1Ref.current) {
        tl.fromTo(
          leftBlock1Ref.current,
          {
            opacity: 0,
            y: 28,
            x: -16,
          },
          {
            opacity: 1,
            y: 0,
            x: 0,
            ease: "power2.out",
            duration: 0.3,
          },
          0.42,
        );
      }
      if (rightBlock1Ref.current) {
        tl.fromTo(
          rightBlock1Ref.current,
          {
            opacity: 0,
            y: 28,
            x: 16,
          },
          {
            opacity: 1,
            y: 0,
            x: 0,
            ease: "power2.out",
            duration: 0.3,
          },
          0.42,
        );
      }

      // 6. Second text on both sides animated transition (OUR COMMITMENT & OUR MISSION)
      if (leftBlock2Ref.current) {
        tl.fromTo(
          leftBlock2Ref.current,
          {
            opacity: 0,
            y: 28,
            x: -16,
          },
          {
            opacity: 1,
            y: 0,
            x: 0,
            ease: "power2.out",
            duration: 0.3,
          },
          0.66,
        );
      }
      if (rightBlock2Ref.current) {
        tl.fromTo(
          rightBlock2Ref.current,
          {
            opacity: 0,
            y: 28,
            x: 16,
          },
          {
            opacity: 1,
            y: 0,
            x: 0,
            ease: "power2.out",
            duration: 0.3,
          },
          0.66,
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
          <HeroBackground active={currentScreen === 0 || scrollProgress < 0.6} />
        </div>

        {/* Background 2: About Ferrofluid artwork */}
        <div ref={aboutBgRef} className="absolute inset-0 z-0 opacity-0">
          <AboutBackground active={currentScreen === 1 || scrollProgress > 0.4} />
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
        {/* LAYER 2: ABOUT SCREEN CONTENT (HOVERING OVER FERROFLUID)     */}
        {/* ============================================================ */}
        <div
          id="about"
          ref={aboutContentRef}
          className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-center px-4 opacity-0 sm:px-6 lg:px-8 py-10"
        >
          <div className="mx-auto w-full max-w-[1400px]">
            {/* Top Center: Compact Hierarchy Header (Controlled by Y-Axis Slider) */}
            <div
              style={{
                transform: `translateY(${headerYOffset}px)`,
                transition: "transform 0.05s ease-out",
              }}
              className="will-change-transform"
            >
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
            </div>

            {/* Symmetrical 3-Column Layout framing the flowing central particle mark */}
            <div className="mt-8 grid grid-cols-1 items-center gap-y-8 lg:mt-6 lg:grid-cols-[1fr_minmax(320px,460px)_1fr] lg:gap-x-8 xl:gap-x-12">
              {/* Left Side: OUR VISION & OUR COMMITMENT */}
              <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
                <div ref={leftBlock1Ref} className="will-change-transform">
                  <AboutContentBlock
                    tag="OUR VISION"
                    title={
                      <>
                        A <span className="text-[#8AB6FF]">Trusted</span> Leader in AV
                      </>
                    }
                    description="To be India’s most trusted and influential AV distribution company for path-breaking and converging technologies across the AV space."
                  />
                </div>

                <div ref={leftBlock2Ref} className="will-change-transform">
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
              </div>

              {/* Centre: Focal Frame for the Centered Particles */}
              <div className="order-first flex h-[34vh] min-h-[260px] max-h-[480px] w-full items-center justify-center lg:order-none lg:h-[48vh]" />

              {/* Right Side: OUR STORY & OUR MISSION */}
              <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
                <div ref={rightBlock1Ref} className="will-change-transform">
                  <AboutContentBlock
                    tag="OUR STORY"
                    title={
                      <>
                        <span className="text-[#8AB6FF]">17+ Years</span> of Industry Expertise
                      </>
                    }
                    description="Drawing on more than 17 years of industry expertise, we specialise in the distribution of world-class, premium audio-visual products and the delivery of advanced solutions for private cinemas, professional AV installations, and unique design-led environments."
                  />
                </div>

                <div ref={rightBlock2Ref} className="will-change-transform">
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

        {/* ============================================================ */}
        {/* FLOATING HEADER Y-AXIS CONTROL SLIDER                        */}
        {/* ============================================================ */}
        <div
          className={`fixed bottom-6 right-6 z-50 pointer-events-auto flex flex-col items-end gap-2 transition-all duration-300 ${
            scrollProgress > 0.2 || currentScreen === 1
              ? "opacity-100 translate-y-0"
              : "opacity-0 pointer-events-none translate-y-4"
          }`}
        >
          <div className="flex flex-col gap-2.5 rounded-2xl border border-white/20 bg-[#0c1222]/92 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] font-semibold tracking-wider text-fg-mute uppercase">
                Header Y-Axis Slider
              </span>
              <span className="font-mono text-[13px] font-bold text-[#8AB6FF]">
                {headerYOffset > 0 ? `+${headerYOffset}` : headerYOffset}px
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-fg-mute/70">-200px</span>
              <input
                type="range"
                min="-200"
                max="200"
                step="1"
                value={headerYOffset}
                onChange={(e) => setHeaderYOffset(Number(e.target.value))}
                className="h-1.5 w-44 sm:w-56 cursor-pointer appearance-none rounded-lg bg-white/20 accent-[#8AB6FF]"
              />
              <span className="text-[10px] font-mono text-fg-mute/70">+200px</span>

              <button
                type="button"
                onClick={() => setHeaderYOffset(0)}
                className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-fg hover:bg-white/20 transition active:scale-95"
              >
                Reset
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[9.5px] uppercase tracking-wider text-fg-mute/60">Presets:</span>
              <div className="flex items-center gap-1.5">
                {[-80, -40, -20, 0, 20, 40, 80].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setHeaderYOffset(val)}
                    className={`rounded px-1.5 py-0.5 text-[9.5px] font-mono transition ${
                      headerYOffset === val
                        ? "bg-[#8AB6FF] text-[#0c1222] font-bold shadow-[0_0_10px_rgba(138,182,255,0.5)]"
                        : "bg-white/5 text-fg-mute hover:bg-white/15"
                    }`}
                  >
                    {val > 0 ? `+${val}` : val}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
