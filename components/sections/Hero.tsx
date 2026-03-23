'use client';
import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch } from '@/store/hooks';
import { setActiveSection, startTransition, endTransition, SectionId } from '@/store/slices/navigationSlice';

const NAMED = [
  { id: 'about',        label: 'About',    rx: 155, ry: 58, size: 20, speed: 0.0024, startAngle: Math.PI * (0/3),  color: '#41515b', ring: false },
  { id: 'skills',       label: 'Skills',   rx: 155, ry: 58, size: 18, speed: 0.0024, startAngle: Math.PI * (2/6),  color: '#5671b9', ring: false },
  { id: 'projects',     label: 'Projects', rx: 155, ry: 58, size: 22, speed: 0.0024, startAngle: Math.PI * (4/6),  color: '#fbe6be', ring: true  },
  { id: 'certificates', label: 'Certs',    rx: 155, ry: 58, size: 17, speed: 0.0024, startAngle: Math.PI * (6/6),  color: '#81654f', ring: false },
  { id: 'contact',      label: 'Contact',  rx: 155, ry: 58, size: 17, speed: 0.0024, startAngle: Math.PI * (8/6),  color: '#df7b1a', ring: false },
  { id: 'cafeai',       label: 'CaféAI',   rx: 155, ry: 58, size: 14, speed: 0.0024, startAngle: Math.PI * (10/6), color: '#c26b59', ring: false },
];

const RAW = Array.from({ length: 2 }, (_, i) => ({
  id: `raw${i + 1}`, label: 'Raw',
  rx: 290, ry: 108, size: 15 + (i % 3) * 3,
  speed: 0.0015, startAngle: (i / 2) * Math.PI * 2,
  color: '#666666', ring: i === 1,
}));
const ALL_PLANETS = [...NAMED, ...RAW];

