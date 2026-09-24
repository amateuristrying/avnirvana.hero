"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";
import { getPointer, subscribePointer } from "@/lib/pointer";

/**
 * Prismatic light background.
 *
 * A raymarched pyramid is lit from below and the ray is dispersed across a
 * cosine spectrum on exit, then bloomed heavily — which is what produces the
 * soft bands of colour rather than a hard glass solid. Everything renders in
 * one fragment shader on a full-screen triangle, so the cost is pixels, not
 * geometry; `dpr` is clamped low because the march is the expensive part.
 *
 * Props mirror the React Bits `Prism` API so the usage snippet drops straight
 * in; this is an original implementation of that interface.
 */
export interface PrismProps {
  className?: string;
  /** Pyramid height in world units. */
  height?: number;
  /** Pyramid base width in world units. */
  baseWidth?: number;
  /** `rotate` spins, `3drotate` tumbles, `hover` follows the cursor. */
  animationType?: "rotate" | "3drotate" | "hover";
  /** Bloom strength around the body. */
  glow?: number;
  /** Film grain amount. */
  noise?: number;
  /** Camera zoom — larger pulls the prism closer. */
  scale?: number;
  /** Rotates the whole palette, in turns. */
  hueShift?: number;
  /** How rapidly the spectrum cycles across the dispersed ray. */
  colorFrequency?: number;
  /** Multiplier on elapsed time. */
  timeScale?: number;
  /** Freeze the animation loop (keeps the last frame). */
  paused?: boolean;
  /** Device pixel ratio cap. Defaults to 1 — this shader is fill-bound. */
  dpr?: number;
}

