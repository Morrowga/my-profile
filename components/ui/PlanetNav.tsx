'use client';
import { motion } from 'framer-motion';
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
  // { id: 'raw1',         label: 'Raw',          size: 12, color: '#555555', ring: false },
  // { id: 'raw2',         label: 'Raw',          size: 10, color: '#444444', ring: false },
  // { id: 'raw3',         label: 'Raw',          size: 13, color: '#4a4a4a', ring: true  },
];

export default function PlanetNav() {
  const dispatch = useAppDispatch();
  const { activeSection } = useAppSelector(s => s.navigation);

  const navigate = async (id: string) => {
    if (id.startsWith('raw') || id === 'cafeai') return;
    dispatch(startTransition(id));
    await new Promise(r => setTimeout(r, 1100));
    dispatch(setActiveSection(id as SectionId));
    dispatch(endTransition());
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      style={{
        position: 'absolute', right: '2rem', top: '2rem',
        zIndex: 10,
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end', gap: '0.5rem',
      }}
    >


      {NAV_PLANETS.map((p, i) => {
        const isActive = activeSection === p.id;
        const isRaw    = p.id.startsWith('raw');
        const isDisabled = isRaw || p.id === 'cafeai';
        const d        = p.size * 2 + 4;

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.07 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              cursor: isDisabled ? 'default' : 'pointer',
              flexDirection: 'row-reverse',
            }}
            onClick={() => navigate(p.id)}
          >
            <motion.span
              animate={{ opacity: isActive ? 0.9 : isDisabled ? 0.18 : 0.35 }}
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: isDisabled ? '0.6rem' : '0.68rem',
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontStyle: isDisabled ? 'italic' : 'normal',
                whiteSpace: 'nowrap',
                minWidth: 52,
                textAlign: 'right',
              }}
            >
              {p.label}
            </motion.span>

            <svg width={d} height={d} style={{ overflow: 'visible', flexShrink: 0 }}>
              {/* ...unchanged gradient/circle/ring code... */}
              <circle cx={d/2} cy={d/2} r={p.size}
                fill={`url(#nav-g-${p.id})`}
                stroke={isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.1)'}
                strokeWidth={isActive ? 1.4 : 0.6}
                opacity={isDisabled ? 0.35 : 1}
              />
            </svg>
          </motion.div>
        );
      })}
    </motion.div>
  );
}