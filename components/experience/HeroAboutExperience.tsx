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

const SCREEN2_LOGO_SCALE = 1.34;
const SCREEN2_PARTICLE_SCALE = 1.66;
const HERO_PARTICLE_SCALE = 1.9;
const SCREEN3_WAVE_ARC_LENGTH = 0.85;
const SCREEN3_WAVE_DENSITY = 0.8;

export default function HeroAboutExperience() {
  const viewportRef = useRef<HTMLDivElement>(null);

  // Background refs
  const heroBgRef = useRef<HTMLDivElement>(null);
  const aboutBgRef = useRef<HTMLDivElement>(null);

  // Content layers
  const heroContentRef = useRef<HTMLDivElement>(null);
  const aboutContentRef = useRef<HTMLDivElement>(null);
  const speakerContentRef = useRef<HTMLDivElement>(null);
  const speakerShakeRef = useRef<HTMLDivElement>(null);
  const particleCanvasWrapRef = useRef<HTMLDivElement>(null);

  // About Screen Text Block refs for sequential GSAP animation
  const headerRef = useRef<HTMLDivElement>(null);
  const leftBlock1Ref = useRef<HTMLDivElement>(null);
  const leftBlock2Ref = useRef<HTMLDivElement>(null);
  const rightBlock1Ref = useRef<HTMLDivElement>(null);
  const rightBlock2Ref = useRef<HTMLDivElement>(null);

  // Timeline reference
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Screen tracking: 0 = Hero, 1 = About, 2 = Speaker
  const [currentScreen, setCurrentScreen] = useState(0);
  const currentScreenRef = useRef(0);
  const animatingRef = useRef(false);
  const progressProxy = useRef({ value: 0 });

  // Realtime scroll progress passed to the unified canvas (0.0 to 2.0)
  const [scrollProgress, setScrollProgress] = useState(0);

  // Rate-limiting for tactile speaker shake and device vibration
  const lastShakeTime = useRef(0);

  const triggerVibrateAndShake = useCallback(() => {
    const now = Date.now();
    if (now - lastShakeTime.current < 110) return;
    lastShakeTime.current = now;

    // 1. Mobile Physical Vibration API (Haptic Feedback)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([45, 30, 60, 25, 50]);
      } catch {
        // unsupported or unpermitted
      }
    }

    // 2. Gamepad Rumble API (for laptops/PCs with game controller connected)
    if (typeof navigator !== "undefined" && "getGamepads" in navigator) {
      try {
        const gamepads = navigator.getGamepads();
        for (const gp of gamepads) {
          if (gp && gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === "function") {
            gp.vibrationActuator.playEffect("dual-rumble", {
              startDelay: 0,
              duration: 180,
              weakMagnitude: 0.8,
              strongMagnitude: 1.0,
            });
          }
        }
      } catch {
        // ignored
      }
    }

    // 3. Central Speaker Physical Acoustic Shake
    const speakerEl = speakerShakeRef.current;
    if (speakerEl) {
      gsap.killTweensOf(speakerEl);
      const shakeTl = gsap.timeline();
      shakeTl
        .to(speakerEl, {
          x: () => (Math.random() - 0.5) * 15,
          y: () => (Math.random() - 0.5) * 11,
          rotation: () => (Math.random() - 0.5) * 3.4,
          scale: 1.045,
          duration: 0.045,
          ease: "power2.out",
        })
        .to(speakerEl, {
          x: () => (Math.random() - 0.5) * 11,
          y: () => (Math.random() - 0.5) * 9,
          rotation: () => (Math.random() - 0.5) * -2.6,
          scale: 0.98,
          duration: 0.045,
          ease: "power1.inOut",
        })
        .to(speakerEl, {
          x: () => (Math.random() - 0.5) * 6,
          y: () => (Math.random() - 0.5) * 5,
          rotation: () => (Math.random() - 0.5) * 1.5,
          scale: 1.015,
          duration: 0.05,
          ease: "power1.inOut",
        })
        .to(speakerEl, {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1.0,
          duration: 0.22,
          ease: "elastic.out(1.1, 0.35)",
        });
    }

    // 4. Laptop Screen / Viewport Bass Rumble Shake
    const vp = viewportRef.current;
    if (vp) {
      gsap.killTweensOf(vp);
      gsap.timeline()
        .to(vp, {
          x: () => (Math.random() - 0.5) * 4.5,
          y: () => (Math.random() - 0.5) * 4.5,
          duration: 0.04,
          ease: "power1.inOut",
        })
        .to(vp, {
          x: () => (Math.random() - 0.5) * 2.5,
          y: () => (Math.random() - 0.5) * 2.5,
          duration: 0.04,
          ease: "power1.inOut",
        })
        .to(vp, {
          x: 0,
          y: 0,
          duration: 0.12,
          ease: "power2.out",
        });
    }
  }, []);

  // Screen 3 sequential spec points refs
  const spec1Ref = useRef<HTMLDivElement>(null);
  const spec2Ref = useRef<HTMLDivElement>(null);
  const spec3Ref = useRef<HTMLDivElement>(null);
  const spec4Ref = useRef<HTMLDivElement>(null);
  const specCtaRef = useRef<HTMLDivElement>(null);

  const [revealedSpecs, setRevealedSpecs] = useState(0);
  const revealedSpecsRef = useRef(0);
  const lastScrollStepTime = useRef(0);

  const animateSpecItem = useCallback((index: number, show: boolean) => {
    const specEls = [spec1Ref.current, spec2Ref.current, spec3Ref.current, spec4Ref.current];
    const el = specEls[index];
    if (!el) return;
    gsap.killTweensOf(el);
    if (show) {
      gsap.fromTo(
        el,
        {
          opacity: 0,
          y: 28,
          scale: 0.94,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.48,
          ease: "back.out(1.5)",
          pointerEvents: "auto",
        }
      );
    } else {
      gsap.to(el, {
        opacity: 0,
        y: 20,
        scale: 0.95,
        duration: 0.28,
        ease: "power2.in",
        pointerEvents: "none",
      });
    }
  }, []);

  const handleSpeakerClick = useCallback(() => {
    triggerVibrateAndShake();
    if (revealedSpecsRef.current < 4) {
      const nextIndex = revealedSpecsRef.current;
      revealedSpecsRef.current = nextIndex + 1;
      setRevealedSpecs(nextIndex + 1);
      animateSpecItem(nextIndex, true);
    }
  }, [triggerVibrateAndShake, animateSpecItem]);

  // Sync CTA visibility when all 4 specs are revealed
  useEffect(() => {
    if (!specCtaRef.current) return;
    gsap.killTweensOf(specCtaRef.current);
    if (revealedSpecs >= 4) {
      gsap.fromTo(
        specCtaRef.current,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          delay: 0.15,
          ease: "power2.out",
          pointerEvents: "auto",
        }
      );
    } else {
      gsap.to(specCtaRef.current, {
        opacity: 0,
        y: 14,
        duration: 0.25,
        ease: "power2.in",
        pointerEvents: "none",
      });
    }
  }, [revealedSpecs]);

  const goToScreen = useCallback((target: number) => {
    if (animatingRef.current || target === currentScreenRef.current) return;
    animatingRef.current = true;

    // Reset spec items when navigating away from Screen 3
    if (target < 2) {
      revealedSpecsRef.current = 0;
      setRevealedSpecs(0);
      const specEls = [spec1Ref.current, spec2Ref.current, spec3Ref.current, spec4Ref.current, specCtaRef.current];
      specEls.forEach((el) => {
        if (el) {
          gsap.killTweensOf(el);
          gsap.set(el, { opacity: 0, y: 28, scale: 0.94, pointerEvents: "none" });
        }
      });
    }

    const diff = Math.abs(target - currentScreenRef.current);
    const animDuration = diff > 1 ? 0.95 : 0.72;

    gsap.killTweensOf(progressProxy.current);
    gsap.to(progressProxy.current, {
      value: target,
      duration: animDuration,
      ease: "power2.inOut",
      onUpdate: () => {
        const p = progressProxy.current.value;
        setScrollProgress(p);
        tlRef.current?.time(p);
      },
      onComplete: () => {
        progressProxy.current.value = target;
        setScrollProgress(target);
        tlRef.current?.time(target);
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

      // ============================================================
      // SCREEN 2 -> SCREEN 3 (Time 1.0 to 2.0)
      // ============================================================
      // 7. Screen 2 about content container fades and moves out
      if (aboutContentRef.current) {
        tl.to(
          aboutContentRef.current,
          {
            opacity: 0,
            y: -35,
            pointerEvents: "none",
            ease: "power1.in",
            duration: 0.32,
          },
          1.0,
        );
      }

      // 8. Screen 3 speaker and flagship presentation entrance
      if (speakerContentRef.current) {
        tl.fromTo(
          speakerContentRef.current,
          {
            opacity: 0,
            y: 35,
            pointerEvents: "none",
          },
          {
            opacity: 1,
            y: 0,
            pointerEvents: "auto",
            ease: "power2.out",
            duration: 0.48,
          },
          1.32,
        );
      }

      // Ensure timeline total duration is exactly 2.0
      tl.set({}, {}, 2.0);

      tl.time(0);
    }, viewport);

    // Hijack mouse wheel: any scroll triggers full instant transition between screens
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 3) return;

      // On Screen 3: step through the 4 feature spec points one by one
      if (currentScreenRef.current === 2) {
        const now = Date.now();
        if (e.deltaY > 0) {
          // Scroll down
          triggerVibrateAndShake();
          if (revealedSpecsRef.current < 4) {
            if (now - lastScrollStepTime.current > 240) {
              lastScrollStepTime.current = now;
              const nextIndex = revealedSpecsRef.current;
              revealedSpecsRef.current = nextIndex + 1;
              setRevealedSpecs(nextIndex + 1);
              animateSpecItem(nextIndex, true);
            }
          }
          return;
        } else if (e.deltaY < 0) {
          // Scroll up
          if (revealedSpecsRef.current > 0) {
            triggerVibrateAndShake();
            if (now - lastScrollStepTime.current > 240) {
              lastScrollStepTime.current = now;
              const prevIndex = revealedSpecsRef.current - 1;
              revealedSpecsRef.current = prevIndex;
              setRevealedSpecs(prevIndex);
              animateSpecItem(prevIndex, false);
            }
            return;
          } else {
            // At 0 points, scroll up returns to Screen 2
            if (!animatingRef.current) {
              goToScreen(1);
            }
            return;
          }
        }
      }

      if (animatingRef.current) return;

      if (e.deltaY > 0) {
        if (currentScreenRef.current === 0) goToScreen(1);
        else if (currentScreenRef.current === 1) {
          goToScreen(2);
          setTimeout(triggerVibrateAndShake, 520);
        }
      } else if (e.deltaY < 0) {
        if (currentScreenRef.current === 1) goToScreen(0);
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
      if (currentScreenRef.current === 2) {
        triggerVibrateAndShake();
      }
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
        if (currentScreenRef.current === 2) {
          const now = Date.now();
          if (diffY > 0) {
            // Swipe up (scroll down)
            triggerVibrateAndShake();
            if (revealedSpecsRef.current < 4) {
              if (now - lastScrollStepTime.current > 200) {
                lastScrollStepTime.current = now;
                const nextIndex = revealedSpecsRef.current;
                revealedSpecsRef.current = nextIndex + 1;
                setRevealedSpecs(nextIndex + 1);
                animateSpecItem(nextIndex, true);
              }
              return;
            }
            return;
          } else if (diffY < 0) {
            // Swipe down (scroll up)
            if (revealedSpecsRef.current > 0) {
              triggerVibrateAndShake();
              if (now - lastScrollStepTime.current > 200) {
                lastScrollStepTime.current = now;
                const prevIndex = revealedSpecsRef.current - 1;
                revealedSpecsRef.current = prevIndex;
                setRevealedSpecs(prevIndex);
                animateSpecItem(prevIndex, false);
              }
              return;
            } else {
              goToScreen(1);
              return;
            }
          }
        }

        if (diffY > 0) {
          if (currentScreenRef.current === 0) goToScreen(1);
          else if (currentScreenRef.current === 1) {
            goToScreen(2);
            setTimeout(triggerVibrateAndShake, 520);
          }
        } else if (diffY < 0) {
          if (currentScreenRef.current === 1) goToScreen(0);
        }
      }
    };

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentScreenRef.current === 2) {
        const now = Date.now();
        if (["ArrowDown", "PageDown", " "].includes(e.key) && !e.shiftKey) {
          e.preventDefault();
          triggerVibrateAndShake();
          if (revealedSpecsRef.current < 4) {
            if (now - lastScrollStepTime.current > 200) {
              lastScrollStepTime.current = now;
              const nextIndex = revealedSpecsRef.current;
              revealedSpecsRef.current = nextIndex + 1;
              setRevealedSpecs(nextIndex + 1);
              animateSpecItem(nextIndex, true);
            }
          }
          return;
        } else if (["ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey)) {
          e.preventDefault();
          if (revealedSpecsRef.current > 0) {
            triggerVibrateAndShake();
            if (now - lastScrollStepTime.current > 200) {
              lastScrollStepTime.current = now;
              const prevIndex = revealedSpecsRef.current - 1;
              revealedSpecsRef.current = prevIndex;
              setRevealedSpecs(prevIndex);
              animateSpecItem(prevIndex, false);
            }
            return;
          } else {
            if (!animatingRef.current) {
              goToScreen(1);
            }
            return;
          }
        }
      }

      if (animatingRef.current) return;
      if (["ArrowDown", "PageDown", " "].includes(e.key) && !e.shiftKey) {
        if (currentScreenRef.current === 0) {
          e.preventDefault();
          goToScreen(1);
        } else if (currentScreenRef.current === 1) {
          e.preventDefault();
          goToScreen(2);
          setTimeout(triggerVibrateAndShake, 520);
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
      if (href === "#speaker" || href === "#products") {
        e.preventDefault();
        goToScreen(2);
      } else if (href === "#about") {
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
          <AboutBackground active={currentScreen === 1 || currentScreen === 2 || scrollProgress > 0.4} />
        </div>

        {/*
          THE SINGLE UNIFIED PARTICLE CANVAS:
          Starts at Hero position (left column), fluidly flows into the center of the About screen,
          morphs colors from lavender/white to electric blue/white, and scales up to SCREEN2_LOGO_SCALE (1.34x) & SCREEN2_PARTICLE_SCALE (1.66x).
        */}
        <div ref={particleCanvasWrapRef} className="absolute inset-0 z-10 pointer-events-none">
          <UnifiedParticleFlow
            progress={scrollProgress}
            logoScale={SCREEN2_LOGO_SCALE}
            particleScale={SCREEN2_PARTICLE_SCALE}
            heroParticleScale={HERO_PARTICLE_SCALE}
            waveArcLength={SCREEN3_WAVE_ARC_LENGTH}
            waveDensity={SCREEN3_WAVE_DENSITY}
          />
        </div>

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
            {/* Top Center: Compact Hierarchy Header (Offset set to -52px) */}
            <div
              style={{
                transform: "translateY(-52px)",
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
              {/* Left Side: OUR VISION & OUR COMMITMENT (Left Aligned) */}
              <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
                <div ref={leftBlock1Ref} className="will-change-transform">
                  <AboutContentBlock
                    align="left"
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
                    align="left"
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

              {/* Right Side: OUR STORY & OUR MISSION (Right Aligned) */}
              <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
                <div ref={rightBlock1Ref} className="will-change-transform">
                  <AboutContentBlock
                    align="right"
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
                    align="right"
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
        {/* LAYER 3: SCREEN 3 - AIR-C8 SPEAKER SHOWCASE ON FERROFLUID    */}
        {/* ============================================================ */}
        <div
          id="speaker"
          ref={speakerContentRef}
          className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between px-4 opacity-0 sm:px-6 lg:px-8 py-5 sm:py-7"
        >
          {/* Top Center: Product Header Hierarchy */}
          <div className="mx-auto max-w-[800px] pt-1 sm:pt-2 text-center will-change-transform">
            <div className="inline-flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-[linear-gradient(90deg,transparent,rgba(138,182,255,0.85))]" />
              <span className="text-[11px] font-semibold tracking-[0.26em] text-fg-mute/90 uppercase sm:text-[11.5px]">
                OUR FLAGSHIP PRODUCT
              </span>
              <span className="h-px w-8 bg-[linear-gradient(90deg,rgba(138,182,255,0.85),transparent)]" />
            </div>

            <h2 className="mt-1 text-[clamp(2.4rem,4.2vw,3.8rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-fg drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]">
              AIR-C8
            </h2>

            <p className="mt-1 text-[10.5px] font-semibold tracking-[0.28em] text-fg-mute/85 uppercase sm:text-[11px]">
              PASSIVE INSTALLATION SPEAKER
            </p>

            <p className="mx-auto mt-2 max-w-[48ch] text-[clamp(0.84rem,0.94vw,0.96rem)] font-light leading-[1.52] text-fg-mute drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              Compact form. Powerful performance.
              <br className="hidden sm:inline" /> Engineered for exceptional sound in any space.
            </p>
          </div>

          {/* Centered Speaker Presentation (Framed by acoustic particle sound waves) */}
          <div className="relative flex flex-1 items-center justify-center py-1">
            <div
              className="relative flex items-center justify-center will-change-transform"
              style={{
                transform: "scale(1.2)",
              }}
            >
              <div
                ref={speakerShakeRef}
                className="cursor-pointer will-change-transform pointer-events-auto transition-transform duration-75 active:scale-95"
                onClick={handleSpeakerClick}
                title="Click or scroll to reveal features and feel acoustic rumble"
              >
                <img
                  src="/speaker.png"
                  alt="AIR-C8 Passive Installation Speaker"
                  className="h-[42vh] max-h-[440px] min-h-[250px] w-auto max-w-[78vw] object-contain drop-shadow-[0_24px_60px_rgba(0,0,0,0.95)] drop-shadow-[0_0_50px_rgba(138,182,255,0.20)] select-none pointer-events-none"
                  draggable={false}
                />
              </div>
            </div>
          </div>

          {/* Bottom Specifications (4 Columns with clean SVG icons, revealed one by one on scroll) */}
          <div className="mx-auto w-full max-w-[1360px] pb-1 sm:pb-2">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-2 sm:gap-x-8 sm:px-4 md:grid-cols-4 lg:gap-x-12">
              {/* Feature 1: Sound */}
              <div
                ref={spec1Ref}
                className="flex items-center gap-3 sm:gap-4 will-change-transform"
                style={{ opacity: 0, transform: "translateY(28px) scale(0.94)", pointerEvents: "none" }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center text-fg">
                  <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 11v2" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[11px] font-bold tracking-[0.10em] text-fg uppercase sm:text-[11.5px]">
                    RICH, HIGH-FIDELITY SOUND
                  </h4>
                  <p className="mt-0.5 text-[10.5px] font-light leading-[1.38] text-fg-mute sm:text-[11px]">
                    8&quot; long-excursion woofer with HF driver
                  </p>
                </div>
              </div>

              {/* Feature 2: Versatility */}
              <div
                ref={spec2Ref}
                className="flex items-center gap-3 sm:gap-4 will-change-transform"
                style={{ opacity: 0, transform: "translateY(28px) scale(0.94)", pointerEvents: "none" }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center text-fg">
                  <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <path d="m3.27 6.96 8.73 5.04 8.73-5.04M12 22.08V12" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[11px] font-bold tracking-[0.10em] text-fg uppercase sm:text-[11.5px]">
                    COMPACT &amp; VERSATILE
                  </h4>
                  <p className="mt-0.5 text-[10.5px] font-light leading-[1.38] text-fg-mute sm:text-[11px]">
                    Ideal for retail, entertainment, malls and club settings.
                  </p>
                </div>
              </div>

              {/* Feature 3: Composite Cabinet */}
              <div
                ref={spec3Ref}
                className="flex items-center gap-3 sm:gap-4 will-change-transform"
                style={{ opacity: 0, transform: "translateY(28px) scale(0.94)", pointerEvents: "none" }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center text-fg">
                  <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m2 7 10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[11px] font-bold tracking-[0.10em] text-fg uppercase sm:text-[11.5px]">
                    ADVANCED COMPOSITE CABINET
                  </h4>
                  <p className="mt-0.5 text-[10.5px] font-light leading-[1.38] text-fg-mute sm:text-[11px]">
                    Low distortion, reduced resonance, clearer sound.
                  </p>
                </div>
              </div>

              {/* Feature 4: Built to Last */}
              <div
                ref={spec4Ref}
                className="flex items-center gap-3 sm:gap-4 will-change-transform"
                style={{ opacity: 0, transform: "translateY(28px) scale(0.94)", pointerEvents: "none" }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center text-fg">
                  <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[11px] font-bold tracking-[0.10em] text-fg uppercase sm:text-[11.5px]">
                    BUILT TO LAST
                  </h4>
                  <p className="mt-0.5 text-[10.5px] font-light leading-[1.38] text-fg-mute sm:text-[11px]">
                    Weather-resistant with IP54 rating.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Link CTA */}
            <div
              ref={specCtaRef}
              className="mt-4 sm:mt-5 flex flex-col items-center justify-center gap-1.5 will-change-transform"
              style={{ opacity: 0, transform: "translateY(14px)", pointerEvents: "none" }}
            >
              <a
                href="#products"
                className="group flex flex-col items-center justify-center gap-1.5 transition-opacity duration-300 hover:opacity-85"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/5 text-fg-mute backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0.5">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold tracking-[0.24em] text-fg-mute/80 uppercase transition-colors group-hover:text-fg">
                  VIEW MORE PRODUCTS
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
  );
}
