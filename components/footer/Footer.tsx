"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import gsap from "gsap";
import LogoMark from "@/components/hero/LogoMark";

const icon = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const SOCIALS: { label: string; href: string; svg: ReactNode }[] = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=100057145672980",
    svg: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" {...icon} />,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/avnirvanaindia/",
    svg: (
      <>
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" {...icon} />
        <circle cx="12" cy="12" r="4.2" {...icon} />
        <path d="M17.6 6.4h.01" {...icon} strokeWidth={2.6} />
      </>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/av-nirvana-india/",
    svg: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" {...icon} />
        <rect x="2" y="9" width="4" height="12" {...icon} />
        <circle cx="4" cy="4" r="2" {...icon} />
      </>
    ),
  },
];

// In-site hash routes (intercepted by HeroAboutExperience and mapped to screens)
const QUICK_LINKS = [
  { label: "Home", href: "#" },
  { label: "About Us", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const BRAND_LINKS = [
  { label: "Residential AV", href: "#brands" },
  { label: "Pro AV", href: "#brands" },
  { label: "Technology Domains", href: "#domains" },
];

/** White footer that sits at the bottom of the Contact screen's scroll */
export default function Footer() {
  const rootRef = useRef<HTMLElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const scroller = () => rootRef.current?.closest<HTMLElement>("[data-contact-scroll]") ?? null;

  const scrollToTop = (e: MouseEvent) => {
    e.preventDefault();
    scroller()?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reveal columns as the footer scrolls into view; reset once it's fully out so it replays next time
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = gsap.utils.selector(root);
    const hidden = () => {
      gsap.set(q(".ft-col"), { opacity: 0, y: 36 });
      gsap.set(q(".ft-item"), { opacity: 0, y: 14 });
      gsap.set(q(".ft-rule"), { scaleX: 0 });
      gsap.set(q(".ft-bottom"), { opacity: 0, y: 10 });
    };
    hidden();

    let played = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.15 && !played) {
          played = true;
          tlRef.current?.kill();
          tlRef.current = gsap
            .timeline({ defaults: { ease: "expo.out" } })
            .to(q(".ft-col"), { opacity: 1, y: 0, duration: 1.1, stagger: 0.09 })
            .to(q(".ft-item"), { opacity: 1, y: 0, duration: 0.8, stagger: 0.03 }, 0.2)
            .to(q(".ft-rule"), { scaleX: 1, duration: 1.2, ease: "expo.inOut" }, 0.35)
            .to(q(".ft-bottom"), { opacity: 1, y: 0, duration: 0.8 }, 0.6);
        } else if (!entry.isIntersecting && played) {
          played = false;
          tlRef.current?.kill();
          hidden();
        }
      },
      { threshold: [0, 0.15] }
    );
    io.observe(root);
    return () => {
      io.disconnect();
      tlRef.current?.kill();
    };
  }, []);

  const linkCls =
    "ft-link relative inline-block text-[13.5px] text-[#0b0b0f]/65 transition-colors duration-300 hover:text-[#0b0b0f]";

  return (
    <footer
      ref={rootRef}
      className="relative z-10 rounded-t-[24px] bg-white text-[#0b0b0f] sm:rounded-t-[32px]"
      style={{ boxShadow: "0 -30px 80px -40px rgba(134,239,172,0.25)" }}
    >
      <style>{`
        .ft-link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 100%;
          height: 1px;
          background: currentColor;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ft-link:hover::after { transform: scaleX(1); transform-origin: left; }
      `}</style>

      <div className="mx-auto w-full max-w-[1480px] px-6 pt-9 pb-5 sm:px-10 sm:pt-10 lg:px-14 lg:pt-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-[1.3fr_0.8fr_0.9fr_1.5fr] lg:gap-8">
          {/* Brand */}
          <div className="ft-col col-span-2 flex flex-col lg:col-span-1">
            <a href="#" className="inline-flex items-center gap-3 self-start" aria-label="AV Nirvana India — home">
              <LogoMark className="h-[26px] w-auto" />
              <span className="h-[26px] w-px bg-black/20" aria-hidden="true" />
              <span className="flex flex-col items-center leading-none">
                <span className="text-[15px] font-semibold tracking-[0.02em]">AV NIRVANA</span>
                <span className="mt-[4px] pl-[0.46em] text-[8px] font-medium tracking-[0.46em] text-black/50">INDIA</span>
              </span>
            </a>
            <p className="mt-4 text-[13.5px] leading-[1.6] text-black/60">
              Experience Excellence.
              <br />
              EST. 2012.
            </p>
          </div>

          {/* Quick Links */}
          <div className="ft-col">
            <h4 className="text-[15px] font-semibold tracking-[-0.01em]">Quick Links</h4>
            <ul className="mt-3.5 flex flex-col gap-2">
              {QUICK_LINKS.map((l) => (
                <li key={l.label} className="ft-item">
                  <a href={l.href} onClick={l.href === "#contact" ? scrollToTop : undefined} className={linkCls}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Brands */}
          <div className="ft-col">
            <h4 className="text-[15px] font-semibold tracking-[-0.01em]">Brands</h4>
            <ul className="mt-3.5 flex flex-col gap-2">
              {BRAND_LINKS.map((l) => (
                <li key={l.label} className="ft-item">
                  <a href={l.href} className={linkCls}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="ft-col col-span-2 lg:col-span-1">
            <h4 className="text-[15px] font-semibold tracking-[-0.01em]">Contact</h4>
            <div className="mt-3.5 flex flex-col gap-2 text-[13.5px] leading-[1.55] text-black/65">
              <p className="ft-item">
                Email:{" "}
                <a href="mailto:info@avnirvanaindia.com" className={linkCls}>
                  info@avnirvanaindia.com
                </a>
              </p>
              <p className="ft-item">
                Phone:{" "}
                <a href="tel:+917400414691" className={linkCls}>
                  +91 74004 14691
                </a>
                <span className="mx-2 text-black/25">/</span>
                <a href="tel:+917400414093" className={linkCls}>
                  +91 74004 14093
                </a>
              </p>
              <p className="ft-item">
                8-C, Laxmi Industrial Estate, New Link Road,
                <br />
                Andheri (West), Mumbai - 400053, Maharashtra, India.
              </p>
            </div>

            <div className="ft-item mt-4 flex items-center gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="group flex h-9 w-9 items-center justify-center rounded-full border border-black/12 text-[#0b0b0f] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0b0b0f] hover:bg-[#0b0b0f] hover:text-white"
                >
                  <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] transition-transform duration-300 group-hover:scale-110">
                    {s.svg}
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="ft-rule mt-8 h-px w-full origin-left bg-black/10 sm:mt-10" />
        <div className="ft-bottom flex flex-col items-start justify-between gap-3 pt-4 sm:flex-row sm:items-center">
          <p className="text-[12px] text-black/50">© 2026 AV Nirvana India. All Rights Reserved.</p>
          <a
            href="#contact"
            onClick={scrollToTop}
            className="group inline-flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.2em] text-black/60 uppercase transition-colors hover:text-black"
          >
            Back to top
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-black/15 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-black group-hover:bg-black group-hover:text-white">
              <svg className="h-3 w-3" viewBox="0 0 24 24" {...icon} strokeWidth={2}>
                <path d="m18 15-6-6-6 6" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
