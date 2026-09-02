/**
 * The AV Nirvana mark, as vector geometry.
 *
 * Source of truth is `public/brand/logo.svg`; the path is inlined here so the
 * particle sampler can walk it synchronously with no network fetch. If the
 * brand asset changes, copy the new `d` attribute and viewBox in — everything
 * downstream (particle homes, the burst, the header mark) re-derives from this
 * one definition and cannot drift out of sync.
 *
 * Note the shape is a *single closed path*, not three separate chevrons: the
 * bands are joined on alternating sides into one continuous folded ribbon.
 * Walking its perimeter therefore traces both the outer and inner edges of
 * every chevron in one pass, which is exactly the outline the particles trace.
 */

export interface LogoSource {
  /** viewBox rect in path units. Not assumed to start at the origin. */
  viewBox: { x: number; y: number; width: number; height: number };
  /** One or more SVG path `d` strings, in viewBox units. */
  paths: string[];
}

const PATH =
  "M 175,389 175,852 371,726 630,555 851,704 964,782 996,806 995,992 993,993 " +
  "639,747 630,743 397,896 175,1038 175,1161 394,1032 630,886 787,988 " +
  "1086,1189 1086,727 631,409 268,655 265,655 265,463 371,389 631,213 848,362 " +
  "859,371 911,406 1086,530 1086,390 1083,387 846,222 630,68 523,145 Z";

/**
 * The asset ships inside a 1261×1247 viewBox with roughly 14% dead margin.
 * We use the artwork's own bounding box instead so the mark fills whatever
 * box it is fitted into, and the hero controls its breathing room explicitly
 * through `FIT_INSET_*` in `ParticleLogo`.
 */
export const AV_LOGO: LogoSource = {
  viewBox: { x: 175, y: 68, width: 911, height: 1121 },
  paths: [PATH],
};

export const AV_LOGO_VIEWBOX = `${AV_LOGO.viewBox.x} ${AV_LOGO.viewBox.y} ${AV_LOGO.viewBox.width} ${AV_LOGO.viewBox.height}`;
