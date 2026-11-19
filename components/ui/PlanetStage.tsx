'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { MENU } from '@/lib/planets';

/** Share of the screen width the planet covers (centre sits on the left edge). */
const VISIBLE_DESKTOP = 0.4;
/** Desktop radius is also capped by screen height, so the top/bottom of the circle stay near the screen edges and the curve reads as a circle. */
const DESKTOP_R_MAX_H = 0.62;
/** Phones: a true circle centred on the bottom-left corner (radius as a share of width, capped by height). */
const MOBILE_CX = 0;
const MOBILE_R = 0.8;
const MOBILE_R_MAX_H = 0.36;
export const RIM_SCALE = 1.07;
export const RIM_SCALE_SUN = 1.12;
export const edgeOf = (s: number) => Math.sqrt(1 - 1 / (s * s));
export const RING_TILT = THREE.MathUtils.degToRad(62);
/** Ring outer edge as a multiple of the planet radius (plane is a bit larger than the ring image). */
export const RING_SIZE = 4.8;

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,190,90,0.55)');
  grd.addColorStop(0.35, 'rgba(255,140,40,0.22)');
  grd.addColorStop(1, 'rgba(255,120,20,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const RIM_VERT = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
export const RIM_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uEdge;
  varying vec3 vNormal;
  void main() {
    // brightest right at the planet edge, fading to nothing at the shell edge
    float t = clamp(-dot(vNormal, vec3(0.0, 0.0, 1.0)) / uEdge, 0.0, 1.0);
    float i = pow(t, 3.0) * 0.8;
    gl_FragColor = vec4(uColor * i, i);
  }
`;

interface Entry {
  holder: THREE.Group;
  tilt: THREE.Group;
  mesh: THREE.Mesh;
  rim: THREE.Mesh;
  ring?: THREE.Mesh;
  halo?: THREE.Mesh;
  moon?: THREE.Mesh;
  slot: number;
}

export default function PlanetStage({ index }: { index: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(index);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    host.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, -1, -6000, 6000);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
    sunLight.position.set(1.4, 0.9, 1.6);
    scene.add(sunLight);

    const loader = new THREE.TextureLoader();
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const disposables: { dispose: () => void }[] = [];
    // Every material starts with a 1px placeholder map. Swapping in the real image
    // later then does not change the shader, so there is no recompile hitch the
    // first time a planet appears.
    const blank = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
    blank.needsUpdate = true;
    blank.colorSpace = THREE.SRGBColorSpace;
    blank.wrapS = THREE.RepeatWrapping;
    disposables.push(blank);
    const sphereGeo = new THREE.SphereGeometry(1, 96, 64);
    const planeGeo = new THREE.PlaneGeometry(1, 1);
    disposables.push(sphereGeo, planeGeo);

    // Textures load one by one, the planet on screen first, then its neighbours.
    const jobs: { order: number; run: () => Promise<void> }[] = [];
    let disposed = false;
    const queueTexture = (order: number, url: string, repeat: boolean, done: (t: THREE.Texture) => void) => {
      jobs.push({
        order,
        run: () => new Promise<void>(resolve => {
          loader.load(url, t => {
            if (disposed) { t.dispose(); return resolve(); }
            t.colorSpace = THREE.SRGBColorSpace;
            t.anisotropy = maxAniso;
            if (repeat) t.wrapS = THREE.RepeatWrapping;
            disposables.push(t);
            renderer.initTexture(t);   // upload to the GPU now, not on first use
            done(t);
            resolve();
          }, undefined, () => resolve());
        }),
      });
    };

    let haloTex: THREE.CanvasTexture | null = null;

    const entries: Entry[] = MENU.map((item, i) => {
      const holder = new THREE.Group();
      const tilt = new THREE.Group();
      tilt.rotation.z = THREE.MathUtils.degToRad(item.tilt);
      holder.add(tilt);

      const mat = item.emissive
        ? new THREE.MeshBasicMaterial({ color: 0xffffff, map: blank })
        : new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, map: blank });
      disposables.push(mat);
      const mesh = new THREE.Mesh(sphereGeo, mat);
      tilt.add(mesh);
      queueTexture(Math.abs(i - indexRef.current), item.texture, true, t => {
        (mat as THREE.MeshBasicMaterial).map = t;
        mat.needsUpdate = true;
        if (i === indexRef.current) host.style.opacity = '1';
      });

      const rimMat = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(item.glow) },
          uEdge: { value: edgeOf(item.emissive ? RIM_SCALE_SUN : RIM_SCALE) },
        },
        vertexShader: RIM_VERT,
        fragmentShader: RIM_FRAG,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });
      disposables.push(rimMat);
      const rim = new THREE.Mesh(sphereGeo, rimMat);
      tilt.add(rim);

      const entry: Entry = { holder, tilt, mesh, rim, slot: i - indexRef.current };

      if (item.emissive) {
        haloTex = glowTexture();
        disposables.push(haloTex);
        const haloMat = new THREE.MeshBasicMaterial({
          map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        });
        disposables.push(haloMat);
        const halo = new THREE.Mesh(planeGeo, haloMat);
        halo.position.z = -50;
        holder.add(halo);
        entry.halo = halo;
      }

      if (item.ring) {
        const ringMat = new THREE.MeshBasicMaterial({
          transparent: true, side: THREE.DoubleSide, depthWrite: false, color: 0xe9e3d8, map: blank,
        });
        disposables.push(ringMat);
        const ring = new THREE.Mesh(planeGeo, ringMat);
        ring.rotation.x = -RING_TILT;
        tilt.add(ring);
        entry.ring = ring;
        queueTexture(Math.abs(i - indexRef.current) + 0.5, item.ring, false, t => {
          ringMat.map = t;
          ringMat.needsUpdate = true;
        });
      }

      if (item.moon) {
        const moonMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, map: blank });
        disposables.push(moonMat);
        const moon = new THREE.Mesh(sphereGeo, moonMat);
        holder.add(moon);
        entry.moon = moon;
        queueTexture(Math.abs(i - indexRef.current) + 0.25, item.moon, true, t => {
          moonMat.map = t;
          moonMat.needsUpdate = true;
        });
      }

      scene.add(holder);
      return entry;
    });

    // compile every shader in the background so nothing compiles mid-animation
    renderer.compileAsync(scene, camera).catch(() => {});

    jobs.sort((a, b) => a.order - b.order);
    (async () => { for (const j of jobs) { if (disposed) return; await j.run(); } })();

    let W = 1, H = 1, R = 1, sy = 1, mobile = false;
    const resize = () => {
      W = host.clientWidth || window.innerWidth;
      H = host.clientHeight || window.innerHeight;
      mobile = W < 768;
      if (mobile) {
        R = Math.min(MOBILE_R * W, MOBILE_R_MAX_H * H);
        sy = 1;
      } else {
        R = Math.min(VISIBLE_DESKTOP * W, DESKTOP_R_MAX_H * H);
        sy = 1;
      }
      // phones keep the planet's pole upright (no tilt), except the ring planet
      entries.forEach((e, i) => {
        const item = MENU[i];
        e.tilt.rotation.z = THREE.MathUtils.degToRad(mobile ? (item.ring ? 8 : 0) : item.tilt);
      });
      renderer.setSize(W, H, false);
      camera.left = 0;
      camera.right = W;
      camera.top = H / 2;
      camera.bottom = -H / 2;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ease = 1 - Math.exp(-dt * 6.5);
      const spacing = mobile ? W * (1 - MOBILE_CX) + R * 1.2 + 40 : H / 2 + R * sy * 1.2 + 60;

      entries.forEach((e, i) => {
        const item = MENU[i];
        e.slot += (i - indexRef.current - e.slot) * ease;
        const visible = Math.abs(e.slot) < 1.15;
        e.holder.visible = visible;
        if (!visible) return;

        // the wide ring would run under the menu on phones, so Saturn is smaller there
        const r = R * item.scale * (item.ring && W < 768 ? 0.8 : 1);
        if (mobile) e.holder.position.set(W * MOBILE_CX + e.slot * spacing, -H / 2, 0);
        else e.holder.position.set(0, -e.slot * spacing, 0);
        e.mesh.scale.set(r, r * sy, r);
        const rs = item.emissive ? RIM_SCALE_SUN : RIM_SCALE;
        e.rim.scale.set(r * rs, r * sy * rs, r * rs);
        e.mesh.rotation.y += item.spin * dt;

        if (e.halo) e.halo.scale.set(r * 3.3, r * sy * 3.3, 1);
        if (e.ring) e.ring.scale.set(r * RING_SIZE, r * RING_SIZE, 1);
        if (e.moon) {
          const bob = Math.sin(now / 2600) * R * 0.012;
          if (mobile) {
            const mr = W * 0.065;
            const dome = r * sy;                       // height of the planet's dome
            const mx = W * 0.56;                       // moon sits above the dome's right side
            const edge = dome * Math.sqrt(Math.max(0, 1 - (mx / r) ** 2));
            e.moon.position.set(mx, edge + mr * 2.6 + bob, 60);
            e.moon.scale.set(mr, mr, mr);
          } else {
            const mr = R * 0.15;
            e.moon.position.set(R * 1.08, R * 0.33 + bob, 60);
            e.moon.scale.set(mr, mr, mr);
          }
          e.moon.rotation.y += 0.03 * dt;
        }
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      disposables.forEach(d => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        opacity: 0, transition: 'opacity 0.9s ease',
      }}
    />
  );
}
