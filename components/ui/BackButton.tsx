'use client';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { setActiveSection } from '@/store/slices/navigationSlice';

export default function BackButton() {
  const dispatch = useAppDispatch();

  return (
    <motion.button
      type="button"
      onClick={() => dispatch(setActiveSection('hero'))}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      whileHover={{ x: -3 }}
      className="mono"
      style={{
        position: 'fixed', top: '1.25rem', left: '1.25rem', zIndex: 30,
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.55rem 0.9rem',
        background: 'rgba(5,5,8,0.55)', backdropFilter: 'blur(8px)',
        border: '1px solid var(--border)', borderRadius: 999,
        color: 'var(--text)', fontSize: '0.72rem', letterSpacing: '0.14em',
        textTransform: 'uppercase', cursor: 'pointer',
      }}
    >
      <ArrowLeft size={14} />
      <span>Back</span>
    </motion.button>
  );
}
