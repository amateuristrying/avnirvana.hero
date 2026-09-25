"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import Prism from "@/components/prism/Prism";
import ParticleLogo from "@/components/hero/ParticleLogo";
import Navbar from "@/components/hero/Navbar";
import { useReducedMotion } from "@/lib/useReducedMotion";
import BandTransition, { type BandTransitionHandle } from "@/components/transitions/BandTransition";
import ProductsLight from "@/components/products/ProductsLight";
import BrandsScreen from "@/components/brands/BrandsScreen";
import DomeTransition, { type DomeTransitionHandle } from "@/components/transitions/DomeTransition";
import DomainsScreen, { preloadDomains, type DomainsHandle } from "@/components/domains/DomainsScreen";
import ContactScreen, { type ContactScreenHandle } from "@/components/contact/ContactScreen";

/**
 * Each phrase is split into its two display lines up front. Letting the
 * browser wrap freely put the two longest phrases on three lines; fixed splits
 * guarantee two at every width, and the font is sized from the container so
 * the widest line (11.92em, "Designed for performance,") always fits.
 */
const PHRASES: [string, string][] = [
  ["Technology that", "blends in nature"],
  ["Designed for performance,", "built for scale"],
  ["Seamless technology for", "smarter workspaces"],
  ["Technology for memorable", "hospitality experiences"],
  ["Elevating everyday living", "through technology"],
];

/** Exit duration in seconds; the commit timer is keyed to it. */
const EXIT_S = 0.42;

/** Full cycle per phrase, in milliseconds. */
const CYCLE_MS = 3210;

/** Duration of the glide between screen 1 and screen 2, in seconds. */
const SNAP_S = 2.0;

/** Resting placements, offsets from the frame centre in px (tuned). */
const HERO_LOGO = { x: -390, y: 22, scale: 2.35 };
const HERO_TEXT = { x: 311, y: 61, scale: 1.11 };

/** Screen 2 keeps the logo on the centre line, between the two point columns. */
const SCREEN2_LOGO = { x: 0, y: 107, scale: 1.63 };
const SCREEN2_TEXT = { x: 0, y: -14, scale: 0.98 };

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

