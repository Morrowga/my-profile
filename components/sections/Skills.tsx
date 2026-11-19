'use client';
import { animate, motion, useInView } from 'framer-motion';
import { useEffect, useId, useRef, useState } from 'react';
import { FROST } from '@/lib/styles';

const SKILL_GROUPS = [
  {
    label: 'AI / ML',
    color: 'var(--accent)',
    skills: [
      { name: 'Claude API / LLMs', level: 80 },
      { name: 'Openai API / LLMs', level: 80 },
      { name: 'Prompt Engineering', level: 90 },
      { name: 'Vector DBs', level: 50 },
    ],
  },
  {
    label: 'Frontend',
    color: 'var(--accent)',
    skills: [
      { name: 'Next.js / React', level: 90 },
      { name: 'TypeScript', level: 90 },
      { name: 'Redux', level: 90 },
      { name: 'Vue', level: 90 },
    ],
  },
  {
    label: 'Backend',
    color: 'var(--accent)',
    skills: [
      { name: 'Laravel / PHP', level: 95 },
      { name: 'Python', level: 60 },
      { name: 'Relational Databases', level: 80 },
      { name: 'Redis', level: 50 },
    ],
  },
];

/** A conical lab flask (Erlenmeyer) with liquid in it. The liquid rises to the skill level. */
const FLASK = 'M38 14 V40 L10 98 Q5 108 18 108 H82 Q95 108 90 98 L62 40 V14';   // glass outline
const WAVE = 'M0 0 ' + Array.from({ length: 8 }, (_, i) => (i === 0 ? 'q 12.5 -3 25 0' : 't 25 0')).join(' ') + ' V120 H0 Z';

function SkillFlask({ name, level, color, index }: { name: string; level: number; color: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const id = useId().replace(/:/g, '');
  const [h, setH] = useState(0);                   // 0..1, how high the liquid is

  useEffect(() => {
    if (!inView) return;
    const c = animate(0, level / 100, { duration: 1.4, delay: index * 0.12, ease: 'easeOut', onUpdate: setH });
    return () => c.stop();
  }, [inView, level, index]);

  const y = 108 - 94 * h;                          // liquid surface: bottom of flask (108) to the rim (14)
  const edge = 'rgba(255,255,255,0.45)';

  return (
    <div ref={ref} style={{ width: 116, textAlign: 'center' }}>
      <svg viewBox="0 0 100 120" width="100%" style={{ display: 'block', overflow: 'visible' }} role="img" aria-label={`${name} ${level}%`}>
        <defs>
          <clipPath id={id}><path d={FLASK + ' Z'} /></clipPath>
          <linearGradient id={id + 'g'} x1="0" x2="1">
            <stop offset="0" stopColor={`color-mix(in srgb, ${color} 75%, #fff)`} />
            <stop offset="1" stopColor={`color-mix(in srgb, ${color} 80%, #000)`} />
          </linearGradient>
        </defs>

        {/* soft shadow under the flask */}
        <ellipse cx={50} cy={111} rx={44} ry={4} fill="rgba(0,0,0,0.35)" />

        {/* glass */}
        <path d={FLASK + ' Z'} fill="rgba(255,255,255,0.08)" />

        <g clipPath={`url(#${id})`}>
          {/* liquid with a gently moving surface */}
          {h > 0.005 && (
            <g transform={`translate(0 ${y})`}>
              <motion.path d={WAVE} fill={`url(#${id}g)`}
                animate={{ x: [0, -50] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }} />
            </g>
          )}
          {/* glass light and shade: bright strip on the left, darker side on the right */}
          <path d="M41 14 H46 V40 L32 104 H22 L41 40 Z" fill="rgba(255,255,255,0.32)" />
          <path d="M56 14 H62 V40 L90 100 Q92 104 88 106 L56 40 Z" fill="rgba(0,0,0,0.14)" />
        </g>

        {/* outline and rim */}
        <path d={FLASK} fill="none" stroke={edge} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={33} y={9} width={34} height={6} rx={3} fill="rgba(255,255,255,0.22)" stroke={edge} strokeWidth={1.6} />
      </svg>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, marginTop: '0.5rem', lineHeight: 1.3 }}>{name}</div>
      <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 2 }}>{level}%</div>
    </div>
  );
}

export default function Skills() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <section id="skills" style={{ width: '100%' }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 30 }}
        transition={{ duration: 0.6 }}
      >
        <p className="mono" style={{ color: 'var(--accent)', fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          Skills
        </p>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          What I work with
        </h2>
        <p style={{ color: 'var(--muted)', maxWidth: 500, lineHeight: 1.7, marginBottom: '4rem' }}>
          Bridging classical full-stack engineering with modern AI tooling — building systems that think and products that resonate.
        </p>
      </motion.div>

      <div style={{ display: 'grid', gap: '2.25rem' }}>
        {SKILL_GROUPS.map((group, gi) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 30 }}
            transition={{ duration: 0.6, delay: gi * 0.15 }}
          >
            <h3 className="mono" style={{
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: group.color, marginBottom: '1.1rem',
            }}>
              {group.label}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem 1.75rem' }}>
              {group.skills.map((skill, si) => (
                <SkillFlask key={skill.name} {...skill} color={group.color} index={si} />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tags */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: inView ? 1 : 0 }}
        transition={{ delay: 0.8 }}
        style={{ marginTop: '3rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}
      >
        {['Docker', 'Git', 'Realtime', 'REST APIs', 'AWS Services', 'Stripe', 'Firebase', 'Linux', 'N8N'].map((tag) => (
          <span key={tag} className="mono" style={{
            padding: '0.35rem 0.85rem',
            ...FROST,
            borderRadius: 4,
            fontSize: '0.7rem',
            color: 'var(--muted)',
            letterSpacing: '0.05em',
          }}>
            {tag}
          </span>
        ))}
      </motion.div>
    </section>
  );
}
