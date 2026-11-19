'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Travelling-through-space background: soft nebula clouds + star dots that
 * stream outward from the centre. Everything is generated in a shader, so
 * there are no image files to load.
 *
 *  FLOW_DIRECTION  1 = fly forward (things grow outward from the centre)
 *                 -1 = zoom out   (things shrink in toward the centre)
 */
const FLOW_DIRECTION = 1;
const CLOUD_SPEED = 0.03;   // cycles per second (a cloud layer repeats every 1/CLOUD_SPEED s)
const STAR_SPEED = 0.055;

// Performance: the shader is the heaviest thing on the page, so it renders at
// a reduced resolution (the clouds are soft anyway) and a capped frame rate.
const RENDER_SCALE = 0.75;   // share of CSS pixels actually rendered
const FPS_HOME = 30;
const FPS_PAGE = 20;         // behind long scrolling pages

/**
 * Cloud colours (r, g, b in 0–1): shadow → body → bright highlight.
 * White version (current). The original blue/violet version was:
 *   SHADOW  0.08, 0.16, 0.42   BODY  0.40, 0.26, 0.82   LIGHT  0.34, 0.64, 0.98
 */
const CLOUD_SHADOW = [0.10, 0.12, 0.18];
const CLOUD_BODY = [0.50, 0.53, 0.60];
const CLOUD_LIGHT = [0.92, 0.95, 1.0];
const v3 = (c: number[]) => `vec3(${c.map(n => n.toFixed(3)).join(', ')})`;

const VERT = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec2  uRes;
  uniform float uTime;   // already multiplied by direction

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
    return v;
  }

  // One cloud layer. phase 0..1 = how far it has travelled; it fades in and out
  // so layers can overlap and the loop never shows a seam.
  vec3 cloudLayer(vec2 uv, float phase, float seed) {
    float zoom = exp(phase * 1.7);
    vec2 p = uv / zoom * 3.4 + seed * 17.3;
    float q = fbm(p * 1.3 + seed);
    float d = fbm(p + q * 0.9);
    d = smoothstep(0.43, 0.72, d);
    float fade = sin(3.14159265 * phase);
    vec3 col = mix(${v3(CLOUD_SHADOW)}, ${v3(CLOUD_BODY)}, smoothstep(0.25, 0.8, q));
    col = mix(col, ${v3(CLOUD_LIGHT)}, smoothstep(0.6, 1.0, d) * 0.4);
    return col * d * fade;
  }

  // One star layer: dots on a grid, each cell may hold a star.
  vec3 starLayer(vec2 uv, float phase, float seed, float gridN) {
    float zoom = exp(phase * 1.8);
    vec2 p = uv / zoom * gridN + seed * 31.7;
    vec2 id = floor(p), f = fract(p);
    float r = hash21(id);
    if (r > 0.5) return vec3(0.0);
    vec2 pos = vec2(hash21(id + 7.3), hash21(id + 13.1)) * 0.6 + 0.2;
    // radius in pixels: ~1px when far, a few px as it nears; converted to cell units
    float pxR = max(0.9, (0.7 + 0.8 * hash21(id + 3.7)) * (1.0 + 1.6 * phase) * (uRes.y / 900.0));
    float rad = pxR * gridN / (zoom * uRes.y);
    float dist = length(f - pos);
    float s = exp(-pow(dist / rad, 2.0) * 1.6);
    float fade = smoothstep(0.0, 0.18, phase) * smoothstep(1.0, 0.78, phase);
    vec3 tint = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.92, 0.8), hash21(id + 91.7));
    return tint * s * fade * (0.55 + 0.7 * hash21(id + 5.1));
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    vec3 col = vec3(0.006, 0.008, 0.028);

    // clouds — 3 layers, evenly staggered
    float cp = uTime * ${CLOUD_SPEED.toFixed(4)};
    vec3 clouds = vec3(0.0);
    for (int k = 0; k < 3; k++) {
      float ph = fract(cp + float(k) / 3.0);
      clouds += cloudLayer(uv, ph, float(k) + floor(cp + float(k) / 3.0) * 1.7);
    }
    // keep the very centre a little clearer, like the reference
    float r = length(uv);
    clouds *= 0.6 + 0.4 * smoothstep(0.0, 0.55, r);
    col += clouds * 1.15;

    // stars — 4 layers
    float sp = uTime * ${STAR_SPEED.toFixed(4)};
    for (int k = 0; k < 4; k++) {
      float ph = fract(sp + float(k) / 4.0);
      col += starLayer(uv, ph, float(k) + floor(sp + float(k) / 4.0) * 2.3, 16.0 + float(k) * 3.0);
    }

    // soft vignette
    col *= 1.0 - 0.35 * smoothstep(0.6, 1.4, r);
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Props {
  /** freeze the animation (e.g. during the page-enter zoom) */
  paused?: boolean;
  /** lower frame rate while a content page is open */
  calm?: boolean;
}

export default function SpaceBackground({ paused = false, calm = false }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const fpsRef = useRef(calm ? FPS_PAGE : FPS_HOME);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { fpsRef.current = calm ? FPS_PAGE : FPS_HOME; }, [calm]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(RENDER_SCALE);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = { uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 } };
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, depthTest: false, depthWrite: false });
    scene.add(new THREE.Mesh(geo, mat));

    const resize = () => {
      renderer.setSize(host.clientWidth || window.innerWidth, host.clientHeight || window.innerHeight, false);
      renderer.getDrawingBufferSize(uniforms.uRes.value);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const speed = reduce ? 0.12 : 1;
    let t = 40;   // start part-way so the first frame already has clouds in view
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (pausedRef.current) { last = now; return; }              // frozen: costs nothing
      if (now - last < 1000 / fpsRef.current - 2) return;          // frame cap
      t += Math.min(0.1, (now - last) / 1000) * speed;
      last = now;
      uniforms.uTime.value = t * FLOW_DIRECTION;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: '#02020a' }} />;
}
