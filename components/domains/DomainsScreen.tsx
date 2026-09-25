"use client";

import { Fragment, forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import type React from "react";
import gsap from "gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";

const TITLE = "Sound & Vision, Built for Every Space";
const SUBTITLE =
  "From intelligent homes to immersive commercial environments, we bring audio, video and automation together to transform the way spaces feel and function.";

interface Domain {
  title: string;
  /** The open card's title, broken where it reads best. */
  lines: [string, string];
  tag: string;
  desc: string;
  /** Card colour. */
  card: string;
  /** Topology line colour and page tint while this card is open. */
  line: number;
  bg: string;
}

const DOMAINS: Domain[] = [
  {
    title: "Home & Smart Living",
    lines: ["Home &", "Smart Living"],
    tag: "Residential",
    desc: "Private cinemas, multi-room audio and seamless automation, crafted around the way you live.",
    card: "#EBE9E4",
    line: 0xebe9e4,
    bg: "#171614",
  },
  {
    title: "Auditoriums & Event Spaces",
    lines: ["Auditoriums &", "Event Spaces"],
    tag: "Venues",
    desc: "Line arrays, projection and stage control engineered so every seat gets the best experience.",
    card: "#BDB9B8",
    line: 0xbdb9b8,
    bg: "#1a1516",
  },
  {
    title: "Retail & Lifestyle Spaces",
    lines: ["Retail &", "Lifestyle Spaces"],
    tag: "Retail",
    desc: "Curated background music, digital signage and ambience that shape how customers feel.",
    card: "#A5B1A1",
    line: 0xa5b1a1,
    bg: "#0f1811",
  },
  {
    title: "Corporate & Commercial Spaces",
    lines: ["Corporate &", "Commercial Spaces"],
    tag: "Workplace",
    desc: "Boardrooms, collaboration suites and building-wide AV that keep teams effortlessly connected.",
    card: "#D1C5A1",
    line: 0xd1c5a1,
    bg: "#1c170c",
  },
  {
    title: "Hospitality & Leisure",
    lines: ["Hospitality", "& Leisure"],
    tag: "Hospitality",
    desc: "Zoned audio, lighting scenes and entertainment systems for hotels, bars, clubs and resorts.",
    card: "#F1F0B2",
    line: 0xf1f0b2,
    bg: "#19190a",
  },
  {
    title: "Education & Institutions",
    lines: ["Education &", "Institutions"],
    tag: "Education",
    desc: "Smart classrooms, lecture capture and campus-wide AV that elevate the way people learn.",
    card: "#B3AB9E",
    line: 0xb3ab9e,
    bg: "#1a140f",
  },
];

const N = DOMAINS.length;

/** No card open: the Vanta config as given (color: 0xffffff, backgroundColor: 0x6c5cd9). */
const REST = { line: 0xffffff, bg: "#6c5cd9" };

/** Spring stiffness for the card widths (rad/s, critically damped). */
const OMEGA = 10;
/** How long the background keeps drawing before Domains is opened. */
const WARM_MS = 4500;
/** Parallax reach, in px, as the cursor moves over the page. */
const DRIFT_X = 16;
const DRIFT_Y = 10;

interface VantaEffect {
  options: Record<string, unknown>;
  p5?: {
    draw?: () => void;
    loop: () => void;
    noLoop: () => void;
    drawingContext?: CanvasRenderingContext2D;
  };
  p5canvas?: HTMLCanvasElement;
  req?: number;
  resize: () => void;
  destroy: () => void;
}
type VantaFactory = (opts: Record<string, unknown>) => VantaEffect;

let loader: Promise<{ p5: unknown; TOPOLOGY: VantaFactory }> | null = null;

/** Fetch p5 and the Vanta effect ahead of time; they are only needed here. */
export function preloadDomains() {
  if (!loader) {
    loader = Promise.all([import("p5"), import("vanta/dist/vanta.topology.min")]).then(([p5m, vm]) => ({
      p5: p5m.default ?? p5m,
      TOPOLOGY: (vm.default ?? vm) as VantaFactory,
    }));
    loader.catch(() => {
      loader = null;
    });
  }
  return loader;
}

export interface DomainsHandle {
  /** Back to the entry state: content hidden, every card slim, rest colours. */
  prepare: () => void;
  /** Resolves once the background is drawing (or after a short cap). */
  ready: () => Promise<void>;
  /** Entrance: the title slides up out of its masks and the cards rise in. */
  playIn: () => void;
  /** Root container element for cross-screen transitions. */
  getRoot: () => HTMLElement | null;
}

interface Geometry {
  vertical: boolean;
  gap: number;
  slim: number;
  big: number;
  /** Card size across the row. */
  cross: number;
}

function smoothstep(e0: number, e1: number, v: number) {
  const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const toRgb = (n: number) => ({ r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 });
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

const DomainsScreen = forwardRef<DomainsHandle, { active: boolean; warm: boolean }>(function DomainsScreen(
  { active, warm },
  ref,
) {
  const reduced = useReducedMotion();
  const [vertical, setVertical] = useState(false);
  const [touch, setTouch] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const vantaRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const slimRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const detailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dimRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const activeRef = useRef(active);
  activeRef.current = active;
  const geoRef = useRef<Geometry | null>(null);
  const hoverRef = useRef(-1);
  const sizes = useRef<number[]>(Array(N).fill(0));
  const vels = useRef<number[]>(Array(N).fill(0));
  const written = useRef<number[]>(Array(N).fill(-1));
  const opens = useRef<number[]>(Array(N).fill(-1));
  const offX = useRef<number[]>(Array(N).fill(0));
  const offY = useRef<number[]>(Array(N).fill(0));
  const pointer = useRef({ x: 0, y: 0, nx: 0, ny: 0, has: false });
  const leaveTimer = useRef<number | undefined>(undefined);
  const paletteTimer = useRef<number | undefined>(undefined);
  const lastCardRef = useRef(-1);

  // --- Background (Vanta TOPOLOGY) -----------------------------------------
  const effectRef = useRef<VantaEffect | null>(null);
  const creatingRef = useRef<Promise<void> | null>(null);
  const genRef = useRef(0);
  const runWantRef = useRef(false);
  const pauseTimer = useRef<number | undefined>(undefined);
  const lineCol = useRef(toRgb(REST.line));
  const lineTween = useRef<gsap.core.Tween | null>(null);

  const applyRun = useCallback(() => {
    const p = effectRef.current?.p5;
    if (!p) return;
    if (runWantRef.current) p.loop();
    else p.noLoop();
  }, []);

  /**
   * The effect draws its lines onto a transparent canvas and never clears it.
   * New strokes pick the colour up from `options.color`; strokes already down
   * are repainted in place (source-atop keeps each pixel's coverage), so the
   * whole topology changes colour at once instead of over many seconds.
   */
  const paintLines = useCallback(() => {
    const eff = effectRef.current;
    if (!eff) return;
    const { r, g, b } = lineCol.current;
    const R = Math.round(r);
    const G = Math.round(g);
    const B = Math.round(b);
    eff.options.color = (R << 16) | (G << 8) | B;
    const canvas = eff.p5canvas;
    const ctx = eff.p5?.drawingContext ?? canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgb(${R},${G},${B})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }, []);

  const destroyVanta = useCallback(() => {
    genRef.current++;
    const eff = effectRef.current;
    effectRef.current = null;
    try {
      eff?.destroy();
    } catch {
      // Nothing to recover: the host is cleared below either way.
    }
    vantaRef.current?.replaceChildren();
  }, []);

  const createVanta = useCallback((): Promise<void> => {
    if (reduced || effectRef.current) return Promise.resolve();
    if (creatingRef.current) return creatingRef.current;
    const host = vantaRef.current;
    if (!host) return Promise.resolve();
    const gen = genRef.current;
    const job = preloadDomains()
      .then(({ p5, TOPOLOGY }) => {
        if (gen !== genRef.current || !host.isConnected) return;
        const eff = TOPOLOGY({
          el: host,
          p5,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: REST.line,
          backgroundColor: 0x6c5cd9,
        });
        // Vanta resizes the canvas under a flow field sized for the old one,
        // which throws once the window grows; the resize handler below
        // rebuilds the effect instead.
        window.removeEventListener("resize", eff.resize);
        // Its own frame loop only measures the page for a p5 effect.
        if (eff.req) cancelAnimationFrame(eff.req);
        // The tint lives on the host (so it can transition); the canvas only
        // carries the lines.
        if (eff.p5canvas) eff.p5canvas.style.background = "transparent";
        effectRef.current = eff;
        paintLines();
        applyRun();
      })
      .catch(() => {
        // The static tint stands in if the effect cannot load.
      })
      .finally(() => {
        creatingRef.current = null;
      });
    creatingRef.current = job;
    return job;
  }, [reduced, paintLines, applyRun]);

  /** Tint and line colour for the open card (or the rest state). */
  const setPalette = useCallback(
    (i: number, instant = false) => {
      const target = i < 0 ? REST : DOMAINS[i];
      const bg = bgRef.current;
      if (bg) {
        if (instant) bg.style.transition = "none";
        bg.style.backgroundColor = target.bg;
        if (instant) {
          void bg.offsetWidth;
          bg.style.transition = "";
        }
      }
      lineTween.current?.kill();
      const to = toRgb(target.line);
      if (instant || reduced || !effectRef.current) {
        lineCol.current = to;
        paintLines();
        return;
      }
      lineTween.current = gsap.to(lineCol.current, {
        ...to,
        duration: 0.9,
        ease: "power2.out",
        onUpdate: paintLines,
      });
    },
    [reduced, paintLines],
  );

  // Lifecycle: warm (drawing in the background, then paused) while Brands is
  // up, running while Domains is open, gone otherwise.
  useEffect(() => {
    window.clearTimeout(pauseTimer.current);
    if (!active && !warm) {
      runWantRef.current = false;
      destroyVanta();
      return;
    }
    const existed = effectRef.current !== null;
    runWantRef.current = true;
    void createVanta();
    applyRun();
    if (!active) {
      // Leave it long enough for the lines to build up, then stop drawing.
      pauseTimer.current = window.setTimeout(
        () => {
          if (activeRef.current) return;
          runWantRef.current = false;
          applyRun();
        },
        existed ? 0 : WARM_MS,
      );
    }
  }, [active, warm, createVanta, destroyVanta, applyRun]);

  useEffect(
    () => () => {
      window.clearTimeout(pauseTimer.current);
      window.clearTimeout(leaveTimer.current);
      window.clearTimeout(paletteTimer.current);
      lineTween.current?.kill();
      destroyVanta();
    },
    [destroyVanta],
  );

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
      g = { vertical: false, gap, slim, big, cross: clamp(H, 280, 540) };
    } else {
      const gap = 8;
      const slim = clamp(Math.round((H - 6 * gap) * 0.1), 46, 60);
      const big = clamp(H - 5 * (slim + gap) - gap, 190, 340);
      g = { vertical: true, gap, slim, big, cross: Math.min(W, 560) };
    }
    const prev = geoRef.current;
    geoRef.current = g;
    if (!prev || prev.vertical !== g.vertical) setVertical(g.vertical);
    row.style.setProperty("--g", `${g.gap}px`);
    row.style.setProperty("--slim", `${g.slim}px`);
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
    }
  }, []);

  useLayoutEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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

  // Rebuild the background after a resize (see createVanta).
  useEffect(() => {
    let t: number | undefined;
    const onResize = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        if (!effectRef.current) return;
        destroyVanta();
        void createVanta();
      }, 350);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [createVanta, destroyVanta]);

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
      if (hoverRef.current === i) return;
      hoverRef.current = i;
      dimRefs.current.forEach((el, k) => {
        if (el) el.style.opacity = i >= 0 && k !== i ? "1" : "0";
      });
      cardRefs.current.forEach((el, k) => el?.setAttribute("data-open", String(k === i)));
      // A short beat before recolouring, so sweeping across the row does not
      // flicker the whole page through every palette on the way.
      window.clearTimeout(paletteTimer.current);
      if (i >= 0) {
        lastCardRef.current = i;
        paletteTimer.current = window.setTimeout(() => setPalette(i), 70);
      } else if (lastCardRef.current >= 0) {
        // When unhovering, preserve the background of whatever card was hovered last
        setPalette(lastCardRef.current);
      }
    },
    [setPalette],
  );

  const onSlotEnter = (i: number) => (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(leaveTimer.current);
    setHover(i);
  };
  const onRowLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setHover(-1), 110);
  };
  const onSlotTap = (i: number) => () => {
    if (!touch) return;
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

      // Parallax: the row leans after the cursor, each card at its own pace
      // (the ones nearest the cursor answer first), so a sweep ripples through
      // it. While a card is open the others settle on its offset instead, and
      // the open card itself holds still under the cursor.
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
      let along = -rowLen / 2;
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
  }, [active, reduced, touch]);

  // --- Entrance --------------------------------------------------------------------
  const hideContent = useCallback(() => {
    const words = wordRefs.current.filter(Boolean);
    const soft = [eyebrowRef.current, subRef.current, hintRef.current].filter(Boolean);
    const cards = cardRefs.current.filter(Boolean);
    gsap.killTweensOf([...words, ...soft, ...cards]);
    gsap.set(words, { yPercent: 115 });
    gsap.set(soft, { autoAlpha: 0, y: 14 });
    gsap.set(cards, { autoAlpha: 0, y: 64 });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      prepare: () => {
        window.clearTimeout(leaveTimer.current);
        window.clearTimeout(paletteTimer.current);
        lastCardRef.current = -1;
        hoverRef.current = -2; // forces setHover(-1) to apply
        setHover(-1);
        window.clearTimeout(paletteTimer.current);
        setPalette(-1, true);
        measure();
        const g = geoRef.current;
        for (let k = 0; k < N; k++) {
          if (g) sizes.current[k] = g.slim;
          vels.current[k] = 0;
          written.current[k] = -1;
          opens.current[k] = -1;
          offX.current[k] = 0;
          offY.current[k] = 0;
          const slot = slotRefs.current[k];
          if (slot) slot.style.transform = "";
        }
        hideContent();
        // Start drawing now, so the lines build up behind the curtain.
        window.clearTimeout(pauseTimer.current);
        runWantRef.current = true;
        applyRun();
        void createVanta();
      },
      ready: async () => {
        await Promise.race([createVanta(), new Promise((r) => setTimeout(r, 350))]);
        // Let the now-visible screen commit and paint before the curtain lifts.
        await nextFrame();
      },
      playIn: () => {
        const words = wordRefs.current.filter(Boolean);
        const soft = [eyebrowRef.current, subRef.current, hintRef.current].filter(Boolean);
        const cards = cardRefs.current.filter(Boolean);
        if (reduced) {
          gsap.set(words, { yPercent: 0 });
          gsap.set([...soft, ...cards], { autoAlpha: 1, y: 0 });
          return;
        }
        // The demo's motion text: lines rise out of their masks as the
        // curtain clears.
        gsap.to(words, { yPercent: 0, duration: 0.45, stagger: 0.035, ease: "power2.inOut" });
        gsap.to(soft, { autoAlpha: 1, y: 0, duration: 0.55, ease: "power3.out", stagger: 0.05, delay: 0.06 });
        gsap.to(cards, {
          autoAlpha: 1,
          y: 0,
          duration: 0.75,
          ease: "expo.out",
          stagger: 0.045,
          delay: 0.03,
          clearProps: "transform",
        });
      },
      getRoot: () => sectionRef.current,
    }),
    [applyRun, createVanta, hideContent, measure, reduced, setHover, setPalette],
  );

  return (
    <section
      ref={sectionRef}
      aria-label="Domains"
      aria-hidden={!active}
      className={`fixed inset-0 z-[135] overflow-hidden text-white ${active ? "visible" : "pointer-events-none invisible"}`}
      onPointerDown={(e) => {
        if (touch && !rowRef.current?.contains(e.target as Node)) setHover(-1);
      }}
    >
      {/* Background: the topology over a tint that follows the open card. */}
      <div
        ref={bgRef}
        className="absolute inset-0 transition-[background-color] duration-[900ms] ease-out"
        style={{ backgroundColor: REST.bg }}
      >
        <div ref={vantaRef} className="absolute inset-0" />
      </div>
      {/* Keeps the type legible over the busiest lines. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_42%,transparent_38%,rgba(0,0,0,0.5)_100%)]" />

      <div className="relative flex h-full flex-col px-5 pb-5 pt-[88px] sm:px-8 sm:pt-[100px] lg:px-12 lg:pb-7">
        <header className="mx-auto flex max-w-[900px] flex-col items-center text-center">
          <div
            ref={eyebrowRef}
            className="flex items-center gap-3 text-[10.5px] font-medium uppercase tracking-[0.3em] text-white/60 sm:text-[11px]"
          >
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-white/50" />
            Spaces We Transform
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-white/50" />
          </div>
          <h2 className="mt-3 text-[clamp(1.75rem,3.2vw,2.9rem)] font-medium leading-[1.06] tracking-[-0.03em]">
            {TITLE.split(" ").map((w, i) => (
              <Fragment key={i}>
                <span className="-mb-[0.1em] inline-block overflow-hidden pb-[0.1em] align-bottom">
                  <span
                    ref={(el) => {
                      wordRefs.current[i] = el;
                    }}
                    className="inline-block will-change-transform"
                  >
                    {w}
                  </span>
                </span>{" "}
              </Fragment>
            ))}
          </h2>
          <p
            ref={subRef}
            className="mt-3 max-w-[60ch] text-[clamp(0.84rem,0.95vw,0.96rem)] font-light leading-relaxed text-white/55 [@media(max-height:720px)]:hidden"
          >
            {SUBTITLE}
          </p>
        </header>

        <div ref={stageRef} className="relative my-4 flex min-h-0 flex-1 items-center justify-center sm:my-5">
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
                onClick={onSlotTap(i)}
              >
                <article
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  tabIndex={0}
                  aria-label={d.title}
                  data-open="false"
                  onFocus={() => setHover(i)}
                  className={`font-swiss absolute overflow-hidden rounded-[18px] text-[#020303] shadow-[0_40px_80px_-38px_rgba(0,0,0,0.8)] outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                    vertical
                      ? "inset-x-0 top-[calc(var(--g)/2)] bottom-[calc(var(--g)/2)]"
                      : "inset-y-0 left-[calc(var(--g)/2)] right-[calc(var(--g)/2)]"
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
                    ref={(el) => {
                      detailRefs.current[i] = el;
                    }}
                    className={`@container absolute left-0 top-0 flex flex-col justify-between ${
                      vertical ? "p-5 pt-[calc(var(--slim)/2_-_6px)]" : "p-6 sm:p-7"
                    }`}
                    style={{ opacity: 0, visibility: "hidden" }}
                  >
                    <div className="flex justify-end">
                      <span className="text-[12px] font-medium uppercase leading-none tracking-[0.01em]">{d.tag}</span>
                    </div>
                    <div>
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

        <p ref={hintRef} className="text-center text-[11px] tracking-[0.02em] text-white/45">
          {touch ? "Tap a domain to explore" : "Hover a domain to explore"}
        </p>
      </div>
    </section>
  );
});

export default DomainsScreen;
