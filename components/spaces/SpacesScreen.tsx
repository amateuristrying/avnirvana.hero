"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";

const STRIP_COUNT = 10;
const BG = "rgb(129,129,129)";
const AUTOPLAY_SECONDS = 5;

const TITLE = "Sound & Vision, Built for Every Space";
const SUBTITLE =
  "From intelligent homes to immersive commercial environments, we bring audio, video and automation together to transform the way spaces feel and function.";

interface Space {
  title: string;
  desc: string;
}

const SPACES: Space[] = [
  { title: "Home & Smart Living", desc: "Private cinemas, multi-room audio and seamless automation, crafted around the way you live." },
  { title: "Auditoriums & Event Spaces", desc: "Line arrays, projection and stage control engineered so every seat gets the best experience." },
  { title: "Retail & Lifestyle Spaces", desc: "Curated background music, digital signage and ambience that shape how customers feel." },
  { title: "Corporate & Commercial Spaces", desc: "Boardrooms, collaboration suites and building-wide AV that keep teams effortlessly connected." },
  { title: "Hospitality & Leisure", desc: "Zoned audio, lighting scenes and entertainment systems for hotels, bars, clubs and resorts." },
  { title: "Education & Institutions", desc: "Smart classrooms, lecture capture and campus-wide AV that elevate the way people learn." },
];

const N = SPACES.length;

// Layout offsets (dialled in with tuning sliders)
const LAYOUT = { headerY: -21, headerScale: 0.93, cardsScale: 1.15 };

/** Signed shortest distance from the active index, in range [-N/2, N/2) */
function relOffset(i: number, active: number) {
  let d = (i - active) % N;
  if (d < -N / 2) d += N;
  if (d >= N / 2) d -= N;
  return d;
}

interface SpacesScreenProps {
  active: boolean;
  onEntered?: () => void;
  onExited?: () => void;
}

