'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveSection, startTransition, endTransition } from '@/store/slices/navigationSlice';
import { MENU, MenuItem, SectionId } from '@/lib/planets';
import MiniPlanet from '@/components/ui/MiniPlanet';

const ZOOM_MS = 1350; // same as the zoom-in animation on the home screen

/** A small spinning planet made with CSS only (no extra WebGL contexts). */
function PlanetDot({ item, onClick, disabled }: { item: MenuItem; onClick: () => void; disabled: boolean }) {
  const vars = {
    '--tex': `url(${item.texture})`,
    '--glow': item.glow,
    ...(item.ring ? { '--ring': `url(${item.ring})` } : {}),
  } as React.CSSProperties;

  return (
    <button
      type="button"
      className={`pdot${item.ring ? ' pdot--ring' : ''}`}
      style={vars}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Go to ${item.label}`}
    >
      {item.ring && <span className="pdot-ring pdot-ring--back" />}
      <span className="pdot-sphere"><span className="pdot-tex" /></span>
      {item.ring && <span className="pdot-ring pdot-ring--front" />}
      <span className="pdot-tip">{item.label}</span>
    </button>
  );
}

/**
 * Top-right corner of a page: the current planet, an arrow, and — when the arrow
 * is pressed — a row of all the other planets sliding out to the left.
 */
export default function PlanetSwitcher({ id }: { id: SectionId }) {
  const dispatch = useAppDispatch();
  const { isTransitioning } = useAppSelector(s => s.navigation);
  // Open by default on desktop. On phones the row would cover the page title, so it starts closed there.
  const [ready, setReady] = useState(false);   // is the corner planet drawn yet?
  const [open, setOpen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 769px)').matches,
  );
  const rootRef = useRef<HTMLDivElement>(null);

  // close on Escape or when clicking outside
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const go = async (target: SectionId) => {
    if (isTransitioning) return;
    setOpen(false);
    if (target === 'hero') { dispatch(setActiveSection('hero')); return; }
    dispatch(startTransition(target));
    await new Promise(r => setTimeout(r, ZOOM_MS));
    dispatch(setActiveSection(target));
    dispatch(endTransition());
  };

  const others = MENU.filter(m => m.id !== id);
  const current = MENU.find(m => m.id === id);

  return (
    <div ref={rootRef} className="switcher">
      <AnimatePresence>
        {open && (
          <motion.div
            key="tray"
            className="switcher-tray"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {others.map((item, i) => {
              // the planet nearest the arrow comes out first
              const fromArrow = others.length - 1 - i;
              return (
                <motion.div
                  key={item.id}
                  initial={{ x: 70, opacity: 0, scale: 0.5 }}
                  animate={{ x: 0, opacity: 1, scale: 1, transition: { delay: fromArrow * 0.045, type: 'spring', stiffness: 320, damping: 26 } }}
                  exit={{ x: 70, opacity: 0, scale: 0.5, transition: { delay: i * 0.02, duration: 0.18 } }}
                >
                  <PlanetDot item={item} onClick={() => go(item.id)} disabled={isTransitioning} />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        className="switcher-arrow"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={open ? 'Hide planets' : 'Show all planets'}
      >
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }} style={{ display: 'flex' }}>
          <ChevronLeft size={18} />
        </motion.span>
        <span className="pdot-tip">{open ? 'Hide' : 'All planets'}</span>
      </button>

      {/* the page you are on (hover for its name; the spinner shows while it loads) */}
      <div className="switcher-current" data-ready={ready} aria-label={`Current page: ${current?.label}`} tabIndex={0}>
        <MiniPlanet id={id} onReady={() => setReady(true)} />
        <span className="switcher-loader" role="status" aria-label="Loading planet" />
        <span className="pdot-tip">{current?.label} · You are here</span>
      </div>
    </div>
  );
}
