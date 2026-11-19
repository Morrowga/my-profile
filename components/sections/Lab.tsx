'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Code, Container, Database, Search, Workflow, X, Zap, type LucideIcon } from 'lucide-react';
import { FROST } from '@/lib/styles';
import TrafficShowcase from './lab/TrafficShowcase';
import DataCleaningShowcase from './lab/DataCleaningShowcase';
import SearchShowcase from './lab/SearchShowcase';
import SearchSteps from './lab/SearchSteps';
import KubernetesShowcase from './lab/KubernetesShowcase';

/**
 * Lab: a menu of experiments. Click one to open it; "All experiments" goes back to the menu.
 * To add an experiment, add one object to EXPERIMENTS.
 * (Older experiments are kept, unused, in components/sections/lab/.)
 */
type Experiment = {
  id: string;
  title: string;
  icon: LucideIcon;
  summary: string;
  tags: string[];
  Screen?: React.ComponentType;   // no Screen = not built yet
  Steps?: React.ComponentType;    // "How it works" tree; when set, a button next to Source code shows it
  source_code?: boolean;          // true: show the "Source code" button, it opens repo_url
  repo_url?: string;
  soon?: boolean;                 // shows "Working on it" and the card cannot be opened
};

const EXPERIMENTS: Experiment[] = [
  {
    id: 'traffic',
    title: 'Highest traffic product',
    icon: Zap,
    summary: '100,000 people press Buy for 100 items. Nobody is thrown out, and the fastest get the item.',
    tags: ['Waiting room', 'Rate limit', 'Redis', 'Queue + workers'],
    Screen: TrafficShowcase,
  },
  {
    id: 'data-cleaning',
    title: 'Messy data to clean data',
    icon: Database,
    summary: 'A real file of 672 messy job posts goes in. 659 clean rows come out, one step at a time.',
    tags: ['Python', 'Data cleaning', 'Claude Haiku'],
    Screen: DataCleaningShowcase,
    source_code: true,
    repo_url: 'https://github.com/Morrowga/data-cleaning-for-glass-door-dataset',
  },
  {
    id: 'search-scroll',
    title: 'Search millions of papers',
    icon: Search,
    summary: 'Search words, filters with live counts and a sort order work together on real research papers. Results keep loading as you scroll.',
    tags: ['Advanced search', 'Cursor paging', 'Infinite scroll', 'Virtual list'],
    Screen: SearchShowcase,
    Steps: SearchSteps,
    source_code: true,
    repo_url: 'https://github.com/Morrowga/search-list-experiment-with-high-data',
  },
  {
    id: 'kubernetes',
    title: 'Containers going up and down',
    icon: Container,
    summary: 'Three copies of one app run on a small Kubernetes cluster. I killed Pods, crashed the app, stopped a whole server and added load, and recorded what happened to the customers.',
    tags: ['Kubernetes', 'Deployment', 'Containers', 'Rolling update'],
    Screen: KubernetesShowcase,
    source_code: true,
    repo_url: 'https://github.com/Morrowga/k8-experiment',
  },
];

const chip: React.CSSProperties = {
  padding: '0.25rem 0.6rem', borderRadius: 4, fontSize: '0.66rem', letterSpacing: '0.03em',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.72)',
};

/** A dialog over the page. Esc, the X button or a click outside closes it; the content scrolls inside. */
function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        background: 'rgba(0, 0, 0, 0.62)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: 'min(1120px, 100%)', maxHeight: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 18,
          background: 'rgba(10, 10, 16, 0.96)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 30px var(--glow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.9rem 1.1rem 0.9rem 1.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 className="lab-title" style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.3 }}>{title}</h2>
          <button
            ref={closeBtn}
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)',
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="dialog-scroll" style={{ overflowY: 'auto', overflowX: 'hidden', padding: '1.4rem', minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Lab() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);   // the "How it works" dialog
  const topRef = useRef<HTMLDivElement>(null);
  const open = EXPERIMENTS.find(e => e.id === openId && e.Screen) ?? null;

  // opening or closing an experiment starts at the top of the page
  useEffect(() => { topRef.current?.scrollIntoView({ block: 'start' }); }, [openId]);

  return (
    <motion.div className="lab-root" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ width: '100%', minWidth: 0 }}>
      <div ref={topRef} style={{ scrollMarginTop: '5rem' }}>
        <div className="mono" style={{ color: 'var(--accent)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Live Experiment
        </div>
      </div>

      {open ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem', margin: '1rem 0 0.9rem' }}>
          <button
            type="button"
            onClick={() => { setOpenId(null); setShowSteps(false); }}
            className="mono"
            style={{
              ...FROST, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem', borderRadius: 999, cursor: 'pointer',
              color: '#fff', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', 
            }}
          >
            <ArrowLeft size={14} /> All experiments
            </button>
            {open.source_code && open.repo_url && (
              <a
                href={open.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mono"
                style={{
                  ...FROST, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem', borderRadius: 999,
                  color: '#fff', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none',
                }}
              >
                <Code size={14} /> Source code
              </a>
            )}
            {open.Steps && (
              <button
                type="button"
                onClick={() => setShowSteps(true)}
                className="mono"
                style={{
                  ...FROST, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem', borderRadius: 999, cursor: 'pointer',
                  color: '#fff', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                }}
              >
                <Workflow size={14} /> How it works
              </button>
            )}
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3.6vw, 2.2rem)', fontWeight: 800, margin: '0 0 0.35rem', letterSpacing: '0.01em' }}>
            {open.title}
          </h1>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6, fontSize: '0.9rem', marginBottom: '1rem' }}>{open.summary}</p>
          {open.Screen && <open.Screen />}
          {showSteps && open.Steps && (
            <Dialog title={`${open.title}: how it works`} onClose={() => setShowSteps(false)}>
              <open.Steps />
            </Dialog>
          )}
        </>
      ) : (
        <div className="lab-grid" style={{ marginTop: '1.5rem' }}>
          {EXPERIMENTS.map(exp => {
            const Icon = exp.icon;
            return (
              <button
                key={exp.id}
                type="button"
                className={exp.soon ? undefined : 'lab-card'}
                disabled={exp.soon}
                aria-disabled={exp.soon}
                onClick={() => { if (!exp.soon) { setOpenId(exp.id); setShowSteps(false); } }}
                style={{
                  ...FROST, borderRadius: 20, padding: '1.5rem', textAlign: 'left', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1rem',
                  cursor: exp.soon ? 'not-allowed' : 'pointer', opacity: exp.soon ? 0.6 : 1,
                }}
              >
                <span style={{
                  width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 45%, transparent)',
                }}>
                  <Icon size={26} />
                </span>
                <span>
                  <span className="lab-title" style={{ display: 'block', fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.3 }}>{exp.title}</span>
                  <span style={{ display: 'block', color: 'rgba(255,255,255,0.74)', fontSize: '0.9rem', lineHeight: 1.6, marginTop: 6 }}>{exp.summary}</span>
                </span>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: 'auto' }}>
                  {exp.tags.map(t => <span key={t} className="mono" style={chip}>{t}</span>)}
                </span>
                {exp.soon ? (
                  <span className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    <span className="spin-ring" style={{ width: 12, height: 12, borderWidth: 2 }} /> Working on it
                  </span>
                ) : (
                  <span className="mono" style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)' }}>Open →</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
