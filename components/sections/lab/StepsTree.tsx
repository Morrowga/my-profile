'use client';
import { FROST } from '@/lib/styles';

/**
 * A "How it works" tree: one goal, three branches, four steps in each branch.
 * Every step has one sentence and one real example. The layout is the CSS in globals.css (.steps-*),
 * which expects exactly 3 branches of 4 steps.
 * (SearchSteps.tsx has its own copy of this; it could use this component later.)
 */
export type Step = { title: string; text: string; example: { label: string; value: string } };
export type Branch = { id: string; title: string; hint: string; steps: Step[] };

const tiny: React.CSSProperties = { fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' };

function Link() {
  return <div aria-hidden="true" className="steps-link" />;
}

function StepNode({ n, step }: { n: number; step: Step }) {
  return (
    <div style={{ ...FROST, borderRadius: 14, padding: '1rem 1.05rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span className="mono" style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', border: '1px solid var(--accent)', background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
        }}>{n}</span>
        <h3 className="lab-title" style={{ fontSize: '0.98rem', fontWeight: 800, lineHeight: 1.25 }}>{step.title}</h3>
      </div>
      <p style={{ fontSize: '0.86rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.8)' }}>{step.text}</p>
      <div style={{ marginTop: 'auto', padding: '0.55rem 0.7rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="mono" style={tiny}>{step.example.label}</p>
        <p style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--accent)', marginTop: 3, overflowWrap: 'anywhere' }}>{step.example.value}</p>
      </div>
    </div>
  );
}

export default function StepsTree({ goal, branches, note }: { goal: { title: string; text: string }; branches: Branch[]; note?: string }) {
  // the steps are numbered 1, 2, 3 ... across the branches
  const first = branches.map((_, i) => branches.slice(0, i).reduce((sum, b) => sum + b.steps.length, 0) + 1);
  return (
    <div className="steps-wrap">
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ ...FROST, borderRadius: 16, padding: '1rem 1.4rem', textAlign: 'center', maxWidth: 520, border: '1px solid var(--accent)', boxShadow: '0 0 22px var(--glow)' }}>
          <p className="mono" style={{ ...tiny, color: 'var(--accent)' }}>The goal</p>
          <h2 className="lab-title" style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 4 }}>{goal.title}</h2>
          <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.75)', marginTop: 6, lineHeight: 1.5 }}>{goal.text}</p>
        </div>
      </div>

      <div className="steps-tree">
        <div className="steps-rail" aria-hidden="true" />
        {branches.map((b, bi) => (
          <div key={b.id} className="steps-branch">
            <div style={{ ...FROST, borderRadius: 14, padding: '0.8rem 1rem', textAlign: 'center', width: '100%', border: '1px solid color-mix(in srgb, var(--accent) 55%, transparent)' }}>
              <h3 className="lab-title" style={{ fontSize: '1.02rem', fontWeight: 800 }}>{b.title}</h3>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{b.hint}</p>
            </div>
            {b.steps.map((s, si) => (
              <div key={s.title} style={{ display: 'contents' }}>
                <Link />
                <StepNode n={first[bi] + si} step={s} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {note && (
        <p className="mono" style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '1rem', lineHeight: 1.6 }}>{note}</p>
      )}
    </div>
  );
}
