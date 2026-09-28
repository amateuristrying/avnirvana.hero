"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type React from "react";
import Image from "next/image";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { DOMAINS_HEAD } from "@/components/v3/content";
import { gsap, headDrift, headIn, once, useMotion } from "@/components/v3/motion";
import { SectionHead } from "@/components/v3/ui";
import styles from "./DomainsScreen.module.css";

interface Domain {
  title: string;
  /** The open card's title, broken where it reads best. */
  lines: [string, string];
  tag: string;
  desc: string;
  /** Card colour. */
  card: string;
  /** Existing illustration-only PNG, in card order. */
  illustration: { src: string; width: number; height: number };
}

const DOMAINS: Domain[] = [
  {
    title: "Home & Smart Living",
    lines: ["Home &", "Smart Living"],
    tag: "Residential",
    desc: "Private cinemas, multi-room audio and seamless automation, crafted around the way you live.",
    card: "#EBE9E4",
    illustration: { src: "/domains/1.png", width: 1032, height: 538 },
  },
  {
    title: "Auditoriums & Event Spaces",
    lines: ["Auditoriums &", "Event Spaces"],
    tag: "Venues",
    desc: "Line arrays, projection and stage control engineered so every seat gets the best experience.",
    card: "#BDB9B8",
    illustration: { src: "/domains/2.png", width: 1091, height: 544 },
  },
  {
    title: "Retail & Lifestyle Spaces",
    lines: ["Retail &", "Lifestyle Spaces"],
    tag: "Retail",
    desc: "Curated background music, digital signage and ambience that shape how customers feel.",
    card: "#A5B1A1",
    illustration: { src: "/domains/3.png", width: 1081, height: 542 },
  },
  {
    title: "Corporate & Commercial Spaces",
    lines: ["Corporate &", "Commercial Spaces"],
    tag: "Workplace",
    desc: "Boardrooms, collaboration suites and building-wide AV that keep teams effortlessly connected.",
    card: "#D1C5A1",
    illustration: { src: "/domains/4.png", width: 1090, height: 546 },
  },
  {
    title: "Hospitality & Leisure",
    lines: ["Hospitality", "& Leisure"],
    tag: "Hospitality",
    desc: "Zoned audio, lighting scenes and entertainment systems for hotels, bars, clubs and resorts.",
    card: "#F1F0B2",
    illustration: { src: "/domains/5.png", width: 1118, height: 550 },
  },
  {
    title: "Education & Institutions",
    lines: ["Education &", "Institutions"],
    tag: "Education",
    desc: "Smart classrooms, lecture capture and campus-wide AV that elevate the way people learn.",
    card: "#B3AB9E",
    illustration: { src: "/domains/6.png", width: 1115, height: 593 },
  },
];

const N = DOMAINS.length;

/** Spring stiffness for the card widths (rad/s, critically damped). */
const OMEGA = 10;
/** Parallax reach, in px, as the cursor moves over the page. */
const DRIFT_X = 16;
const DRIFT_Y = 10;

interface Geometry {
  vertical: boolean;
  gap: number;
  slim: number;
  big: number;
  /** Card size across the row. */
  cross: number;
  /** Stage length along the row. */
  main: number;
}

