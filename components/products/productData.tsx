import type { ReactNode } from "react";

/**
 * Product catalogue shared by the product showcases (the dark Screen 3 in
 * HeroAboutExperience and the light products screen).
 */

export interface ProductSpec {
  icon: ReactNode;
  title: string;
  desc: string;
}

export interface Product {
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

export const PRODUCTS: Product[] = [
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
