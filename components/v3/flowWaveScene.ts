/**
 * Flow Wave — the v3 site's living ground.
 *
 * A 1:1 port of the "Flow Wave" Three.js brief: one Points sheet reshaped by
 * two octaves of Simplex noise, additive mint points, camera-attached motes,
 * and three composers blended by FinalPass. Pinned to three r143 (the brief's
 * version) and loaded as a module instead of through an importmap.
 *
 * The values are the brief's closing "use exactly these" list. That list sets
 * bgColor to #0e16fb, where the constants block above it said #02160c; the
 * closing list wins.
 *
 * Changes for a multi-section page, none of them visual:
 * - The page's own content is the scroll host, so the dive runs over the site.
 * - `mouseout` only counts when the pointer leaves the window; over a page full
 *   of elements it would otherwise fire between every pair of them.
 * - The scroll fraction is also recomputed when the page height changes.
 * - With prefers-reduced-motion the clock is held still: the field stops
 *   drifting but still follows scroll and the cursor.
 */

import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";

// ── Fixed parameters ────────────────────────────────────────────────────────
const bgColor = "#0e16fb"; // FinalPass background tint
const flameColor = "#0aff7f"; // corner-flame A
const flameColor2 = "#aef0c0"; // corner-flame B
const flameAmt = 0.2; // corner-flame intensity
const atmoColor = "#7affbf"; // ambient motes color
const atmoCount = 300; // mote count
const atmoSize = 24; // mote base size
const atmoSpeed = 1.0; // mote warp speed
const colorLow = "#02160c"; // points low color
const colorHigh = "#34e89a"; // points high color
const opacity = 0.26; // point opacity
const pointSize = 5.5; // point base size
const brightness = 0.45; // point color multiplier
const waveHeight = 3; // base swell amplitude
const flow = 1; // noise scroll speed
const tilt = 0; // sheet X rotation (negated)
const scale = 0.275; // shrinks the sheet to frame
const scrollRise = 1.0; // swell amplitude growth on scroll
const camStartY = 7,
  camStartZ = 16; // scroll 0 camera
const camEndY = 0.8,
  camEndZ = -2; // scroll 1 camera
const lookStartZ = 2,
  lookEndZ = -16; // look-target pan
const parallax = 1.2;
const pointerRadius = 7.0;
const pointerStrength = 0.9;

