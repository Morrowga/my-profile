'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppSelector } from '@/store/hooks';
import { SectionId } from '@/store/slices/navigationSlice';

import SpaceBackground        from '@/components/ui/SpaceBackground';
import { MENU } from '@/lib/planets';
import ZoomTransition        from '@/components/ui/ZoomTransition';
import Cursor                from '@/components/ui/Cursor';
import BackButton            from '@/components/ui/BackButton';
import PlanetSwitcher         from '@/components/ui/PlanetSwitcher';
import Hero                  from '@/components/sections/Hero';
import About                 from '@/components/sections/About';
import Work                  from '@/components/sections/Work';
import Lab                   from '@/components/sections/Lab';
import Apps                  from '@/components/sections/Apps';
import Certificates          from '@/components/sections/Certificates';
import Contact               from '@/components/sections/Contact';
import Life                  from '@/components/sections/Life';
import { useEffect, useRef } from 'react';

const SECTION_CONTENT: Record<SectionId, React.ComponentType> = {
  hero: Hero, about: About, work: Work, lab: Lab,
  apps: Apps, certs: Certificates, contact: Contact, life: Life,
};

export default function Home() {
  const { activeSection, isTransitioning } = useAppSelector(s => s.navigation);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeSection]);

  const isHero  = activeSection === 'hero';
  // Highlight colour of a page = the colour of its planet
  const planet = MENU.find(m => m.id === activeSection);
  const accentVars = planet && !isHero ? ({
    '--accent': planet.glow,
    '--accent2': 'color-mix(in srgb, var(--accent) 78%, #ffffff)',
    '--accent3': 'color-mix(in srgb, var(--accent) 50%, #ffffff)',
    '--glow': 'color-mix(in srgb, var(--accent) 18%, transparent)',
  } as React.CSSProperties) : {};
  const Content = SECTION_CONTENT[activeSection];

  return (
    <div style={{
      width: '100vw', height: '100vh',
      overflow: 'hidden', position: 'relative', background: '#000',
      ...accentVars,
    }}>
      <Cursor />
      <SpaceBackground paused={isTransitioning} calm={activeSection !== 'hero'} />
      <ZoomTransition />

      <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex' }}>
        <AnimatePresence mode="wait">
          <motion.div
            ref={scrollRef}
            key={activeSection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.45, delay: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0 } }}
            style={{
              flex: 1, height: '100%', position: 'relative',
              overflow: isHero ? 'hidden' : 'auto',
              overscrollBehavior: 'none',
            }}
          >
            {isHero ? (
              <Content />
            ) : (
              <div
                className="section-wrapper"
                style={{
                  minHeight: '100%',
                  padding: '5rem 4rem 5rem 4rem',
                  color: '#fff',
                }}
              >
                <Content />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {!isHero && <BackButton />}
      {!isHero && <PlanetSwitcher key={activeSection} id={activeSection} />}
    </div>
  );
}