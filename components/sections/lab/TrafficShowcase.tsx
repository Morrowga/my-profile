'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Package, Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { FROST } from '@/lib/styles';
import {
  ADMIT_PER_SECOND, FAST_PLACE, FUNNEL, LINE_SIZE, NORMAL_VISITORS, RUSH_VISITORS, SCENARIOS, SLOW_PLACE, STOCK, buildSteps,
  type ScenarioId, type UserState,
} from './traffic';

// ── layout of the two rows: every column has the same width; the rows slide sideways ──
const COL_W = 214;
const GAP = 28;               // room for the arrow between two steps
const LABEL_COL = 44;         // the row names, which stay in place while you slide
const HEAD_H = 46;
const USER_H = 160;
const LINK_H = 22;
const BG_H = 120;
const STEP_MS = 3400;
const RED = '#ff6b6b';

/** Where a step is, compared with the moment we are looking at. */
type Status = 'standby' | 'now' | 'passed' | 'problem';

const fmt = (n: number) => n.toLocaleString('en-US');

// ───────────────────────────── what the user sees ─────────────────────────────
function Spinner() {
  return <span className="spin-ring" style={{ width: 22, height: 22, borderWidth: 3 }} />;
}

const big: React.CSSProperties = { fontSize: '0.84rem', fontWeight: 800, color: '#fff', lineHeight: 1.25 };
const small: React.CSSProperties = { fontSize: '0.66rem', color: 'rgba(255,255,255,0.74)', lineHeight: 1.4 };
const fakeBtn = (on = true): React.CSSProperties => ({
  padding: '0.32rem 0.8rem', borderRadius: 6, fontWeight: 800, fontSize: '0.68rem', fontFamily: 'inherit', border: on ? 'none' : '1px solid rgba(255,255,255,0.25)',
  background: on ? 'var(--accent)' : 'rgba(255,255,255,0.08)', color: on ? '#050508' : '#fff', cursor: 'default',
});

/** States that are a final result: they stay on screen after the step is over. */
const STAYS = new Set<UserState>(['soldout', 'done', 'notyours', 'released', 'restock']);

