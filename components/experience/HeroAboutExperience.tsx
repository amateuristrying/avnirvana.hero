"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import HeroBackground from "@/components/hero/HeroBackground";
import HeroContent from "@/components/hero/HeroContent";
import Navbar from "@/components/hero/Navbar";
import ScrollIndicator from "@/components/hero/ScrollIndicator";
import AboutBackground from "@/components/about/AboutBackground";
import AboutContentBlock from "@/components/about/AboutContentBlock";
import BrandsScreen from "@/components/brands/BrandsScreen";
import SpacesScreen from "@/components/spaces/SpacesScreen";
import ContactScreen from "@/components/contact/ContactScreen";
import BandTransition, { type BandTransitionHandle } from "@/components/transitions/BandTransition";
import UnifiedParticleFlow from "./UnifiedParticleFlow";

const SCREEN2_LOGO_SCALE = 1.34;
const SCREEN2_PARTICLE_SCALE = 1.66;
const HERO_PARTICLE_SCALE = 1.9;

// Hero text block offset & scale (dialled in with the tuning sliders)
const HERO_TEXT = { x: 164, y: -18, scale: 1.03 };

// Experiment: use the Screen 2 ferrofluid background on the Hero too (false = original filament artwork)
const HERO_USE_FERROFLUID = true;
const SCREEN3_WAVE_ARC_LENGTH = 0.85;
const SCREEN3_WAVE_DENSITY = 0.8;

