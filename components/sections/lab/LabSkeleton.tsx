import { FROST } from '@/lib/styles';

/**
 * Loading placeholders for the Lab. They are the same size as the real thing, so nothing jumps when it arrives.
 *   LabListSkeleton    the list of experiment cards, shown while the Lab page itself is being downloaded
 *   ExperimentSkeleton an experiment screen, shown while that experiment's code is being downloaded
 * The soft pulse is the `.skeleton` class in globals.css (it is switched off for people who prefer reduced motion).
 */
const block = (width: string, height: number): React.CSSProperties => ({
  width, height, borderRadius: 6, background: 'rgba(255,255,255,0.09)',
});

function SkeletonCard() {
  return (
    <div
      className="skeleton"
      aria-hidden="true"
      style={{ ...FROST, borderRadius: 20, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 280 }}
    >
      <span style={{ ...block('52px', 52), borderRadius: 14 }} />
      <span style={{ display: 'grid', gap: 10 }}>
        <span style={block('72%', 20)} />
        <span style={block('100%', 12)} />
        <span style={block('94%', 12)} />
        <span style={block('58%', 12)} />
      </span>
      <span style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        {['64px', '88px', '72px'].map(w => <span key={w} style={{ ...block(w, 22), borderRadius: 4 }} />)}
      </span>
    </div>
  );
}

export function LabListSkeleton() {
  return (
    <div role="status" aria-label="Loading experiments" style={{ width: '100%', minWidth: 0 }}>
      <div className="skeleton" style={block('132px', 12)} />
      <div className="lab-grid" style={{ marginTop: '1.5rem' }}>
        {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

export function ExperimentSkeleton() {
  return (
    <div role="status" aria-label="Loading experiment" className="skeleton" style={{ display: 'grid', gap: '0.9rem', width: '100%', minWidth: 0 }}>
      <div style={{ ...FROST, borderRadius: 16, height: 56 }} />
      <div style={{ ...FROST, borderRadius: 20, height: 340 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.75rem' }}>
        {[0, 1, 2].map(i => <div key={i} style={{ ...FROST, borderRadius: 14, height: 84 }} />)}
      </div>
    </div>
  );
}
