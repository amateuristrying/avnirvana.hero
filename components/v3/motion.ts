"use client";

import { useEffect, useLayoutEffect, type DependencyList, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/* The v3 motion system. Every component that animates marks its root with
 * `data-motion`: the root stays hidden (see spotlight.css) until its
 * animations are built, so their start states apply before anything paints
 * and nothing flashes in at rest first. Entrances play once, as their
 * trigger scrolls into view, and are reverted on unmount. */

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText };

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Web fonts settle line breaks, so splits wait for them (capped, in case they never arrive). */
let fontsGate: Promise<void> | null = null;
function fontsReady() {
  if (!fontsGate) {
    fontsGate = Promise.race([
      document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve(),
      new Promise<void>((resolve) => setTimeout(resolve, 1800)),
    ]);
  }
  return fontsGate;
}

let refreshQueued = false;
function queueRefresh() {
  if (refreshQueued) return;
  refreshQueued = true;
  requestAnimationFrame(() => {
    refreshQueued = false;
    ScrollTrigger.refresh();
  });
}

type Build = (root: HTMLElement, ctx: gsap.Context) => void | (() => void);

/**
 * Builds a component's animations inside a gsap.context scoped to `ref`, once
 * the fonts are in, then reveals the root. Unmounting reverts every tween,
 * trigger and split (and runs the cleanup `build` returns). If `build`
 * throws, its partial work is reverted and the component shows at rest.
 */
export function useMotion(ref: RefObject<HTMLElement | null>, build: Build, deps: DependencyList = []) {
  useIsoLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    let ctx: gsap.Context | undefined;
    let cancelled = false;

    fontsReady().then(() => {
      if (cancelled) return;
      if (!prefersReducedMotion()) {
        let failed = false;
        ctx = gsap.context((self) => {
          try {
            return build(root, self);
          } catch (err) {
            failed = true;
            console.error(err);
          }
        }, root);
        if (failed) {
          ctx.revert();
          ctx = undefined;
        }
      }
      root.style.visibility = "visible";
      queueRefresh();
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
    // The builders read refs; they only need to rerun when `deps` change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** A trigger that fires once, when the top of `trigger` reaches `start`. */
export const once = (trigger: Element | null, start = "top 82%"): ScrollTrigger.Vars => ({
  trigger: trigger ?? undefined,
  start,
  once: true,
});

const all = (root: ParentNode | null | undefined, selector: string) =>
  root ? Array.from(root.querySelectorAll<HTMLElement>(selector)) : [];

/** Masked lines rise into place; the masks themselves never move. */
export function linesUp(
  tl: gsap.core.Timeline,
  lines: gsap.TweenTarget,
  at: gsap.Position = 0,
  vars: gsap.TweenVars = {},
) {
  return tl.fromTo(
    lines,
    { yPercent: 112 },
    { yPercent: 0, duration: 1.15, ease: "expo.out", stagger: 0.1, ...vars },
    at,
  );
}

/** Splits a paragraph into masked lines and rises them in, returning it to plain text after. */
export function proseUp(tl: gsap.core.Timeline, el: HTMLElement | null, at: gsap.Position = 0, vars: gsap.TweenVars = {}) {
  if (!el || !el.textContent?.trim()) return;
  const split = SplitText.create(el, { type: "lines", mask: "lines" });
  tl.fromTo(
    split.lines,
    { yPercent: 105 },
    {
      yPercent: 0,
      duration: 1,
      ease: "expo.out",
      stagger: 0.07,
      ...vars,
      onComplete: () => split.revert(),
    },
    at,
  );
}

/** Blocks that rise and fade in, one after another. */
export function riseIn(
  tl: gsap.core.Timeline,
  targets: gsap.TweenTarget,
  at: gsap.Position = 0,
  vars: gsap.TweenVars = {},
  y = 24,
) {
  return tl.fromTo(
    targets,
    { autoAlpha: 0, y },
    { autoAlpha: 1, y: 0, duration: 0.95, ease: "expo.out", stagger: 0.07, clearProps: "transform", ...vars },
    at,
  );
}

/** A panel that wipes up out of its own rounded rect, as main's contact card did. */
export function wipeUp(tl: gsap.core.Timeline, el: HTMLElement | null, at: gsap.Position = 0, vars: gsap.TweenVars = {}) {
  if (!el) return tl;
  const r = getComputedStyle(el).borderTopLeftRadius || "0px";
  return tl.fromTo(
    el,
    { autoAlpha: 0, y: 64, clipPath: `inset(100% 0% 0% 0% round ${r})` },
    {
      autoAlpha: 1,
      y: 0,
      clipPath: `inset(0% 0% 0% 0% round ${r})`,
      duration: 1.35,
      ease: "expo.inOut",
      clearProps: "clipPath,transform",
      ...vars,
    },
    at,
  );
}

/** Arrow discs spin to rest as their pill arrives. */
export function discsSpin(tl: gsap.core.Timeline, root: ParentNode | null, at: gsap.Position = 0) {
  const discs = all(root, ".sp-disc");
  if (!discs.length) return tl;
  return tl.fromTo(
    discs,
    { rotate: -180, transformOrigin: "50% 50%" },
    { rotate: 0, duration: 1.2, ease: "expo.out", stagger: 0.08, clearProps: "transform" },
    at,
  );
}

/**
 * A section head's entrance: the glass tag pops in with its mark spinning to
 * rest, the two title lines rise out of their masks, and the lead (wherever
 * it sits in the head) follows line by line.
 */
export function headIn(head: Element | null, start = "top 82%") {
  if (!head) return;
  const tl = gsap.timeline({ scrollTrigger: once(head, start), defaults: { ease: "expo.out" } });
  tl.fromTo(
    head.querySelector(".v3-tag"),
    { autoAlpha: 0, y: 16, scale: 0.88 },
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, clearProps: "transform" },
    0,
  );
  tl.fromTo(
    head.querySelector(".v3-tag-mark"),
    { rotate: -140, transformOrigin: "50% 50%" },
    { rotate: 0, duration: 1.3, clearProps: "transform" },
    0,
  );
  linesUp(tl, all(head, ".v3-ta, .v3-tb"), 0.08);
  all(head, ".v3-lead").forEach((lead, i) => proseUp(tl, lead, 0.28 + i * 0.1));
  return tl;
}

/**
 * A head drifts against the scroll as its section passes, trailing on the way
 * in and leading on the way out. It is at rest exactly when a one-screen
 * section fills the screen.
 */
export function headDrift(section: Element, head: Element | null, distance = 44) {
  if (!head) return;
  gsap.fromTo(
    head,
    { y: distance },
    {
      y: -distance,
      ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.6 },
    },
  );
}