const vertex = /* glsl */ `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
precision highp float;

uniform vec2  iResolution;
uniform float iTime;
uniform vec2  uPointer;
uniform float uHeight;
uniform float uBaseWidth;
uniform float uGlow;
uniform float uNoise;
uniform float uScale;
uniform float uHueShift;
uniform float uColorFreq;
uniform float uMode;        // 0 rotate, 1 3drotate, 2 hover

#define STEPS 64
#define FAR 16.0

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

// Cosine palette (Inigo Quilez), kept desaturated so the bloom reads as light
// rather than as printed colour.
vec3 palette(float t) {
  vec3 a = vec3(0.46, 0.44, 0.50);
  vec3 b = vec3(0.38, 0.36, 0.42);
  vec3 c = vec3(1.00, 1.00, 1.00);
  vec3 d = vec3(0.00, 0.20, 0.46);
  return a + b * cos(6.28318 * (c * t + d + uHueShift));
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Square pyramid SDF (IQ). h is height, unit base at y = 0.
float sdPyramid(vec3 p, float h) {
  float m2 = h * h + 0.25;
  p.xz = abs(p.xz);
  p.xz = (p.z > p.x) ? p.zx : p.xz;
  p.xz -= 0.5;
  vec3 q = vec3(p.z, h * p.y - 0.5 * p.x, h * p.x + 0.5 * p.y);
  float s = max(-q.x, 0.0);
  float t = clamp((q.y - 0.5 * p.z) / (m2 + 0.25), 0.0, 1.0);
  float a = m2 * (q.x + s) * (q.x + s) + q.y * q.y;
  float b = m2 * (q.x + 0.5 * t) * (q.x + 0.5 * t) + (q.y - m2 * t) * (q.y - m2 * t);
  float d2 = min(q.y, -q.x * m2 - q.y * 0.5) > 0.0 ? 0.0 : min(a, b);
  return sqrt((d2 + q.z * q.z) / m2) * sign(max(q.z, -p.y));
}

vec3 transform(vec3 p) {
  float t = iTime;
  if (uMode < 0.5) {
    p.xz *= rot(t * 0.6);
  } else if (uMode < 1.5) {
    p.xz *= rot(t * 0.55);
    p.xy *= rot(sin(t * 0.37) * 0.5);
  } else {
    // hover: the cursor steers the tilt over a slow idle drift
    p.xz *= rot(uPointer.x * 0.9 + t * 0.10);
    p.xy *= rot(-uPointer.y * 0.55 + sin(t * 0.22) * 0.10);
  }
  return p;
}

float map(vec3 p) {
  vec3 q = transform(p);
  q.y += uHeight * 0.30;
  q.xz /= max(uBaseWidth, 0.001);
  return sdPyramid(q, uHeight) * min(uBaseWidth, 1.0);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5 * iResolution.xy) / max(iResolution.y, 1.0);

  vec3 ro = vec3(0.0, 0.0, -21.0 / max(uScale, 0.001));
  vec3 rd = normalize(vec3(uv * 1.35, 1.6));

  // March straight through the body, accumulating emission. Treating the
  // prism as a participating volume rather than a lit surface is what keeps
  // the silhouette soft instead of cutting a hard triangle out of the frame.
  float t = 0.0;
  vec3 acc = vec3(0.0);
  float transmittance = 1.0;
  float halo = 0.0;

  for (int i = 0; i < STEPS; i++) {
    vec3 p = ro + rd * t;
    float d = map(p);

    // Outside contribution: soft bloom that falls off with distance
    halo += 0.020 / (0.10 + d * d * 9.0);

    if (d < 0.0) {
      // Inside: emission tinted by depth through the body and by where the
      // ray sits across the prism, which is what spreads the spectrum.
      float depth = clamp(-d * 1.6, 0.0, 1.0);
      float band = (p.y * 0.30 + p.x * 0.16 + t * 0.045) * uColorFreq;
      vec3 c = palette(band);
      acc += c * (0.055 + depth * 0.10) * transmittance;
      transmittance *= 0.955;
      if (transmittance < 0.02) break;
    }

    t += max(abs(d) * 0.65, 0.022);
    if (t > FAR) break;
  }

  // Base field: a very dark vertical wash so the frame is never flat black
  float bg = smoothstep(0.85, -0.6, uv.y);
  vec3 col = palette(uv.y * uColorFreq * 0.55 + 0.1) * bg * 0.055;

  col += acc * 1.35;
  col += palette(uv.y * uColorFreq * 0.7 + 0.2) * halo * 0.055 * uGlow;

  // Lift the lower centre, sink the top — the composition the copy sits in
  float lift = smoothstep(0.62, -0.5, uv.y);
  col += palette(0.35 + uHueShift) * lift * 0.075 * uGlow;
  col *= mix(0.22, 1.0, smoothstep(1.0, -0.35, uv.y * 1.25 + 0.3));

  // Light spilling toward the viewer along the bottom edge
  float bottom = smoothstep(-0.08, -0.52, uv.y);
  col += palette(0.55 + uHueShift) * bottom * 0.13 * uGlow;

  // Radial vignette keeps attention centred
  col *= 1.0 - smoothstep(0.50, 1.18, length(uv * vec2(0.85, 1.0))) * 0.60;

  float g = hash(frag + fract(iTime) * 137.0) - 0.5;
  col += g * uNoise * 0.045;

  col = max(col, 0.0);
  col = col / (1.0 + col * 0.72);   // filmic rolloff keeps highlights from clipping
  col = pow(col, vec3(0.92));

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function Prism({
  className,
  height = 3.4,
  baseWidth = 5.5,
  animationType = "rotate",
  glow = 1,
  noise = 0.5,
  scale = 4.2,
  hueShift = 0,
  colorFrequency = 0.8,
  timeScale = 0.7,
  paused = false,
  dpr,
}: PrismProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      dpr: dpr ?? 1,
      alpha: false,
      antialias: false,
    });
    const gl = renderer.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const modeIndex = animationType === "hover" ? 2 : animationType === "3drotate" ? 1 : 0;

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iResolution: { value: [gl.drawingBufferWidth, gl.drawingBufferHeight] },
        iTime: { value: 0 },
        uPointer: { value: [0, 0] },
        uHeight: { value: height },
        uBaseWidth: { value: baseWidth },
        uGlow: { value: glow },
        uNoise: { value: noise },
        uScale: { value: scale },
        uHueShift: { value: hueShift },
        uColorFreq: { value: colorFrequency },
        uMode: { value: modeIndex },
      },
    });

    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h);
      program.uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const releasePointer = animationType === "hover" ? subscribePointer() : () => {};
    const pointer = getPointer();
    const smooth = { x: 0, y: 0 };

    let raf = 0;
    let running = true;
    let elapsed = 0;
    let last = performance.now();

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);

      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      if (!paused) elapsed += dt * timeScale;

      if (animationType === "hover") {
        const tx = pointer.active ? pointer.nx : 0;
        const ty = pointer.active ? pointer.ny : 0;
        const k = 1 - Math.exp(-dt / 0.45);
        smooth.x += (tx - smooth.x) * k;
        smooth.y += (ty - smooth.y) * k;
        program.uniforms.uPointer.value = [smooth.x, smooth.y];
      }

      program.uniforms.iTime.value = elapsed;
      renderer.render({ scene: mesh });
    };
    raf = requestAnimationFrame(frame);

    // Stop entirely when scrolled out of view.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          last = performance.now();
          raf = requestAnimationFrame(frame);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 },
    );
    io.observe(container);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      releasePointer();
      const lose = gl.getExtension("WEBGL_lose_context");
      if (lose) lose.loseContext();
      if (canvas.parentElement === container) container.removeChild(canvas);
    };
  }, [
    height,
    baseWidth,
    animationType,
    glow,
    noise,
    scale,
    hueShift,
    colorFrequency,
    timeScale,
    paused,
    dpr,
  ]);

  return <div ref={containerRef} className={className ?? "h-full w-full"} aria-hidden="true" />;
}
