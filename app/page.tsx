'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppSelector } from '@/store/hooks';
import { SectionId } from '@/store/slices/navigationSlice';

import StarField             from '@/components/ui/StarField';
import ZoomTransition        from '@/components/ui/ZoomTransition';
import PlanetNav             from '@/components/ui/PlanetNav';
import Cursor                from '@/components/ui/Cursor';
import MobilePlanetSidebar   from '@/components/ui/MobilePlanetSidebar';
import Hero                  from '@/components/sections/Hero';
import About                 from '@/components/sections/About';
import Skills                from '@/components/sections/Skills';
import Projects              from '@/components/sections/Projects';
import Certificates          from '@/components/sections/Certificates';
import Contact               from '@/components/sections/Contact';
import CafeAI                from '@/components/sections/CafeAI';
import { useEffect, useRef } from 'react';

const SECTION_CONTENT: Record<SectionId, React.ComponentType> = {
  hero: Hero, about: About, skills: Skills, projects: Projects,
  certificates: Certificates, contact: Contact,cafeai: CafeAI,

};

export default function Home() {
  const { activeSection } = useAppSelector(s => s.navigation);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeSection]);

  const isHero  = activeSection === 'hero';
  const Content = SECTION_CONTENT[activeSection];


  return (
    <div style={{
      width: '100vw', height: '100vh',
      overflow: 'hidden', position: 'relative', background: '#000',
    }}>
      <Cursor />
      <StarField />
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
                  padding: '2rem 12rem 5rem 4rem',
                  color: '#fff',
                }}
              >
                <Content />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {!isHero && (
            <motion.div
              key="planet-nav"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.5 }}
              className="desktop-planet-nav"
              style={{
                position: 'absolute', right: 0, top: 0, bottom: 0,
                width: '11rem', display: 'flex', alignItems: 'flex-start', zIndex: 20,
              }}
            >
              <PlanetNav />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile only — FAB + sidebar */}
      {!isHero && <MobilePlanetSidebar />}
    </div>
  );
}