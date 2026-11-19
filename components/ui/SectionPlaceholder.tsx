'use client';
import { motion } from 'framer-motion';

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  plans: string[];
}

/** Temporary page for sections whose content is not written yet. */
export default function SectionPlaceholder({ eyebrow, title, description, plans }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ maxWidth: 760 }}
    >
      <div className="mono" style={{ color: 'var(--accent)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        {eyebrow}
      </div>
      <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontWeight: 800, margin: '0.6rem 0 1rem', letterSpacing: '0.02em' }}>
        {title}
      </h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.8, marginBottom: '2rem' }}>{description}</p>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {plans.map(p => (
          <div key={p} className="mono" style={{
            padding: '0.9rem 1.1rem', background: 'var(--surface)',
            border: '1px dashed var(--border)', borderRadius: 10,
            fontSize: '0.8rem', color: 'var(--text)',
          }}>
            {p}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