function smoothstep(e0: number, e1: number, v: number) {
  const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

export default function PrismHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const targetProgress = useRef(0);
  const currentProgress = useRef(0);
  const reduced = useReducedMotion();
  const bandRef = useRef<BandTransitionHandle>(null);
  // Screen 3 (light products) is an overlay reached through the band wipe.
  const [productsOn, setProductsOn] = useState(false);
  const productsOnRef = useRef(false);
  // Screen 4 (Brands) sweeps in over the products screen in white strips.
  const [brandsOn, setBrandsOn] = useState(false);
  const brandsOnRef = useRef(false);
  const [brandsInstant, setBrandsInstant] = useState(false);
  const [productsCovered, setProductsCovered] = useState(false);
  // Solid white behind the strips once they have landed, so no hairline seam
  // between two strips can show the dimmed page through.
  const [brandsSettled, setBrandsSettled] = useState(false);
  const brandsBusyRef = useRef(false);
  const lockUntilRef = useRef(0);
  // Screen 5 (Domains) opens under the dome curtain, over everything else.
  const [domainsOn, setDomainsOn] = useState(false);
  const domainsOnRef = useRef(false);
  const domeRef = useRef<DomeTransitionHandle>(null);
  const domainsRef = useRef<DomainsHandle>(null);
  // Screen 6 (Contact) opens with the Ciel Rose / Index transition over Domains
  const [contactOn, setContactOn] = useState(false);
  const contactOnRef = useRef(false);
  const contactRef = useRef<ContactScreenHandle>(null);
  const contactTransitionBusyRef = useRef(false);

  // The Domains background (p5 + Vanta) is only fetched once the white
  // screens are reached, one step ahead of needing it.
  useEffect(() => {
    if (productsOn) void preloadDomains();
  }, [productsOn]);

  const onBrandsEntered = useCallback(() => {
    setBrandsSettled(true);
    brandsBusyRef.current = false;
    lockUntilRef.current = performance.now() + 650;
  }, []);
  const onBrandsExited = useCallback(() => {
    setBrandsSettled(false);
    setProductsCovered(false);
    brandsBusyRef.current = false;
    lockUntilRef.current = performance.now() + 650;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const totalScroll = container.offsetHeight - window.innerHeight;
      if (totalScroll <= 0) return;
      const scrolled = -rect.top;
      const p = Math.min(1, Math.max(0, scrolled / totalScroll));
      targetProgress.current = p;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    let rafId: number;
    const update = () => {
      // Smooth interpolation for silky 60/120fps motion
      const diff = targetProgress.current - currentProgress.current;
      if (Math.abs(diff) > 0.0003) {
        currentProgress.current += diff * 0.09;
        setScrollProgress(currentProgress.current);
      } else if (currentProgress.current !== targetProgress.current) {
        currentProgress.current = targetProgress.current;
        setScrollProgress(currentProgress.current);
      }
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Scroll stops: screen 1 ⇄ screen 2 glide (the transition always plays in
  // full and never rests half-way); past screen 2 the AV NIRVANA band wipes
  // to the light products screen, and back up the same way.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let tween: gsap.core.Tween | null = null;
    let tweenDir = 0;
    let arrivedAt = 0;
    let banding = false;
    let brandsTimer: ReturnType<typeof setTimeout> | undefined;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let touchY: number | null = null;
    let touchFired = false;

    const bounds = () => {
      const top = container.getBoundingClientRect().top + window.scrollY;
      return { top, end: top + container.offsetHeight - window.innerHeight };
    };
    const inSection = () => {
      const { top, end } = bounds();
      return window.scrollY >= top - 1 && window.scrollY <= end + 1;
    };
    const atEnd = () => Math.abs(window.scrollY - bounds().end) < 1;

    /** Jump the hero straight to a progress (used while it is covered). */
    const settleProgress = (v: number) => {
      targetProgress.current = v;
      currentProgress.current = v;
      setScrollProgress(v);
    };

    /** Glide to one end. Returns false when already there. */
    const glide = (dir: 1 | -1) => {
      const { top, end } = bounds();
      const target = dir > 0 ? end : top;
      if (Math.abs(window.scrollY - target) < 1) return false;
      if (tween && tweenDir === dir) return true;
      tween?.kill();
      tweenDir = dir;
      const state = { y: window.scrollY };
      tween = gsap.to(state, {
        y: target,
        duration: reduced ? 0 : SNAP_S,
        ease: "power2.inOut",
        // "instant" bypasses the global `scroll-behavior: smooth`, which would
        // otherwise re-smooth every step of the tween.
        onUpdate: () => window.scrollTo({ top: state.y, behavior: "instant" }),
        onComplete: () => {
          tween = null;
          tweenDir = 0;
          // Swallow the tail of trackpad inertia so it can't bounce straight back.
          lockUntilRef.current = performance.now() + 450;
          arrivedAt = performance.now();
        },
      });
      return true;
    };

    const enterProducts = async () => {
      const band = bandRef.current;
      if (!band || banding || productsOnRef.current) return;
      banding = true;
      tween?.kill();
      tween = null;
      await band.cover();
      // Park the hero on screen 2 underneath, so leaving lands there.
      window.scrollTo({ top: bounds().end, behavior: "instant" });
      settleProgress(1);
      setWhite(true, false);
      await band.reveal();
      banding = false;
      lockUntilRef.current = performance.now() + 600;
    };

    /** Put the white screens in a given state at once (only while covered). */
    const setWhite = (products: boolean, brands: boolean) => {
      clearTimeout(brandsTimer);
      brandsBusyRef.current = false;
      productsOnRef.current = products;
      setProductsOn(products);
      if (brands !== brandsOnRef.current) {
        brandsOnRef.current = brands;
        setBrandsInstant(true);
        setBrandsOn(brands);
      }
      setProductsCovered(brands);
    };

    const setDomains = (on: boolean) => {
      domainsOnRef.current = on;
      setDomainsOn(on);
    };

    const setContact = (on: boolean) => {
      contactOnRef.current = on;
      setContactOn(on);
    };

    const leaveProducts = async (to: "screen2" | "top") => {
      const band = bandRef.current;
      if (!band || banding || !productsOnRef.current) return;
      banding = true;
      await band.cover();
      setContact(false);
      setDomains(false);
      setWhite(false, false);
      // Land exactly on the screen, even if the viewport changed meanwhile.
      const { top, end } = bounds();
      window.scrollTo({ top: to === "top" ? top : end, behavior: "instant" });
      settleProgress(to === "top" ? 0 : 1);
      await band.reveal();
      setBrandsInstant(false);
      banding = false;
      arrivedAt = performance.now();
      lockUntilRef.current = performance.now() + 600;
    };

    /** Products → Brands: the page dims, then the white strips sweep in. */
    const enterBrands = () => {
      if (banding || brandsBusyRef.current || brandsOnRef.current || !productsOnRef.current) return;
      brandsBusyRef.current = true;
      setProductsCovered(true);
      brandsTimer = setTimeout(
        () => {
          brandsOnRef.current = true;
          setBrandsOn(true);
        },
        reduced ? 0 : 260,
      );
    };

    /** Brands → Products: strips retract, then the page brightens again. */
    const leaveBrands = () => {
      if (banding || brandsBusyRef.current || !brandsOnRef.current) return;
      brandsBusyRef.current = true;
      brandsOnRef.current = false;
      setBrandsSettled(false);
      setBrandsOn(false);
    };

    /** From screen 1 or 2 straight to Brands, under the band. */
    const jumpToBrands = async () => {
      const band = bandRef.current;
      if (!band || banding) return;
      banding = true;
      tween?.kill();
      tween = null;
      await band.cover();
      window.scrollTo({ top: bounds().end, behavior: "instant" });
      settleProgress(1);
      setWhite(true, true);
      await band.reveal();
      setBrandsInstant(false);
      banding = false;
      lockUntilRef.current = performance.now() + 600;
    };

    /** Brands → Domains (or a jump from any screen): the dome rises over the page. */
    const enterDomains = async () => {
      const dome = domeRef.current;
      const dom = domainsRef.current;
      if (!dome || !dom || banding || brandsBusyRef.current || domainsOnRef.current) return;
      banding = true;
      tween?.kill();
      tween = null;
      dom.prepare();
      await dome.cover("up");
      if (!productsOnRef.current) {
        window.scrollTo({ top: bounds().end, behavior: "instant" });
        settleProgress(1);
      }
      // The white screens stay stacked underneath, so going back unwinds them.
      setWhite(true, true);
      setDomains(true);
      await dom.ready();
      await dome.reveal("up", () => dom.playIn());
      setBrandsInstant(false);
      banding = false;
      lockUntilRef.current = performance.now() + 250;
    };

    /** Domains → Brands (or Products): the dome comes back down from the top. */
    const leaveDomains = async (to: "brands" | "products" = "brands") => {
      const dome = domeRef.current;
      if (!dome || banding || !domainsOnRef.current) return;
      banding = true;
      await dome.cover("down");
      setDomains(false);
      if (to === "products") setWhite(true, false);
      await nextFrame();
      await dome.reveal("down");
      setBrandsInstant(false);
      banding = false;
      lockUntilRef.current = performance.now() + 250;
    };

    /**
     * Domains → Contact: Ciel Rose / Index transition (from page-transitions demo)
     * Outgoing Domains scales down to 0.6 with slight content lift and opacity fade.
     * Incoming Contact starts at scale 0.6, wipes up via clip-path inset(100% -> 0%), and scales to 1.
     */
    const enterContact = async () => {
      const contact = contactRef.current;
      const dom = domainsRef.current;
      if (!contact || contactTransitionBusyRef.current || contactOnRef.current) return;

      contactTransitionBusyRef.current = true;
      tween?.kill();
      tween = null;

      contact.prepare();
      setContact(true);

      const domainsEl = dom?.getRoot();
      const contactEl = contact.getRoot();

      if (!domainsEl || !contactEl) {
        contactTransitionBusyRef.current = false;
        return;
      }

      gsap.set(contactEl, {
        scale: 0.6,
        clipPath: "inset(100% 0% 0% 0%)",
        opacity: 1,
        visibility: "visible",
        willChange: "transform, clip-path",
      });
      gsap.set(domainsEl, {
        willChange: "transform, opacity",
      });

      const tl = gsap.timeline({
        defaults: { duration: 0.85, ease: "power3.inOut" },
      });

      tl.to(domainsEl, {
        scale: 0.6,
        opacity: 0.4,
        yPercent: -8,
      })
        .to(
          contactEl,
          {
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "power3.inOut",
            onStart: () => {
              contact.playIn();
            },
          },
          "<",
        )
        .to(
          contactEl,
          {
            scale: 1,
            ease: "power3.out",
            duration: 0.8,
          },
          "<0.05",
        );

      await new Promise<void>((resolve) => {
        tl.eventCallback("onComplete", () => {
          gsap.set(contactEl, { clearProps: "clipPath" });
          contactTransitionBusyRef.current = false;
          lockUntilRef.current = performance.now() + 250;
          resolve();
        });
      });
    };

    /**
     * Contact → Domains (or earlier screens): Reverse Ciel Rose transition
     * Contact scales down to 0.6 and wipes down via clip-path inset(0% -> 100%).
     * Domains scales back up to 1.0 and fades back in.
     */
    const leaveContact = async (to: "domains" | "brands" | "products" | "screen2" | "top" = "domains") => {
      const contact = contactRef.current;
      const dom = domainsRef.current;
      if (!contact || contactTransitionBusyRef.current || !contactOnRef.current) return;

      contactTransitionBusyRef.current = true;
      const domainsEl = dom?.getRoot();
      const contactEl = contact.getRoot();

      if (domainsEl && contactEl) {
        const tl = gsap.timeline({
          defaults: { duration: 0.75, ease: "power3.inOut" },
        });

        tl.to(contactEl, {
          clipPath: "inset(100% 0% 0% 0%)",
          scale: 0.6,
          opacity: 0.4,
          ease: "power3.inOut",
        })
          .to(
            domainsEl,
            {
              scale: 1,
              opacity: 1,
              yPercent: 0,
              ease: "power3.out",
              duration: 0.7,
            },
            "<0.05",
          );

        await new Promise<void>((resolve) => {
          tl.eventCallback("onComplete", () => {
            gsap.set([contactEl, domainsEl], { clearProps: "all" });
            setContact(false);
            contactTransitionBusyRef.current = false;
            lockUntilRef.current = performance.now() + 250;
            resolve();
          });
        });
      } else {
        setContact(false);
        contactTransitionBusyRef.current = false;
      }

      if (to === "brands") {
        void leaveDomains("brands");
      } else if (to === "products") {
        void leaveDomains("products");
      } else if (to === "screen2" || to === "top") {
        void leaveProducts(to);
      }
    };

    /** From any screen straight to Contact */
    const jumpToContact = async () => {
      if (contactOnRef.current) {
        contactRef.current?.getRoot()?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (domainsOnRef.current) {
        await enterContact();
        return;
      }
      const band = bandRef.current;
      if (!band || banding || contactTransitionBusyRef.current) return;
      banding = true;
      tween?.kill();
      tween = null;
      await band.cover();
      window.scrollTo({ top: bounds().end, behavior: "instant" });
      settleProgress(1);
      setWhite(true, true);
      setDomains(true);
      setContact(true);
      contactRef.current?.prepare();
      const contactEl = contactRef.current?.getRoot();
      if (contactEl) {
        gsap.set(contactEl, { scale: 1, clipPath: "none", opacity: 1, yPercent: 0 });
      }
      await band.reveal();
      contactRef.current?.playIn();
      setBrandsInstant(false);
      banding = false;
      lockUntilRef.current = performance.now() + 600;
    };

    const busy = () =>
      banding ||
      brandsBusyRef.current ||
      contactTransitionBusyRef.current ||
      tween !== null ||
      performance.now() < lockUntilRef.current;

    /** One step of navigation in `dir`. Returns true when the input was used. */
    const step = (dir: 1 | -1) => {
      if (contactOnRef.current) {
        if (busy()) return true;
        if (dir < 0) {
          const root = contactRef.current?.getRoot();
          if (!root || root.scrollTop <= 5) {
            void leaveContact();
            return true;
          }
        }
        return false;
      }
      if (productsOnRef.current) {
        // The white screens own all vertical input.
        if (busy()) return true;
        if (domainsOnRef.current) {
          if (dir < 0) void leaveDomains();
          else if (dir > 0) void enterContact();
        } else if (brandsOnRef.current) {
          if (dir < 0) leaveBrands();
          else void enterDomains();
        } else if (dir > 0) enterBrands();
        else leaveProducts("screen2");
        return true;
      }
      if (!inSection()) return false;
      if (dir > 0 && atEnd()) {
        // A deliberate further scroll, not leftover inertia from the glide.
        if (!busy() && performance.now() - arrivedAt > 900) enterProducts();
        return true;
      }
      if (busy()) return true;
      return glide(dir);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      if (contactOnRef.current) {
        const root = contactRef.current?.getRoot();
        const atTop = !root || root.scrollTop <= 5;
        if (dir < 0 && atTop) {
          if (!busy()) void leaveContact();
          e.preventDefault();
        }
        return;
      }
      // A reversal mid-glide is honoured.
      if (tween && dir !== tweenDir) {
        glide(dir);
        e.preventDefault();
        return;
      }
      if (step(dir)) e.preventDefault();
    };

    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
      touchFired = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY === null) return;
      if (contactOnRef.current) {
        const root = contactRef.current?.getRoot();
        const atTop = !root || root.scrollTop <= 5;
        const dy = touchY - (e.touches[0]?.clientY ?? touchY);
        if (dy < -24 && atTop) {
          e.preventDefault();
          if (!touchFired && !busy()) {
            touchFired = true;
            void leaveContact();
          }
        }
        return;
      }
      if (!productsOnRef.current && !inSection()) return;
      e.preventDefault();
      if (touchFired) return;
      const dy = touchY - (e.touches[0]?.clientY ?? touchY);
      if (Math.abs(dy) < 24) return;
      touchFired = true;
      step(dy > 0 ? 1 : -1);
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      // Space on a focused control should activate it, not scroll.
      if (e.key === " " && t?.closest("button, a, [role='button']")) return;
      const down = ["ArrowDown", "PageDown", "End"].includes(e.key) || (e.key === " " && !e.shiftKey);
      const up = ["ArrowUp", "PageUp", "Home"].includes(e.key) || (e.key === " " && e.shiftKey);
      if (!down && !up) return;
      if (step(down ? 1 : -1)) e.preventDefault();
    };

    // Nav links for the screens that exist on this page.
    const onNav = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href^='#']");
      if (!a) return;
      const hash = a.getAttribute("href");
      if (hash === "#contact") {
        e.preventDefault();
        void jumpToContact();
      } else if (hash === "#products") {
        e.preventDefault();
        if (contactOnRef.current) void leaveContact("products");
        else if (domainsOnRef.current) void leaveDomains("products");
        else if (brandsOnRef.current) leaveBrands();
        else enterProducts();
      } else if (hash === "#brands") {
        e.preventDefault();
        if (contactOnRef.current) void leaveContact("brands");
        else if (domainsOnRef.current) void leaveDomains("brands");
        else if (productsOnRef.current) enterBrands();
        else jumpToBrands();
      } else if (hash === "#domains") {
        e.preventDefault();
        if (contactOnRef.current) void leaveContact("domains");
        else void enterDomains();
      } else if (hash === "#about") {
        e.preventDefault();
        if (contactOnRef.current) void leaveContact("screen2");
        else if (productsOnRef.current) leaveProducts("screen2");
        else glide(1);
      } else if (hash === "#") {
        e.preventDefault();
        if (contactOnRef.current) void leaveContact("top");
        else if (productsOnRef.current) leaveProducts("top");
        else glide(-1);
      }
    };

    // Anything that still leaves the section part-way (scrollbar drag, find-in-
    // page) settles to the nearer screen once scrolling stops.
    const onScroll = () => {
      clearTimeout(settleTimer);
      if (tween || banding || productsOnRef.current || contactOnRef.current) return;
      settleTimer = setTimeout(() => {
        if (tween || banding || productsOnRef.current || contactOnRef.current || !inSection()) return;
        const { top, end } = bounds();
        const y = window.scrollY;
        if (y - top > 1 && end - y > 1) glide((y - top) / (end - top) >= 0.5 ? 1 : -1);
      }, 220);
    };

    // A resize moves screen 2's scroll offset (the section is sized in vh);
    // snap to whichever screen was showing rather than resting between them.
    const onResize = () => {
      if (tween || banding || productsOnRef.current || contactOnRef.current || !inSection()) return;
      const { top, end } = bounds();
      const y = window.scrollY;
      if (y - top > 1 && end - y > 1) {
        const toEnd = currentProgress.current >= 0.5;
        window.scrollTo({ top: toEnd ? end : top, behavior: "instant" });
        settleProgress(toEnd ? 1 : 0);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onNav);
    return () => {
      tween?.kill();
      clearTimeout(settleTimer);
      clearTimeout(brandsTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onNav);
    };
  }, [reduced]);

  const p = scrollProgress;

  // Particle logo interpolates from its screen-1 to its screen-2 placement.
  const logoX = HERO_LOGO.x * (1 - p) + SCREEN2_LOGO.x * p;
  const logoY = HERO_LOGO.y * (1 - p) + SCREEN2_LOGO.y * p;
  const logoScale = HERO_LOGO.scale * (1 - p) + SCREEN2_LOGO.scale * p;

  // Particles leave the frame over p 0.06–0.36, stay out while the logo
  // re-centres, then fly back in from the side they left over 0.60–0.90 as
  // screen 2 arrives.
  const disassemble = smoothstep(0.06, 0.36, p) * (1 - smoothstep(0.6, 0.9, p));

  // Screen 1 exit: slides away to the right and fades out with blur
  const screen1Opacity = Math.max(0, 1 - p * 2.6);
  const screen1X = HERO_TEXT.x + p * 160;
  const screen1Blur = p * 10;

  // Screen 2 entrance: starts at p = 0.35, fully visible by p = 0.90
  const screen2Progress = Math.min(1, Math.max(0, (p - 0.35) / 0.55));
  const screen2Opacity = screen2Progress;

  return (
    <div ref={containerRef} className="relative w-full bg-black min-h-[220vh]">
      {/* Pinned Viewport Container across both screens */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center items-center">
        {/* Continuous Prism Background */}
        <div className="pointer-events-none absolute inset-0">
          <Prism
            paused={productsOn}
            animationType="hover"
            timeScale={0.7}
            height={3.4}
            baseWidth={5.5}
            scale={4.2}
            hueShift={0}
            colorFrequency={0.8}
            noise={0.5}
            glow={1}
          />
        </div>

        {/* Gradient veil for contrast and legibility */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.12)_28%,rgba(0,0,0,0.45)_100%)]" />

        {/* Pinned Navigation Bar */}
        <Navbar menuId="prism-menu" />

        {/* Shared particle logo. The canvas spans the whole frame so particles
            can leave the screen; placement moves the mark within it. */}
        <div className="pointer-events-none absolute inset-0 z-20">
          <ParticleLogo
            className="h-[32vh] max-h-[400px] min-h-[200px] w-full max-w-[560px] sm:h-[36vh]"
            placement={{ x: logoX, y: logoY, scale: logoScale }}
            disassemble={disassemble}
            paused={productsOn}
          />
        </div>

        {/* Screen 1: Hero Right-Side Content Block */}
        <div
          className="relative z-10 flex min-h-svh w-full items-center justify-center px-5 pb-[104px] pt-[116px] sm:px-8 lg:pb-[140px] pointer-events-none"
          style={{
            opacity: screen1Opacity,
            visibility: screen1Opacity > 0.005 ? "visible" : "hidden",
          }}
        >
          <div
            className="relative w-full max-w-[640px] pointer-events-auto"
            style={{
              transform: `translate3d(${screen1X}px, ${HERO_TEXT.y}px, 0) scale(${HERO_TEXT.scale})`,
              filter: `blur(${screen1Blur}px)`,
              transformOrigin: "center center",
              willChange: "transform, opacity, filter",
            }}
          >
            <CyclingHeadline />
          </div>
        </div>

        {/* Screen 2: "What drives AV Nirvana?" + 4 Symmetrical Points */}
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-5 sm:px-8 lg:px-12 pt-[90px] pb-[50px] transition-opacity duration-300 pointer-events-none"
          style={{
            opacity: screen2Opacity,
            visibility: screen2Opacity > 0.005 ? "visible" : "hidden",
          }}
        >
          {/* Placement wrapper: moves and scales the heading and all points as one. */}
          <div
            className="flex w-full flex-col items-center"
            style={{
              transform: `translate3d(${SCREEN2_TEXT.x}px, ${SCREEN2_TEXT.y}px, 0) scale(${SCREEN2_TEXT.scale})`,
              transformOrigin: "center center",
            }}
          >
          {/* Screen 2 Header */}
          <div
            className="mx-auto w-full max-w-[840px] text-center mb-6 sm:mb-8 lg:mb-10 transition-transform duration-300 pointer-events-auto"
            style={{
              transform: `translate3d(0, ${-32 * (1 - screen2Progress)}px, 0)`,
              willChange: "transform",
            }}
          >
            <h2 className="text-[clamp(1.6rem,2.8vw,2.4rem)] font-medium tracking-[-0.025em] text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.6)]">
              What drives AV Nirvana?
            </h2>
            <p className="mt-3 mx-auto max-w-[56ch] text-[clamp(0.88rem,1vw,1rem)] font-light leading-relaxed text-white/60 [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
              The pursuit of better sound through thoughtful engineering and solutions built around every space.
            </p>
          </div>

          {/* Symmetrical 3-Column Layout: Left (2 Points) - Center (Particle Logo) - Right (2 Points) */}
          <div className="w-full max-w-[1360px] grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,360px)_1fr] items-center gap-8 lg:gap-10 pointer-events-auto">
            {/* Left Side: Point 1 & Point 2 */}
            <div
              className="flex flex-col gap-7 sm:gap-9 lg:gap-11"
              style={{
                transform: `translate3d(${-40 * (1 - screen2Progress)}px, 0, 0)`,
                willChange: "transform",
              }}
            >
              {/* Point 1 */}
              <div className="relative flex flex-col items-start text-left">
                <h3 className="text-[clamp(1.05rem,1.2vw,1.3rem)] font-medium leading-[1.3] tracking-[-0.01em] text-white/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
                  Setting the Standard in AV
                </h3>
                <p className="mt-2.5 max-w-[40ch] text-[clamp(0.82rem,0.86vw,0.92rem)] font-light leading-[1.7] text-white/55 [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
                  To become one of India’s most trusted AV companies, bringing together leading technologies and emerging innovations to shape the future of professional audio-visual experiences.
                </p>
              </div>

              {/* Point 2 */}
              <div className="relative flex flex-col items-start text-left">
                <h3 className="text-[clamp(1.05rem,1.2vw,1.3rem)] font-medium leading-[1.3] tracking-[-0.01em] text-white/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
                  With You at Every Stage
                </h3>
                <p className="mt-2.5 max-w-[40ch] text-[clamp(0.82rem,0.86vw,0.92rem)] font-light leading-[1.7] text-white/55 [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
                  From consultation and solution design to installation, service, and technical support, we stay involved at every stage — combining in-house expertise, dependable logistics, and pan-India support to deliver with confidence.
                </p>
              </div>
            </div>

            {/* Center Spacer: Preserves clean room for the centered Particle Logo */}
            <div className="hidden lg:block h-[340px] pointer-events-none" />

            {/* Right Side: Point 3 & Point 4 — right-aligned on desktop so they
                mirror the left column against the right edge. */}
            <div
              className="flex flex-col gap-7 sm:gap-9 lg:gap-11"
              style={{
                transform: `translate3d(${40 * (1 - screen2Progress)}px, 0, 0)`,
                willChange: "transform",
              }}
            >
              {/* Point 3 */}
              <div className="relative flex flex-col items-start text-left lg:items-end lg:text-right">
                <h3 className="text-[clamp(1.05rem,1.2vw,1.3rem)] font-medium leading-[1.3] tracking-[-0.01em] text-white/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
                  17+ Years of Industry Expertise
                </h3>
                <p className="mt-2.5 max-w-[40ch] text-[clamp(0.82rem,0.86vw,0.92rem)] font-light leading-[1.7] text-white/55 [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
                  With more than 17 years of industry experience, we specialise in premium audio-visual solutions — from professional AV installations and private cinemas to sophisticated, design-led environments.
                </p>
              </div>

              {/* Point 4 */}
              <div className="relative flex flex-col items-start text-left lg:items-end lg:text-right">
                <h3 className="text-[clamp(1.05rem,1.2vw,1.3rem)] font-medium leading-[1.3] tracking-[-0.01em] text-white/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
                  Redefining What’s Possible
                </h3>
                <p className="mt-2.5 max-w-[40ch] text-[clamp(0.82rem,0.86vw,0.92rem)] font-light leading-[1.7] text-white/55 [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
                  To bring advanced AV technologies to every project we undertake, combining innovation, technical expertise, and uncompromising service to create solutions that perform beyond expectations.
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Scroll Anchor for navigation "#about" */}
        <div id="about" className="absolute bottom-0 h-px w-px pointer-events-none" />
      </div>

      <ProductsLight active={productsOn} covered={productsCovered} hidden={brandsSettled} />
      {/* Stacking wrapper: lifts the Brands overlay above the products screen. */}
      <div className="relative z-[130]">
        {brandsSettled && <div className="fixed inset-0 bg-white" aria-hidden="true" />}
        <BrandsScreen
          active={brandsOn}
          instant={brandsInstant}
          onEntered={onBrandsEntered}
          onExited={onBrandsExited}
        />
      </div>
      <DomainsScreen ref={domainsRef} active={domainsOn} warm={brandsSettled} />
      <ContactScreen ref={contactRef} active={contactOn} />
      {/* One nav across the overlay screens, so it holds still between them. */}
      {(productsOn || domainsOn || contactOn) && (
        <div className="fixed inset-x-0 top-0 z-[148]">
          <Navbar
            menuId="overlay-menu"
            tone={productsOn && !domainsOn && !contactOn ? "onLight" : "onDark"}
          />
        </div>
      )}
      <BandTransition ref={bandRef} />
      <DomeTransition ref={domeRef} />

    </div>
  );
}

