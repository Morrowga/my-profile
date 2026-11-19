'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Download, ExternalLink, Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { FROST } from '@/lib/styles';

/**
 * Messy data to clean data. Every card shows ONE sentence and ONE example, nothing else.
 * All of it is read from /lab/data-cleaning/lab-data.json, which the Python lab folder exports
 * from the real files (doc-extraction-lab/src/12_export_ui_data.py). Nothing here is typed in by hand.
 */
const DATA_URL = '/lab/data-cleaning/lab-data.json';
const GAP = 28;          // room for the arrow between two cards
const STEP_MS = 3200;
const CARD_W = 290;
const EX_H = 112;        // the example block has the same height on every step card

type Example = { field: string; before: string | null; after: string | null };
type StepData = { id: string; step: number; title: string; action: string; primary: number; examples: Example[] };
type LabData = {
  source: { name: string; file: string; url: string };
  totals: { rawRows: number; rawColumns: number; cleanRows: number; cleanColumns: number; exactCopiesRemoved: number; aiCostUsd: number };
  steps: StepData[];
  story: { before: [string, string][]; after: [string, string][] };
  links: { clean: string; uncleanSample: string; descriptions: string | null; source: string };
};

type Node = { kind: 'raw' } | { kind: 'step'; step: StepData } | { kind: 'clean' };
type Status = 'input' | 'standby' | 'now' | 'passed';

const roundBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  color: '#fff', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)',
};
const linkChip: React.CSSProperties = {
  ...FROST, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.9rem', borderRadius: 999, fontSize: '0.8rem',
  color: '#fff', textDecoration: 'none', fontWeight: 700,
};
const tiny: React.CSSProperties = { fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' };

function StatusTag({ status }: { status: Status }) {
  const label = status === 'now' ? 'Running' : status === 'passed' ? 'Passed ✓' : status === 'input' ? 'Start' : 'Standby';
  const on = status !== 'standby';
  return (
    <span className="mono" style={{
      padding: '0.14rem 0.55rem', borderRadius: 999, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
      color: status === 'now' ? '#050508' : on ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
      background: status === 'now' ? 'var(--accent)' : 'transparent', border: `1px solid ${on ? 'var(--accent)' : 'rgba(255,255,255,0.22)'}`,
    }}>
      {label}
    </span>
  );
}

/** One line of a record: a small name above a clear value. */
function Line({ name, value, accent, dim }: { name: string; value: string; accent?: boolean; dim?: boolean }) {
  return (
    <div>
      <p style={tiny}>{name}</p>
      <p className="mono" style={{ fontSize: '0.86rem', lineHeight: 1.4, overflowWrap: 'anywhere', color: accent ? 'var(--accent)' : dim ? 'rgba(255,255,255,0.62)' : '#fff' }}>{value}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: 'grid', gap: 9, marginTop: 'auto', height: EX_H, alignContent: 'end' }} aria-label="not reached yet">
      {[86, 62, 74].map((p, k) => <span key={k} style={{ height: 9, width: `${p}%`, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }} />)}
    </div>
  );
}