// ── Helpers ─────────────────────────────────────────────────────────────────
const Lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
function hexToVec3(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const LAYERS = { NONE: 0, TORUS_SCENE: 1, BLOOM_SCENE: 2, ENTIRE_SCENE: 3 };

// ── Shaders (verbatim) ──────────────────────────────────────────────────────
const SNOISE = /* glsl */ `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx; vec3 x2 = x0 - i2 + 2.0 * C.xxx; vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0; vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

const POINTS_VERT = /* glsl */ `
uniform float uTime; uniform float uStream; uniform float uSize; uniform float uWaveHeight; uniform float uFlow; uniform float uScale;
uniform vec3 uColLow; uniform vec3 uColHigh;
uniform vec3 uCursor; uniform float uRepelRadius; uniform float uRepelStrength; uniform float uActivity;
varying float vFade; varying vec3 vColor;
${SNOISE}
void main() {
  vec3 wp = vec3(position.x * 13.0, 0.0, position.z * 25.0);
  wp.x += position.y * 6.0;
  // uStream slides the sampled hills toward the camera (forward flight).
  float zc = wp.z + uStream;
  float wn = snoise(vec3(wp.x * 0.08, zc * 0.08, uTime * 0.15 * uFlow)) * 2.0;
  wn += snoise(vec3(wp.x * 0.16, zc * 0.16, uTime * 0.3 * uFlow)) * 0.8;
  wp.y += wn * uWaveHeight;

  vec3 finalPos = wp * uScale;
  vec4 modelPosition = modelMatrix * vec4(finalPos, 1.0);
  vec3 toP = modelPosition.xyz - uCursor;
  float cd = length(toP);
  float fall = smoothstep(uRepelRadius, 0.0, cd);
  modelPosition.xyz += normalize(toP + vec3(0.0001)) * fall * uRepelStrength * uActivity;
  vec4 mvPosition = viewMatrix * modelPosition;

  float colMix = smoothstep(-3.0, 3.0, position.y + position.x * 0.5);
  vColor = mix(uColLow, uColHigh, clamp(colMix, 0.0, 1.0));
  vFade = 1.0;

  gl_PointSize = uSize * (10.0 / -mvPosition.z);
  gl_PointSize = max(gl_PointSize, 1.5);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const POINTS_FRAG = /* glsl */ `
uniform float uOpacity; uniform float uBrightness; uniform float uAppear;
varying float vFade; varying vec3 vColor;
void main() {
  vec2 xy = gl_PointCoord - 0.5;
  float ll = length(xy);
  if (ll > 0.5) discard;
  float a = smoothstep(0.5, 0.1, ll);
  gl_FragColor = vec4(vColor * uBrightness, vFade * a * uOpacity * uAppear);
}
`;

const FINAL_VERT = /* glsl */ `
varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }
`;

const FINAL_FRAG = /* glsl */ `
uniform float iTime; uniform sampler2D tDiffuse; uniform sampler2D bloomTexture; uniform sampler2D torusTexture; uniform sampler2D haloTexture;
uniform vec3 uBg; uniform vec3 uFlameA; uniform vec3 uFlameB; uniform float uFlameAmt;
varying vec2 vUv;
vec3 warp3d(vec3 pos, float t){ float curv=.8,a=1.9,b=0.7; pos*=2.;
  pos.x+=curv*sin(t+a*pos.y)+t*b; pos.y+=curv*cos(t+a*pos.x);
  pos.y+=curv*sin(t+a*pos.z)+t*b; pos.z+=curv*cos(t+a*pos.y);
  pos.z+=curv*sin(t+a*pos.x)+t*b; pos.x+=curv*cos(t+a*pos.z);
  return 0.5+0.5*cos(pos.xyz+vec3(1,2,4)); }
void main(){
  vec2 uv = 2.*vUv - 1.;
  vec3 w = pow(warp3d(vec3(uv.x, sin(uv.y), uv.y), iTime*1.5), vec3(1.5));
  vec3 flame = 1.5*uFlameA*w.x; flame*=w.y; flame += uFlameB*w.z;
  flame *= smoothstep(0.25, 1., abs(uv.y));
  float md = smoothstep(-0.7, 1., -uv.y*uv.x); flame *= md*md;
  vec3 bg = uBg * (1.0 - 0.4 * length(uv));
  vec3 halo = texture2D(haloTexture, vUv).xyz;
  gl_FragColor = vec4(bg + flame*uFlameAmt + texture2D(bloomTexture, vUv).xyz + texture2D(torusTexture, vUv).xyz + texture2D(tDiffuse, vUv).xyz + halo, 1.);
}
`;

const ATMO_VERT = /* glsl */ `
attribute float size; attribute float seed; uniform float uTime; uniform vec2 uRes;
varying float vA;
vec3 warp(vec3 p, float t){ float c=0.9,a=1.9,b=0.02,s=0.05; p*=2.;
  p.x+=c*sin(s*t+a*p.y)+t*b; p.y+=c*cos(s*t+a*p.x); p.y+=c*sin(s*t+a*p.z)+t*b;
  p.z+=c*cos(s*t+a*p.y); p.z+=c*sin(s*t+a*p.x)+t*b; p.x+=c*cos(s*t+a*p.z);
  return cos(p+vec3(1,2,4)); }
void main(){
  vec3 v = position*4.0 + warp(position, uTime)*1.2;
  vec4 mv = modelViewMatrix * vec4(v, 1.0);
  float r = length(v); float farF = 1.0 - smoothstep(5.0, 6.5, r); float nearF = smoothstep(0.0, 0.5, -mv.z);
  vA = farF * nearF;
  gl_PointSize = size * uRes.y / 900.0 / -mv.z; gl_PointSize = max(gl_PointSize, 1.0);
  gl_Position = projectionMatrix * mv;
}
`;

const ATMO_FRAG = /* glsl */ `
uniform vec3 uColor; varying float vA;
void main(){ vec2 p = gl_PointCoord - 0.5; float l = length(p); if (l > 0.5) discard;
  float tex = smoothstep(0.5, 0.0, l); gl_FragColor = vec4(uColor * tex, tex * vA * 0.6); }
`;

export interface FlowWaveOptions {
  /** Hold the clock still (prefers-reduced-motion). */
  reducedMotion?: boolean;
}

/** Starts the scene on `canvas`; returns a function that tears it down. */
export function createFlowWave(canvas: HTMLCanvasElement, { reducedMotion = false }: FlowWaveOptions = {}) {
  const frozenT = performance.now() / 1000;
  const clock = () => (reducedMotion ? frozenT : performance.now() / 1000);

  // ── Renderer, scene, camera ───────────────────────────────────────────────
  const renderer = new THREE.WebGL1Renderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 0, 15);

  const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 400);
  camera.position.set(0, 7, 16);
  camera.layers.enable(LAYERS.TORUS_SCENE);
  camera.layers.enable(LAYERS.BLOOM_SCENE);
  camera.layers.enable(LAYERS.ENTIRE_SCENE);
  scene.add(camera);

  // ── Postprocessing: three composers sharing one RenderPass ───────────────
  const renderPass = new RenderPass(scene, camera);

  const torusComposer = new EffectComposer(renderer);
  torusComposer.renderToScreen = false;
  const torusGamma = new ShaderPass(GammaCorrectionShader);
  const torusBloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.22, 0.2, 0);
  const torusCopy = new ShaderPass(CopyShader);
  torusComposer.addPass(renderPass);
  torusComposer.addPass(torusGamma);
  torusComposer.addPass(torusBloom);
  torusComposer.addPass(torusCopy);

  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  const bloomBloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.4, 0.55, 0);
  const bloomGamma = new ShaderPass(GammaCorrectionShader);
  bloomComposer.addPass(renderPass);
  bloomComposer.addPass(bloomBloom);
  bloomComposer.addPass(bloomGamma);

  const finalPass = new ShaderPass({
    uniforms: {
      iTime: { value: 0 },
      tDiffuse: { value: null },
      torusTexture: { value: null },
      bloomTexture: { value: null },
      haloTexture: { value: null },
      uBg: { value: hexToVec3(bgColor) },
      uFlameA: { value: hexToVec3(flameColor) },
      uFlameB: { value: hexToVec3(flameColor2) },
      uFlameAmt: { value: flameAmt },
    },
    vertexShader: FINAL_VERT,
    fragmentShader: FINAL_FRAG,
  });
  const finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(renderPass);
  finalComposer.addPass(finalPass);
  finalPass.uniforms.bloomTexture.value = bloomComposer.renderTarget1.texture;
  finalPass.uniforms.torusTexture.value = torusComposer.renderTarget1.texture;

  // ── The flow sheet ────────────────────────────────────────────────────────
  const uniforms = {
    uTime: { value: 0 },
    uStream: { value: 0 },
    uAppear: { value: 0 },
    uColLow: { value: hexToVec3(colorLow) },
    uColHigh: { value: hexToVec3(colorHigh) },
    uOpacity: { value: opacity },
    uSize: { value: pointSize },
    uBrightness: { value: brightness },
    uWaveHeight: { value: waveHeight },
    uFlow: { value: flow },
    uScale: { value: scale },
    uCursor: { value: new THREE.Vector3() },
    uRepelRadius: { value: pointerRadius },
    uRepelStrength: { value: pointerStrength },
    uActivity: { value: 0 },
  };
  const sheetGeometry = new THREE.SphereGeometry(4.2, 200, 600);
  const sheetMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: POINTS_VERT,
    fragmentShader: POINTS_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(sheetGeometry, sheetMaterial);
  points.frustumCulled = false;
  points.layers.enable(LAYERS.ENTIRE_SCENE);
  const group = new THREE.Group();
  group.add(points);
  scene.add(group);

  // ── Ambient motes (camera-attached) ───────────────────────────────────────
  const atmo = (() => {
    const N = Math.round(atmoCount);
    const positions = new Float32Array(N * 3);
    const sizes = new Float32Array(N);
    const seeds = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      positions[i * 3] = 2 * Math.random() - 1;
      positions[i * 3 + 1] = 2 * Math.random() - 1;
      positions[i * 3 + 2] = 2 * Math.random() - 1;
      sizes[i] = atmoSize * (0.4 + Math.random());
      seeds[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));
    const atmoMat = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: hexToVec3(atmoColor) },
        uRes: { value: new THREE.Vector2(innerWidth * devicePixelRatio, innerHeight * devicePixelRatio) },
      },
      vertexShader: ATMO_VERT,
      fragmentShader: ATMO_FRAG,
    });
    const pts = new THREE.Points(geo, atmoMat);
    pts.frustumCulled = false;
    pts.layers.enable(LAYERS.ENTIRE_SCENE);
    pts.onBeforeRender = () => {
      const t = clock();
      atmoMat.uniforms.uTime.value = t * atmoSpeed * 8.0;
      pts.position.copy(camera.position);
      finalPass.uniforms.iTime.value = t;
    };
    scene.add(pts);
    return { geo, atmoMat };
  })();

  // ── Scroll input (double-damped) ──────────────────────────────────────────
  let scrollTarget = 0;
  let scrollSmooth = 0;
  let scrollCurrent = 0;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollTarget = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
  };

  // ── Pointer input ─────────────────────────────────────────────────────────
  const mouseTarget = { x: 0, y: 0 };
  const mouse = { x: 0, y: 0 };
  const POINTER = { world: new THREE.Vector3(), activity: 0, active: false, lastMove: performance.now() };
  const onMouseMove = (e: MouseEvent) => {
    mouseTarget.x = (e.clientX / innerWidth) * 2 - 1;
    mouseTarget.y = -((e.clientY / innerHeight) * 2 - 1);
    POINTER.active = true;
    POINTER.lastMove = performance.now();
  };
  const onMouseOut = (e: MouseEvent) => {
    if (!e.relatedTarget) POINTER.active = false;
  };

  const _ndc = new THREE.Vector3(),
    _dir = new THREE.Vector3(),
    _tgt = new THREE.Vector3();
  function updatePointerWorld() {
    _tgt.set(0, 0, 0);
    if (POINTER.active) {
      _ndc.set(mouse.x, mouse.y, 0.5).unproject(camera);
      _dir.copy(_ndc).sub(camera.position).normalize();
      const dn = _dir.z;
      if (Math.abs(dn) > 1e-4) {
        const tt = -camera.position.z / dn;
        if (tt > 0 && Number.isFinite(tt)) _tgt.copy(camera.position).addScaledVector(_dir, tt);
      }
    }
    POINTER.world.lerp(_tgt, 0.12);
    const idle = (performance.now() - POINTER.lastMove) / 1000;
    POINTER.activity += ((POINTER.active && idle < 3 ? 1 : 0) - POINTER.activity) * 0.06;
  }

  // ── Per-frame scene update ────────────────────────────────────────────────
  const sceneObj = {
    stream: 0,
    appearStart: performance.now(),
    t0: clock(),
    render(scroll: number, m: { x: number; y: number }) {
      const t = clock();
      const dt = Math.min(0.05, t - this.t0);
      this.t0 = t;
      uniforms.uTime.value = t;

      // Stream the hills toward us at a constant rate; grow the swell with scroll.
      this.stream += dt * (flow * 2.0) * 4.0;
      uniforms.uStream.value = this.stream;
      uniforms.uWaveHeight.value = waveHeight * (1 + scroll * scrollRise);

      // Camera fly-path: smoothstep over the first 35% of scroll.
      const ea = Math.min(scroll / 0.35, 1.0);
      const e = ea * ea * (3 - 2 * ea);
      const camY = Lerp(camStartY, camEndY, e);
      const camZ = Lerp(camStartZ, camEndZ, e);
      camera.position.set(m.x * parallax, camY + m.y * parallax * 0.3, camZ);
      camera.lookAt(m.x * parallax * 0.5, Lerp(0.0, 0.6, e), Lerp(lookStartZ, lookEndZ, e));
      group.rotation.x = -tilt;
      group.rotation.y = 0;
      updatePointerWorld();

      uniforms.uCursor.value.copy(POINTER.world);
      uniforms.uActivity.value = POINTER.activity;
      const elapsed = (performance.now() - this.appearStart) / 1000;
      uniforms.uAppear.value = Math.max(0, Math.min(1, (elapsed - 0.2) / 1.4)); // 0.2s delay, 1.4s fade-in
    },
  };

  // ── Resize ────────────────────────────────────────────────────────────────
  const composers = [torusComposer, bloomComposer, finalComposer];
  const resize = () => {
    const w = innerWidth;
    const h = innerHeight;
    const dpr = devicePixelRatio;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    for (const c of composers) {
      c.setPixelRatio(dpr);
      c.setSize(w, h);
    }
    onScroll();
  };

  // ── Render loop ───────────────────────────────────────────────────────────
  let raf = 0;
  const frame = () => {
    raf = requestAnimationFrame(frame);
    scrollSmooth = Lerp(scrollSmooth, scrollTarget, 0.1);
    scrollCurrent = Lerp(scrollCurrent, scrollSmooth, 0.06);
    mouse.x = Lerp(mouse.x, mouseTarget.x, 0.06);
    mouse.y = Lerp(mouse.y, mouseTarget.y, 0.06);
    sceneObj.render(scrollCurrent, mouse);
    camera.layers.set(LAYERS.TORUS_SCENE);
    torusComposer.render();
    camera.layers.set(LAYERS.BLOOM_SCENE);
    bloomComposer.render();
    camera.layers.set(LAYERS.ENTIRE_SCENE);
    finalComposer.render();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("mousemove", onMouseMove, { passive: true });
  window.addEventListener("mouseout", onMouseOut);
  window.addEventListener("resize", resize);
  // Content below the fold (fonts, images) changes the page height without a
  // scroll or resize; keep the scroll fraction honest when it does.
  const heightWatch = new ResizeObserver(onScroll);
  heightWatch.observe(document.body);

  resize();
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseout", onMouseOut);
    window.removeEventListener("resize", resize);
    heightWatch.disconnect();

    sheetGeometry.dispose();
    sheetMaterial.dispose();
    atmo.geo.dispose();
    atmo.atmoMat.dispose();
    for (const pass of [torusGamma, torusCopy, bloomGamma, finalPass]) {
      pass.material.dispose();
      // r143's Pass has no dispose(); only its full-screen quad does.
      (pass as unknown as { fsQuad?: { dispose(): void } }).fsQuad?.dispose();
    }
    torusBloom.dispose();
    bloomBloom.dispose();
    for (const c of composers) {
      c.renderTarget1.dispose();
      c.renderTarget2.dispose();
    }
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
