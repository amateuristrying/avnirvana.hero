"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { PRODUCTS } from "@/components/products/productData";
import { PRODUCTS_HEAD } from "../content";
import { gsap, headDrift, headIn, once, prefersReducedMotion, riseIn, SplitText, useMotion, wipeUp } from "../motion";
import { Disc, SectionHead } from "../ui";

const N = PRODUCTS.length;

/** Where each PNG's visible artwork sits ([x0, y0, x1, y1] as fractions), so
 *  the product itself, not its canvas, lands on the centre line. */
const ART: Record<string, [number, number, number, number]> = {
  "air-c8": [0.089, 0.068, 0.96, 0.93],
  "squareroot-6-5": [0.204, 0.039, 0.949, 0.982],
  "pl-30": [0.01, 0, 0.993, 0.953],
  "air-s26": [0.062, 0.132, 0.942, 0.946],
};

/** "RICH, HIGH-FIDELITY SOUND" → "Rich, high-fidelity sound". */
const sentence = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** A slide's copy, in the order it arrives. */
const COPY_PARTS = ".pr-badge, .pr-sub, .pr-desc, .pr-spec";

/** One product change: both slides travel as a single strip. */
const SLIDE_S = 1.05;
const SLIDE_EASE = "expo.inOut";

/** Tabs pattern: arrows step through the products, Home/End jump to the ends. */
const TAB_KEYS: Record<string, (cur: number) => [number, 1 | -1]> = {
  ArrowRight: (cur) => [cur + 1, 1],
  ArrowLeft: (cur) => [cur - 1, -1],
  Home: () => [0, -1],
  End: () => [N - 1, 1],
};

