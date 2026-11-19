'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { FROST } from '@/lib/styles';
import type { Experiment } from './experiments';
import FlowDiagram, { type NodeState } from './FlowDiagram';

const STEP_MS = 5200;

export default function ArchitectureDiagram({ experiment }: { experiment: Experiment }) {
  const { nodes, edges, steps } = experiment;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(
    () => typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setStep(s => (s + 1) % steps.length), STEP_MS);
    return () => clearInterval(t);
  }, [playing, steps.length]);

  const current = steps[step];
  const lit = new Set(current.nodes);
  // the nodes of the current step are "active"; an arrow is active when both of its ends are
  const nodeStates: Record<string, NodeState> = Object.fromEntries(current.nodes.map(id => [id, 'active' as NodeState]));
  const edgeStates: Record<string, NodeState> = Object.fromEntries(
    edges.filter(([a, b]) => lit.has(a) && lit.has(b)).map(([a, b]) => [`${a}>${b}`, 'active' as NodeState]),
  );

  // Clicking a control means "I'm driving now": stop the automatic play.
  const go = (i: number) => { setPlaying(false); setStep((i + steps.length) % steps.length); };

  const btn: React.CSSProperties = {
    width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)',
  };

  return (
    <div>
      {/* the diagram (scrolls sideways on small screens) */}
      <FlowDiagram nodes={nodes} edges={edges} nodeStates={nodeStates} edgeStates={edgeStates} />

      {/* step text + controls */}
      <div style={{ ...FROST, borderRadius: 16, padding: '1.25rem 1.5rem', marginTop: '1rem', display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button type="button" style={btn} onClick={() => go(step - 1)} aria-label="Previous step"><ChevronLeft size={18} /></button>
          <button type="button" style={btn} onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
          </button>
          <button type="button" style={btn} onClick={() => go(step + 1)} aria-label="Next step"><ChevronRight size={18} /></button>

          <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '0.6rem', flexWrap: 'wrap' }}>
            {steps.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => go(i)}
                aria-label={`Step ${i + 1}: ${s.title}`}
                aria-current={i === step}
                style={{
                  width: i === step ? 34 : 10, height: 10, borderRadius: 5, border: 'none', cursor: 'pointer', padding: 0,
                  background: i === step ? 'var(--accent)' : 'rgba(255,255,255,0.22)', transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mono" style={{ fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            Step {step + 1} of {steps.length}
          </p>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '0.35rem 0 0.5rem' }}>{current.title}</h3>
          <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.75, fontSize: '0.95rem' }}>{current.text}</p>
        </div>
      </div>
    </div>
  );
}