function smoothstep(e0: number, e1: number, v: number) {
  const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/**
 * The Domains carousel, reused from the Prism branch as a section of the v3
 * page: six slim cards that widen on hover to reveal their details and
 * illustration. It runs (frame loop, parallax, arrow keys) only while it is
 * on screen. As it arrives the head rises in and the cards stand up one after
 * another, left to right.
 */
export default function DomainsScreen() {
  const reduced = useReducedMotion();
  const [vertical, setVertical] = useState(false);
  const [touch, setTouch] = useState(false);
  const [active, setActive] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const slimRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const detailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dimRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const geoRef = useRef<Geometry | null>(null);
  const hoverRef = useRef(-1);
  const keyboardRef = useRef(false);
  const sizes = useRef<number[]>(Array(N).fill(0));
  const vels = useRef<number[]>(Array(N).fill(0));
  const written = useRef<number[]>(Array(N).fill(-1));
  const opens = useRef<number[]>(Array(N).fill(-1));
  const offX = useRef<number[]>(Array(N).fill(0));
  const offY = useRef<number[]>(Array(N).fill(0));
  /** Slide along the row that keeps an open card on screen (spring state). */
  const shift = useRef({ x: 0, v: 0, written: 0 });
  const pointer = useRef({ x: 0, y: 0, nx: 0, ny: 0, has: false });
  const leaveTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(leaveTimer.current);
    },
    [],
  );

  useMotion(sectionRef, (root) => {
    const head = root.querySelector(".v3-head");
    headIn(head);
    headDrift(root, head, 32);
    // The cards, not their slots: the frame loop owns the slots' transforms.
    const tl = gsap.timeline({ scrollTrigger: once(stageRef.current, "top 88%") });
    tl.fromTo(
      cardRefs.current,
      { autoAlpha: 0, yPercent: 24 },
      { autoAlpha: 1, yPercent: 0, duration: 1.35, ease: "expo.out", stagger: 0.08, clearProps: "transform" },
      0,
    );
    tl.fromTo(
      root.querySelector(".v3-domains-hint"),
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", clearProps: "transform" },
      0.6,
    );
  });

  // Run only while a meaningful part of the section is on screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      rootMargin: "-20% 0px -20% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // --- Layout ----------------------------------------------------------------
  const measure = useCallback(() => {
    const stage = stageRef.current;
    const row = rowRef.current;
    if (!stage || !row) return;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const vert = W < 820;
    let g: Geometry;
    if (!vert) {
      const gap = W > 1100 ? 14 : 12;
      const slim = Math.min(160, Math.floor((W - 80) / 6));
      const big = clamp(W - 5 * (slim + gap) - gap, 380, 640);
      g = { vertical: false, gap, slim, big, cross: clamp(H, 280, 540), main: W };
    } else {
      const gap = 8;
      const slim = clamp(Math.round((H - 6 * gap) * 0.1), 46, 60);
      const cross = Math.min(W, 560);
      const base = clamp(H - 5 * (slim + gap) - gap, 190, 340);
      // Retain the stacked carousel; give only the open card room for its art.
      const artwork = Math.min((cross - 40) * (593 / 1115), 260);
      const big = Math.min(base + artwork + 20, Math.max(base, H - gap));
      g = { vertical: true, gap, slim, big, cross, main: H };
    }
    const prev = geoRef.current;
    geoRef.current = g;
    if (!prev || prev.vertical !== g.vertical) {
      setVertical(g.vertical);
      // The slide moves to the other axis: rewrite it on the next frame.
      shift.current.written = Number.POSITIVE_INFINITY;
    }
    row.style.setProperty("--g", `${g.gap}px`);
    row.style.setProperty("--slim", `${g.slim}px`);
    // On shorter desktops the existing cards already fill the stage. Its
    // surrounding margin still allows a small, visible vertical expansion.
    row.style.setProperty("--reveal-growth", `${clamp(H - g.cross, 24, 96)}px`);
    slotRefs.current.forEach((slot) => {
      if (!slot) return;
      if (g.vertical) {
        slot.style.width = `${g.cross}px`;
      } else {
        slot.style.height = `${g.cross}px`;
      }
    });
    detailRefs.current.forEach((el) => {
      if (!el) return;
      el.style.width = g.vertical ? "100%" : `${g.big}px`;
      el.style.height = g.vertical ? `${g.big}px` : "100%";
    });
    // Rest the springs on the new sizes; the frame loop writes them.
    for (let k = 0; k < N; k++) {
      const target = hoverRef.current === k ? g.big : g.slim;
      if (!prev || prev.vertical !== g.vertical || sizes.current[k] === 0) {
        sizes.current[k] = target;
        vels.current[k] = 0;
      }
      written.current[k] = -1;
      opens.current[k] = -1;
      // Lay each slot out at its resting size now: the frame loop only runs
      // while the section is on screen, and the row must already have its
      // shape when the reader arrives.
      const slot = slotRefs.current[k];
      if (slot) {
        const len = `${(sizes.current[k] + g.gap).toFixed(2)}px`;
        if (g.vertical) slot.style.height = len;
        else slot.style.width = len;
      }
    }
  }, []);

  useLayoutEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    // The head above the stage can settle late (web fonts), resizing the
    // stage without a window resize.
    const ro = new ResizeObserver(onResize);
    if (stageRef.current) ro.observe(stageRef.current);
    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [measure]);

  // A layout change swaps which axis the slots size on.
  useLayoutEffect(() => {
    slotRefs.current.forEach((slot) => {
      if (!slot) return;
      slot.style.width = "";
      slot.style.height = "";
    });
    measure();
  }, [vertical, measure]);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    const sync = () => setTouch(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // --- Hover ---------------------------------------------------------------------
  const setHover = useCallback(
    (i: number) => {
      window.clearTimeout(leaveTimer.current);
      if (hoverRef.current === i) return;
      hoverRef.current = i;
      dimRefs.current.forEach((el, k) => {
        if (el) el.style.opacity = i >= 0 && k !== i ? "1" : "0";
      });
      cardRefs.current.forEach((el, k) => {
        el?.setAttribute("data-open", String(k === i));
        el?.setAttribute("aria-expanded", String(k === i));
      });
    },
    [],
  );

  const onSlotEnter = (i: number) => (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || keyboardRef.current) return;
    window.clearTimeout(leaveTimer.current);
    setHover(i);
  };
  const onSlotMove = (i: number) => (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || (!e.movementX && !e.movementY)) return;
    keyboardRef.current = false;
    setHover(i);
  };
  const onRowLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || keyboardRef.current) return;
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setHover(-1), 110);
  };
  const onSlotTap = (i: number) => (e: React.MouseEvent) => {
    const pointerType = (e.nativeEvent as PointerEvent).pointerType;
    if (!touch && pointerType !== "touch" && pointerType !== "pen" && e.detail !== 0) return;
    setHover(hoverRef.current === i ? -1 : i);
  };
  const onRowBlur = (e: React.FocusEvent) => {
    if (!rowRef.current?.contains(e.relatedTarget as Node | null)) setHover(-1);
  };

  // Keyboard: arrows walk the row while Domains is open.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Escape") return;
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      keyboardRef.current = true;
      if (e.key === "Escape") {
        setHover(-1);
        return;
      }
      const cur = hoverRef.current;
      const next = e.key === "ArrowRight" ? (cur + 1 + N) % N : cur < 0 ? N - 1 : (cur - 1 + N) % N;
      cardRefs.current[next]?.focus({ preventScroll: true });
      setHover(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, setHover]);

  // --- Frame loop: widths, content reveal, parallax --------------------------------
  useEffect(() => {
    if (!active) return;
    const P = pointer.current;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (keyboardRef.current && (e.movementX || e.movementY)) {
        keyboardRef.current = false;
        if (!rowRef.current?.contains(e.target as Node)) setHover(-1);
      }
      P.x = e.clientX;
      P.y = e.clientY;
      P.nx = (e.clientX / window.innerWidth) * 2 - 1;
      P.ny = (e.clientY / window.innerHeight) * 2 - 1;
      P.has = true;
    };
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) P.has = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onOut);

    let raf = 0;
    let last = performance.now();
    let stageRect = stageRef.current?.getBoundingClientRect();
    let rectAge = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      let dt = (now - last) / 1000;
      last = now;
      if (!(dt > 0)) return;
      if (dt > 0.05) dt = 0.05;
      const g = geoRef.current;
      if (!g) return;
      const hv = hoverRef.current;
      const S = sizes.current;
      const V = vels.current;
      let rowLen = 0;

      for (let k = 0; k < N; k++) {
        const target = hv === k ? g.big : g.slim;
        let x = S[k];
        let v = V[k];
        if (reduced || (Math.abs(x - target) < 0.05 && Math.abs(v) < 0.05)) {
          x = target;
          v = 0;
        } else {
          // Exact critically damped step: stable at any frame time and keeps
          // its velocity when the target changes mid-flight.
          const y = x - target;
          const e = Math.exp(-OMEGA * dt);
          const j = (v + OMEGA * y) * dt;
          x = target + (y + j) * e;
          v = (v - j * OMEGA) * e;
        }
        S[k] = x;
        V[k] = v;
        rowLen += x + g.gap;

        if (Math.abs(x - written.current[k]) > 0.01) {
          written.current[k] = x;
          const slot = slotRefs.current[k];
          if (slot) {
            if (g.vertical) slot.style.height = `${(x + g.gap).toFixed(2)}px`;
            else slot.style.width = `${(x + g.gap).toFixed(2)}px`;
          }
        }
        const open = clamp((x - g.slim) / (g.big - g.slim || 1), 0, 1);
        if (Math.abs(open - opens.current[k]) > 0.001) {
          opens.current[k] = open;
          const slim = slimRefs.current[k];
          const det = detailRefs.current[k];
          if (slim) slim.style.opacity = String(1 - smoothstep(0, 0.28, open));
          if (det) {
            const d = smoothstep(0.42, 0.95, open);
            det.style.opacity = String(d);
            det.style.transform = `translate3d(0, ${((1 - smoothstep(0.42, 1, open)) * 14).toFixed(2)}px, 0)`;
            det.style.visibility = d > 0.001 ? "visible" : "hidden";
          }
        }
      }

      // At rest the cards fill the row, so an open card overflows it. Centring
      // that overflow would clip an end card; instead the row slides just
      // enough to keep the open card inside the stage, and the cards beyond it
      // run off the far edge.
      let shiftTarget = 0;
      // Taller illustrated cards may send neighbouring mobile cards beyond
      // the stage. Clip that excess before it reaches the heading or hint.
      const stage = stageRef.current;
      const overflow = g.vertical && rowLen > g.main + 0.5 ? "true" : "false";
      if (stage && stage.dataset.overflow !== overflow) stage.dataset.overflow = overflow;
      if (rowLen > g.main + 0.5) {
        const natural = (g.main - rowLen) / 2;
        let lead = natural;
        if (hv >= 0) {
          let start = 0;
          for (let k = 0; k < hv; k++) start += S[k] + g.gap;
          lead = clamp(natural, -start, g.main - (start + S[hv] + g.gap));
        }
        shiftTarget = lead - natural;
      }
      const sh = shift.current;
      if (reduced) {
        sh.x = shiftTarget;
        sh.v = 0;
      } else {
        const y = sh.x - shiftTarget;
        const e = Math.exp(-OMEGA * dt);
        const j = (sh.v + OMEGA * y) * dt;
        sh.x = shiftTarget + (y + j) * e;
        sh.v = (sh.v - j * OMEGA) * e;
      }
      if (Math.abs(sh.x - sh.written) > 0.01) {
        sh.written = sh.x;
        const row = rowRef.current;
        if (row) {
          row.style.transform = g.vertical
            ? `translate3d(0, ${sh.x.toFixed(2)}px, 0)`
            : `translate3d(${sh.x.toFixed(2)}px, 0, 0)`;
        }
      }

      // Parallax: the row leans after the cursor, each card at its own pace
      if (reduced || touch) return;
      if ((rectAge += dt) > 0.5 || !stageRect) {
        stageRect = stageRef.current?.getBoundingClientRect();
        rectAge = 0;
      }
      if (!stageRect) return;
      const centreMain = g.vertical ? stageRect.top + stageRect.height / 2 : stageRect.left + stageRect.width / 2;
      const cursorMain = (g.vertical ? P.y : P.x) - centreMain;
      const tx = P.has && hv < 0 ? P.nx * DRIFT_X : 0;
      const ty = P.has && hv < 0 ? P.ny * DRIFT_Y : 0;
      let along = -rowLen / 2 + sh.x;
      for (let k = 0; k < N; k++) {
        const len = S[k] + g.gap;
        const centre = along + len / 2;
        along += len;
        let gx = tx;
        let gy = ty;
        let rate = 5;
        if (hv >= 0) {
          gx = offX.current[hv];
          gy = offY.current[hv];
          if (k === hv) continue;
        } else {
          const d = cursorMain - centre;
          const influence = P.has ? Math.exp(-(d * d) / (2 * 240 * 240)) : 0;
          rate = 2 + 3.6 * influence;
        }
        const f = 1 - Math.exp(-rate * dt);
        const nx = offX.current[k] + (gx - offX.current[k]) * f;
        const ny = offY.current[k] + (gy - offY.current[k]) * f;
        if (Math.abs(nx - offX.current[k]) < 0.005 && Math.abs(ny - offY.current[k]) < 0.005) continue;
        offX.current[k] = nx;
        offY.current[k] = ny;
        const slot = slotRefs.current[k];
        if (slot) slot.style.transform = `translate3d(${nx.toFixed(2)}px, ${ny.toFixed(2)}px, 0)`;
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onOut);
      P.has = false;
    };
  }, [active, reduced, touch, setHover]);

  return (
    <section
      id="domains"
      ref={sectionRef}
      aria-labelledby="domains-title"
      className="v3-domains text-white"
      data-motion
      onPointerDown={(e) => {
        keyboardRef.current = false;
        if (touch && !rowRef.current?.contains(e.target as Node)) setHover(-1);
      }}
    >
      <div className="v3-domains-inner">
        <SectionHead
          tag={DOMAINS_HEAD.tag}
          a={DOMAINS_HEAD.a}
          b={DOMAINS_HEAD.b}
          align="left"
          titleId="domains-title"
          aside={<p className="v3-lead">{DOMAINS_HEAD.lead}</p>}
        />

        <div
          ref={stageRef}
          className={`${styles.stage} v3-domains-stage relative my-4 flex min-h-0 flex-1 items-center justify-center sm:my-5`}
        >
          <div
            ref={rowRef}
            className={`flex ${vertical ? "flex-col" : "flex-row"}`}
            onPointerLeave={onRowLeave}
            onBlur={onRowBlur}
          >
            {DOMAINS.map((d, i) => (
              <div
                key={d.title}
                ref={(el) => {
                  slotRefs.current[i] = el;
                }}
                className="relative shrink-0 will-change-transform"
                onPointerEnter={onSlotEnter(i)}
                onPointerMove={onSlotMove(i)}
                onClick={onSlotTap(i)}
              >
                <article
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={d.title}
                  aria-expanded="false"
                  aria-controls={`domain-details-${i + 1}`}
                  data-open="false"
                  data-layout={vertical ? "vertical" : "horizontal"}
                  onFocus={(e) => {
                    // A touch-induced focus must not open and then immediately
                    // close the card again when its click event arrives.
                    if (e.currentTarget.matches(":focus-visible")) {
                      keyboardRef.current = true;
                      setHover(i);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    e.stopPropagation();
                    keyboardRef.current = true;
                    setHover(hoverRef.current === i ? -1 : i);
                  }}
                  className={`${styles.card} font-swiss absolute overflow-hidden rounded-[18px] text-[#020303] shadow-[0_40px_80px_-38px_rgba(0,0,0,0.8)] outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                    vertical
                      ? "inset-x-0 top-[calc(var(--g)/2)] bottom-[calc(var(--g)/2)]"
                      : "left-[calc(var(--g)/2)] right-[calc(var(--g)/2)]"
                  }`}
                  style={{ backgroundColor: d.card }}
                >
                  {/* Index: stays put whether the card is slim or open. */}
                  <span
                    className={`absolute left-5 text-[12px] font-medium tabular-nums leading-none ${
                      vertical ? "top-[calc(var(--slim)/2)] -translate-y-1/2" : "top-5"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Slim: just the name, running up the strip. */}
                  <span
                    ref={(el) => {
                      slimRefs.current[i] = el;
                    }}
                    className={`absolute whitespace-nowrap text-[12.5px] font-medium uppercase leading-none tracking-[0.01em] ${
                      vertical
                        ? "left-14 top-[calc(var(--slim)/2)] -translate-y-1/2"
                        : "bottom-5 left-[17px] rotate-180 [writing-mode:vertical-rl]"
                    }`}
                  >
                    {d.title}
                  </span>

                  {/* Open: the details, laid out at full width so nothing
                      reflows while the card grows; the card clips them. */}
                  <div
                    id={`domain-details-${i + 1}`}
                    ref={(el) => {
                      detailRefs.current[i] = el;
                    }}
                    className={`@container absolute left-0 top-0 flex flex-col justify-between ${
                      vertical ? "p-5 pt-[calc(var(--slim)/2_-_6px)]" : "p-6 sm:p-7"
                    }`}
                    style={{ opacity: 0, visibility: "hidden" }}
                  >
                    <div className="flex shrink-0 justify-end">
                      <span className="text-[12px] font-medium uppercase leading-none tracking-[0.01em]">{d.tag}</span>
                    </div>
                    <div className={styles.illustration} aria-hidden="true">
                      <Image
                        src={d.illustration.src}
                        width={d.illustration.width}
                        height={d.illustration.height}
                        alt=""
                        unoptimized
                        draggable={false}
                        loading={active ? "eager" : "lazy"}
                        className={styles.image}
                      />
                    </div>
                    <div className="shrink-0">
                      <h3
                        className={`font-medium uppercase leading-[0.93] tracking-[-0.035em] ${
                          vertical ? "text-[min(34px,8.4cqw)]" : "text-[min(52px,9.2cqw)]"
                        }`}
                      >
                        <span className="block">{d.lines[0]}</span>
                        <span className="block">{d.lines[1]}</span>
                      </h3>
                      <p
                        className={`max-w-[36ch] font-normal leading-[1.45] text-[#020303]/70 ${
                          vertical ? "mt-3 text-[13px]" : "mt-4 text-[14.5px]"
                        }`}
                      >
                        {d.desc}
                      </p>
                    </div>
                  </div>

                  {/* Dims the cards that are not open. */}
                  <span
                    ref={(el) => {
                      dimRefs.current[i] = el;
                    }}
                    className="pointer-events-none absolute inset-0 bg-[#020303]/[0.14] opacity-0 transition-opacity duration-500"
                  />
                </article>
              </div>
            ))}
          </div>
        </div>

        <p className="v3-domains-hint">
          {touch ? "Tap a domain to explore" : "Hover a domain to explore"}
        </p>
      </div>
    </section>
  );
}
