'use client';
import { useEffect, useRef } from 'react';

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const ANGLE = Math.PI / 5;
    const dx = Math.sin(ANGLE);
    const dy = Math.cos(ANGLE);

    const stars = Array.from({ length: 200 }, () => ({
      x:       Math.random() * (window.innerWidth + 300) - 150,
      y:       Math.random() * window.innerHeight,
      len:     Math.random() * 70 + 20,
      speed:   Math.random() * 2.2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      width:   Math.random() * 1.1 + 0.2,
    }));

    const resetStar = (s: typeof stars[0]) => {
      const mobile = window.innerWidth < 768;
      if (mobile) {
        if (Math.random() > 0.5) {
          s.x = Math.random() * window.innerWidth;
          s.y = -s.len;
        } else {
          s.x = -s.len;
          s.y = Math.random() * window.innerHeight;
        }
      } else {
        s.x = Math.random() * window.innerWidth - 200;
        s.y = -s.len;
      }
      s.speed   = Math.random() * 2.2 + 0.5;
      s.opacity = Math.random() * 0.5 + 0.1;
    };

    const bgStars = Array.from({ length: 220 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 0.8 + 0.15,
      a: Math.random() * 0.3 + 0.04,
    }));

    // 5 big accent shooting stars with staggered timers
    type AccentStar = { x: number; y: number; len: number; opacity: number; life: number; maxLife: number } | null;
    const accents: AccentStar[] = [null, null, null, null, null];
    const accentTimers = [0, 60, 120, 180, 240]; // staggered so they don't all fire at once

    const spawnAccent = (i: number) => {
      accents[i] = {
        x: Math.random() * canvas.width * 0.8,
        y: Math.random() * canvas.height * 0.5,
        len: 140 + Math.random() * 100,
        opacity: 0, life: 0, maxLife: 60 + Math.floor(Math.random() * 30),
      };
    };

    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Static bg dots
      bgStars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.fill();
      });

      // Regular diagonal streaks
      stars.forEach(s => {
        s.x += s.speed * dx;
        s.y += s.speed * dy;
        if (s.y - s.len * dy > canvas.height || s.x - s.len * dx > canvas.width) {
          resetStar(s);
        }
        const tx = s.x - s.len * dx;
        const ty = s.y - s.len * dy;
        const g = ctx.createLinearGradient(tx, ty, s.x, s.y);
        g.addColorStop(0, 'transparent');
        g.addColorStop(1, `rgba(255,255,255,${s.opacity})`);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = g;
        ctx.lineWidth   = s.width;
        ctx.stroke();
      });

      // 5 big accent shooting stars
      accents.forEach((accent, i) => {
        accentTimers[i]++;
        if (accentTimers[i] > 200 && !accents[i]) {
          spawnAccent(i);
          accentTimers[i] = 0;
        }
        if (accents[i]) {
          const a = accents[i]!;
          a.life++;
          const prog = a.life / a.maxLife;
          a.opacity = prog < 0.3 ? prog / 0.3 : 1 - (prog - 0.3) / 0.7;
          a.x += 3.5 * dx;
          a.y += 3.5 * dy;
          const tx = a.x - a.len * dx;
          const ty = a.y - a.len * dy;
          const ag = ctx.createLinearGradient(tx, ty, a.x, a.y);
          ag.addColorStop(0, 'transparent');
          ag.addColorStop(0.5, `rgba(74,222,128,${a.opacity * 0.4})`);
          ag.addColorStop(1,   `rgba(74,222,128,${a.opacity})`);
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(a.x, a.y);
          ctx.strokeStyle = ag;
          ctx.lineWidth = 2.5;
          ctx.stroke();
          const hg = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, 6);
          hg.addColorStop(0, `rgba(74,222,128,${a.opacity})`);
          hg.addColorStop(1, 'transparent');
          ctx.fillStyle = hg;
          ctx.beginPath();
          ctx.arc(a.x, a.y, 6, 0, Math.PI * 2);
          ctx.fill();
          if (a.life >= a.maxLife) accents[i] = null;
        }
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        pointerEvents: 'none', background: '#000',
      }}
    />
  );
}