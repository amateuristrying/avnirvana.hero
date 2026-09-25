"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type React from "react";
import gsap from "gsap";
import Footer from "@/components/footer/Footer";

const MAPS_LINK = "https://maps.app.goo.gl/4qd2RCxQY5sjqoZY6";
const MAP_EMBED =
  "https://www.google.com/maps?q=" +
  encodeURIComponent("8-C, Laxmi Industrial Estate, Suresh Nagar, Andheri West, Mumbai, Maharashtra 400053") +
  "&z=16&output=embed";

const PHONE_1 = "+91 74004 14691";
const PHONE_2 = "+91 74004 14093";
const EMAIL = "info@avnirvanaindia.com";
const ADDRESS = "8-C, Laxmi Industrial Estate, Suresh Nagar, Andheri West, Mumbai, Maharashtra 400053";

const ArrowUpRight = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

export interface ContactScreenHandle {
  getRoot: () => HTMLElement | null;
  prepare: () => void;
  playIn: () => void;
  onEntered?: () => void;
}

interface ContactScreenProps {
  active: boolean;
}

const ContactScreen = forwardRef<ContactScreenHandle, ContactScreenProps>(function ContactScreen(
  { active },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useImperativeHandle(
    ref,
    () => ({
      getRoot: () => rootRef.current,
      prepare: () => {
        const root = rootRef.current;
        if (!root) return;
        root.scrollTop = 0;
        gsap.killTweensOf([headerRef.current, ...cardsRef.current.filter(Boolean)]);
        gsap.set(headerRef.current, { opacity: 0, y: 30 });
        gsap.set(cardsRef.current.filter(Boolean), { opacity: 0, y: 40 });
      },
      playIn: () => {
        const cards = cardsRef.current.filter(Boolean);
        gsap.killTweensOf([headerRef.current, ...cards]);
        gsap.to(headerRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
        });
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.1,
          clearProps: "transform",
        });
      },
      onEntered: () => {
        // Ready for interactions
      },
    }),
    [],
  );

  useEffect(() => {
    if (!active) {
      const root = rootRef.current;
      if (root) root.scrollTop = 0;
    }
  }, [active]);

  return (
    <div
      ref={rootRef}
      data-contact-scroll
      aria-label="Contact Screen"
      aria-hidden={!active}
      className={`fixed inset-0 z-[145] overflow-y-auto overflow-x-hidden bg-[#040406] text-white selection:bg-black selection:text-white ${
        active ? "pointer-events-auto visible" : "pointer-events-none invisible"
      }`}
      style={{
        // Initially placed for the GSAP clip-path / zoom transition
        willChange: "transform, clip-path",
      }}
    >
      <style>{`
        .contact-card-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 500;
          color: #0b0b0f;
          transition: color 0.25s ease;
        }
        .contact-card-link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 0%;
          height: 1.5px;
          background-color: currentColor;
          transition: width 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .contact-card-link:hover::after {
          width: 100%;
        }
      `}</style>

      {/* Subtle ambient lighting vignette on pure black background */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.06)_0%,transparent_70%)]" />

      {/* Sticky top gradient scrim ensuring the fixed white navbar remains legible as white cards scroll under */}
      <div className="pointer-events-none sticky top-0 z-30 h-24 -mb-24 w-full bg-gradient-to-b from-[#040406]/95 via-[#040406]/75 to-transparent backdrop-blur-[6px]" />

      {/* Content wrapper */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-5 pt-[104px] pb-12 sm:px-8 sm:pt-[124px] lg:px-12 lg:pb-16">
        {/* Header Block in White against Black background */}
        <header ref={headerRef} className="mx-auto mb-10 flex max-w-[940px] flex-col items-center text-center sm:mb-12">
          <div className="flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.34em] text-white/55 sm:text-[11px]">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-white/50" />
            Connect With AV Nirvana
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-white/50" />
          </div>

          <h1 className="mt-3.5 text-[clamp(2.1rem,4.4vw,3.8rem)] font-bold leading-[1.05] tracking-[-0.035em] text-white">
            Experience Excellence.
          </h1>

          <p className="mt-4 max-w-[62ch] text-[clamp(0.92rem,1.05vw,1.06rem)] font-light leading-relaxed text-white/60">
            Our Mumbai Experience Centre is built for private demos, acoustic consultations, and dealer training. Step inside and immerse yourself in state-of-the-art sound and vision.
          </p>
        </header>

        {/* Grid of Rounded Edged Boxes in White */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-7">
          {/* Box 1: Interactive Map Box (Hero Card - Span 7 cols) */}
          <div
            ref={(el) => {
              cardsRef.current[0] = el;
            }}
            className="flex flex-col justify-between rounded-[32px] bg-white p-6 sm:p-7 text-[#0b0b0f] shadow-[0_30px_90px_rgba(0,0,0,0.5)] lg:col-span-7"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                <div>
                  <span className="inline-block rounded-full bg-[#0b0b0f]/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#0b0b0f]/70">
                    Flagship Experience Centre
                  </span>
                  <h2 className="mt-2 text-[26px] font-bold tracking-[-0.03em] sm:text-[32px]">
                    How to reach us?
                  </h2>
                </div>
                <span className="text-[12px] font-medium text-[#0b0b0f]/50">
                  Andheri West, Mumbai
                </span>
              </div>

              {/* Map embed with rounded corners */}
              <div className="group relative h-[320px] sm:h-[380px] w-full overflow-hidden rounded-[22px] bg-[#e8e8ed] border border-black/5">
                <iframe
                  title="AV Nirvana Experience Centre"
                  src={MAP_EMBED}
                  className="absolute inset-0 h-full w-full border-0 grayscale-[0.85] transition-all duration-700 ease-out group-hover:grayscale-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Map Card Footer */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-black/8 pt-4">
              <div className="max-w-[420px]">
                <p className="text-[13px] font-medium leading-snug text-[#0b0b0f]">
                  {ADDRESS}
                </p>
                <p className="mt-0.5 text-[11.5px] text-[#0b0b0f]/50">
                  Dedicated visitor parking available inside the industrial estate
                </p>
              </div>

              <a
                href={MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-[#0b0b0f] px-5 py-2.5 text-[12.5px] font-medium text-white transition-all duration-300 hover:bg-black hover:shadow-lg active:scale-95"
              >
                <span>Get directions</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>

          {/* Box 2 & Box 3 in Right Column (Span 5 cols) */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            {/* Box 2: Direct Contact Card (Rounded White Box) */}
            <div
              ref={(el) => {
                cardsRef.current[1] = el;
              }}
              className="flex flex-col justify-between rounded-[32px] bg-white p-6 sm:p-7 text-[#0b0b0f] shadow-[0_30px_90px_rgba(0,0,0,0.5)]"
            >
              <div>
                <span className="inline-block rounded-full bg-[#0b0b0f]/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#0b0b0f]/70">
                  Direct Inquiries
                </span>
                <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] sm:text-[28px]">
                  Get in Touch
                </h3>

                <div className="mt-6 flex flex-col gap-5">
                  {/* Phone */}
                  <div className="flex flex-col gap-1 border-b border-black/8 pb-4">
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#0b0b0f]/45">
                      Phone &amp; WhatsApp
                    </span>
                    <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[15px] font-semibold sm:text-[16px]">
                      <a href={`tel:${PHONE_1.replace(/\s/g, "")}`} className="contact-card-link">
                        {PHONE_1}
                      </a>
                      <span className="text-black/25">/</span>
                      <a href={`tel:${PHONE_2.replace(/\s/g, "")}`} className="contact-card-link">
                        {PHONE_2}
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1 border-b border-black/8 pb-4">
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#0b0b0f]/45">
                      Project Inquiries &amp; Consultations
                    </span>
                    <a
                      href={`mailto:${EMAIL}`}
                      className="contact-card-link pt-0.5 text-[15px] font-semibold sm:text-[16px]"
                    >
                      {EMAIL}
                    </a>
                  </div>

                  {/* Hours */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#0b0b0f]/45">
                      Experience Centre Hours
                    </span>
                    <p className="pt-0.5 text-[13.5px] font-medium text-[#0b0b0f]/80">
                      Monday – Saturday: 10:00 AM – 7:00 PM
                    </p>
                    <p className="text-[12px] text-[#0b0b0f]/50">
                      Sunday &amp; late evenings by prior appointment
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-black/8">
                <a
                  href={`mailto:${EMAIL}?subject=Private%20Demo%20Inquiry`}
                  className="group flex w-full items-center justify-between rounded-full bg-[#0b0b0f] px-5 py-3 text-[13px] font-medium text-white transition-all duration-300 hover:bg-black active:scale-95"
                >
                  <span>Inquire About A Project</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </div>

            {/* Box 3: Private Demo / Solutions Card (Rounded White Box) */}
            <div
              ref={(el) => {
                cardsRef.current[2] = el;
              }}
              className="flex flex-col justify-between rounded-[32px] bg-white p-6 sm:p-7 text-[#0b0b0f] shadow-[0_30px_90px_rgba(0,0,0,0.5)]"
            >
              <div>
                <span className="inline-block rounded-full bg-[#0b0b0f]/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#0b0b0f]/70">
                  Private Demonstrations
                </span>
                <h3 className="mt-2 text-[20px] font-bold tracking-[-0.02em]">
                  Book A Room Walkthrough
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[#0b0b0f]/70">
                  Private cinemas, multi-room architectural audio, and automated collaboration spaces are primed for live demonstration. Call ahead and we’ll calibrate the rooms for your visit.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-1.5 pt-2">
                {[
                  "Home Theatres",
                  "Line Arrays",
                  "Commercial AV",
                  "Retail Audio",
                  "Acoustic Design",
                  "Residential Projects",
                  "Sound Staging",
                  "Speaker Modeling",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-black/10 bg-[#f4f4f7] px-3 py-1 text-[11px] font-medium text-[#0b0b0f]/70 transition-colors duration-200 hover:border-black/20 hover:bg-[#eaebee]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Box 4: Pan-India Leadership Box (Full-width rounded white card) */}
          <div
            ref={(el) => {
              cardsRef.current[3] = el;
            }}
            className="rounded-[32px] bg-white p-6 sm:p-8 text-[#0b0b0f] shadow-[0_30px_90px_rgba(0,0,0,0.5)] lg:col-span-12"
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
              <div className="flex flex-col border-b border-black/8 pb-5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6">
                <span className="text-[32px] font-bold tracking-tight text-[#0b0b0f] sm:text-[36px]">
                  17+ Years
                </span>
                <span className="mt-1 text-[13px] font-semibold text-[#0b0b0f]">
                  Industry Expertise &amp; Trust
                </span>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[#0b0b0f]/65">
                  Over 17 years crafting bespoke audio-visual solutions across luxury residential and commercial spaces nationwide.
                </p>
              </div>

              <div className="flex flex-col border-b border-black/8 pb-5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6">
                <span className="text-[32px] font-bold tracking-tight text-[#0b0b0f] sm:text-[36px]">
                  Pan-India
                </span>
                <span className="mt-1 text-[13px] font-semibold text-[#0b0b0f]">
                  Logistics &amp; Technical Support
                </span>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[#0b0b0f]/65">
                  In-house engineering teams, verified dealer networks, and rapid dispatch across all Indian metro and regional centres.
                </p>
              </div>

              <div className="flex flex-col">
                <span className="text-[32px] font-bold tracking-tight text-[#0b0b0f] sm:text-[36px]">
                  End-to-End
                </span>
                <span className="mt-1 text-[13px] font-semibold text-[#0b0b0f]">
                  Consultation to Commissioning
                </span>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[#0b0b0f]/65">
                  From initial CAD layout and acoustic modeling to hardware installation, DSP tuning, and ongoing warranty coverage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer attached at bottom of scroll */}
      <Footer />
    </div>
  );
});

export default ContactScreen;
