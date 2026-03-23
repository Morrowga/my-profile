'use client';
import { motion, useInView } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

const TERMINAL_LINES = [
  { prefix: '>', text: 'whoami', delay: 0, color: 'var(--accent)' },
  { prefix: '', text: 'THIHA AUNG — AI Engineer & Vibe Coder', delay: 600, color: 'var(--text)' },
  { prefix: '>', text: 'cat career.md', delay: 1400, color: 'var(--accent)' },
  { prefix: '', text: 'Full-stack dev switching lanes into AI engineering.', delay: 2000, color: 'var(--muted)' },
  { prefix: '', text: 'Building intelligent products with Python, Next.js & Claude API.', delay: 2400, color: 'var(--muted)' },
  { prefix: '>', text: 'ls superpowers/', delay: 3400, color: 'var(--accent)' },
  { prefix: '', text: 'system-design/  ai-integration/  vibe-coding/  shipping/', delay: 4000, color: 'var(--accent3)' },
  { prefix: '>', text: 'echo $STATUS', delay: 5000, color: 'var(--accent)' },
  { prefix: '', text: 'Open to AI consulting & ambitious projects ✦', delay: 5500, color: 'var(--accent2)' },
];

function TerminalLine({ line, startVisible }: { line: typeof TERMINAL_LINES[0]; startVisible: boolean }) {
  const [visible, setVisible] = useState(false);
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!startVisible) return;
    const t = setTimeout(() => {
      setVisible(true);
      let i = 0;
      const fullText = (line.prefix ? line.prefix + ' ' : '') + line.text;
      const interval = setInterval(() => {
        i++;
        setTyped(fullText.slice(0, i));
        if (i >= fullText.length) clearInterval(interval);
      }, 28);
      return () => clearInterval(interval);
    }, line.delay);
    return () => clearTimeout(t);
  }, [startVisible, line]);

  if (!visible) return null;

  return (
    <div style={{
      fontFamily: 'Space Mono, monospace',
      fontSize: '0.82rem',
      lineHeight: 1.8,
      color: line.color,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    }}>
      {typed}
      {typed.length < ((line.prefix ? line.prefix + ' ' : '') + line.text).length && (
        <span style={{
          display: 'inline-block', width: 8, height: '1em',
          background: 'var(--accent)', opacity: 0.9,
          animation: 'blink 0.7s step-end infinite',
          verticalAlign: 'text-bottom', marginLeft: 1,
        }} />
      )}
    </div>
  );
}

const STATS = [
  { value: '5+', label: 'Years shipping\nproduction code' },
  // { value: '4', label: 'AI tasks\nautomated' },
  // { value: '100%', label: 'Vibe-driven\ndevelopment' },
  { value: '∞', label: 'Coffee consumed\nwhile coding' },
];

export default function About() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="about" className="about-section" style={{ padding: '0rem 2rem', background: 'var(--bg)' }}>
      <div ref={ref} style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
          gap: '3rem',
          alignItems: 'center',
        }}>
          {/* Left: text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : -30 }}
            transition={{ duration: 0.7 }}
          >
            <p className="mono" style={{
              color: 'var(--accent)', fontSize: '0.75rem',
              letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '0.75rem',
            }}>
              {'// about'}
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
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              I started as a full-stack developer building real estate platforms and e-commerce systems.
              Now I&apos;m deep in the AI transition — integrating LLMs into real products,
              designing Human-in-the-Loop workflows, and shipping things that actually work.
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: '0.95rem', marginBottom: '2.5rem' }}>
              My edge is bridging the gap between AI capabilities and production realities —
              I don&apos;t just prototype, I architect and ship.
            </p>

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
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
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

          {/* Right: terminal */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : 30 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="about-terminal" style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--surface2)',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                {['#ff5f57', '#ffbd2e', '#28c841'].map((c) => (
                  <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
                ))}
               <span className="mono" style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--muted)', flex: 1 }}>
                  ~/portfolio — zsh
                </span>
                <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--muted)', marginLeft: 'auto' }}>
                  <MapPin size={11} style={{marginRight: 5}}/>
                   Thailand
                </span>
              </div>
              <div style={{ padding: '1.5rem', minHeight: 320 }}>
                {TERMINAL_LINES.map((line, i) => (
                  <TerminalLine key={i} line={line} startVisible={inView} />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </section>
  );
}