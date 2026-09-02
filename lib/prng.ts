/**
 * Tiny deterministic PRNG helpers.
 *
 * The particle field is generated from a fixed seed so that a given viewport
 * always produces the same logo, which keeps resizes and re-mounts stable
 * instead of reshuffling the mark under the user.
 */

export type Random = () => number;

/** mulberry32 — small, fast, good enough distribution for scatter. */
export function mulberry32(seed: number): Random {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample (Box–Muller), clamped to keep outliers sane. */
export function gaussian(rnd: Random, clamp = 3): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rnd();
  while (v === 0) v = rnd();
  const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return g < -clamp ? -clamp : g > clamp ? clamp : g;
}
