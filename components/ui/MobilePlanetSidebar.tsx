'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveSection, startTransition, endTransition, SectionId } from '@/store/slices/navigationSlice';

const NAV_PLANETS = [
  { id: 'hero',         label: 'Home',         size: 14, color: '#FFD97D', ring: false }, 
  { id: 'about',        label: 'About',        size: 18, color: '#3A8BD4', ring: false }, 
  { id: 'skills',       label: 'Skills',       size: 16, color: '#5671b9', ring: false },
  { id: 'projects',     label: 'Projects',     size: 20, color: '#fbe6be', ring: true  },
  { id: 'certificates', label: 'Certs',        size: 15, color: '#81654f', ring: false },
  { id: 'contact',      label: 'Contact',      size: 14, color: '#df7b1a', ring: false },
  { id: 'cafeai',       label: 'CaféAI',       size: 13, color: '#c26b59', ring: false },
  // { id: 'raw1',         label: 'Raw',          size: 13, color: '#555555', ring: false },
  // { id: 'raw2',         label: 'Raw',          size: 11, color: '#444444', ring: false },
  // { id: 'raw3',         label: 'Raw',          size: 14, color: '#4a4a4a', ring: true  },
];

export default function MobilePlanetSidebar() {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { activeSection } = useAppSelector(s => s.navigation);

  const navigate = async (id: string) => {
    if (id.startsWith('raw')) return;
    setOpen(false);
    dispatch(startTransition(id));
    await new Promise(r => setTimeout(r, 1350));
    dispatch(setActiveSection(id as SectionId));
    dispatch(endTransition());
  };

  return (
    <>
      {/* FAB button — bottom right */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: '2rem', right: '1.5rem',
          zIndex: 100,
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.6rem 1rem',
          background: 'rgba(0,0,0,0.85)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 999,
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
        }}
        className="mobile-fab"
      >
        {/* Eye icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="5" fill="rgba(255,255,255,0.7)"/>
          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"/>
        </svg>
        <span style={{
          fontFamily: 'Space Mono, monospace', fontSize: '0.62rem',
          color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em', textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          planets
        </span>
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 101,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel — slides in from right */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="sidebar"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '72vw', maxWidth: 280,
              zIndex: 102,
              background: 'rgba(5,5,8,0.4)',   // ← more transparent
              backdropFilter: 'blur(24px)',     // ← frosted glass blur
              WebkitBackdropFilter: 'blur(24px)', // ← Safari support
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', flexDirection: 'column',
              padding: '2rem 1.5rem',
            }}
          >
            {/* Header */}
            {/* <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <p style={{
                fontFamily: 'Space Mono, monospace', fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.3)', letterSpacing: '0.25em', textTransform: 'uppercase',
              }}>
                Navigate
              </p>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)', fontSize: '1.2rem', lineHeight: 1,
                  padding: '0.25rem',
                }}
              >
                ×
              </button>
            </div> */}

            {/* Planet list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {NAV_PLANETS.map((p, i) => {
                const isActive = activeSection === p.id;
                const isRaw    = p.id.startsWith('raw');
                const d        = p.size * 2 + 4;

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 8,
                      cursor: isRaw ? 'default' : 'pointer',
                      background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                      border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                      transition: 'background 0.2s',
                    }}
                  >
                    {/* Planet SVG */}
                    <svg width={d} height={d} style={{ overflow: 'visible', flexShrink: 0 }}>
                      <defs>
                        <radialGradient id={`mob-g-${p.id}`} cx="35%" cy="30%" r="65%">
                          <stop offset="0%"  stopColor="#fff"    stopOpacity={isActive ? 1 : 0.7} />
                          <stop offset="60%" stopColor={p.color} stopOpacity={isActive ? 0.9 : 0.5} />
                          <stop offset="100%" stopColor="#111"   stopOpacity="0.8" />
                        </radialGradient>
                      </defs>
                      {p.ring && (
                        <ellipse cx={d/2} cy={d/2} rx={p.size * 1.8} ry={p.size * 0.4}
                          fill="none"
                          stroke={isActive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'}
                          strokeWidth="1.2" />
                      )}
                      <circle cx={d/2} cy={d/2} r={p.size}
                        fill={`url(#mob-g-${p.id})`}
                        stroke={isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.08)'}
                        strokeWidth={isActive ? 1.4 : 0.6}
                        opacity={isRaw ? 0.3 : 1}
                      />
                    </svg>

                    {/* Label */}
                    <span style={{
                      fontFamily: 'Syne, sans-serif', fontWeight: 700,
                      fontSize: isRaw ? '0.7rem' : '0.85rem',
                      color: isRaw ? 'rgba(255,255,255,0.2)'
                           : isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      fontStyle: isRaw ? 'italic' : 'normal',
                    }}>
                      {p.label}
                    </span>

                    {isActive && (
                      <span style={{
                        marginLeft: 'auto', fontFamily: 'Space Mono, monospace',
                        fontSize: '0.55rem', color: 'var(--accent)', letterSpacing: '0.1em',
                      }}>
                        ● NOW
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .mobile-fab {
          display: none;
        }
        @media (max-width: 768px) {
          .mobile-fab {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}