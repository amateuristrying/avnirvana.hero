/**
 * Generic SVG outline sampler.
 *
 *   logoSource -> path -> evenly spaced points along the *stroke* -> particles
 *
 * Points are walked along the path with `getPointAtLength`, so they land on the
 * geometric contour of the shape and never inside it. That is the whole point:
 * the mark must read as an outline traced in particles, not as a filled
 * silhouette. Because we walk the path itself rather than rasterising a fill,
 * this works unchanged for any future production SVG, curves included.
 *
 * Each sample also carries the outward-facing unit normal, which lets the
 * particle system thicken the stroke symmetrically and push its halo away from
 * the shape rather than into its hollow interior.
 */

import type { LogoSource } from "./logo";
import { mulberry32 } from "./prng";

export interface OutlineSample {
  count: number;
  /** Positions in viewBox units. */
  x: Float32Array;
  y: Float32Array;
  /** Outward unit normal in viewBox units. */
  nx: Float32Array;
  ny: Float32Array;
}

const SVG_NS = "http://www.w3.org/2000/svg";
/** Distance used to probe which side of the contour is "outside", in viewBox units. */
const PROBE = 2.5;
/** Half-window for the finite-difference tangent, in path length units. */
const TANGENT_EPS = 0.8;

/**
 * Builds an offscreen 2D context holding the combined filled mark, used purely
 * for inside/outside tests. Kept small — we only need hit testing, not pixels.
 */
function createHitTester(source: LogoSource) {
  const vb = source.viewBox;
  const target = 320;
  const scale = target / vb.width;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(vb.width * scale);
  canvas.height = Math.ceil(vb.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // The viewBox need not start at the origin, so shift the artwork onto the
  // canvas — `isPointInPath` is unreliable for points outside the bitmap.
  const combined = new Path2D();
  const matrix = new DOMMatrix([scale, 0, 0, scale, -vb.x * scale, -vb.y * scale]);
  for (const d of source.paths) combined.addPath(new Path2D(d), matrix);

  return (x: number, y: number) =>
    ctx.isPointInPath(combined, (x - vb.x) * scale, (y - vb.y) * scale);
}

export function sampleOutline(source: LogoSource, count: number, seed = 20260830): OutlineSample {
  const rnd = mulberry32(seed);

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute(
    "viewBox",
    `${source.viewBox.x} ${source.viewBox.y} ${source.viewBox.width} ${source.viewBox.height}`,
  );
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;";

  const elements: SVGPathElement[] = source.paths.map((d) => {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
    return path;
  });
  document.body.appendChild(svg);

  try {
    const lengths = elements.map((p) => p.getTotalLength());
    const total = lengths.reduce((sum, l) => sum + l, 0);
    if (!(total > 0)) {
      return { count: 0, x: new Float32Array(0), y: new Float32Array(0), nx: new Float32Array(0), ny: new Float32Array(0) };
    }

    // Uniform arc-length spacing across every subpath, so density is even
    // regardless of how the mark is split into paths.
    const step = total / count;
    const perPath = lengths.map((l) => Math.max(1, Math.round(l / step)));
    const actual = perPath.reduce((sum, n) => sum + n, 0);

    const x = new Float32Array(actual);
    const y = new Float32Array(actual);
    const nx = new Float32Array(actual);
    const ny = new Float32Array(actual);

    const isInside = createHitTester(source);

    let w = 0;
    for (let p = 0; p < elements.length; p++) {
      const el = elements[p];
      const len = lengths[p];
      const n = perPath[p];
      const localStep = len / n;

      for (let i = 0; i < n; i++) {
        // Centre of the slot plus a little jitter, so the ring of dots reads as
        // organic rather than as a mechanical comb.
        const jitter = (rnd() - 0.5) * localStep * 0.5;
        let at = (i + 0.5) * localStep + jitter;
        if (at < 0) at = 0;
        else if (at > len) at = len;

        const point = el.getPointAtLength(at);

        const before = el.getPointAtLength(Math.max(0, at - TANGENT_EPS));
        const after = el.getPointAtLength(Math.min(len, at + TANGENT_EPS));
        let tx = after.x - before.x;
        let ty = after.y - before.y;
        const tlen = Math.hypot(tx, ty);
        if (tlen > 1e-6) {
          tx /= tlen;
          ty /= tlen;
        } else {
          tx = 1;
          ty = 0;
        }

        // Perpendicular, then flipped if it points into the filled shape.
        let ox = -ty;
        let oy = tx;
        if (isInside && isInside(point.x + ox * PROBE, point.y + oy * PROBE)) {
          ox = -ox;
          oy = -oy;
        }

        x[w] = point.x;
        y[w] = point.y;
        nx[w] = ox;
        ny[w] = oy;
        w++;
      }
    }

    return { count: actual, x, y, nx, ny };
  } finally {
    svg.remove();
  }
}
