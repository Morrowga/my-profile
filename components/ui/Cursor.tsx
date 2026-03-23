'use client';
import { useEffect, useRef } from 'react';

export default function Cursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const pos  = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 3}px, ${e.clientY - 3}px)`;
      }
    };

    const onEnter = () => {
      if (ringRef.current) {
        ringRef.current.style.width = '52px';
        ringRef.current.style.height = '52px';
        ringRef.current.style.opacity = '1';
      }
    };

    const onLeave = () => {
      if (ringRef.current) {
        ringRef.current.style.width = '34px';
        ringRef.current.style.height = '34px';
        ringRef.current.style.opacity = '0.75';
      }
    };

    window.addEventListener('mousemove', onMove);
    const interactives = document.querySelectorAll('button, a, [data-hover]');
    interactives.forEach(el => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    let animId: number;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const animate = () => {
      ring.current.x = lerp(ring.current.x, pos.current.x, 0.1);
      ring.current.y = lerp(ring.current.y, pos.current.y, 0.1);
      if (ringRef.current) {
        const w = parseInt(ringRef.current.style.width || '34');
        ringRef.current.style.transform = `translate(${ring.current.x - w / 2}px, ${ring.current.y - w / 2}px)`;
      }
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', onMove);
      interactives.forEach(el => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      {/* Center dot */}
      <div ref={dotRef} className="custom-cursor" style={{
        position: 'fixed', top: 0, left: 0, zIndex: 9999,
        width: 6, height: 6,
        borderRadius: '50%',
        pointerEvents: 'none',
        background: '#fff',
        boxShadow: '0 0 4px 1px rgba(255,255,255,0.4)',
      }} />

      {/* Outer ring — planet surface style */}
      <div ref={ringRef} className="custom-cursor" style={{
        position: 'fixed', top: 0, left: 0, zIndex: 9998,
        width: 34, height: 34,
        borderRadius: '50%',
        pointerEvents: 'none',
        opacity: 0.75,
        transition: 'width 0.35s ease, height 0.35s ease, opacity 0.3s',
        border: '1px solid rgba(200,200,200,0.6)',
        boxShadow: `
          0 0 0 2px rgba(120,120,120,0.2),
          0 0 0 4px rgba(60,60,60,0.1),
          inset 0 0 8px rgba(255,255,255,0.05),
          0 0 10px rgba(180,180,180,0.1)
        `,
        background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.06) 0%, transparent 65%)',
      }} />
    </>
  );
}