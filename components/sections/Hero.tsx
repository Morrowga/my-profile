'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setActiveSection, setMenuIndex, startTransition, endTransition,
} from '@/store/slices/navigationSlice';
import { MENU } from '@/lib/planets';
import PlanetStage from '@/components/ui/PlanetStage';

const WHEEL_COOLDOWN = 420;   // ms between wheel steps
const BLINK_MS = 800;         // blink before entering
const ZOOM_MS = 1350;         // existing zoom-in animation

export default function Hero() {
  const dispatch = useAppDispatch();
  const { menuIndex: index, isTransitioning } = useAppSelector(s => s.navigation);
  const [entering, setEntering] = useState(false);
  const [compact, setCompact] = useState(false);

  const busy = entering || isTransitioning;
  const busyRef = useRef(busy);
  const indexRef = useRef(index);
  useEffect(() => { busyRef.current = busy; }, [busy]);
  useEffect(() => { indexRef.current = index; }, [index]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const set = () => setCompact(mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);

  const move = useCallback((dir: 1 | -1) => {
    if (busyRef.current) return;
    const next = Math.max(0, Math.min(MENU.length - 1, indexRef.current + dir));
    if (next !== indexRef.current) dispatch(setMenuIndex(next));
  }, [dispatch]);

  const enter = useCallback(async () => {
    if (busyRef.current) return;
    const item = MENU[indexRef.current];
    if (item.id === 'hero') return;      // Home is this screen
    busyRef.current = true;
    setEntering(true);
    await new Promise(r => setTimeout(r, BLINK_MS));
    dispatch(startTransition(item.id));
    await new Promise(r => setTimeout(r, ZOOM_MS));
    dispatch(setActiveSection(item.id));
    dispatch(endTransition());
  }, [dispatch]);

  // Wheel / keyboard / swipe
  useEffect(() => {
    let lastStep = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 8) return;
      const now = performance.now();
      if (now - lastStep < WHEEL_COOLDOWN) return;
      lastStep = now;
      move(e.deltaY > 0 ? 1 : -1);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); enter(); }
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      const dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 40) move(dy > 0 ? 1 : -1);
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [move, enter]);

  const itemH = compact ? 62 : 84;
  const OPACITY = [1, 0.4, 0.2, 0.09];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <PlanetStage index={index} />

      <motion.div
        className="home-id"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.7 }}
      >
        <span className="home-name">THIHA AUNG</span>
        <span className="mono home-role">Software Engineer</span>
      </motion.div>

      <div className="menu-panel">
        <div className="menu-list">
          {MENU.map((item, i) => {
            const d = i - index;
            const dist = Math.abs(d);
            const active = d === 0;
            const blink = entering && active;
            return (
              <motion.button
                key={item.id}
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => (active ? enter() : !busy && dispatch(setMenuIndex(i)))}
                className="menu-item"
                initial={false}
                animate={{
                  y: d * itemH,
                  opacity: blink ? [1, 0.1, 1, 0.1, 1, 0.1, 1] : (OPACITY[dist] ?? 0.04),
                }}
                transition={{
                  y: { type: 'spring', stiffness: 260, damping: 30 },
                  opacity: blink ? { duration: BLINK_MS / 1000, ease: 'linear' } : { duration: 0.35 },
                }}
              >
                <span className="menu-text">
                  <motion.span
                    className="menu-label"
                    animate={{ scale: active ? 1 : 0.58, x: active ? 0 : -4 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                  >
                    {item.label}
                  </motion.span>
                </span>
              </motion.button>
            );
          })}
          <motion.div
            className="menu-marker"
            initial={false}
            animate={{
              backgroundColor: MENU[index].glow,
              boxShadow: `0 0 16px ${MENU[index].glow}`,
            }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}