export default function Hero() {
  const anglesRef  = useRef<number[]>(ALL_PLANETS.map(p => p.startAngle));
  const dispatch   = useAppDispatch();
  const [hovered,   setHovered]   = useState<string | null>(null);
  const [positions, setPositions] = useState<{ id: string; x: number; y: number; z: number }[]>([]);
  const [wh,        setWH]        = useState({ w: 0, h: 0 });

  // Track solar system container size separately from window
  const solarRef = useRef<HTMLDivElement>(null);
  const [solar, setSolar] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const set = () => setWH({ w: window.innerWidth, h: window.innerHeight });
    set();
    window.addEventListener('resize', set);
    return () => window.removeEventListener('resize', set);
  }, []);

  useEffect(() => {
    if (!solarRef.current) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSolar({ w: width, h: height });
    });
    obs.observe(solarRef.current);
    return () => obs.disconnect();
  }, []);

  const cx = solar.w / 2;
  const cy = solar.h / 2;

  useEffect(() => {
    let id: number;
    const tick = () => {
      anglesRef.current = anglesRef.current.map((a, i) => a + ALL_PLANETS[i].speed);
      setPositions(ALL_PLANETS.map((p, i) => ({
        id: p.id,
        x: cx + Math.cos(anglesRef.current[i]) * p.rx,
        y: cy + Math.sin(anglesRef.current[i]) * p.ry,
        z: Math.sin(anglesRef.current[i]),
      })));
      id = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(id);
  }, [cx, cy]);

  const navigate = async (sectionId: SectionId) => {
    dispatch(startTransition(sectionId));
    await new Promise(r => setTimeout(r, 1350));
    dispatch(setActiveSection(sectionId));
    dispatch(endTransition());
  };

  const sorted = [...positions].sort((a, b) => a.z - b.z);

  const renderPlanet = (pos: typeof positions[0]) => {
    const p      = ALL_PLANETS.find(pp => pp.id === pos.id)!;
    const behind = pos.z < 0;
    const scale  = behind ? 0.78 + 0.22 * (pos.z + 1) : 1;
    const r      = p.size * scale;
    const isHov  = hovered === pos.id;
    const isRaw  = pos.id.startsWith('raw');

    return (
      <g key={pos.id} opacity={behind ? 0.45 : 1}>
        {isHov && !isRaw && (
          <circle cx={pos.x} cy={pos.y} r={r + 14}
            fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
        )}
        {p.ring && (
          <ellipse cx={pos.x} cy={pos.y} rx={r * 1.9} ry={r * 0.44}
            fill="none"
            stroke={isHov ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.16)'}
            strokeWidth="1.6" />
        )}
        <circle cx={pos.x} cy={pos.y} r={r}
          fill={`url(#g-${p.id})`}
          stroke={isHov && !isRaw ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.12)'}
          strokeWidth={isHov && !isRaw ? 1.6 : 0.8}
          style={{ cursor: isRaw ? 'default' : 'pointer' }}
          onMouseEnter={() => setHovered(pos.id)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => !isRaw && navigate(p.id as SectionId)}
        />
        <text x={pos.x} y={pos.y + r + 15} textAnchor="middle"
          fill={isRaw ? 'rgba(255,255,255,0.18)' : isHov ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)'}
          fontSize={isHov && !isRaw ? '11' : '9'}
          fontFamily="Syne, sans-serif" fontWeight="700" letterSpacing="2"
          fontStyle={isRaw ? 'italic' : 'normal'}
          style={{ pointerEvents: 'none', textTransform: 'uppercase' }}
        >{p.label}</text>
      </g>
    );
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>

      {/* ── Top bar — name + role ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="hero-topbar"
        style={{
          paddingTop: '2rem', zIndex: 3, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
        }}
      >
        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2.2rem', color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em' }}>
          THIHA AUNG
        </p>
        <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          AI Engineer / Vibe Coder
        </p>
      </motion.div>

      {/* ── Solar system — flex: 1 fills remaining height ── */}
      <div ref={solarRef} style={{ flex: 1, width: '100%', position: 'relative' }}>
        {solar.w > 0 && (
          <svg width={solar.w} height={solar.h}
            style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'visible' }}
          >
            <defs>
              <radialGradient id="sunCore" cx="38%" cy="32%" r="62%">
                <stop offset="0%"   stopColor="#ffffff" stopOpacity="1"   />
                <stop offset="40%"  stopColor="#FFD97D" stopOpacity="0.95"/>
                <stop offset="75%"  stopColor="#FF9B3D" stopOpacity="0.85"/>
                <stop offset="100%" stopColor="#C45C1A" stopOpacity="0.6" />
              </radialGradient>
              <radialGradient id="sunHalo" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#FFD97D" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#FF9B3D" stopOpacity="0"    />
              </radialGradient>
              {ALL_PLANETS.map(p => (
                <radialGradient key={`g-${p.id}`} id={`g-${p.id}`} cx="35%" cy="30%" r="65%">
                  <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.95" />
                  <stop offset="50%"  stopColor={p.color}  stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#111111"  stopOpacity="0.7"  />
                </radialGradient>
              ))}
            </defs>

            <ellipse cx={cx} cy={cy} rx={155} ry={58}
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.7" strokeDasharray="3 9" />
            <ellipse cx={cx} cy={cy} rx={290} ry={108}
              fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.7" strokeDasharray="3 12" />

            <circle cx={cx} cy={cy} r={80} fill="url(#sunHalo)" />
            {sorted.filter(p => p.z < 0).map(renderPlanet)}
            <circle cx={cx} cy={cy} r={24} fill="url(#sunCore)" />
            <text x={cx} y={cy + 40} textAnchor="middle"
              fill="rgba(255,255,255,0.3)" fontSize="8"
              fontFamily="Space Mono, monospace" letterSpacing="3">ME</text>
            {sorted.filter(p => p.z >= 0).map(renderPlanet)}
          </svg>
        )}

        {/* Tooltip */}
        <AnimatePresence>
          {hovered && !hovered.startsWith('raw') && (() => {
            const pos = positions.find(p => p.id === hovered);
            const p   = ALL_PLANETS.find(pp => pp.id === hovered);
            if (!pos || !p) return null;
            return (
              <motion.div key={hovered}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.14 }}
                style={{
                  position: 'absolute', left: pos.x, top: pos.y - p.size - 44,
                  transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none',
                  background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 5, padding: '0.3rem 0.8rem', whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.76rem', color: '#fff', letterSpacing: '0.12em' }}>
                  → {p.label}
                </span>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* ── Bottom hint ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        style={{
          paddingBottom: '2rem', zIndex: 3, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}
      >
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          click a planet
        </span>
        <motion.span
          animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}
          style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}
        >→</motion.span>
      </motion.div>
    </div>
  );
}