/**
 * Cycles the phrase list on a fixed interval.
 *
 * `index` drives the schedule and `shown` drives the DOM: bumping the index
 * plays the exit, and only when that finishes does `shown` change — so the
 * incoming words never overwrite the outgoing ones mid-flight.
 */
function CyclingHeadline() {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const wrapRef = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % PHRASES.length), CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  // Exit the current phrase, then hand over to the enter effect below.
  useEffect(() => {
    if (index === shown) return;
    const words = wrapRef.current?.querySelectorAll<HTMLElement>("[data-word]");
    if (!words?.length || reduced) {
      setShown(index);
      return;
    }
    const tl = gsap.to(words, {
      yPercent: -110,
      opacity: 0,
      filter: "blur(10px)",
      duration: EXIT_S,
      ease: "power2.in",
      stagger: 0.028,
    });
    // Commit on a timer rather than the tween's onComplete. GSAP runs on
    // requestAnimationFrame, which a backgrounded tab pauses while the cycle
    // interval keeps firing — gating the swap on it strands the text.
    const commit = setTimeout(() => setShown(index), EXIT_S * 1000 + 60);
    return () => {
      tl.kill();
      clearTimeout(commit);
    };
  }, [index, shown, reduced]);

  // Enter whenever the rendered phrase changes (including first paint).
  useLayoutEffect(() => {
    const words = wrapRef.current?.querySelectorAll<HTMLElement>("[data-word]");
    if (!words?.length) return;
    if (reduced) {
      gsap.set(words, { yPercent: 0, opacity: 1, filter: "blur(0px)" });
      return;
    }
    const tl = gsap.fromTo(
      words,
      { yPercent: 110, opacity: 0, filter: "blur(12px)" },
      {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.78,
        ease: "power3.out",
        stagger: 0.05,
      },
    );
    return () => {
      tl.kill();
    };
  }, [shown, reduced]);

  return (
    <div className="@container flex w-full flex-col items-start text-left">
      {/* Left-aligned brand logo above the main text */}
      <div className="mb-5 flex flex-col items-start leading-none select-none">
        <span className="text-[20px] font-bold tracking-[0.04em] text-white sm:text-[24px] [text-shadow:0_2px_16px_rgba(0,0,0,0.65)]">
          AV NIRVANA
        </span>
        <span className="mt-[5px] text-[10px] font-semibold tracking-[0.44em] text-brand sm:text-[11.5px]">
          INDIA
        </span>
      </div>

      {/* Main headline text */}
      {/* 8.14cqw puts the widest line (11.92em) at 97% of the container. */}
      <p
        ref={wrapRef}
        aria-live="polite"
        className="w-full text-left text-[min(3.25rem,8.14cqw)] font-bold leading-[1.12] tracking-[-0.032em] text-white [text-shadow:0_2px_30px_rgba(0,0,0,0.55)]"
      >
        {PHRASES[shown].map((line, li) => (
          <span key={`${shown}-${li}`} className="flex gap-x-[0.28em] whitespace-nowrap">
            {line.split(" ").map((word, wi) => (
              // The clipping span gives the words an edge to slide out of.
              <span key={wi} className="inline-block overflow-hidden pb-[0.12em]">
                <span data-word className="inline-block will-change-transform">
                  {word}
                </span>
              </span>
            ))}
          </span>
        ))}
      </p>
    </div>
  );
}