interface ProductSpec {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

interface Product {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imageScale: number;
  imageDropShadow: string;
  accentGlow: string;
  ctaText: string;
  ctaHref: string;
  specs: ProductSpec[];
}

const PRODUCTS: Product[] = [
  {
    id: "air-c8",
    badge: "OUR FLAGSHIP PRODUCT",
    title: "AIR-C8",
    subtitle: "PASSIVE INSTALLATION SPEAKER",
    description: "Compact form. Powerful performance.\nEngineered for exceptional sound in any space.",
    imageSrc: "/speaker.png",
    imageAlt: "AIR-C8 Passive Installation Speaker",
    imageScale: 1.2,
    imageDropShadow: "drop-shadow-[0_24px_60px_rgba(0,0,0,0.95)] drop-shadow-[0_0_50px_rgba(138,182,255,0.20)]",
    accentGlow: "rgba(138,182,255,0.85)",
    ctaText: "BRANDS WE'VE WORKED WITH",
    ctaHref: "#brands",
    specs: [
      {
        icon: (
          <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 11v2" />
          </svg>
        ),
        title: "RICH, HIGH-FIDELITY SOUND",
        desc: '8" long-excursion woofer with HF driver',
      },
      {
        icon: (
          <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <path d="m3.27 6.96 8.73 5.04 8.73-5.04M12 22.08V12" />
          </svg>
        ),
        title: "COMPACT & VERSATILE",
        desc: "Ideal for retail, entertainment, malls and club settings.",
      },
      {
        icon: (
          <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m2 7 10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5" />
          </svg>
        ),
        title: "ADVANCED COMPOSITE CABINET",
        desc: "Low distortion, reduced resonance, clearer sound.",
      },
      {
        icon: (
          <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        ),
        title: "BUILT TO LAST",
        desc: "Weather-resistant with IP54 rating.",
      },
    ],
  },
  {
    id: "squareroot-6-5",
    badge: "OUR OUTDOOR SOLUTION",
    title: "SQUAREROOT 6.5",
    subtitle: "OMNIDIRECTIONAL PLANTER SPEAKER",
    description: "Blends naturally. Sounds exceptionally.\nPremium outdoor audio, designed for any space.",
    imageSrc: "/outdoor-speaker.png",
    imageAlt: "SQUAREROOT 6.5 Omnidirectional Planter Speaker",
    imageScale: 1.25,
    imageDropShadow: "drop-shadow-[0_24px_60px_rgba(0,0,0,0.95)] drop-shadow-[0_0_55px_rgba(34,197,94,0.30)]",
    accentGlow: "rgba(34,197,94,0.85)",
    ctaText: "SOUND FOR A BRIGHTER TOMORROW",
    ctaHref: "#brands",
    specs: [
      {
        icon: (
          <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 11v2" />
          </svg>
        ),
        title: "360° DYNAMIC AUDIO",
        desc: 'Coaxial 6.5" woofer with 0.75" dome tweeter for omnidirectional sound.',
      },
      {
        icon: (
          <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22v-9" />
            <path d="M9 8c0-3.5 3-5 3-5s3 1.5 3 5a3 3 0 0 1-6 0z" />
            <path d="M12 13a6 6 0 0 0 6-6c-2 0-4 1-5 2.5" />
            <path d="M12 15a6 6 0 0 1-6-6c2 0 4 1 5 2.5" />
          </svg>
        ),
        title: "BLENDS WITH NATURE",
        desc: 'Functional 20" square planter with drainage holes.',
      },
      {
        icon: (
          <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
        title: "WEATHER-RESISTANT",
        desc: "UV-stable, durable polyethylene built for the outdoors.",
      },
      {
        icon: (
          <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <path d="m3.27 6.96 8.73 5.04 8.73-5.04M12 22.08V12" />
          </svg>
        ),
        title: "STYLISH & VERSATILE",
        desc: "Available in Granite Grey or Terra Cotta.",
      },
    ],
  },
  {
    id: "pl-30",
    badge: "OUR SIGNATURE PRODUCT",
    title: "PL 30",
    subtitle: "PENDANT CEILING LOUDSPEAKER",
    description: "Designed for high-ceiling spaces where exceptional sound meets clean architectural aesthetics.",
    imageSrc: "/pendant_speakers.png",
    imageAlt: "PL 30 Pendant Ceiling Loudspeaker",
    imageScale: 1.33,
    imageDropShadow: "drop-shadow-[0_24px_60px_rgba(0,0,0,0.95)] drop-shadow-[0_0_55px_rgba(255,255,255,0.20)]",
    accentGlow: "rgba(255,255,255,0.85)",
    ctaText: "SOUND FOR A BRIGHTER TOMORROW",
    ctaHref: "#brands",
    specs: [
      {
        icon: (
          <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        ),
        title: "POWERFUL & CLEAR",
        desc: "35W coaxial loudspeaker with 130° conical dispersion for broad, consistent coverage.",
      },
      {
        icon: (
          <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v10" />
            <path d="M18 12a6 6 0 1 1-12 0" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ),
        title: "FLEXIBLE INSTALLATION",
        desc: "Integrated 100V line transformer with an adjustable 300 cm steel suspension cable.",
      },
      {
        icon: (
          <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
        title: "SLEEK & DURABLE",
        desc: "Durable ABS plastic housing with a steel grille, built for dependable long-term installation.",
      },
      {
        icon: (
          <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <path d="m3.27 6.96 8.73 5.04 8.73-5.04M12 22.08V12" />
          </svg>
        ),
        title: "BUILT FOR PERFORMANCE",
        desc: "Robust ABS enclosure with precision steel grille.",
      },
    ],
  },
  {
    id: "air-s26",
    badge: "AIR SERIES",
    title: "AIR-S26",
    subtitle: "PASSIVE INSTALLATION SUBWOOFER",
    description: "Compact form. Powerful low-frequency performance.\nEngineered for seamless integration in any space.",
    imageSrc: "/subwoofer.png",
    imageAlt: "AIR-S26 Passive Installation Subwoofer",
    imageScale: 1.15,
    imageDropShadow: "drop-shadow-[0_28px_60px_rgba(0,0,0,0.95)] drop-shadow-[0_0_55px_rgba(56,189,248,0.25)]",
    accentGlow: "rgba(56,189,248,0.85)",
    ctaText: "ENGINEERED FOR BETTER SPACES",
    ctaHref: "#brands",
    specs: [
      {
        icon: (
          <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M8 12h.01M10 9v6M12 7v10M14 9v6M16 12h.01" />
          </svg>
        ),
        title: "DEEP & CONTROLLED BASS",
        desc: '6.5" high excursion woofers for smooth, low-frequency reinforcement.',
      },
      {
        icon: (
          <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
        ),
        title: "FLEXIBLE INSTALLATION",
        desc: "Wall or ceiling mounting options for easy and versatile setup.",
      },
      {
        icon: (
          <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
            <circle cx="12" cy="7" r=".75" fill="currentColor" />
            <circle cx="7.5" cy="15" r=".75" fill="currentColor" />
            <circle cx="16.5" cy="15" r=".75" fill="currentColor" />
          </svg>
        ),
        title: "COMPACT & STYLISH",
        desc: "Interior-friendly design that blends seamlessly into any space.",
      },
      {
        icon: (
          <svg className="h-6 w-6 sm:h-7 sm:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        ),
        title: "RELIABLE PERFORMANCE",
        desc: "Optimised vent design for clear, distortion-free bass.",
      },
    ],
  },
];

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

  // Product carousel tracking on Screen 3: 0 = AIR-C8, 1 = SQUAREROOT 6.5, 2 = PL 30, 3 = AIR-S26
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const currentProductIndexRef = useRef(0);
  const switchingProductRef = useRef(false);

  // Product 4 (AIR-S26) Flow Thickness locked to 4.2x, Flow Speed locked to 0.10x
  const p4FlowThickness = 4.2;
  const p4FlowSpeed = 0.1;

  const productHeaderRef = useRef<HTMLDivElement>(null);
  const speakerImageWrapRef = useRef<HTMLDivElement>(null);

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

  // Screen 3 → Screen 4 (Brands) exit gauge: the arrow ball fills as the user keeps scrolling
  const exitFillElRef = useRef<HTMLDivElement>(null);
  const exitRingRef = useRef<SVGCircleElement>(null);
  const exitBallRef = useRef<HTMLDivElement>(null);
  // Set the moment the gauge is full: locks input so extra scroll events can't delay the transition
  const exitCommittedRef = useRef(false);
  // Nav jump straight to Domains: Brands sweeps in underneath, Spaces follows on top
  const pendingDomainsRef = useRef(false);
  const exitFillProxy = useRef({ value: 0 });
  const exitFillTarget = useRef(0);
  const exitDecayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const brandsTransitioningRef = useRef(false);
  const [particleExplode, setParticleExplode] = useState(0);
  const explodeProxy = useRef({ value: 0 });
  const [brandsActive, setBrandsActive] = useState(false);
  const [spacesActive, setSpacesActive] = useState(false);
  const [contactActive, setContactActive] = useState(false);
  // Brands/Domains jump to their end state instead of animating (only while the band cover hides the stage)
  const [overlayInstant, setOverlayInstant] = useState(false);
  const bandRef = useRef<BandTransitionHandle>(null);
  // Contact actions are defined after goToScreen; navigateOverlay reaches them through this ref
  const contactApiRef = useRef({ enter: () => {}, exit: () => {} });
  // Guards against trackpad inertia skipping straight through overlay screens
  const overlayEnteredAt = useRef(0);

  // Screen 2 progressive text reveal state (left first, then right on scroll)
  const [screen2RightRevealed, setScreen2RightRevealed] = useState(false);
  const screen2RightRevealedRef = useRef(false);
  const [screen2LeftRevealed, setScreen2LeftRevealed] = useState(false);
  const screen2LeftRevealedRef = useRef(false);

  const animateLeftText = useCallback((show: boolean) => {
    const el1 = leftBlock1Ref.current;
    const el2 = leftBlock2Ref.current;
    if (!el1 || !el2) return;

    gsap.killTweensOf([el1, el2]);

    if (show) {
      gsap.fromTo(
        el1,
        { opacity: 0, x: -32, y: 18, scale: 0.94 },
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.58,
          delay: 0.22,
          ease: "back.out(1.4)",
          pointerEvents: "auto",
        }
      );
      gsap.fromTo(
        el2,
        { opacity: 0, x: -32, y: 18, scale: 0.94 },
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.58,
          delay: 0.38,
          ease: "back.out(1.4)",
          pointerEvents: "auto",
        }
      );
    } else {
      gsap.to([el2, el1], {
        opacity: 0,
        x: -24,
        y: 12,
        scale: 0.95,
        duration: 0.28,
        stagger: 0.08,
        ease: "power2.in",
        pointerEvents: "none",
      });
    }
  }, []);

  const animateRightText = useCallback((show: boolean) => {
    const el1 = rightBlock1Ref.current;
    const el2 = rightBlock2Ref.current;
    if (!el1 || !el2) return;

    gsap.killTweensOf([el1, el2]);

    if (show) {
      gsap.fromTo(
        el1,
        { opacity: 0, x: 32, y: 18, scale: 0.94 },
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.58,
          delay: 0.06,
          ease: "back.out(1.4)",
          pointerEvents: "auto",
        }
      );
      gsap.fromTo(
        el2,
        { opacity: 0, x: 32, y: 18, scale: 0.94 },
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.58,
          delay: 0.22,
          ease: "back.out(1.4)",
          pointerEvents: "auto",
        }
      );
    } else {
      gsap.to([el2, el1], {
        opacity: 0,
        x: 24,
        y: 12,
        scale: 0.95,
        duration: 0.28,
        stagger: 0.08,
        ease: "power2.in",
        pointerEvents: "none",
      });
    }
  }, []);

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

  const switchProduct = useCallback(
    (direction: "next" | "prev") => {
      if (switchingProductRef.current) return;
      switchingProductRef.current = true;
      triggerVibrateAndShake();

      const wasRevealed = revealedSpecsRef.current;
      const shouldShowSpecs = wasRevealed > 0;
      const dir = direction === "next" ? 1 : -1;

      const headerEl = productHeaderRef.current;
      const speakerWrapEl = speakerImageWrapRef.current;
      const allSpecCards = [spec1Ref.current, spec2Ref.current, spec3Ref.current, spec4Ref.current];
      const ctaEl = specCtaRef.current;

      const targets = [headerEl, speakerWrapEl].filter(Boolean);

      // 1. Animate out current product
      if (shouldShowSpecs) {
        // Gracefully slide and fade out currently visible spec options
        const visibleCards = allSpecCards.slice(0, wasRevealed).filter(Boolean);
        gsap.to(visibleCards, {
          opacity: 0,
          x: -dir * 30,
          y: 12,
          scale: 0.94,
          duration: 0.24,
          stagger: 0.03,
          ease: "power2.in",
        });
        if (ctaEl && wasRevealed >= 4) {
          gsap.to(ctaEl, {
            opacity: 0,
            y: 10,
            duration: 0.2,
            ease: "power2.in",
          });
        }
      } else {
        // Ensure specs remain hidden
        allSpecCards.forEach((el) => {
          if (el) {
            gsap.killTweensOf(el);
            gsap.set(el, { opacity: 0, y: 28, scale: 0.94, pointerEvents: "none" });
          }
        });
        if (ctaEl) {
          gsap.killTweensOf(ctaEl);
          gsap.set(ctaEl, { opacity: 0, y: 14, pointerEvents: "none" });
        }
      }

      gsap.to(targets, {
        opacity: 0,
        x: -dir * 38,
        scale: 0.92,
        duration: 0.26,
        ease: "power2.in",
        onComplete: () => {
          const nextIdx =
            direction === "next"
              ? (currentProductIndexRef.current + 1) % PRODUCTS.length
              : (currentProductIndexRef.current - 1 + PRODUCTS.length) % PRODUCTS.length;
          currentProductIndexRef.current = nextIdx;
          setCurrentProductIndex(nextIdx);

          if (shouldShowSpecs) {
            revealedSpecsRef.current = 4;
            setRevealedSpecs(4);
          } else {
            revealedSpecsRef.current = 0;
            setRevealedSpecs(0);
          }

          // 2. Animate in new product header & speaker
          gsap.fromTo(
            targets,
            { opacity: 0, x: dir * 38, scale: 0.92 },
            {
              opacity: 1,
              x: 0,
              scale: 1,
              duration: 0.42,
              ease: "power2.out",
              onComplete: () => {
                switchingProductRef.current = false;
                triggerVibrateAndShake();
              },
            }
          );

          // 3. If bottom options have already come up, gracefully animate in the new product's options with GSAP!
          if (shouldShowSpecs) {
            requestAnimationFrame(() => {
              const newCards = [spec1Ref.current, spec2Ref.current, spec3Ref.current, spec4Ref.current].filter(Boolean);
              gsap.killTweensOf(newCards);
              gsap.fromTo(
                newCards,
                {
                  opacity: 0,
                  x: dir * 30,
                  y: 22,
                  scale: 0.93,
                },
                {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  scale: 1,
                  duration: 0.52,
                  stagger: 0.08,
                  delay: 0.08,
                  ease: "back.out(1.4)",
                  pointerEvents: "auto",
                }
              );

              if (specCtaRef.current) {
                gsap.killTweensOf(specCtaRef.current);
                gsap.fromTo(
                  specCtaRef.current,
                  { opacity: 0, y: 14 },
                  {
                    opacity: 1,
                    y: 0,
                    duration: 0.42,
                    delay: 0.42,
                    ease: "power2.out",
                    pointerEvents: "auto",
                  }
                );
              }
            });
          }
        },
      });
    },
    [triggerVibrateAndShake]
  );

  const handlePrevProduct = useCallback(() => {
    switchProduct("prev");
  }, [switchProduct]);

  const handleNextProduct = useCallback(() => {
    switchProduct("next");
  }, [switchProduct]);

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

  const applyExitFill = useCallback((v: number) => {
    if (exitFillElRef.current) exitFillElRef.current.style.transform = `scaleY(${v})`;
    if (exitRingRef.current) exitRingRef.current.style.strokeDashoffset = String(100 - v * 100);
    // Particles start to tremble apart while the gauge fills
    if (!brandsTransitioningRef.current) {
      explodeProxy.current.value = Math.pow(v, 1.6) * 0.32;
      setParticleExplode(explodeProxy.current.value);
    }
  }, []);

  const tweenExitFill = useCallback(
    (to: number, duration: number, onComplete?: () => void) => {
      exitFillTarget.current = to;
      gsap.killTweensOf(exitFillProxy.current);
      gsap.to(exitFillProxy.current, {
        value: to,
        duration,
        ease: "power2.out",
        onUpdate: () => applyExitFill(exitFillProxy.current.value),
        onComplete,
      });
    },
    [applyExitFill]
  );

  const resetExitFill = useCallback(() => {
    if (brandsTransitioningRef.current || exitCommittedRef.current) return;
    if (exitDecayTimer.current) clearTimeout(exitDecayTimer.current);
    if (exitFillTarget.current > 0) tweenExitFill(0, 0.45);
  }, [tweenExitFill]);

  const enterBrands = useCallback(() => {
    if (brandsTransitioningRef.current) return;
    brandsTransitioningRef.current = true;
    if (exitDecayTimer.current) clearTimeout(exitDecayTimer.current);
    triggerVibrateAndShake();

    // Particles burst outward and vanish as the white strips sweep in
    gsap.killTweensOf(explodeProxy.current);
    gsap.to(explodeProxy.current, {
      value: 1,
      duration: 0.8,
      ease: "power3.out",
      onUpdate: () => setParticleExplode(explodeProxy.current.value),
    });
    setBrandsActive(true);
  }, [triggerVibrateAndShake]);

  const handleBrandsEntered = useCallback(() => {
    if (currentScreenRef.current !== 4) {
      currentScreenRef.current = 3;
      setCurrentScreen(3);
    }
    overlayEnteredAt.current = Date.now();
    // Stay locked while a nav jump to Domains is still sweeping in
    if (!pendingDomainsRef.current) brandsTransitioningRef.current = false;
  }, []);

  // Screen 4 (Brands) → Screen 5 (Spaces carousel)
  const enterSpaces = useCallback(() => {
    if (brandsTransitioningRef.current || currentScreenRef.current !== 3) return;
    brandsTransitioningRef.current = true;
    setSpacesActive(true);
  }, []);

  const handleSpacesEntered = useCallback(() => {
    pendingDomainsRef.current = false;
    currentScreenRef.current = 4;
    setCurrentScreen(4);
    overlayEnteredAt.current = Date.now();
    brandsTransitioningRef.current = false;
  }, []);

  const exitSpaces = useCallback(() => {
    if (brandsTransitioningRef.current || currentScreenRef.current !== 4) return;
    brandsTransitioningRef.current = true;
    setSpacesActive(false);
  }, []);

  const handleSpacesExited = useCallback(() => {
    if (currentScreenRef.current >= 4) {
      currentScreenRef.current = 3;
      setCurrentScreen(3);
    }
    overlayEnteredAt.current = Date.now();
    brandsTransitioningRef.current = false;
  }, []);

  /** Vertical navigation while on the full-screen overlay screens (Brands / Spaces) */
  const navigateOverlay = useCallback(
    (dir: 1 | -1) => {
      if (brandsTransitioningRef.current) return;
      if (Date.now() - overlayEnteredAt.current < 650) return;
      if (currentScreenRef.current === 3) {
        if (dir > 0) enterSpaces();
        else exitBrands();
      } else if (currentScreenRef.current === 4) {
        if (dir > 0) contactApiRef.current.enter();
        else exitSpaces();
      } else if (currentScreenRef.current === 5 && dir < 0) {
        contactApiRef.current.exit();
      }
    },
    [enterSpaces, exitSpaces]
  );

  const exitBrands = useCallback(() => {
    if (brandsTransitioningRef.current || currentScreenRef.current !== 3) return;
    brandsTransitioningRef.current = true;
    setBrandsActive(false);
  }, []);

  const handleBrandsExited = useCallback(() => {
    exitCommittedRef.current = false;
    currentScreenRef.current = 2;
    setCurrentScreen(2);
    // Reassemble the particles and drain the gauge
    tweenExitFill(0, 0.6);
    gsap.killTweensOf(explodeProxy.current);
    gsap.to(explodeProxy.current, {
      value: 0,
      duration: 1.1,
      ease: "power3.out",
      onUpdate: () => setParticleExplode(explodeProxy.current.value),
      onComplete: () => {
        brandsTransitioningRef.current = false;
      },
    });
  }, [tweenExitFill]);

  const advanceExitFill = useCallback(
    (amount: number) => {
      if (brandsTransitioningRef.current || exitCommittedRef.current || revealedSpecsRef.current < 4) return;
      triggerVibrateAndShake();
      const next = Math.min(1, exitFillTarget.current + amount);
      if (exitDecayTimer.current) clearTimeout(exitDecayTimer.current);
      if (next >= 1) {
        exitCommittedRef.current = true;
        tweenExitFill(1, 0.18, () => {
          // Full: the ball shakes on its own for 0.2s, then the transition hits
          const ball = exitBallRef.current;
          if (!ball) {
            enterBrands();
            return;
          }
          const prevTransition = ball.style.transition;
          ball.style.transition = "none"; // CSS transform transition would smear the jitter
          gsap.killTweensOf(ball);
          gsap
            .timeline({
              onComplete: () => {
                gsap.set(ball, { clearProps: "transform" }); // hand transform back to the CSS hover nudge
                ball.style.transition = prevTransition;
                enterBrands();
              },
            })
            .to(ball, { scale: 1.14, duration: 0.2, ease: "power2.out" }, 0)
            .to(
              ball,
              {
                x: "random(-3.5, 3.5)",
                y: "random(-2.5, 2.5)",
                rotation: "random(-10, 10)",
                duration: 0.025,
                repeat: 7,
                repeatRefresh: true,
                ease: "none",
              },
              0
            );
        });
        return;
      }
      tweenExitFill(next, 0.45);
      // Stop scrolling and the gauge slowly drains back
      exitDecayTimer.current = setTimeout(() => {
        if (!brandsTransitioningRef.current) tweenExitFill(0, 0.9);
      }, 850);
    },
    [triggerVibrateAndShake, tweenExitFill, enterBrands]
  );

  const goToScreen = useCallback((target: number, durationOverride?: number) => {
    if (animatingRef.current || target === currentScreenRef.current) return;
    animatingRef.current = true;

    // Reset spec items when navigating away from Screen 3
    if (target < 2) {
      resetExitFill();
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

    // Entering Screen 2 (target === 1)
    if (target === 1) {
      screen2LeftRevealedRef.current = true;
      setScreen2LeftRevealed(true);
      animateLeftText(true);

      if (currentScreenRef.current === 0) {
        // Arriving from Screen 1 (Hero): both side columns animate in together, mirrored
        screen2RightRevealedRef.current = true;
        setScreen2RightRevealed(true);
        gsap.delayedCall(0.16, () => animateRightText(true));
      } else if (currentScreenRef.current === 2) {
        // Returning from Screen 3: right text remains visible
        screen2RightRevealedRef.current = true;
        setScreen2RightRevealed(true);
        const rightEls = [rightBlock1Ref.current, rightBlock2Ref.current];
        rightEls.forEach((el) => {
          if (el) {
            gsap.killTweensOf(el);
            gsap.set(el, { opacity: 1, x: 0, y: 0, scale: 1, pointerEvents: "auto" });
          }
        });
      }
    }

    // Returning to Screen 1 (target === 0): reset Screen 2 elements
    if (target === 0) {
      screen2LeftRevealedRef.current = false;
      setScreen2LeftRevealed(false);
      screen2RightRevealedRef.current = false;
      setScreen2RightRevealed(false);
      animateLeftText(false);
      animateRightText(false);
    }

    const diff = Math.abs(target - currentScreenRef.current);
    const animDuration = durationOverride ?? (diff > 1 ? 0.95 : 0.72);

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
  }, [animateLeftText, animateRightText]);

  /** Nav jump to the full-screen overlays: 3 = Brands, 4 = Domains */
  const jumpToOverlay = useCallback(
    (target: 3 | 4) => {
      if (animatingRef.current || brandsTransitioningRef.current || exitCommittedRef.current) return;
      const cur = currentScreenRef.current;
      if (cur === 4) {
        if (target === 3) exitSpaces();
        return;
      }
      if (cur === 3) {
        if (target === 4) enterSpaces();
        return;
      }
      // From Hero / About / Products: glide the stage to Products under cover of the strips,
      // so scrolling back up from the overlay lands on the product showcase as usual
      if (exitDecayTimer.current) clearTimeout(exitDecayTimer.current);
      goToScreen(2);
      enterBrands();
      if (target === 4) {
        pendingDomainsRef.current = true;
        gsap.delayedCall(0.35, () => setSpacesActive(true));
      }
    },
    [goToScreen, enterBrands, enterSpaces, exitSpaces]
  );

  // ── Screen 6 (Contact): reached through the AV NIRVANA band cover transition ──
  const waitFor = (cond: () => boolean, maxFrames = 120) =>
    new Promise<void>((resolve) => {
      let n = 0;
      const tick = () => {
        if (cond() || ++n > maxFrames) resolve();
        else requestAnimationFrame(tick);
      };
      tick();
    });

  const enterContact = useCallback(async () => {
    const band = bandRef.current;
    if (!band || brandsTransitioningRef.current || animatingRef.current || exitCommittedRef.current) return;
    if (currentScreenRef.current >= 5) return;
    brandsTransitioningRef.current = true;
    if (exitDecayTimer.current) clearTimeout(exitDecayTimer.current);

    await band.cover();

    if (currentScreenRef.current < 4) {
      // Arriving from the nav: stack Products → Brands → Domains instantly under the cover,
      // so scrolling back up from Contact unwinds through the screens as usual
      gsap.killTweensOf(explodeProxy.current);
      explodeProxy.current.value = 1;
      setParticleExplode(1);
      if (currentScreenRef.current !== 2) {
        goToScreen(2, 0.01);
        await waitFor(() => currentScreenRef.current === 2);
      }
      setOverlayInstant(true);
      setBrandsActive(true);
      setSpacesActive(true);
      await waitFor(() => currentScreenRef.current === 4);
      setOverlayInstant(false);
    }

    brandsTransitioningRef.current = true;
    currentScreenRef.current = 5;
    setCurrentScreen(5);
    setContactActive(true);

    await band.reveal();
    overlayEnteredAt.current = Date.now();
    brandsTransitioningRef.current = false;
  }, [goToScreen]);

  const exitContact = useCallback(async () => {
    const band = bandRef.current;
    if (!band || brandsTransitioningRef.current || currentScreenRef.current !== 5) return;
    brandsTransitioningRef.current = true;

    await band.cover();
    setContactActive(false);
    currentScreenRef.current = 4;
    setCurrentScreen(4);

    await band.reveal();
    overlayEnteredAt.current = Date.now();
    brandsTransitioningRef.current = false;
  }, []);

  /** Nav link pressed on the Contact screen: cover, unwind the stage to the target, reveal */
  const navFromContact = useCallback(
    async (target: number) => {
      const band = bandRef.current;
      if (!band || brandsTransitioningRef.current || currentScreenRef.current !== 5 || target >= 5) return;
      brandsTransitioningRef.current = true;

      await band.cover();
      setContactActive(false);

      if (target >= 4) {
        currentScreenRef.current = 4;
        setCurrentScreen(4);
      } else {
        const settled = target <= 2 ? 2 : 3;
        setOverlayInstant(true);
        setSpacesActive(false);
        if (target <= 2) setBrandsActive(false);
        await waitFor(() => currentScreenRef.current === settled);
        setOverlayInstant(false);
      }

      if (target <= 2) {
        // Particles reassemble and the exit gauge resets while still hidden
        gsap.killTweensOf(explodeProxy.current);
        explodeProxy.current.value = 0;
        setParticleExplode(0);
        exitCommittedRef.current = false;
        tweenExitFill(0, 0.01);
        if (target < 2) {
          goToScreen(target, 0.01);
          await waitFor(() => currentScreenRef.current === target);
        }
      }

      brandsTransitioningRef.current = true;
      await band.reveal();
      overlayEnteredAt.current = Date.now();
      brandsTransitioningRef.current = false;
    },
    [goToScreen, tweenExitFill]
  );

  contactApiRef.current = { enter: enterContact, exit: exitContact };

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
      if (!HERO_USE_FERROFLUID && heroBgRef.current && aboutBgRef.current) {
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
    const contactScroller = () => document.querySelector<HTMLElement>("[data-contact-scroll]");

    const handleWheel = (e: WheelEvent) => {
      if (currentScreenRef.current === 5 && !brandsTransitioningRef.current) {
        const sc = contactScroller();
        const canScroll =
          sc && (e.deltaY > 0 ? sc.scrollTop + sc.clientHeight < sc.scrollHeight - 1 : sc.scrollTop > 0);
        if (canScroll) return; // let the contact page scroll natively
      }
      e.preventDefault();
      if (Math.abs(e.deltaY) < 3) return;

      // On Screen 4 (Brands): scroll up returns to the product showcase
      if (currentScreenRef.current >= 3 || brandsTransitioningRef.current) {
        if (Math.abs(e.deltaY) > 8) navigateOverlay(e.deltaY > 0 ? 1 : -1);
        return;
      }

      // On Screen 3: step through the 4 feature spec points one by one
      if (currentScreenRef.current === 2) {
        const now = Date.now();
        if (e.deltaY > 0) {
          // Scroll down
          triggerVibrateAndShake();
          if (revealedSpecsRef.current >= 4) {
            // All specs shown: fill the arrow ball gauge
            advanceExitFill(Math.min(0.085, Math.max(0.012, Math.abs(e.deltaY) / 1200)));
            return;
          }
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
          if (exitFillTarget.current > 0) {
            resetExitFill();
            return;
          }
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

      // On Screen 2: both columns are already revealed on entry, scroll moves between screens
      if (currentScreenRef.current === 1) {
        const now = Date.now();
        if (e.deltaY > 0) {
          // Scroll down
          if (!screen2RightRevealedRef.current) {
            if (now - lastScrollStepTime.current > 240) {
              lastScrollStepTime.current = now;
              screen2RightRevealedRef.current = true;
              setScreen2RightRevealed(true);
              animateRightText(true);
            }
            return;
          } else {
            // Right text already revealed: proceed to Screen 3
            if (now - lastScrollStepTime.current > 280) {
              lastScrollStepTime.current = now;
              goToScreen(2);
              setTimeout(triggerVibrateAndShake, 520);
            }
            return;
          }
        } else if (e.deltaY < 0) {
          // Scroll up
          // Return to Screen 0 (Hero)
          if (now - lastScrollStepTime.current > 280) {
            lastScrollStepTime.current = now;
            goToScreen(0);
          }
          return;
        }
      }

      if (e.deltaY > 0) {
        if (currentScreenRef.current === 0) goToScreen(1);
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
      if (currentScreenRef.current === 5) {
        const sc = contactScroller();
        if (sc && sc.scrollHeight > sc.clientHeight + 1) return; // native scroll on Contact
      }
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
        if (currentScreenRef.current >= 3 || brandsTransitioningRef.current) {
          // On Contact, only leave upward once the page is scrolled back to its top
          if (currentScreenRef.current === 5 && (diffY > 0 || (contactScroller()?.scrollTop ?? 0) > 0)) return;
          navigateOverlay(diffY > 0 ? 1 : -1);
          return;
        }
        if (currentScreenRef.current === 2) {
          const now = Date.now();
          if (diffY > 0) {
            // Swipe up (scroll down)
            triggerVibrateAndShake();
            if (revealedSpecsRef.current >= 4) {
              advanceExitFill(Math.min(0.32, Math.max(0.14, diffY / 900)));
              return;
            }
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
            if (exitFillTarget.current > 0) {
              resetExitFill();
              return;
            }
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

        // On Screen 2: progressive reveal of right text
        if (currentScreenRef.current === 1) {
          const now = Date.now();
          if (diffY > 0) {
            // Swipe up (scroll down)
            if (!screen2RightRevealedRef.current) {
              if (now - lastScrollStepTime.current > 200) {
                lastScrollStepTime.current = now;
                screen2RightRevealedRef.current = true;
                setScreen2RightRevealed(true);
                animateRightText(true);
              }
              return;
            } else {
              if (!animatingRef.current && now - lastScrollStepTime.current > 260) {
                lastScrollStepTime.current = now;
                goToScreen(2);
                setTimeout(triggerVibrateAndShake, 520);
              }
              return;
            }
          } else if (diffY < 0) {
            // Swipe down (scroll up)
            if (!animatingRef.current && now - lastScrollStepTime.current > 260) {
              lastScrollStepTime.current = now;
              goToScreen(0);
            }
            return;
          }
        }

        if (diffY > 0) {
          if (currentScreenRef.current === 0) goToScreen(1);
        }
      }
    };

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      // Contact: arrow / page keys scroll the page (down to the footer) before leaving the screen
      if (currentScreenRef.current === 5 && !brandsTransitioningRef.current) {
        const sc = contactScroller();
        const down = ["ArrowDown", "PageDown"].includes(e.key) || (e.key === " " && !e.shiftKey);
        const up = ["ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey);
        if (sc && (down || up)) {
          const canScroll = down ? sc.scrollTop + sc.clientHeight < sc.scrollHeight - 1 : sc.scrollTop > 0;
          if (canScroll) {
            e.preventDefault();
            sc.scrollBy({ top: (down ? 1 : -1) * sc.clientHeight * 0.8, behavior: "smooth" });
            return;
          }
        }
      }
      if (currentScreenRef.current >= 3 || brandsTransitioningRef.current) {
        if (["ArrowDown", "PageDown", " ", "ArrowUp", "PageUp"].includes(e.key)) e.preventDefault();
        if (["ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey)) navigateOverlay(-1);
        else if (["ArrowDown", "PageDown", " "].includes(e.key)) navigateOverlay(1);
        return;
      }
      if (currentScreenRef.current === 2) {
        const now = Date.now();
        if (["ArrowDown", "PageDown", " "].includes(e.key) && !e.shiftKey) {
          e.preventDefault();
          triggerVibrateAndShake();
          if (revealedSpecsRef.current >= 4) {
            advanceExitFill(0.16);
            return;
          }
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
          if (exitFillTarget.current > 0) {
            resetExitFill();
            return;
          }
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

      // Keyboard navigation on Screen 2
      if (currentScreenRef.current === 1) {
        const now = Date.now();
        if (["ArrowDown", "PageDown", " "].includes(e.key) && !e.shiftKey) {
          e.preventDefault();
          if (!screen2RightRevealedRef.current) {
            if (now - lastScrollStepTime.current > 200) {
              lastScrollStepTime.current = now;
              screen2RightRevealedRef.current = true;
              setScreen2RightRevealed(true);
              animateRightText(true);
            }
            return;
          } else {
            if (!animatingRef.current && now - lastScrollStepTime.current > 260) {
              lastScrollStepTime.current = now;
              goToScreen(2);
              setTimeout(triggerVibrateAndShake, 520);
            }
            return;
          }
        } else if (["ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey)) {
          e.preventDefault();
          if (!animatingRef.current && now - lastScrollStepTime.current > 260) {
            lastScrollStepTime.current = now;
            goToScreen(0);
          }
          return;
        }
      }

      if (animatingRef.current) return;
      if (["ArrowDown", "PageDown", " "].includes(e.key) && !e.shiftKey) {
        if (currentScreenRef.current === 0) {
          e.preventDefault();
          goToScreen(1);
        }
      }
    };

    // Global anchor link handler
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href") ?? "";
      const routes: Record<string, number> = {
        "#": 0,
        "#home": 0,
        "#about": 1,
        "#products": 2,
        "#speaker": 2,
        "#brands": 3,
        "#domains": 4,
        "#contact": 5,
      };
      if (!(href in routes)) return;
      e.preventDefault();
      const dest = routes[href];

      if (currentScreenRef.current === 5) {
        if (dest !== 5) navFromContact(dest);
        return;
      }
      if (currentScreenRef.current >= 3 || brandsTransitioningRef.current) return;
      if (dest === 5) enterContact();
      else if (dest >= 3) jumpToOverlay(dest as 3 | 4);
      else goToScreen(dest);
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
  }, [goToScreen, advanceExitFill, resetExitFill, navigateOverlay, jumpToOverlay, enterContact, navFromContact]);

  const activeProduct = PRODUCTS[currentProductIndex] || PRODUCTS[0];

  return (
    <div
      ref={viewportRef}
      className="relative h-svh w-full overflow-hidden bg-[#120a1e]"
    >
        {/* Background 1: Hero Filament loop artwork */}
        {!HERO_USE_FERROFLUID && (
          <div ref={heroBgRef} className="absolute inset-0 z-0">
            <HeroBackground active={currentScreen === 0 || scrollProgress < 0.6} />
          </div>
        )}

        {/* Background 2: About Ferrofluid artwork */}
        <div ref={aboutBgRef} className={`absolute inset-0 z-0 ${HERO_USE_FERROFLUID ? "" : "opacity-0"}`}>
          <AboutBackground
            active={HERO_USE_FERROFLUID ? currentScreen <= 2 : currentScreen === 1 || currentScreen === 2 || scrollProgress > 0.4}
            theme={
              HERO_USE_FERROFLUID && scrollProgress < 0.5
                ? "aqua"
                : currentProductIndex === 3
                ? "light-blue"
                : currentProductIndex === 2
                ? "blue"
                : currentProductIndex === 1
                ? "green"
                : "blue"
            }
          />
        </div>

        {/*
          THE SINGLE UNIFIED PARTICLE CANVAS:
          Starts at Hero position (left column), fluidly flows into the center of the About screen,
          morphs colors from lavender/white to electric blue/white, and scales up to SCREEN2_LOGO_SCALE (1.34x) & SCREEN2_PARTICLE_SCALE (1.66x).
        */}
        <div ref={particleCanvasWrapRef} className="absolute inset-0 z-10 pointer-events-none">
          <UnifiedParticleFlow
            progress={scrollProgress}
            explode={particleExplode}
            productIndex={currentProductIndex}
            logoScale={SCREEN2_LOGO_SCALE}
            particleScale={SCREEN2_PARTICLE_SCALE}
            heroParticleScale={HERO_PARTICLE_SCALE}
            waveArcLength={SCREEN3_WAVE_ARC_LENGTH}
            waveDensity={SCREEN3_WAVE_DENSITY}
            p3LineWidth={3.0}
            p3ParticleDensity={2.0}
            p4FlowWidth={0.9}
            p4ParticleDensity={3.0}
            p4FlowThickness={p4FlowThickness}
            p4FlowSpeed={p4FlowSpeed}
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
                <div
                  style={{
                    transform: `translate3d(${HERO_TEXT.x}px, ${HERO_TEXT.y}px, 0) scale(${HERO_TEXT.scale})`,
                    transformOrigin: "left center",
                  }}
                >
                  <HeroContent />
                </div>
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
                <div
                  ref={leftBlock1Ref}
                  className="will-change-transform"
                  style={{ opacity: 0, transform: "translateX(-32px) translateY(18px) scale(0.94)", pointerEvents: "none" }}
                >
                  <AboutContentBlock
                    align="left"
                    tag="OUR VISION"
                    title="A Trusted Leader in AV"
                    description="To be India’s most trusted and influential AV distribution company for path-breaking and converging technologies across the AV space."
                  />
                </div>

                <div
                  ref={leftBlock2Ref}
                  className="will-change-transform"
                  style={{ opacity: 0, transform: "translateX(-32px) translateY(18px) scale(0.94)", pointerEvents: "none" }}
                >
                  <AboutContentBlock
                    align="left"
                    tag="OUR COMMITMENT"
                    title="With You at Every Stage"
                    description="To support our partners at every stage, from pre-sales consultation and solution design to post-sales service and technical support, backed by pan-India reach, reliable logistics, in-house expertise and continuous training."
                  />
                </div>
              </div>

              {/* Centre: Focal Frame for the Centered Particles */}
              <div className="order-first flex h-[34vh] min-h-[260px] max-h-[480px] w-full items-center justify-center lg:order-none lg:h-[48vh]" />

              {/* Right Side: OUR STORY & OUR MISSION (Right Aligned) */}
              <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
                <div
                  ref={rightBlock1Ref}
                  className="will-change-transform"
                  style={{ opacity: 0, transform: "translateX(32px) translateY(18px) scale(0.94)", pointerEvents: "none" }}
                >
                  <AboutContentBlock
                    align="right"
                    tag="OUR STORY"
                    title="17+ Years of Industry Expertise"
                    description="Drawing on more than 17 years of industry expertise, we specialise in the distribution of world-class, premium audio-visual products and the delivery of advanced solutions for private cinemas, professional AV installations, and unique design-led environments."
                  />
                </div>

                <div
                  ref={rightBlock2Ref}
                  className="will-change-transform"
                  style={{ opacity: 0, transform: "translateX(32px) translateY(18px) scale(0.94)", pointerEvents: "none" }}
                >
                  <AboutContentBlock
                    align="right"
                    tag="OUR MISSION"
                    title="Redefining What’s Possible"
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
          {/* Far Left Navigation Arrow (Previous Product) */}
          <button
            type="button"
            aria-label="Previous product"
            onClick={handlePrevProduct}
            className="group pointer-events-auto absolute left-3 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-40 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-white/45 hover:bg-white/[0.14] active:scale-95 drop-shadow-[0_4px_18px_rgba(0,0,0,0.7)] cursor-pointer"
            title="Previous product"
          >
            <svg
              className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-white transition-transform duration-300 group-hover:-translate-x-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m11 17-5-5 5-5" />
              <path d="m18 17-5-5 5-5" />
            </svg>
          </button>

          {/* Far Right Navigation Arrow (Next Product) */}
          <button
            type="button"
            aria-label="Next product"
            onClick={handleNextProduct}
            className="group pointer-events-auto absolute right-3 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-40 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-white/45 hover:bg-white/[0.14] active:scale-95 drop-shadow-[0_4px_18px_rgba(0,0,0,0.7)] cursor-pointer"
            title="Next product"
          >
            <svg
              className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-white transition-transform duration-300 group-hover:translate-x-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 17 5-5-5-5" />
              <path d="m13 17 5-5-5-5" />
            </svg>
          </button>

          {/* Top Center: Product Header Hierarchy */}
          <div
            ref={productHeaderRef}
            className="mx-auto max-w-[800px] pt-1 sm:pt-2 text-center will-change-transform"
          >
            <div className="inline-flex items-center justify-center gap-3">
              <span
                className="h-px w-8 transition-colors duration-500"
                style={{
                  background: `linear-gradient(90deg,transparent,${activeProduct.accentGlow})`,
                }}
              />
              <span className="text-[11px] font-semibold tracking-[0.26em] text-fg-mute/90 uppercase sm:text-[11.5px]">
                {activeProduct.badge}
              </span>
              <span
                className="h-px w-8 transition-colors duration-500"
                style={{
                  background: `linear-gradient(90deg,${activeProduct.accentGlow},transparent)`,
                }}
              />
            </div>

            <h2 className="mt-1 text-[clamp(2.4rem,4.2vw,3.8rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-fg drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]">
              {activeProduct.title}
            </h2>

            <p className="mt-1 text-[10.5px] font-semibold tracking-[0.28em] text-fg-mute/85 uppercase sm:text-[11px]">
              {activeProduct.subtitle}
            </p>

            <p className="mx-auto mt-2 max-w-[50ch] whitespace-pre-line text-[clamp(0.84rem,0.94vw,0.96rem)] font-light leading-[1.52] text-fg-mute drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              {activeProduct.description}
            </p>
          </div>

          {/* Centered Speaker Presentation (Framed by acoustic particle sound waves) */}
          <div className="relative flex flex-1 items-center justify-center py-1">
            <div
              ref={speakerImageWrapRef}
              className="relative flex items-center justify-center will-change-transform"
            >
              <div
                className="relative flex items-center justify-center will-change-transform"
                style={{
                  transform:
                    currentProductIndex === 2
                      ? "translate(-9px, 23px) scale(1.33)"
                      : `scale(${activeProduct.imageScale})`,
                }}
              >
                <div
                  ref={speakerShakeRef}
                  className="cursor-pointer will-change-transform pointer-events-auto transition-transform duration-75 active:scale-95"
                  onClick={handleSpeakerClick}
                  title="Click or scroll to reveal features and feel acoustic rumble"
                >
                  <img
                    key={activeProduct.id}
                    src={activeProduct.imageSrc}
                    alt={activeProduct.imageAlt}
                    className={`h-[42vh] max-h-[440px] min-h-[250px] w-auto max-w-[78vw] object-contain ${activeProduct.imageDropShadow} select-none pointer-events-none`}
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Specifications (4 Columns with clean SVG icons, revealed one by one on scroll) */}
          <div className="mx-auto w-full max-w-[1360px] pb-1 sm:pb-2">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-2 sm:gap-x-8 sm:px-4 md:grid-cols-4 lg:gap-x-12">
              {activeProduct.specs.map((spec, idx) => {
                const ref =
                  idx === 0
                    ? spec1Ref
                    : idx === 1
                    ? spec2Ref
                    : idx === 2
                    ? spec3Ref
                    : spec4Ref;
                return (
                  <div
                    key={idx}
                    ref={ref}
                    className={`flex items-center gap-3 sm:gap-4 will-change-transform ${
                      idx < 3 ? "md:border-r md:border-white/10 md:pr-4 lg:pr-6" : ""
                    }`}
                    style={{
                      opacity: 0,
                      transform: "translateY(28px) scale(0.94)",
                      pointerEvents: "none",
                    }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center text-fg">
                      {spec.icon}
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-[11px] font-bold tracking-[0.10em] text-fg uppercase sm:text-[11.5px]">
                        {spec.title}
                      </h4>
                      <p className="mt-0.5 text-[10.5px] font-light leading-[1.38] text-fg-mute sm:text-[11px]">
                        {spec.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Link CTA */}
            <div
              ref={specCtaRef}
              className="mt-4 sm:mt-5 flex flex-col items-center justify-center gap-1.5 will-change-transform"
              style={{ opacity: 0, transform: "translateY(14px)", pointerEvents: "none" }}
            >
              <a
                href={activeProduct.ctaHref}
                className="group flex flex-col items-center justify-center gap-1.5 transition-opacity duration-300 hover:opacity-85"
              >
                <div ref={exitBallRef} className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/5 text-white backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0.5">
                  {/* White liquid fill rising from the bottom as the user scrolls */}
                  <div
                    ref={exitFillElRef}
                    className="absolute inset-0 origin-bottom bg-white will-change-transform"
                    style={{ transform: "scaleY(0)" }}
                  />
                  {/* Progress ring */}
                  <svg className="pointer-events-none absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      ref={exitRingRef}
                      cx="18"
                      cy="18"
                      r="17"
                      fill="none"
                      stroke="white"
                      strokeWidth="1.5"
                      pathLength={100}
                      strokeDasharray="100"
                      style={{ strokeDashoffset: 100 }}
                    />
                  </svg>
                  <svg className="relative h-4 w-4 mix-blend-difference" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
                <div className="inline-flex items-center gap-3">
                  <span
                    className="h-px w-8 transition-colors duration-500"
                    style={{
                      background: `linear-gradient(90deg,transparent,${activeProduct.accentGlow})`,
                    }}
                  />
                  <span className="text-[10px] font-semibold tracking-[0.24em] text-fg-mute/80 uppercase transition-colors group-hover:text-fg">
                    {activeProduct.ctaText}
                  </span>
                  <span
                    className="h-px w-8 transition-colors duration-500"
                    style={{
                      background: `linear-gradient(90deg,${activeProduct.accentGlow},transparent)`,
                    }}
                  />
                </div>
              </a>
            </div>
          </div>
        </div>

        <BrandsScreen
          active={brandsActive}
          covered={spacesActive}
          instant={overlayInstant}
          onEntered={handleBrandsEntered}
          onExited={handleBrandsExited}
        />
        <SpacesScreen
          active={spacesActive}
          instant={overlayInstant}
          onEntered={handleSpacesEntered}
          onExited={handleSpacesExited}
        />
        <ContactScreen active={contactActive} />
        <BandTransition ref={bandRef} />
      </div>
  );
}
