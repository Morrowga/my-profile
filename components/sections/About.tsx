'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { FROST } from '@/lib/styles';
import Skills from './Skills';

const STATS = [
  { value: '6+', label: 'Years shipping\nproduction code' },
  // { value: '4', label: 'AI tasks\nautomated' },
  // { value: '100%', label: 'Vibe-driven\ndevelopment' },
  { value: '∞', label: 'Coffee consumed\nwhile coding' },
];

export default function About() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="about" className="about-section" style={{ padding: '0rem 2rem' }}>
      {/* Profile photo: pinned to the bottom-left of the screen, faded on top and right, bottom edge is not faded */}
      <div className="about-photo" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/profile.webp" alt="" />
      </div>
      <div ref={ref}>
        <div className="about-grid">
          {/* left 4 columns: empty, the photo sits here */}
          <div aria-hidden="true" />
          {/* right 8 columns: about, then skills */}
          <div style={{ minWidth: 0 }}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : -30 }}
            transition={{ duration: 0.7 }}
          >
            <p className="mono" style={{
              color: 'var(--accent)', fontSize: '0.75rem',
              letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '0.75rem',
            }}>
              About
            </p>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800,
              letterSpacing: '-0.02em', marginBottom: '1.5rem', lineHeight: 1.1,
            }}>
              Engineer by trade,<br />
              <span style={{
                background: 'linear-gradient(135deg, var(--accent2) 0%, var(--accent) 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                artist at heart.
              </span>
            </h2>
            <div style={{ ...FROST, padding: '1.25rem 1.5rem', borderRadius: 14, marginBottom: '1.75rem' }}>
              <p style={{ color: 'var(--text)', lineHeight: 1.8, fontSize: '0.95rem' }}>
                I&apos;m a full-stack developer. I started in 2019, and since then I have been part of
                14 production projects at the companies I&apos;ve worked for.
              </p>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '1rem',
            }}>
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  style={{
                    ...FROST,
                    borderRadius: 8, padding: '1rem 0.75rem', textAlign: 'center',
                  }}
                >
                  <div style={{
                    fontSize: '1.6rem', fontWeight: 800,
                    color: 'var(--accent)', lineHeight: 1, marginBottom: '0.5rem',
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: '0.65rem', color: 'var(--muted)',
                    lineHeight: 1.4, whiteSpace: 'pre-line',
                  }}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div style={{ marginTop: '4rem' }}>
            <Skills />
          </div>
          </div>
        </div>
      </div>

      <style>{`
        .about-photo {
          position: fixed; left: 0; bottom: 0; z-index: 0; pointer-events: none;
          height: min(88vh, 900px); aspect-ratio: 980 / 1808;
          opacity: 0.9; transform: translateX(-20%);   /* 80% of the photo is on screen */
          -webkit-mask-image: linear-gradient(to right, #000 70%, transparent 100%);
                  mask-image: linear-gradient(to right, #000 70%, transparent 100%);
        }
        .about-photo img {
          display: block; width: 100%; height: 100%; object-fit: contain; object-position: bottom left;
          -webkit-mask-image: linear-gradient(to top, #000 80%, transparent 100%);
                  mask-image: linear-gradient(to top, #000 80%, transparent 100%);
        }
        @media (max-width: 768px) { .about-photo { height: 60vh; opacity: 0.3; } }
        .about-grid { display: grid; grid-template-columns: 4fr 8fr; gap: 2rem; }
        @media (max-width: 900px) { .about-grid { grid-template-columns: 1fr; } .about-grid > div:first-child { display: none; } }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </section>
  );
}