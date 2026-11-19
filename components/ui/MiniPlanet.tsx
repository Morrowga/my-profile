'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { MENU, SectionId } from '@/lib/planets';
import { RIM_VERT, RIM_FRAG, RIM_SCALE, RIM_SCALE_SUN, edgeOf, RING_TILT, RING_SIZE } from '@/components/ui/PlanetStage';

const SIZE = 64;          // canvas size in CSS px
const SPIN = 0.55;        // rad/s — faster than the big planet so it reads at this size

/** Small, fully visible spinning planet for the top-right corner of a section page. */
export default function MiniPlanet({ id, onReady }: { id: SectionId; onReady?: () => void }) {
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start after the page has faded in, so creating the WebGL context and
    // decoding textures does not compete with the enter animation.
    let cleanup: (() => void) | undefined;
    const timer = window.setTimeout(() => { cleanup = init(); }, 400);
    return () => { window.clearTimeout(timer); cleanup?.(); };

    function init(): (() => void) | undefined {
    const host = hostRef.current;
    const item = MENU.find(m => m.id === id);
    if (!host || !item) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(SIZE, SIZE);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.DirectionalLight(0xffffff, 2.3);
    light.position.set(1.4, 0.9, 1.6);
    scene.add(light);

    const disposables: { dispose: () => void }[] = [];
    const sphereGeo = new THREE.SphereGeometry(1, 48, 32);
    const planeGeo = new THREE.PlaneGeometry(1, 1);
    disposables.push(sphereGeo, planeGeo);

    // a ringed planet needs room for its ring
    const r = item.ring ? 0.4 : item.emissive ? 0.78 : 0.84;
    const rimScale = item.emissive ? RIM_SCALE_SUN : RIM_SCALE;
    const tilt = new THREE.Group();
    tilt.rotation.z = THREE.MathUtils.degToRad(item.tilt);
    scene.add(tilt);

    // the Sun glows by itself, so it ignores the lights
    const mat = item.emissive
      ? new THREE.MeshBasicMaterial({ color: 0xffffff })
      : new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
    disposables.push(mat);
    const mesh = new THREE.Mesh(sphereGeo, mat);
    mesh.scale.setScalar(r);
    tilt.add(mesh);

    const rimMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(item.glow) }, uEdge: { value: edgeOf(rimScale) } },
      vertexShader: RIM_VERT, fragmentShader: RIM_FRAG,
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    });
    disposables.push(rimMat);
    const rim = new THREE.Mesh(sphereGeo, rimMat);
    rim.scale.setScalar(r * rimScale);
    tilt.add(rim);

    let disposed = false;
    const loader = new THREE.TextureLoader();
    // The planet counts as ready once its images have arrived. A failed image still
    // counts, so the loading indicator can never spin forever.
    let pending = item.ring ? 2 : 1;
    const oneDone = () => {
      if (--pending > 0 || disposed) return;
      host.style.opacity = '1';
      requestAnimationFrame(() => { if (!disposed) onReadyRef.current?.(); });
    };
    const load = (url: string, repeat: boolean, done: (t: THREE.Texture) => void) =>
      loader.load(
        url,
        t => {
          if (disposed) { t.dispose(); return; }
          t.colorSpace = THREE.SRGBColorSpace;
          if (repeat) t.wrapS = THREE.RepeatWrapping;
          disposables.push(t);
          done(t);
          oneDone();
        },
        undefined,
        () => oneDone(),
      );

    load(item.texture, true, t => {
      (mat as THREE.MeshBasicMaterial).map = t;
      mat.needsUpdate = true;
    });

    if (item.ring) {
      const ringMat = new THREE.MeshBasicMaterial({
        transparent: true, side: THREE.DoubleSide, depthWrite: false, color: 0xe9e3d8,
      });
      disposables.push(ringMat);
      const ring = new THREE.Mesh(planeGeo, ringMat);
      ring.rotation.x = -RING_TILT;
      ring.scale.setScalar(r * RING_SIZE);
      tilt.add(ring);
      load(item.ring, false, t => { ringMat.map = t; ringMat.needsUpdate = true; });
    }

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      mesh.rotation.y += SPIN * dt;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      disposables.forEach(d => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
    }
  }, [id]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      style={{
        position: 'relative', flexShrink: 0,
        width: SIZE, height: SIZE, pointerEvents: 'none',
        opacity: 0, transition: 'opacity 0.6s ease',
      }}
    />
  );
}