export default function Products() {
  const ref = useRef<HTMLElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabsRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  /** Each slide's title, split into characters once the fonts are in. */
  const charsRef = useRef<Element[][]>([]);
  const entranceRef = useRef<gsap.core.Timeline | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const indexRef = useRef(0);
  const swipeRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const [index, setIndex] = useState(0);

  // ── Entrance ─────────────────────────────────────────────────────────────
  useMotion(ref, (root) => {
    const head = root.querySelector(".v3-head");
    headIn(head);
    headDrift(root, head);
    riseIn(
      gsap.timeline({ scrollTrigger: once(root.querySelector(".pr-picker"), "top 90%") }),
      root.querySelectorAll(".pr-tabs, .pr-arrow"),
      0.35,
      { stagger: 0.08 },
      16,
    );

    charsRef.current = slideRefs.current.map((slide) => {
      const title = slide?.querySelector(".pr-title");
      return title ? SplitText.create(title, { type: "chars" }).chars : [];
    });

    // The panel wipes up, then the current product lands in it: its light
    // blooms, the hardware glides in, the name rises letter by letter.
    const tl = gsap.timeline({ scrollTrigger: once(root.querySelector(".pr-stage"), "top 88%") });
    wipeUp(tl, root.querySelector<HTMLElement>(".pr-stage"), 0, { duration: 1.4 });
    const slide = slideRefs.current[indexRef.current];
    if (slide) {
      tl.fromTo(
        slide.querySelector(".pr-glow"),
        { autoAlpha: 0, scale: 0.6 },
        { autoAlpha: 1, scale: 1, duration: 1.8, ease: "expo.out", clearProps: "transform" },
        0.4,
      );
      tl.fromTo(
        slide.querySelector("[data-art]"),
        { autoAlpha: 0, xPercent: 18, scale: 0.9 },
        { autoAlpha: 1, xPercent: 0, scale: 1, duration: 1.5, ease: "expo.out", clearProps: "transform" },
        0.45,
      );
      tl.fromTo(
        charsRef.current[indexRef.current],
        { autoAlpha: 0, yPercent: 70 },
        { autoAlpha: 1, yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.04 },
        0.55,
      );
      riseIn(tl, slide.querySelectorAll(COPY_PARTS), 0.6, { stagger: 0.07 });
    }
    entranceRef.current = tl;

    return () => {
      tlRef.current?.kill();
      tlRef.current = null;
      entranceRef.current = null;
    };
  });

  // ── Switching ────────────────────────────────────────────────────────────
  // The current product is pushed out as the next one slides in beside it, the
  // two moving as one strip. Inside the incoming slide the hardware travels
  // further than its copy and the copy arrives piece by piece, so the change
  // reads with depth rather than as a flat swap.
  const go = useCallback((target: number, dir: 1 | -1) => {
    const next = ((target % N) + N) % N;
    const cur = indexRef.current;
    if (next === cur) return;

    // Land a switch still in flight (and an entrance not yet played) first.
    entranceRef.current?.progress(1);
    if (tlRef.current) {
      tlRef.current.progress(1).kill();
      tlRef.current = null;
    }
    indexRef.current = next;
    setIndex(next);

    const from = slideRefs.current[cur];
    const to = slideRefs.current[next];
    if (!from || !to || prefersReducedMotion()) return;

    const fromArt = from.querySelector("[data-art]");
    const toArt = to.querySelector("[data-art]");
    const toGlow = to.querySelector(".pr-glow");
    const toParts = to.querySelectorAll(COPY_PARTS);
    const chars = charsRef.current[next] ?? [];

    // Inactive slides are hidden by CSS; keep the outgoing one up while it leaves.
    gsap.set(from, { visibility: "visible" });
    const tl = gsap.timeline({
      defaults: { duration: SLIDE_S, ease: SLIDE_EASE },
      onComplete: () => {
        gsap.set([from, fromArt], { clearProps: "all" });
        if (tlRef.current === tl) tlRef.current = null;
      },
    });
    // The outgoing slide runs a little past a full width, so nothing of it is
    // left in the stage's padding, and fades as it goes.
    tl.to(from, { xPercent: -dir * 112 }, 0)
      .to(from, { opacity: 0, ease: "power2.in" }, 0)
      .to(fromArt, { xPercent: -dir * 30, scale: 0.9 }, 0)
      .fromTo(to, { xPercent: dir * 100, opacity: 0 }, { xPercent: 0, opacity: 1, clearProps: "transform,opacity" }, 0)
      .fromTo(toArt, { xPercent: dir * 40, scale: 0.9 }, { xPercent: 0, scale: 1, clearProps: "transform" }, 0)
      .fromTo(toParts, { x: dir * 80 }, { x: 0, stagger: 0.035, clearProps: "transform" }, 0)
      .fromTo(
        toGlow,
        { autoAlpha: 0, scale: 0.6 },
        { autoAlpha: 1, scale: 1, duration: 1.5, ease: "expo.out", clearProps: "transform" },
        0.35,
      );
    if (chars.length) {
      tl.fromTo(
        chars,
        { x: dir * 50 },
        { x: 0, stagger: { each: 0.025, from: dir > 0 ? "start" : "end" }, clearProps: "transform" },
        0,
      );
    }
    tlRef.current = tl;
  }, []);

  // ── Tab thumb: the black pill glides to the selected tab ─────────────────
  const placeThumb = useCallback((i: number, animate: boolean) => {
    const tab = tabRefs.current[i];
    const thumb = thumbRef.current;
    const tabs = tabsRef.current;
    if (!tab || !thumb || !tabs) return;
    const box = { x: tab.offsetLeft, y: tab.offsetTop, width: tab.offsetWidth, height: tab.offsetHeight };
    if (animate && !prefersReducedMotion()) {
      gsap.to(thumb, { ...box, duration: 0.75, ease: "expo.out", overwrite: true });
    } else {
      gsap.set(thumb, box);
    }
    // Keep the selected tab in view where the row scrolls (phones).
    if (tabs.scrollWidth > tabs.clientWidth) {
      const left = tab.offsetLeft - (tabs.clientWidth - tab.offsetWidth) / 2;
      tabs.scrollTo({ left: Math.max(0, left), behavior: animate ? "smooth" : "auto" });
    }
  }, []);

  const placed = useRef(false);
  useLayoutEffect(() => {
    placeThumb(index, placed.current);
    placed.current = true;
  }, [index, placeThumb]);

  // Fonts and resizes change the tabs' widths under the thumb.
  useEffect(() => {
    const tabs = tabsRef.current;
    if (!tabs) return;
    const ro = new ResizeObserver(() => placeThumb(indexRef.current, false));
    ro.observe(tabs);
    document.fonts?.ready.then(() => placeThumb(indexRef.current, false));
    return () => ro.disconnect();
  }, [placeThumb]);

  // Warm the other products' artwork once the section is close.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        PRODUCTS.forEach((p) => {
          const img = new Image();
          img.src = p.imageSrc;
        });
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /** The pressed arrow gives a little. */
  const press = (el: HTMLElement) => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(el, { scale: 0.86 }, { scale: 1, duration: 0.6, ease: "back.out(3)", clearProps: "transform", overwrite: true });
  };

  const onTabsKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const move = TAB_KEYS[e.key];
    if (!move) return;
    e.preventDefault();
    const [target, dir] = move(indexRef.current);
    const next = (target + N) % N;
    go(next, dir);
    tabRefs.current[next]?.focus();
  };

  // Swipe (touch and pen) on the stage; the stage leaves vertical panning to
  // the page (touch-action: pan-y).
  const onStageDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    swipeRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onStageUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = swipeRef.current;
    swipeRef.current = null;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    const dir = dx < 0 ? 1 : -1;
    go(indexRef.current + dir, dir);
  };

  return (
    <section id="products" ref={ref} className="v3-section pr" aria-labelledby="products-title" data-motion>
      <div className="v3-wrap">
        <SectionHead
          tag={PRODUCTS_HEAD.tag}
          a={PRODUCTS_HEAD.a}
          b={PRODUCTS_HEAD.b}
          align="left"
          titleId="products-title"
          aside={
            <div className="pr-picker">
              <div ref={tabsRef} className="pr-tabs" role="tablist" aria-label="Products" onKeyDown={onTabsKey}>
                <span ref={thumbRef} className="pr-thumb" aria-hidden="true" />
                {PRODUCTS.map((p, i) => (
                  <button
                    key={p.id}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    id={`product-tab-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-controls={`product-panel-${i}`}
                    tabIndex={i === index ? 0 : -1}
                    className="pr-tab"
                    onClick={() => go(i, i > indexRef.current ? 1 : -1)}
                  >
                    <span className="pr-tab-n">{String(i + 1).padStart(2, "0")}</span>
                    {p.title}
                  </button>
                ))}
              </div>
              <div className="pr-arrows">
                <button
                  type="button"
                  className="pr-arrow"
                  aria-label="Previous product"
                  onClick={(e) => {
                    press(e.currentTarget);
                    go(indexRef.current - 1, -1);
                  }}
                >
                  <Disc size="nav" className="sp-disc pr-arrow-prev" />
                </button>
                <button
                  type="button"
                  className="pr-arrow"
                  aria-label="Next product"
                  onClick={(e) => {
                    press(e.currentTarget);
                    go(indexRef.current + 1, 1);
                  }}
                >
                  <Disc size="nav" />
                </button>
              </div>
            </div>
          }
        />

        <div
          className="v3-glass pr-stage"
          onPointerDown={onStageDown}
          onPointerUp={onStageUp}
          onPointerCancel={() => {
            swipeRef.current = null;
          }}
        >
          <div className="pr-slides">
            {PRODUCTS.map((p, i) => {
              const [x0, y0, x1, y1] = ART[p.id] ?? [0, 0, 1, 1];
              const centreFix = `translate(${((0.5 - (x0 + x1) / 2) * 100).toFixed(2)}%, ${((0.5 - (y0 + y1) / 2) * 100).toFixed(2)}%)`;
              const active = i === index;
              return (
                <article
                  key={p.id}
                  ref={(el) => {
                    slideRefs.current[i] = el;
                  }}
                  id={`product-panel-${i}`}
                  className="pr-slide"
                  data-active={active}
                  role="tabpanel"
                  aria-labelledby={`product-tab-${i}`}
                  inert={!active}
                >
                  <div className="pr-copy">
                    <span className="pr-badge">{p.badge}</span>
                    <h3 className="pr-title">{p.title}</h3>
                    <p className="pr-sub">{p.subtitle}</p>
                    <p className="pr-desc">{p.description}</p>
                  </div>

                  <div className="pr-visual">
                    <div className="pr-glow" aria-hidden="true" />
                    <div className="pr-art" data-art>
                      <img
                        src={p.imageSrc}
                        alt={p.imageAlt}
                        className="pr-img"
                        style={{ transform: centreFix }}
                        loading={i === 0 ? "eager" : "lazy"}
                        decoding="async"
                        draggable={false}
                      />
                    </div>
                  </div>

                  <ul className="pr-specs">
                    {p.specs.map((spec, k) => (
                      <li key={k} className="pr-spec">
                        <span className="pr-spec-icon" aria-hidden="true">
                          {spec.icon}
                        </span>
                        <span className="pr-spec-text">
                          <span className="pr-spec-t">{sentence(spec.title)}</span>
                          <span className="pr-spec-d">{spec.desc}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
