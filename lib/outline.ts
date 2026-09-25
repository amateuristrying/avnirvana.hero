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
 * Fast mathematical polygon point-in-polygon tester.
 * Completely immune to canvas rendering bugs, scale quantization, or DOMMatrix issues.
 */
function createPolygonTester(source: LogoSource) {
  const polygons: [number, number][][] = [];
  for (const d of source.paths) {
    const clean = d.replace(/[MZ]/gi, "").trim();
    const pairs = clean.split(/\s+/).map((p) => {
      const parts = p.split(",");
      return [parseFloat(parts[0]), parseFloat(parts[1])] as [number, number];
    });
    if (pairs.length >= 3) polygons.push(pairs);
  }

  return (x: number, y: number): boolean => {
    for (const poly of polygons) {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0];
        const yi = poly[i][1];
        const xj = poly[j][0];
        const yj = poly[j][1];
        const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      if (inside) return true;
    }
    return false;
  };
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

    const isInside = createPolygonTester(source);

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

export interface InteriorSample {
  count: number;
  x: Float32Array;
  y: Float32Array;
}

/**
 * Samples points uniformly distributed across the entire filled body of the logo ribbons,
 * ensuring top, middle, and bottom chevrons are all equally and densely populated.
 */
export function sampleInterior(source: LogoSource, count: number, seed = 20260830): InteriorSample {
  const rnd = mulberry32(seed);
  const isInside = createPolygonTester(source);
  const vb = source.viewBox;

  // Compute polygon area (Shoelace formula) to calibrate exact grid step for uniform density
  let area = 0;
  for (const d of source.paths) {
    const clean = d.replace(/[MZ]/gi, "").trim();
    const poly = clean.split(/\s+/).map((p) => p.split(",").map(Number));
    for (let i = 0; i < poly.length; i++) {
      const j = (i + 1) % poly.length;
      area += poly[i][0] * poly[j][1] - poly[j][0] * poly[i][1];
    }
  }
  area = Math.abs(area) / 2;
  if (area === 0) area = vb.width * vb.height * 0.4;

  const step = Math.sqrt(area / Math.max(1, count));
  const halfStep = step * 0.5;

  const xList: number[] = [];
  const yList: number[] = [];

  // Uniform grid scan across the entire viewBox bounding box from top to bottom
  for (let y = vb.y + halfStep; y < vb.y + vb.height; y += step) {
    for (let x = vb.x + halfStep; x < vb.x + vb.width; x += step) {
      const jx = (rnd() - 0.5) * step * 0.76;
      const jy = (rnd() - 0.5) * step * 0.76;
      const px = x + jx;
      const py = y + jy;
      if (isInside(px, py)) {
        xList.push(px);
        yList.push(py);
      }
    }
  }

  const collected = xList.length;
  const xArr = new Float32Array(collected);
  const yArr = new Float32Array(collected);
  for (let i = 0; i < collected; i++) {
    xArr[i] = xList[i];
    yArr[i] = yList[i];
  }

  return {
    count: collected,
    x: xArr,
    y: yArr,
  };
}
