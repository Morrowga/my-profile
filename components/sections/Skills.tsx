'use client';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

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

function SkillBar({ name, level, color, index }: { name: string; level: number; color: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref} style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{name}</span>
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{level}%</span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: inView ? `${level}%` : 0 }}
          transition={{ duration: 1, delay: index * 0.1, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 2 }}
        />
      </div>
    </div>
  );
}

export default function Skills() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <section id="skills" style={{ padding: '', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 30 }}
        transition={{ duration: 0.6 }}
      >
        <p className="mono" style={{ color: 'var(--accent)', fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          {'// skills'}
        </p>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          What I work with
        </h2>
        <p style={{ color: 'var(--muted)', maxWidth: 500, lineHeight: 1.7, marginBottom: '4rem' }}>
          Bridging classical full-stack engineering with modern AI tooling — building systems that think and products that resonate.
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {SKILL_GROUPS.map((group, gi) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 40 }}
            transition={{ duration: 0.6, delay: gi * 0.15 }}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '2rem',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: group.color,
            }} />
            <h3 style={{
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: group.color, marginBottom: '1.5rem',
            }}>
              {group.label}
            </h3>
            {group.skills.map((skill, si) => (
              <SkillBar key={skill.name} {...skill} color={group.color} index={si} />
            ))}
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
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
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
