'use client';
import { FROST } from '@/lib/styles';

interface Props<T extends string> {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
}

/** Frosted pill tabs. The active tab gets the page's accent colour (the planet's colour). */
export default function PillTabs<T extends string>({ tabs, value, onChange }: Props<T>) {
  return (
    <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
      {tabs.map(t => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            style={{
              ...FROST,
              padding: '0.6rem 1.15rem',
              borderRadius: 999,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.03em',
              color: active ? '#fff' : 'var(--muted)',
              border: `1px solid ${active ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: active ? '0 0 18px var(--glow)' : 'none',
              transition: 'color 0.25s, border-color 0.25s, box-shadow 0.25s',
            }}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="mono" style={{ marginLeft: '0.55rem', fontSize: '0.7rem', color: active ? 'var(--accent)' : 'var(--muted)' }}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
