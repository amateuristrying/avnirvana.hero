"use client";

import { useEffect, useState, type ReactNode } from "react";
import LogoMark from "@/components/hero/LogoMark";

const NAV_ARROW =
  "M15 23C14.4477 23 14 23.4477 14 24C14 24.5523 14.4477 25 15 25V24V23ZM33.7071 24.7071C34.0976 24.3166 34.0976 23.6834 33.7071 23.2929L27.3431 16.9289C26.9526 16.5384 26.3195 16.5384 25.9289 16.9289C25.5384 17.3195 25.5384 17.9526 25.9289 18.3431L31.5858 24L25.9289 29.6569C25.5384 30.0474 25.5384 30.6805 25.9289 31.0711C26.3195 31.4616 26.9526 31.4616 27.3431 31.0711L33.7071 24.7071ZM15 24V25H33V24V23H15V24Z";
const BTN_ARROW =
  "M24 32C23.4477 32 23 32.4477 23 33C23 33.5523 23.4477 34 24 34V33V32ZM42.7071 33.7071C43.0976 33.3166 43.0976 32.6834 42.7071 32.2929L36.3431 25.9289C35.9526 25.5384 35.3195 25.5384 34.9289 25.9289C34.5384 26.3195 34.5384 26.9526 34.9289 27.3431L40.5858 33L34.9289 38.6569C34.5384 39.0474 34.5384 39.6805 34.9289 40.0711C35.3195 40.4616 35.9526 40.4616 36.3431 40.0711L42.7071 33.7071ZM24 33V34H42V33V32H24V33Z";

/**
 * The Spotlight disc arrows, verbatim: 48px in the nav, 65px in buttons.
 * `tone="dark"` inverts it (black disc, white arrow) for use on white pills.
 */
export function Disc({
  size,
  tone = "light",
  className = "sp-disc",
}: {
  size: "nav" | "btn";
  tone?: "light" | "dark";
  className?: string;
}) {
  const disc = tone === "dark" ? "black" : "white";
  const arrow = tone === "dark" ? "white" : "black";
  if (size === "nav") {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="24" fill={disc} />
        <path d={NAV_ARROW} fill={arrow} />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 65 65" fill="none" aria-hidden="true">
      <circle cx="32.5" cy="32.5" r="32.5" fill={disc} />
      <path d={BTN_ARROW} fill={arrow} />
    </svg>
  );
}

/** The AV Nirvana lockup: mark, rule, and the stacked AV NIRVANA / INDIA wordmark. */
export function Lockup() {
  return (
    <>
      <LogoMark className="sp-mark" />
      <span className="sp-brand-rule" aria-hidden="true" />
      <span className="sp-word">
        <span className="sp-word-main">AV NIRVANA</span>
        <span className="sp-word-sub">INDIA</span>
      </span>
    </>
  );
}

/**
 * A section's head in the hero's own language: a glass tag, then two lines cut
 * out of the white ramp — General Sans Regular over General Sans Medium — each
 * in a mask it rises out of, and a lead. With `aside`, the head becomes a row:
 * tag and title on the left, `aside` (lead, controls) on the right.
 */
export function SectionHead({
  tag,
  a,
  b,
  lead,
  align = "center",
  titleId,
  aside,
}: {
  tag: string;
  a: string;
  b: string;
  lead?: string;
  align?: "center" | "left";
  titleId?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="v3-head" data-align={align} data-split={aside ? "true" : undefined}>
      <div className="v3-head-main">
        <span className="v3-tag">
          <LogoMark className="v3-tag-mark" />
          {tag}
        </span>
        <h2 className="v3-title" id={titleId}>
          <span className="v3-mask v3-mask-a">
            <span className="v3-ta">{a}</span>
          </span>{" "}
          <span className="v3-mask v3-mask-b">
            <span className="v3-tb">{b}</span>
          </span>
        </h2>
        {lead ? <p className="v3-lead">{lead}</p> : null}
      </div>
      {aside ? <div className="v3-head-aside">{aside}</div> : null}
    </header>
  );
}

/** Which of `ids` currently crosses the middle of the viewport. */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
          else setActive((cur) => (cur === entry.target.id ? null : cur));
        }
      },
      // A thin band just above the middle of the screen.
      { rootMargin: "-45% 0px -54% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return active;
}