export default function SpacesScreen({ active, onEntered, onExited }: SpacesScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stripsRef = useRef<(HTMLDivElement | null)[]>([]);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const titleWordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const subWordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const controlsRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hoverTlsRef = useRef<(gsap.core.Timeline | null)[]>([]);

  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const cbRef = useRef({ onEntered, onExited });
  cbRef.current = { onEntered, onExited };
  const mountedRef = useRef(false);
  const shownRef = useRef(false);

  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const [ready, setReady] = useState(false);
  const hoveringRef = useRef(false);
  const autoplayRef = useRef<gsap.core.Tween | null>(null);

  const cardProps = useCallback((i: number, activeIdx: number) => {
    const card = cardsRef.current[i];
    const w = card?.offsetWidth ?? 300;
    const off = relOffset(i, activeIdx);
    const abs = Math.abs(off);
    const sign = Math.sign(off);
    const x = abs === 0 ? 0 : abs === 1 ? sign * w * 0.68 : abs === 2 ? sign * w * 1.2 : 0;
    return {
      x,
      xPercent: -50,
      yPercent: -50,
      scale: [1, 0.84, 0.7, 0.58][abs],
      rotateY: -sign * Math.min(abs, 2) * 9,
      opacity: abs >= 3 ? 0 : 1,
      filter: `brightness(${[1, 0.62, 0.4, 0.3][abs]})`,
      zIndex: 10 - abs,
    };
  }, []);

  const layout = useCallback(
    (activeIdx: number, immediate = false) => {
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        const props = cardProps(i, activeIdx);
        // z-index switches at the midpoint so cards pass behind each other cleanly
        gsap.set(card, { zIndex: props.zIndex });
        if (immediate) {
          gsap.set(card, props);
        } else {
          gsap.to(card, { ...props, duration: 0.95, ease: "power3.inOut", overwrite: "auto" });
        }
      });
    },
    [cardProps]
  );

  const goTo = useCallback(
    (next: number) => {
      const wrapped = ((next % N) + N) % N;
      if (wrapped === indexRef.current) return;
      // Close any open hover panel on cards that are moving away
      hoverTlsRef.current.forEach((tl) => tl?.reverse());
      indexRef.current = wrapped;
      setIndex(wrapped);
    },
    []
  );

  // Autoplay loop with progress bar, paused while hovering a card
  const scheduleAutoplay = useCallback(() => {
    autoplayRef.current?.kill();
    if (!progressRef.current) return;
    gsap.set(progressRef.current, { scaleX: 0 });
    autoplayRef.current = gsap.to(progressRef.current, {
      scaleX: 1,
      duration: AUTOPLAY_SECONDS,
      ease: "none",
      onComplete: () => goTo(indexRef.current + 1),
    });
    if (hoveringRef.current) autoplayRef.current.pause();
  }, [goTo]);

  useEffect(() => {
    if (!ready) return;
    layout(index);
    scheduleAutoplay();
  }, [index, ready, layout, scheduleAutoplay]);

  // Enter / exit timelines
  useEffect(() => {
    const root = rootRef.current;
    const strips = stripsRef.current.filter(Boolean) as HTMLDivElement[];
    const titleWords = titleWordsRef.current.filter(Boolean) as HTMLSpanElement[];
    const subWords = subWordsRef.current.filter(Boolean) as HTMLSpanElement[];
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    const eyebrow = eyebrowRef.current;
    const controls = controlsRef.current;
    if (!root || !eyebrow || !controls) return;

    if (!mountedRef.current) {
      mountedRef.current = true;
      gsap.set(strips, { scaleY: 0 });
      gsap.set(eyebrow, { opacity: 0, y: 16, letterSpacing: "0.6em" });
      gsap.set(titleWords, { yPercent: 115, rotate: 4 });
      gsap.set(subWords, { opacity: 0, y: 14, filter: "blur(6px)" });
      gsap.set(controls, { opacity: 0, y: 20 });
      cards.forEach((c, i) => gsap.set(c, { ...cardProps(i, 0), opacity: 0, y: 120, scale: 0.6 }));
      gsap.set(root, { visibility: "hidden", pointerEvents: "none" });
      if (!active) return;
    }

    if (active === shownRef.current) return;
    shownRef.current = active;

    tlRef.current?.kill();
    const tl = gsap.timeline();
    tlRef.current = tl;

    if (active) {
      indexRef.current = 0;
      setIndex(0);
      tl.set(root, { visibility: "visible", pointerEvents: "auto" })
        // Grey strips sweep over the white screen, left → right
        .to(strips, { scaleY: 1, duration: 0.5, ease: "power3.inOut", stagger: 0.055 })
        .to(eyebrow, { opacity: 1, y: 0, letterSpacing: "0.34em", duration: 0.9, ease: "power3.out" }, "-=0.2")
        .to(titleWords, { yPercent: 0, rotate: 0, duration: 0.9, ease: "power4.out", stagger: 0.06 }, "<0.05")
        .to(subWords, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power2.out", stagger: 0.012 }, "<0.3");

      // Cards rise and fan out from the centre
      const order = cards
        .map((c, i) => ({ c, i, abs: Math.abs(relOffset(i, 0)) }))
        .sort((a, b) => a.abs - b.abs);
      order.forEach(({ c, i }, k) => {
        tl.fromTo(
          c,
          { ...cardProps(i, 0), x: 0, y: 140, scale: 0.55, opacity: 0, rotateY: 0 },
          { ...cardProps(i, 0), y: 0, duration: 1.15, ease: "expo.out" },
          k === 0 ? "<0.1" : "<0.08"
        );
      });
      tl.to(controls, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.8").call(() => {
        setReady(true);
        cbRef.current.onEntered?.();
      });
    } else {
      setReady(false);
      autoplayRef.current?.kill();
      hoverTlsRef.current.forEach((h) => h?.reverse());
      tl.to(controls, { opacity: 0, y: 20, duration: 0.25, ease: "power2.in" })
        .to(cards, { opacity: 0, y: 80, scale: 0.6, duration: 0.45, ease: "power3.in", stagger: 0.03 }, "<")
        .to(subWords, { opacity: 0, y: -8, filter: "blur(6px)", duration: 0.3, ease: "power2.in", stagger: 0.004 }, "<0.1")
        .to(titleWords, { yPercent: -115, duration: 0.45, ease: "power3.in", stagger: 0.03 }, "<")
        .to(eyebrow, { opacity: 0, y: -10, duration: 0.3 }, "<")
        // Grey strips retract right → left, revealing the white Brands screen
        .to(strips, { scaleY: 0, duration: 0.42, ease: "power3.inOut", stagger: { each: 0.05, from: "end" } }, "-=0.1")
        .set(root, { visibility: "hidden", pointerEvents: "none" })
        .set(titleWords, { yPercent: 115, rotate: 4 })
        .call(() => cbRef.current.onExited?.());
    }
  }, [active, cardProps]);

  // Keep carousel positions correct on resize
  useEffect(() => {
    const onResize = () => {
      if (shownRef.current && ready) layout(indexRef.current, true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [layout, ready]);

  // Arrow keys switch cards while this screen is showing
  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(indexRef.current + 1);
      if (e.key === "ArrowLeft") goTo(indexRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, goTo]);

  useEffect(
    () => () => {
      tlRef.current?.kill();
      autoplayRef.current?.kill();
      hoverTlsRef.current.forEach((h) => h?.kill());
    },
    []
  );

  // Hover reveal: built lazily per card, played forward on enter and reversed on leave
  const getHoverTl = (i: number) => {
    if (hoverTlsRef.current[i]) return hoverTlsRef.current[i]!;
    const card = cardsRef.current[i];
    if (!card) return null;
    const q = gsap.utils.selector(card);
    const tl = gsap
      .timeline({ paused: true, defaults: { ease: "power3.out" } })
      .to(q(".sp-shade"), { opacity: 1, duration: 0.45 })
      .to(q(".sp-media"), { scale: 1.08, duration: 0.9, ease: "power2.out" }, 0)
      .to(q(".sp-reveal"), { height: "auto", duration: 0.55, ease: "power3.inOut" }, 0)
      .fromTo(q(".sp-line"), { scaleX: 0 }, { scaleX: 1, duration: 0.5 }, 0.08)
      .fromTo(
        q(".sp-desc-word"),
        { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.012 },
        0.1
      )
      .fromTo(q(".sp-cta"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45 }, 0.28);
    hoverTlsRef.current[i] = tl;
    return tl;
  };

  const onCardEnter = (i: number) => {
    if (i !== indexRef.current) return;
    hoveringRef.current = true;
    autoplayRef.current?.pause();
    getHoverTl(i)?.timeScale(1).play();
  };

  const onCardLeave = (i: number) => {
    if (!hoveringRef.current) return;
    hoveringRef.current = false;
    autoplayRef.current?.resume();
    getHoverTl(i)?.timeScale(1.6).reverse();
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[90] overflow-hidden"
      style={{ visibility: "hidden" }}
      aria-hidden={!active}
    >
      {/* Grey strips */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: STRIP_COUNT }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              stripsRef.current[i] = el;
            }}
            className="relative h-full flex-1 will-change-transform"
            style={{
              background: BG,
              transformOrigin: i % 2 === 0 ? "top" : "bottom",
              marginLeft: i === 0 ? 0 : -1,
            }}
          />
        ))}
      </div>

      {/* Soft vignette for depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 35%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 55%), radial-gradient(140% 90% at 50% 110%, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 60%)",
        }}
      />

      <div className="relative flex h-full w-full flex-col items-center px-5 pt-[7vh] pb-[4vh] sm:px-8">
        {/* Header */}
        <div
          className="flex flex-col items-center text-center"
          style={{
            transform: `translate3d(0, ${LAYOUT.headerY}px, 0) scale(${LAYOUT.headerScale})`,
            transformOrigin: "top center",
          }}
        >
          <div ref={eyebrowRef} className="mb-3 inline-flex items-center gap-3 text-[10px] font-semibold text-white/85 uppercase sm:mb-4 sm:text-[11px]">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-white/70 sm:w-10" />
            Spaces We Transform
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-white/70 sm:w-10" />
          </div>

          <h2 className="max-w-[18ch] text-[30px] leading-[1.08] font-bold tracking-[-0.025em] text-white sm:max-w-none sm:text-5xl lg:text-[58px]">
            {TITLE.split(" ").map((word, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <span
                  ref={(el) => {
                    titleWordsRef.current[i] = el;
                  }}
                  className="inline-block origin-bottom-left will-change-transform"
                >
                  {word}
                  {" "}
                </span>
              </span>
            ))}
          </h2>

          <p className="mt-3 max-w-[640px] text-[13px] leading-[1.6] font-normal text-[#141416]/85 sm:mt-4 sm:text-[15px]">
            {SUBTITLE.split(" ").map((word, i) => (
              <span
                key={i}
                ref={(el) => {
                  subWordsRef.current[i] = el;
                }}
                className="inline-block will-change-transform"
              >
                {word}
                {" "}
              </span>
            ))}
          </p>
        </div>

        {/* Carousel stage */}
        <div
          className="relative mt-[4vh] w-full flex-1"
          style={{ perspective: "1600px", transform: `scale(${LAYOUT.cardsScale})`, transformOrigin: "center center" }}
        >
          {SPACES.map((space, i) => {
            const isActive = i === index;
            return (
              <div
                key={space.title}
                ref={(el) => {
                  cardsRef.current[i] = el;
                }}
                onMouseEnter={() => onCardEnter(i)}
                onMouseMove={() => !hoveringRef.current && onCardEnter(i)}
                onMouseLeave={() => onCardLeave(i)}
                onClick={() => !isActive && goTo(i)}
                className={`absolute top-1/2 left-1/2 h-[min(50vh,540px)] min-h-[270px] w-[min(62vw,calc(min(50vh,540px)*0.64))] min-w-[196px] overflow-hidden rounded-[28px] will-change-transform sm:rounded-[34px] ${
                  isActive ? "cursor-default" : "cursor-pointer"
                }`}
                style={{
                  transformStyle: "preserve-3d",
                  boxShadow: "0 40px 80px -30px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08) inset",
                }}
              >
                {/* Empty image slot */}
                <div
                  className="sp-media absolute inset-0 will-change-transform"
                  style={{
                    background:
                      "radial-gradient(90% 60% at 30% 15%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 60%), linear-gradient(165deg, #3a3a3f 0%, #1f1f23 55%, #121214 100%)",
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="h-10 w-10 text-white/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <rect x="3" y="4" width="18" height="16" rx="3" />
                      <circle cx="9" cy="10" r="2" />
                      <path d="m21 16-5-5-9 9" />
                    </svg>
                  </div>
                </div>

                {/* Hover shade */}
                <div
                  className="sp-shade pointer-events-none absolute inset-0 opacity-0"
                  style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.9) 100%)" }}
                />

                {/* Index */}
                <div className="absolute top-5 left-5 text-[11px] font-semibold tracking-[0.24em] text-white/60 sm:top-6 sm:left-6">
                  {String(i + 1).padStart(2, "0")}
                </div>

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                  <h3 className="sp-title text-[19px] leading-[1.15] font-semibold tracking-[-0.01em] text-white sm:text-[23px]">
                    {space.title}
                  </h3>
                  <div className="sp-reveal h-0 overflow-hidden">
                  <div className="sp-line mt-3 h-px w-12 origin-left bg-white/60" style={{ transform: "scaleX(0)" }} />
                  <p className="mt-3 text-[12.5px] leading-[1.55] font-light text-white/85 sm:text-[13.5px]">
                    {space.desc.split(" ").map((w, k) => (
                      <span key={k} className="inline-block overflow-hidden align-bottom">
                        <span className="sp-desc-word inline-block opacity-0">
                          {w}
                          {" "}
                        </span>
                      </span>
                    ))}
                  </p>
                  <div className="sp-cta mt-4 inline-flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.22em] text-white uppercase opacity-0">
                    Explore
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17 17 7M8 7h9v9" />
                    </svg>
                  </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div ref={controlsRef} className="mt-[3vh] flex items-center gap-5 sm:gap-7">
          <button
            type="button"
            aria-label="Previous space"
            onClick={() => goTo(indexRef.current - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 text-white transition-colors duration-300 hover:bg-white hover:text-[#141416]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            {SPACES.map((s, i) => (
              <button
                key={s.title}
                type="button"
                aria-label={`Show ${s.title}`}
                onClick={() => goTo(i)}
                className={`relative h-[3px] overflow-hidden rounded-full bg-white/30 transition-[width] duration-500 ${
                  i === index ? "w-10 sm:w-14" : "w-3 sm:w-4"
                }`}
              >
                {i === index && (
                  <div ref={progressRef} className="absolute inset-0 origin-left bg-white" style={{ transform: "scaleX(0)" }} />
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-label="Next space"
            onClick={() => goTo(indexRef.current + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 text-white transition-colors duration-300 hover:bg-white hover:text-[#141416]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
