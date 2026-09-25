"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type React from "react";
import gsap from "gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { PRODUCTS } from "./productData";
import ProductParticles, { type ContentBox, type Motif } from "./ProductParticles";

/**
 * Light-theme take on each product: particle motif, deep palette that reads
 * on white, accent for type and icons, and where the artwork actually sits
 * inside its PNG (several are off-centre), so both the image and the
 * particles centre on the product rather than on the file.
 */
const LIGHT: Record<string, { motif: Motif; palette: [string, string, string, string]; accent: string; box: ContentBox }> = {
  "air-c8": {
    motif: "waves",
    palette: ["#0f2a5c", "#1d4ed8", "#60a5fa", "#475569"],
    accent: "#1d4ed8",
    box: [0.089, 0.068, 0.96, 0.93],
  },
  "squareroot-6-5": {
    motif: "ribbon",
    palette: ["#064e3b", "#059669", "#34d399", "#475569"],
    accent: "#059669",
    box: [0.204, 0.039, 0.949, 0.982],
  },
  "pl-30": {
    motif: "inward",
    palette: ["#3b0764", "#7e22ce", "#c084fc", "#475569"],
    accent: "#7e22ce",
    box: [0.01, 0, 0.993, 0.953],
  },
  "air-s26": {
    motif: "helix",
    palette: ["#0c4a6e", "#0284c7", "#38bdf8", "#475569"],
    accent: "#0284c7",
    box: [0.062, 0.132, 0.942, 0.946],
  },
};

const EXIT_S = 0.36;