function UserScreen({ state, status, note, rush, fast, notified, onNotify }: {
  state: UserState; status: Status; note: string; rush: boolean; fast: boolean; notified: boolean; onNotify: () => void;
}) {
  const place = fast ? FAST_PLACE : SLOW_PLACE;
  const wait = fast ? 'less than 1 second' : `about ${Math.ceil(SLOW_PLACE / ADMIT_PER_SECOND)} seconds`;
  const tick = <Check size={22} style={{ color: 'var(--accent)' }} />;

  // the recap shown once a step has been passed (the line is the only one that depends on who you are)
  const recap = state === 'line' ? (rush ? `you were #${fmt(place)}` : 'no line today') : note;

  let body: React.ReactNode;
  if (status === 'standby') {
    // the request has not reached this step yet: nothing is happening here, so nothing is "loading"
    body = (<>
      <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)' }} />
      <p style={{ ...big, color: 'rgba(255,255,255,0.5)' }}>Standby</p>
      <p style={{ ...small, color: 'rgba(255,255,255,0.4)' }}>not reached yet</p>
    </>);
  } else if (status === 'passed' && !STAYS.has(state)) {
    body = (<>
      {tick}
      <p style={big}>Passed</p>
      <p style={small}>{recap}</p>
    </>);
  } else {
    switch (state) {
      case 'product':
        body = (<>
          <Package size={26} style={{ color: 'var(--accent)' }} />
          <p style={big}>Limited Sneaker</p>
          <p className="mono" style={{ ...small, color: 'var(--accent)' }}>{STOCK} left</p>
          <span style={fakeBtn()}>Buy</span>
        </>);
        break;
      case 'joining':
        body = (<><Spinner /><p style={big}>Joining…</p><p style={small}>please wait a moment</p></>);
        break;
      case 'line':
        body = rush ? (<>
          <p style={small}>You are in line</p>
          <p style={{ ...big, fontSize: '1.4rem', color: 'var(--accent)' }}>#{fmt(place)}</p>
          <p style={small}>of {fmt(LINE_SIZE)}</p>
          <div style={{ width: '78%', height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
            <div style={{ width: fast ? '92%' : '38%', height: '100%', background: 'var(--accent)' }} />
          </div>
          <p style={small}>wait: {wait}</p>
        </>) : (<>{tick}<p style={big}>No line today</p><p style={small}>you go straight in</p></>);
        break;
      case 'turn':
        body = (<>{tick}<p style={big}>It&apos;s your turn!</p><p style={small}>opening the buying screen</p></>);
        break;
      case 'checking':
        body = (<><Spinner /><p style={big}>Checking availability…</p><p style={small}>in order of your place</p></>);
        break;
      case 'reserved':
        body = (<>{tick}<p style={big}>Reserved for you</p><p className="mono" style={{ ...small, color: 'var(--accent)' }}>4:59 left to pay</p><span style={fakeBtn()}>Pay now</span></>);
        break;
      case 'soldout':
        body = (<>
          <p style={big}>Sold out for now</p>
          <p style={small}>Next stock: Friday 10:00</p>
          <button type="button" onClick={e => { e.stopPropagation(); onNotify(); }} aria-pressed={notified} style={{ ...fakeBtn(!notified), cursor: 'pointer' }}>
            {notified ? '✓ We will tell you' : 'Notify me'}
          </button>
        </>);
        break;
      case 'paying':
        body = (<><Spinner /><p style={big}>Paying…</p><p style={small}>please do not close the page</p></>);
        break;
      case 'saving':
        body = (<><Spinner /><p style={big}>Saving your order…</p></>);
        break;
      case 'done':
        body = (<><Check size={28} style={{ color: 'var(--accent)' }} /><p style={big}>Order confirmed</p><p className="mono" style={small}>#1042 · receipt sent</p></>);
        break;
      // calm messages: the user never sees an error, only that we are still working on it
      case 'slow':
        body = (<><Spinner /><p style={big}>Still working on it…</p><p style={small}>we are trying again</p></>);
        break;
      case 'kept':
        body = (<><Spinner /><p style={big}>Your place is kept</p><p style={small}>one moment, please</p></>);
        break;
      case 'slowline':
        body = (<>
          <p style={small}>You are in line</p>
          <p style={{ ...big, fontSize: '1.4rem', color: 'var(--accent)' }}>#{fmt(place)}</p>
          <p style={small}>the line is moving a little slower</p>
          <p style={small}>wait: about {fast ? '1 minute' : '2 minutes'}</p>
        </>);
        break;
      case 'pending':
        body = (<><Spinner /><p style={big}>Processing your payment…</p><p style={small}>this takes a little longer. We will tell you.</p></>);
        break;
      case 'finishing':
        body = (<><Spinner /><p style={big}>Reserved for you</p><p style={small}>finishing your order…</p></>);
        break;
      case 'timeup':
        body = (<><p className="mono" style={{ ...big, fontSize: '1.2rem', color: 'rgba(255,255,255,0.6)' }}>0:00</p><p style={big}>Time is up</p><p style={small}>the reservation ended</p></>);
        break;
      case 'released':
        body = (<><p style={big}>Item released</p><p style={small}>it is back in stock for other people</p></>);
        break;
      case 'restock':
        body = (<>
          <Check size={22} style={{ color: 'var(--accent)' }} />
          <p style={big}>Back in stock!</p>
          <p style={small}>you were notified</p>
          <span style={fakeBtn()}>Buy now</span>
        </>);
        break;
      default:
        body = (<p style={{ ...small, textAlign: 'center', padding: '0 0.4rem' }}>Sold out for now.<br />This step is for the winners&apos; orders.</p>);
    }
  }

  return (
    <div style={{
      height: '100%', borderRadius: 14, padding: '0.5rem 0.55rem', display: 'flex', flexDirection: 'column',
      background: 'rgba(8,8,14,0.92)', border: '1px solid rgba(255,255,255,0.12)',
      opacity: status === 'standby' ? 0.7 : state === 'notyours' ? 0.55 : 1,
    }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {[0, 1, 2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.28)' }} />)}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, textAlign: 'center' }}>{body}</div>
    </div>
  );
}

// ───────────────────────────── small controls ─────────────────────────────
function Seg<T extends string>({ value, onChange, options, disabled }: {
  value: T; onChange: (v: T) => void; options: { id: T; label: string; sub?: string }[]; disabled?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', opacity: disabled ? 0.45 : 1 }}>
      {options.map(o => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            disabled={disabled}
            aria-pressed={on}
            onClick={() => onChange(o.id)}
            style={{
              ...FROST, padding: '0.32rem 0.8rem', borderRadius: 999, fontFamily: 'inherit', fontSize: '0.74rem', textAlign: 'left',
              cursor: disabled ? 'not-allowed' : 'pointer', color: on ? '#fff' : 'var(--muted)',
              border: `1px solid ${on ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}`, boxShadow: on ? '0 0 14px var(--glow)' : 'none',
            }}
          >
            <strong>{o.label}</strong>{o.sub && <span className="mono" style={{ opacity: 0.75, marginLeft: 6 }}>{o.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

const ctlLabel: React.CSSProperties = { fontSize: '0.64rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)' };
const rowNameText: React.CSSProperties = {
  writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap',
  fontFamily: "'Lato', sans-serif", fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)',
};
const roundBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  color: '#fff', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)',
};

/** The little tag on each background step: standby, running, problem or passed. */
function StatusTag({ status, handled }: { status: Status; handled: boolean }) {
  const label = status === 'now' ? 'Running' : status === 'problem' ? 'Problem' : status === 'passed' ? (handled ? 'Handled ✓' : 'Passed ✓') : 'Standby';
  const colour = status === 'standby' ? 'rgba(255,255,255,0.5)' : status === 'problem' ? RED : 'var(--accent)';
  const solid = status === 'now' || status === 'problem';
  return (
    <span className="mono" style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.12rem 0.5rem', borderRadius: 999, fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase',
      whiteSpace: 'nowrap', flexShrink: 0,
      color: solid ? '#050508' : colour, background: solid ? colour : 'transparent',
      border: `1px solid ${status === 'standby' ? 'rgba(255,255,255,0.22)' : colour}`,
    }}>
      {solid && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#050508', animation: 'pulse-glow 1s ease-in-out infinite' }} />}
      {label}
    </span>
  );
}

// ───────────────────────────── the page ─────────────────────────────
export default function TrafficShowcase() {
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);   // nothing runs until the visitor presses Start
  const [playing, setPlaying] = useState(false);
  const [rush, setRush] = useState(true);
  const [fast, setFast] = useState(true);
  const [notified, setNotified] = useState(false);
  const [scenario, setScenario] = useState<ScenarioId>('healthy');   // the default is a healthy day

  const scroller = useRef<HTMLDivElement>(null);
  const cols = useRef<(HTMLDivElement | null)[]>([]);

  // the healthy steps, plus the problem and its recovery when one is chosen
  const steps = useMemo(() => buildSteps(scenario), [scenario]);
  const N = steps.length;

  // Move forward by itself, and stop at the last step.
  useEffect(() => {
    if (!playing || step >= N - 1) return;
    const t = setInterval(() => setStep(s => Math.min(N - 1, s + 1)), STEP_MS);
    return () => clearInterval(t);
  }, [playing, step, N]);

  // Keep the current step in the middle: both rows slide together, and the steps still to come appear on the right.
  useEffect(() => {
    const sc = scroller.current;
    const el = cols.current[step];
    if (!sc || !el) return;
    // the row names cover the first LABEL_COL pixels, so centre the column in the space that is left
    sc.scrollTo({ left: Math.max(0, el.offsetLeft - LABEL_COL - (sc.clientWidth - LABEL_COL - el.offsetWidth) / 2), behavior: 'smooth' });
  }, [step, scenario]);

  const win = !rush || fast;
  const current = steps[step];
  const stateOf = (i: number): UserState => {
    const u = steps[i].user;
    return typeof u === 'string' ? u : win ? u.win : u.lose;
  };

  // before Start, moving the slider only scrolls to that step; every node stays on Standby
  const go = (i: number) => { setPlaying(false); setStep(Math.max(0, Math.min(N - 1, i))); };
  // choosing another problem starts over and waits for Start again
  const pick = (id: ScenarioId) => { setScenario(id); setStarted(false); setStep(0); setPlaying(false); };
  const onPlay = () => {
    if (!started) { setStarted(true); setStep(0); setPlaying(true); }
    else if (step >= N - 1) { setStep(0); setPlaying(true); }
    else setPlaying(p => !p);
  };
  const finished = started && step >= N - 1;
  const playLabel = !started ? 'Start' : finished ? 'Replay' : playing ? 'Pause' : 'Resume';

  // funnel
  const values = FUNNEL.map(f => (rush ? f.rush : f.normal));
  const maxValue = Math.max(...values);

  return (
    <div className="lab-stack" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.25rem', width: '100%', minWidth: 0 }}>
      {/* ───────────── controls (one slim row) ───────────── */}
      <div className="lab-ctl lab-hscroll" style={{ ...FROST, borderRadius: 16, padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.7rem 1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span className="mono" style={ctlLabel}>Visitors</span>
          <Seg
            value={rush ? 'rush' : 'normal'}
            onChange={v => setRush(v === 'rush')}
            options={[
              { id: 'normal', label: 'Normal day', sub: fmt(NORMAL_VISITORS) },
              { id: 'rush', label: 'Rush', sub: fmt(RUSH_VISITORS) },
            ]}
          />
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}
          title={rush ? `Only ${STOCK} items. The first ${STOCK} in line get one.` : 'On a normal day there is enough for everybody, so being fast does not matter.'}
        >
          <span className="mono" style={ctlLabel}>You are</span>
          <Seg
            value={fast ? 'fast' : 'slow'}
            onChange={v => setFast(v === 'fast')}
            disabled={!rush}
            options={[
              { id: 'fast', label: 'Fast', sub: `#${fmt(FAST_PLACE)}` },
              { id: 'slow', label: 'Slow', sub: `#${fmt(SLOW_PLACE)}` },
            ]}
          />
        </div>
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
            type="range"
            min={0}
            max={N - 1}
            step={1}
            value={step}
            onChange={e => go(Number(e.target.value))}
            aria-label="Step"
            style={{ flex: 1, minWidth: 100, accentColor: 'var(--accent)' }}
          />
          <span className="mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>{step + 1} / {N}</span>
        </div>

        <div style={{ flexBasis: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', paddingTop: '0.55rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="mono" style={ctlLabel}>What goes wrong?</span>
          <Seg value={scenario} onChange={pick} options={SCENARIOS.map(sc => ({ id: sc.id, label: sc.label }))} />
        </div>
      </div>

      {/* ───────────── the two rows (they slide together) ───────────── */}
      <div
        ref={scroller}
        onPointerDown={() => setPlaying(false)}
        className="lab-bleed lab-hscroll"
        style={{ ...FROST, borderRadius: 20, padding: '0.8rem 1rem 0.9rem 0', overflowX: 'auto', position: 'relative' }}
      >
        <div style={{ display: 'flex', width: 'max-content', position: 'relative' }}>
          {/* row names: they stay in place while you slide */}
          <div style={{
            width: LABEL_COL, flexShrink: 0, position: 'sticky', left: 0, zIndex: 4, paddingLeft: 12,
            background: 'linear-gradient(90deg, rgb(11,11,17) 0%, rgb(11,11,17) 80%, rgba(11,11,17,0) 100%)',
          }}>
            <div style={{ height: HEAD_H }} />
            <div style={{ height: USER_H, display: 'flex', alignItems: 'center' }}><span style={rowNameText}>User sees</span></div>
            <div style={{ height: LINK_H }} />
            <div style={{ height: BG_H, display: 'flex', alignItems: 'center' }}><span style={rowNameText}>Background</span></div>
          </div>

          {steps.map((s, i) => {
            const status: Status = !started ? 'standby' : i === step ? (s.kind === 'problem' ? 'problem' : 'now') : i < step ? 'passed' : 'standby';
            const now = status === 'now' || status === 'problem';
            const passed = status === 'passed';
            const Icon = s.icon;
            const bad = status === 'problem';
            const border = bad ? `1.5px solid ${RED}` : now ? '1.5px solid var(--accent)' : passed ? '1px solid color-mix(in srgb, var(--accent) 45%, transparent)' : '1px dashed rgba(255,255,255,0.16)';
            const glow = bad ? `0 0 22px ${RED}55` : now ? '0 0 22px var(--glow)' : 'none';
            const lineColour = bad ? RED : now || passed ? 'var(--accent)' : 'rgba(255,255,255,0.16)';
            const userBorder = now ? '1.5px solid var(--accent)' : border;   // the user sees nothing wrong, even when the background has a problem
            const userGlow = now ? '0 0 22px var(--glow)' : glow;
            return (
              <div
                key={s.id}
                ref={el => { cols.current[i] = el; }}
                onClick={() => go(i)}
                title={s.role}
                style={{ width: COL_W, flexShrink: 0, marginLeft: GAP, position: 'relative', cursor: 'pointer', opacity: now ? 1 : passed ? 0.92 : 0.7, transition: 'opacity 0.4s' }}
              >
                {/* step number and name */}
                <div style={{ height: HEAD_H, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="mono" style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800,
                    color: now ? '#050508' : '#fff', background: now ? 'var(--accent)' : 'rgba(255,255,255,0.08)', border: `1px solid ${now || passed ? 'var(--accent)' : 'rgba(255,255,255,0.22)'}`,
                  }}>{i + 1}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.2, color: now ? '#fff' : 'rgba(255,255,255,0.88)' }}>{s.title}</span>
                </div>

                {/* row 1: what the user sees */}
                <div style={{ height: USER_H, borderRadius: 14, border: userBorder, boxShadow: userGlow, transition: 'all 0.4s' }}>
                  <UserScreen state={stateOf(i)} status={bad ? 'now' : status} note={s.passed} rush={rush} fast={fast} notified={notified} onNotify={() => setNotified(n => !n)} />
                </div>

                {/* the same moment: a line between the two rows */}
                <div style={{ height: LINK_H, position: 'relative' }}>
                  <span className={`flow-line flow-line--v ${now && !bad ? 'flow-line--on' : ''}`} style={{ left: '50%', top: 3, bottom: 3, background: now && !bad ? undefined : lineColour }} />
                </div>

                {/* row 2: what happens in the background */}
                <div style={{ height: BG_H, position: 'relative' }}>
                  {i > 0 && (
                    <>
                      <span className={`flow-line ${now && !bad ? 'flow-line--on' : ''}`} style={{ left: -GAP + 3, width: GAP - 12, top: BG_H / 2 - 1, background: now && !bad ? undefined : lineColour }} />
                      <span style={{ position: 'absolute', left: -9, top: BG_H / 2 - 5, width: 0, height: 0, borderLeft: `7px solid ${bad ? RED : now || passed ? 'var(--accent)' : 'rgba(255,255,255,0.3)'}`, borderTop: '5px solid transparent', borderBottom: '5px solid transparent' }} />
                    </>
                  )}
                  <div style={{
                    height: '100%', borderRadius: 14, border, boxShadow: glow, background: 'rgba(8,8,14,0.9)', padding: '0.55rem 0.7rem', transition: 'all 0.4s',
                    display: 'flex', flexDirection: 'column', gap: 5, justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon size={18} style={{ color: status === 'standby' ? 'rgba(255,255,255,0.45)' : bad ? RED : 'var(--accent)', flexShrink: 0 }} />
                      <span style={{ fontWeight: 800, fontSize: '0.76rem', lineHeight: 1.2, color: status === 'standby' ? 'rgba(255,255,255,0.7)' : '#fff' }}>{s.node}</span>
                    </div>
                    <p style={{ fontSize: '0.64rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{s.role}</p>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
                      <span className="mono" style={{ fontSize: '0.54rem', color: status === 'standby' ? 'rgba(255,255,255,0.4)' : bad ? RED : 'var(--accent)', lineHeight: 1.3, minWidth: 0, overflowWrap: 'anywhere' }}>
                        {s.tools.split(' · ')[0]}
                      </span>
                      <StatusTag status={status} handled={s.kind === 'problem'} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ width: 16, flexShrink: 0 }} />
        </div>
      </div>

      {/* ───────────── where the clicks go ───────────── */}
      {/* same full width as the two rows above */}
      <div className="lab-bleed" style={{ ...FROST, borderRadius: 18, padding: '1.4rem 1.6rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Where the {fmt(rush ? RUSH_VISITORS : NORMAL_VISITORS)} clicks go</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '4px 0 1.2rem' }}>
          Example numbers. Each layer removes load, so the database only sees a small, steady flow.
        </p>
        <div className="lab-hscroll" style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-end', minWidth: 760 }}>
            {FUNNEL.map((f, i) => {
              const v = values[i];
              const h = 10 + 120 * Math.sqrt(v / maxValue);
              const lit = current.funnel === i;
              return (
                <div key={f.label} style={{ flex: 1, textAlign: 'center' }}>
                  <p className="mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: lit ? 'var(--accent)' : '#fff', marginBottom: 6 }}>{fmt(v)}</p>
                  <div style={{ height: h, borderRadius: 8, margin: '0 auto', width: '70%', transition: 'all 0.4s', background: lit ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 32%, transparent)', boxShadow: lit ? '0 0 18px var(--glow)' : 'none' }} />
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: 8, lineHeight: 1.3, color: lit ? '#fff' : 'rgba(255,255,255,0.8)' }}>{f.label}</p>
                  <p style={{ fontSize: '0.62rem', color: 'var(--muted)', marginTop: 3, lineHeight: 1.35 }}>{f.note}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