export default function DataCleaningShowcase() {
  const [data, setData] = useState<LabData | null>(null);
  const [failed, setFailed] = useState(false);
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);   // nothing runs until the visitor presses Start
  const [playing, setPlaying] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const cols = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let alive = true;
    fetch(DATA_URL)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<LabData>; })
      .then(d => { if (alive) setData(d); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  // the unclean file, the ten steps, then the clean result
  const nodes = useMemo<Node[]>(() => (data ? [{ kind: 'raw' }, ...data.steps.map(s => ({ kind: 'step' as const, step: s })), { kind: 'clean' }] : []), [data]);
  const N = nodes.length;

  useEffect(() => {
    if (!playing || step >= N - 1) return;
    const t = setInterval(() => setStep(s => Math.min(N - 1, s + 1)), STEP_MS);
    return () => clearInterval(t);
  }, [playing, step, N]);

  // keep the current card in the middle
  useEffect(() => {
    const sc = scroller.current;
    const el = cols.current[step];
    if (!sc || !el) return;
    sc.scrollTo({ left: Math.max(0, el.offsetLeft - (sc.clientWidth - el.offsetWidth) / 2), behavior: 'smooth' });
  }, [step, N]);

  if (failed) return <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>The data file could not be loaded. Please refresh the page.</p>;
  if (!data) return <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Loading…</p>;

  // before Start, moving the slider only scrolls to a card; every step stays on Standby
  const go = (i: number) => { setPlaying(false); setStep(Math.max(0, Math.min(N - 1, i))); };
  const onPlay = () => {
    if (!started) { setStarted(true); setStep(0); setPlaying(true); }
    else if (step >= N - 1) { setStep(0); setPlaying(true); }
    else setPlaying(p => !p);
  };
  const finished = started && step >= N - 1;
  const playLabel = !started ? 'Start' : finished ? 'Replay' : playing ? 'Pause' : 'Resume';
  const statusOf = (i: number): Status => (i === 0 ? 'input' : !started ? 'standby' : i === step ? 'now' : i < step ? 'passed' : 'standby');

  const { totals, links, story } = data;

  return (
    <div className="lab-stack" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.25rem', width: '100%', minWidth: 0 }}>
      {/* ───────────── controls ───────────── */}
      <div className="lab-ctl lab-hscroll" style={{ ...FROST, borderRadius: 16, padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.7rem 1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 300px', minWidth: 260 }}>
          <button type="button" style={roundBtn} onClick={() => go(step - 1)} aria-label="Previous step"><SkipBack size={15} /></button>
          <button
            type="button"
            onClick={onPlay}
            aria-label={playLabel}
            style={{
              ...roundBtn, width: 'auto', minWidth: 96, padding: '0 1rem', borderRadius: 999, gap: 6, fontFamily: 'inherit', fontWeight: 800, fontSize: '0.78rem',
              ...(!started ? { background: 'var(--accent)', color: '#050508', border: 'none', boxShadow: '0 0 16px var(--glow)' } : {}),
            }}
          >
            {finished ? <RotateCcw size={14} /> : playing ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
            {playLabel}
          </button>
          <button type="button" style={roundBtn} onClick={() => go(step + 1)} aria-label="Next step"><SkipForward size={15} /></button>
          <input
            type="range" min={0} max={N - 1} step={1} value={step} onChange={e => go(Number(e.target.value))} aria-label="Step"
            style={{ flex: 1, minWidth: 100, accentColor: 'var(--accent)' }}
          />
          <span className="mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>{step + 1} / {N}</span>
        </div>
      </div>

      {/* ───────────── the cards (they slide sideways) ───────────── */}
      <div
        ref={scroller}
        onPointerDown={() => setPlaying(false)}
        className="lab-bleed lab-hscroll"
        style={{ ...FROST, borderRadius: 20, padding: '1rem 1rem 1rem 0', overflowX: 'auto', position: 'relative' }}
      >
        <div style={{ display: 'flex', alignItems: 'stretch', width: 'max-content' }}>
          {nodes.map((node, i) => {
            const status = statusOf(i);
            const now = status === 'now';
            const passed = status === 'passed';
            const standby = status === 'standby';
            const border = now ? '1.5px solid var(--accent)' : passed || status === 'input' ? '1px solid color-mix(in srgb, var(--accent) 45%, transparent)' : '1px dashed rgba(255,255,255,0.16)';
            const lineColour = now || passed ? 'var(--accent)' : 'rgba(255,255,255,0.16)';
            const s = node.kind === 'step' ? node.step : null;
            const title = node.kind === 'raw' ? 'The unclean file' : node.kind === 'clean' ? 'The clean file' : s!.title;
            const badge = node.kind === 'raw' ? '•' : node.kind === 'clean' ? '✓' : String(s!.step);
            const sentence = node.kind === 'raw'
              ? `${totals.rawRows.toLocaleString('en-US')} messy job posts from Glassdoor.`
              : node.kind === 'clean'
                ? `${totals.cleanRows.toLocaleString('en-US')} clean rows, ready to use.`
                : s!.action;
            const mid = node.kind === 'step';   // only the ten step cards are centred
            const example = s && s.examples.length ? s.examples[Math.min(s.primary, s.examples.length - 1)] : null;
            return (
              <div
                key={i}
                ref={el => { cols.current[i] = el; }}
                onClick={() => go(i)}
                style={{ width: CARD_W, flexShrink: 0, marginLeft: GAP, position: 'relative', display: 'flex', cursor: 'pointer', opacity: standby ? 0.8 : 1, transition: 'opacity 0.4s' }}
              >
                {i > 0 && (
                  <>
                    <span className="flow-line" style={{ left: -GAP + 3, width: GAP - 12, top: '50%', background: lineColour }} />
                    <span style={{ position: 'absolute', left: -9, top: 'calc(50% - 5px)', width: 0, height: 0, borderLeft: `7px solid ${now || passed ? 'var(--accent)' : 'rgba(255,255,255,0.3)'}`, borderTop: '5px solid transparent', borderBottom: '5px solid transparent' }} />
                  </>
                )}
                <div style={{
                  flex: 1, minWidth: 0, borderRadius: 16, border, background: 'rgba(8,8,14,0.9)', padding: '1rem 1.05rem', transition: 'all 0.4s',
                  boxShadow: now ? '0 0 22px var(--glow)' : 'none', display: 'flex', flexDirection: 'column', gap: 14, minHeight: 300,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span className="mono" style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem', fontWeight: 800,
                      color: now ? '#050508' : '#fff', background: now ? 'var(--accent)' : 'rgba(255,255,255,0.08)', border: `1px solid ${standby ? 'rgba(255,255,255,0.22)' : 'var(--accent)'}`,
                    }}>{badge}</span>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2, flex: 1, minWidth: 0 }}>{title}</span>
                    <StatusTag status={status} />
                  </div>

                  <p style={{
                    fontSize: '0.98rem', lineHeight: 1.5, color: '#fff',
                    ...(mid ? { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' } : {}),
                  }}>{sentence}</p>

                  {/* the unclean file: the same job, as it came */}
                  {node.kind === 'raw' && (
                    <>
                      <div style={{ display: 'grid', gap: 9 }}>
                        {story.before.map(([k, v]) => <Line key={k} name={k} value={v} dim />)}
                      </div>
                      <a href={data.source.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ ...linkChip, alignSelf: 'flex-start', marginTop: 'auto' }}>
                        Source <ExternalLink size={13} />
                      </a>
                    </>
                  )}

                  {/* one cleaning step: one example */}
                  {s && (standby ? <Skeleton /> : example ? (
                    <div style={{ display: 'grid', gap: 7, marginTop: 'auto', height: EX_H, alignContent: 'end' }}>
                      <p style={{ ...tiny, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{example.field}</p>
                      <p className="mono" style={{ fontSize: '0.86rem', lineHeight: 1.4, color: 'rgba(255,255,255,0.62)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{example.before ?? 'empty'}</p>
                      <p className="mono" style={{ fontSize: '0.9rem', lineHeight: 1.4, color: 'var(--accent)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{example.after ?? 'empty'}</p>
                    </div>
                  ) : (
                    <Check size={34} style={{ color: 'var(--accent)', marginTop: 'auto' }} />
                  ))}

                  {/* the clean file: the same job, cleaned */}
                  {node.kind === 'clean' && (standby ? <Skeleton /> : (
                    <>
                      <div style={{ display: 'grid', gap: 9 }}>
                        {story.after.map(([k, v]) => <Line key={k} name={k} value={v} accent />)}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 'auto' }}>
                        <a href={links.clean} download onClick={e => e.stopPropagation()} style={linkChip}><Download size={14} /> clean.csv</a>
                      </div>
                    </>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{ width: 16, flexShrink: 0 }} />
        </div>
      </div>
    </div>
  );
}