export default function ProductsLight({
  active,
  covered = false,
  hidden = false,
}: {
  active: boolean;
  /** The next screen is sweeping over: dim the page, clear the content, burst the particles. */
  covered?: boolean;
  /** Fully hidden under another screen: stop the particle loop. */
  hidden?: boolean;
}) {
  const reduced = useReducedMotion();
  // `index` drives the particles immediately; `shown` swaps the content once
  // the outgoing product has faded, so the two never overlap mid-change.
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const headRef = useRef<HTMLDivElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const specsRef = useRef<HTMLDivElement>(null);
  const wasActive = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  const product = PRODUCTS[shown];
  const look = LIGHT[product.id] ?? LIGHT["air-c8"];
  const target = LIGHT[PRODUCTS[index].id] ?? LIGHT["air-c8"];
  const [x0, y0, x1, y1] = look.box;
  // Shift the image so its artwork, not its canvas, sits on the centre line.
  const centreFix = `translate(${(0.5 - (x0 + x1) / 2) * 100}%, ${(0.5 - (y0 + y1) / 2) * 100}%)`;

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + PRODUCTS.length) % PRODUCTS.length);

  // Keyboard paging while the screen is up.
  useEffect(() => {
    if (!active || covered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, covered]);

  // Cover: the page dims to grey (so the next screen's white strips read
  // against it, as they did over the dark site) while the content clears.
  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll<HTMLElement>("[data-cover]");
    const veil = veilRef.current;
    if (!els || !veil) return;
    const d = reduced ? 0 : 1;
    gsap.killTweensOf([...Array.from(els), veil]);
    if (covered) {
      gsap.to(els, { autoAlpha: 0, y: -14, filter: "blur(8px)", duration: 0.45 * d, ease: "power2.in", stagger: 0.03 * d });
      gsap.to(veil, { opacity: 0.5, duration: 0.5 * d, ease: "power2.out" });
    } else {
      gsap.to(veil, { opacity: 0, duration: 0.5 * d, ease: "power2.inOut" });
      gsap.to(els, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.7 * d,
        ease: "power3.out",
        stagger: 0.04 * d,
        delay: 0.15 * d,
        // Leave no filter/transform behind: they would restack the layers
        // the product is sandwiched between.
        clearProps: "filter,transform",
      });
    }
  }, [covered, reduced]);

  // Outgoing product fades, then the content swaps.
  useEffect(() => {
    if (index === shown) return;
    const parts = [headRef.current, specsRef.current];
    if (reduced) {
      setShown(index);
      return;
    }
    const tl = gsap
      .timeline()
      .to(parts, { autoAlpha: 0, y: -10, duration: EXIT_S, ease: "power2.in" }, 0)
      .to(imageWrapRef.current, { autoAlpha: 0, scale: 0.94, duration: EXIT_S, ease: "power2.in" }, 0);
    // Commit on a timer rather than onComplete, which a backgrounded tab can stall.
    const commit = setTimeout(() => setShown(index), EXIT_S * 1000 + 40);
    return () => {
      tl.kill();
      clearTimeout(commit);
    };
  }, [index, shown, reduced]);

  // Incoming product (and the first arrival on the screen).
  useLayoutEffect(() => {
    if (!active) {
      wasActive.current = false;
      return;
    }
    // On arrival, wait for the band to start lifting.
    const arriving = !wasActive.current;
    wasActive.current = true;
    const head = headRef.current;
    const specs = specsRef.current?.children;
    const image = imageWrapRef.current;
    if (!head || !specs || !image) return;
    if (reduced) {
      gsap.set([head, image, ...Array.from(specs)], { autoAlpha: 1, y: 0, scale: 1 });
      return;
    }
    const tl = gsap
      .timeline({ delay: arriving ? 0.3 : 0 })
      .fromTo(head, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0)
      .fromTo(image, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 1, ease: "power3.out" }, 0.08)
      .fromTo(
        Array.from(specs),
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.07 },
        0.25,
      );
    gsap.set(specsRef.current, { autoAlpha: 1, y: 0 });
    return () => {
      tl.kill();
    };
  }, [shown, active, reduced]);

  return (
    <section
      ref={sectionRef}
      aria-label="Products"
      aria-hidden={!active}
      className={`fixed inset-0 z-[120] overflow-hidden bg-white text-[#0d0d12] ${
        active ? "visible" : "pointer-events-none invisible"
      }`}
    >
      {/* Barely-there vignette so the white has some depth. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_58%,#ffffff_0%,#ffffff_42%,#eef0f4_100%)]" />

      <ProductParticles
        active={active}
        motif={target.motif}
        palette={target.palette}
        anchorRef={imgRef}
        contentBox={look.box}
        zBase={1}
        scattered={covered}
        paused={hidden}
      />

      {/* Dims the page while the next screen sweeps over it. */}
      <div ref={veilRef} className="pointer-events-none absolute inset-0 z-[5] bg-[#15151c]" style={{ opacity: 0 }} />

      <div className="relative flex h-full flex-col px-5 pb-5 pt-[96px] sm:px-8 sm:pt-[104px] lg:px-14 lg:pb-7">
        {/* Header */}
        <div data-cover className="relative z-[4]">
        <div ref={headRef} className="relative mx-auto flex max-w-[760px] flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <span className="h-px w-8" style={{ background: `linear-gradient(90deg,transparent,${look.accent})` }} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#5c5c68]">
              {product.badge}
            </span>
            <span className="h-px w-8" style={{ background: `linear-gradient(90deg,${look.accent},transparent)` }} />
          </div>
          <h2 className="mt-2 text-[clamp(2.1rem,3.8vw,3.4rem)] font-extrabold leading-[1.04] tracking-[-0.035em]">
            {product.title}
          </h2>
          <p className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.28em] sm:text-[11px]" style={{ color: look.accent }}>
            {product.subtitle}
          </p>
          <p className="mt-2 max-w-[50ch] whitespace-pre-line text-[clamp(0.84rem,0.94vw,0.96rem)] font-light leading-[1.55] text-[#5c5c68]">
            {product.description}
          </p>
        </div>
        </div>

        {/* Product, sandwiched between the two particle canvases */}
        <div data-cover className="relative z-[2] flex min-h-0 flex-1 items-center justify-center py-2">
          <div ref={imageWrapRef} className="will-change-transform">
            {/* The per-product scale-up only applies once there is room for it. */}
            <div className="md:scale-(--s)" style={{ "--s": product.imageScale } as React.CSSProperties}>
              <img
                ref={imgRef}
                key={product.id}
                src={product.imageSrc}
                alt={product.imageAlt}
                draggable={false}
                className="h-[24vh] max-h-[380px] min-h-[150px] w-auto max-w-[62vw] select-none object-contain drop-shadow-[0_28px_36px_rgba(15,23,42,0.22)] sm:h-[32vh] lg:h-[36vh]"
                style={{ transform: centreFix }}
              />
            </div>
          </div>
        </div>

        {/* Specs */}
        <div data-cover className="relative z-[4]">
        <div
          ref={specsRef}
          className="mx-auto grid w-full max-w-[1280px] grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4 lg:gap-x-10"
        >
          {product.specs.map((spec, i) => (
            <div
              key={`${product.id}-${i}`}
              className={`flex items-center gap-2.5 sm:gap-4 ${i < 3 ? "md:border-r md:border-black/10 md:pr-4 lg:pr-6" : ""}`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center sm:h-10 sm:w-10" style={{ color: look.accent }}>
                {spec.icon}
              </div>
              <div className="flex flex-col">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#0d0d12] sm:text-[11.5px] sm:tracking-[0.1em]">
                  {spec.title}
                </h4>
                <p className="mt-0.5 hidden text-[10.5px] font-light leading-[1.38] text-[#5c5c68] sm:block sm:text-[11px]">
                  {spec.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        </div>

        {/* Pager */}
        <div data-cover className="relative z-[4] mt-4 flex items-center justify-center gap-2" role="tablist" aria-label="Products">
          {PRODUCTS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={p.title}
              onClick={() => setIndex(i)}
              className="group flex h-6 items-center"
            >
              <span
                className={`block h-[3px] rounded-full transition-all duration-500 ${
                  i === index ? "w-7" : "w-3 bg-black/15 group-hover:bg-black/30"
                }`}
                style={i === index ? { background: target.accent } : undefined}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Edge arrows */}
      {([-1, 1] as const).map((dir) => (
        <button
          key={dir}
          data-cover
          type="button"
          onClick={() => go(dir)}
          aria-label={dir < 0 ? "Previous product" : "Next product"}
          className={`absolute top-1/2 z-[4] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-[#0d0d12] transition-colors duration-300 hover:bg-black/[0.05] ${
            dir < 0 ? "left-2 sm:left-5 lg:left-8" : "right-2 sm:right-5 lg:right-8"
          }`}
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: dir < 0 ? "scaleX(-1)" : undefined }}
          >
            <path d="m6 6 6 6-6 6M12 6l6 6-6 6" />
          </svg>
        </button>
      ))}
    </section>
  );
}
