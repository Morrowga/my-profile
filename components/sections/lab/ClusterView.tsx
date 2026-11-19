'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FROST } from '@/lib/styles';

/**
 * A picture of the cluster with a slider that steps through one test, moment by moment.
 * Control plane on top, two workers with their Pods, and the customers' connections at the bottom.
 * The moments (frames) are written by hand in kubernetesFlows.ts, from the real timings and numbers of each test.
 *
 * Two layouts, chosen by the width of the box it sits in (not of the window):
 *   wide:    the two workers side by side, each with its Pods in a row.
 *   compact: for phones. The workers are narrow columns side by side, each with its Pods stacked, so the text stays readable.
 */
export type PodState = 'ready' | 'starting' | 'stopping' | 'dead' | 'restarting' | 'stuck';
export type Pod = {
  id: string; w: 1 | 2; slot: 0 | 1 | 2; state: PodState;
  v?: string;            // version badge: v1, v2, v3
  routed?: boolean;      // the Service still sends customers here (so, if the Pod is down, those requests fail)
  note?: string;         // replaces the default state text
};
export type WorkerState = 'up' | 'silent' | 'notready';   // silent = stopped, but the control plane does not know yet
export type Readout = { label: string; value: string; tone?: 'good' | 'warn' | 'bad' };
export type Frame = { at: string; title: string; text: string; workers: [WorkerState, WorkerState]; pods: Pod[]; readouts: Readout[] };
export type Flow = { id: string; label: string; frames: Frame[] };

const GOOD = 'var(--accent)';
const WARN = '#fbbf24';
const BAD = '#f87171';
const GREY = 'rgba(255,255,255,0.4)';

const POD_STYLE: Record<PodState, { fill: string; stroke: string; dash?: string; text: string }> = {
  ready: { fill: 'rgba(74,222,128,0.16)', stroke: GOOD, text: 'ready' },
  starting: { fill: 'rgba(251,191,36,0.12)', stroke: WARN, dash: '5 4', text: 'starting' },
  stopping: { fill: 'rgba(255,255,255,0.05)', stroke: GREY, dash: '2 4', text: 'stopping' },
  dead: { fill: 'rgba(248,113,113,0.14)', stroke: BAD, text: 'down' },
  restarting: { fill: 'rgba(251,191,36,0.12)', stroke: WARN, dash: '5 4', text: 'restarting' },
  stuck: { fill: 'rgba(251,191,36,0.12)', stroke: WARN, dash: '5 4', text: 'never ready' },
};

const WORKER_COLOR: Record<WorkerState, string> = { up: GOOD, silent: WARN, notready: BAD };
/** colour of the line from the control plane to a worker: green = running, amber = stopped but not noticed yet, red = NotReady */
const LINE_COLOR = WORKER_COLOR;
const TONE: Record<NonNullable<Readout['tone']>, string> = { good: GOOD, warn: WARN, bad: BAD };

/* ───────── the two layouts ───────── */

type Box = { x: number; y: number; w: number; h: number };
type Layout = {
  viewBox: string;
  cp: Box; cpFont: [number, number];
  boxes: [Box, Box];
  head: { dx: number; titleDy: number; statusDy: number; titleSize: number; statusSize: number };
  workerText: Record<WorkerState, string>;
  pod: (w: 1 | 2, slot: number) => Box;
  podText: { idDy: number; stateDy: number; idSize: number; stateSize: number };
  badgeDx: number;                                       // from the pod's right edge
  edge: (w: 1 | 2, slot: number) => { x: number; y: number };   // where a customer line meets a Pod
  service: Box; serviceFont: number;
  cpLine: (i: 0 | 1) => { x1: number; y1: number; x2: number; y2: number };
  customers: { x: number; y: number; font: number; stub: [number, number] };
};

const WIDE: Layout = {
  viewBox: '0 0 800 480',
  cp: { x: 270, y: 8, w: 260, h: 56 }, cpFont: [17, 12],
  boxes: [{ x: 30, y: 150, w: 350, h: 190 }, { x: 420, y: 150, w: 350, h: 190 }],
  head: { dx: 16, titleDy: 26, statusDy: 44, titleSize: 17, statusSize: 12 },
  workerText: { up: 'running', silent: 'stopped (the control plane does not know yet)', notready: 'NotReady' },
  pod: (w, slot) => ({ x: (w === 1 ? 30 : 420) + 60 + slot * 115 - 45, y: 205, w: 90, h: 56 }),
  podText: { idDy: 23, stateDy: 43, idSize: 16, stateSize: 12 },
  badgeDx: -4,
  edge(w, slot) { const b = this.pod(w, slot); return { x: b.x + b.w / 2, y: b.y + b.h }; },
  service: { x: 300, y: 395, w: 200, h: 40 }, serviceFont: 15,
  cpLine: i => ({ x1: 400, y1: 64, x2: (i === 0 ? 30 : 420) + 175, y2: 150 }),
  customers: { x: 400, y: 466, font: 14, stub: [435, 448] },
};

const COMPACT: Layout = {
  viewBox: '0 0 400 456',
  cp: { x: 100, y: 8, w: 200, h: 48 }, cpFont: [15, 11],
  boxes: [{ x: 8, y: 96, w: 182, h: 226 }, { x: 210, y: 96, w: 182, h: 226 }],
  head: { dx: 12, titleDy: 24, statusDy: 42, titleSize: 15, statusSize: 11 },
  workerText: { up: 'running', silent: 'stopped, not noticed', notready: 'NotReady' },
  pod: (w, slot) => ({ x: (w === 1 ? 8 : 210) + 11, y: 96 + 56 + slot * 54, w: 160, h: 46 }),
  podText: { idDy: 19, stateDy: 36, idSize: 15, stateSize: 12 },
  badgeDx: -6,
  // the lines run up the gap between the two workers and meet each Pod on its inner side, so they never cross another Pod
  edge(w, slot) { const b = this.pod(w, slot); return { x: w === 1 ? b.x + b.w : b.x, y: b.y + b.h / 2 }; },
  service: { x: 115, y: 372, w: 170, h: 40 }, serviceFont: 14,
  cpLine: i => ({ x1: 200, y1: 56, x2: (i === 0 ? 8 : 210) + 91, y2: 96 }),
  customers: { x: 200, y: 440, font: 13, stub: [412, 424] },
};

const COMPACT_BELOW = 600;   // px: below this width of the box, use the compact layout

export default function ClusterView({ flows, layout }: { flows: Flow[]; layout?: 'wide' | 'compact' }) {
  const [flowId, setFlowId] = useState(flows[0].id);
  const [index, setIndex] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // follow the width of the box we sit in; the observer also reports the first size, so the first paint is corrected at once
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < COMPACT_BELOW));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const L = (layout ? layout === 'compact' : narrow) ? COMPACT : WIDE;
  const flow = flows.find(f => f.id === flowId) ?? flows[0];
  const frame = flow.frames[Math.min(index, flow.frames.length - 1)];
  const last = flow.frames.length - 1;

  const go = (i: number) => setIndex(Math.max(0, Math.min(last, i)));
  const chooseFlow = (id: string) => { setFlowId(id); setIndex(0); };

  return (
    <div ref={box} style={{ width: '100%', minWidth: 0 }}>
      {flows.length > 1 && (
        <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.7rem' }}>
          {flows.map(f => (
            <button
              key={f.id} role="tab" aria-selected={f.id === flow.id} onClick={() => chooseFlow(f.id)} className="mono"
              style={{
                ...FROST, padding: '0.35rem 0.8rem', borderRadius: 999, cursor: 'pointer', fontSize: '0.72rem', letterSpacing: '0.06em',
                color: f.id === flow.id ? '#fff' : 'var(--muted)', border: `1px solid ${f.id === flow.id ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
              }}
            >{f.label}</button>
          ))}
        </div>
      )}

      <div style={{ ...FROST, borderRadius: 16, padding: '0.6rem' }}>
        <svg viewBox={L.viewBox} role="img" aria-label={`Cluster picture: ${frame.title}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* control plane and its connections to the workers */}
          {([0, 1] as const).map(i => {
            const c = L.cpLine(i);
            return (
              <line key={`cp${i}`} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
                style={{ stroke: LINE_COLOR[frame.workers[i]], strokeWidth: 2, strokeDasharray: '6 5', opacity: 0.85, transition: 'stroke .25s' }} />
            );
          })}
          <rect x={L.cp.x} y={L.cp.y} width={L.cp.w} height={L.cp.h} rx={12} style={{ fill: 'rgba(8,8,14,0.7)', stroke: 'rgba(255,255,255,0.28)' }} />
          <text x={L.cp.x + L.cp.w / 2} y={L.cp.y + L.cp.h * 0.45} textAnchor="middle" style={{ fill: '#fff', fontSize: L.cpFont[0], fontWeight: 700 }}>Control plane</text>
          <text x={L.cp.x + L.cp.w / 2} y={L.cp.y + L.cp.h * 0.8} textAnchor="middle" style={{ fill: 'rgba(255,255,255,0.6)', fontSize: L.cpFont[1] }}>API server · etcd · scheduler</text>

          {/* workers */}
          {L.boxes.map((b, i) => {
            const state = frame.workers[i];
            return (
              <g key={`w${i}`}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={14}
                  style={{ fill: 'rgba(255,255,255,0.03)', stroke: WORKER_COLOR[state], strokeWidth: 1.5, strokeDasharray: state === 'up' ? undefined : '7 5', transition: 'stroke .25s' }} />
                <text x={b.x + L.head.dx} y={b.y + L.head.titleDy} style={{ fill: '#fff', fontSize: L.head.titleSize, fontWeight: 700 }}>{`Worker ${i + 1}`}</text>
                <text x={b.x + L.head.dx} y={b.y + L.head.statusDy} style={{ fill: WORKER_COLOR[state], fontSize: L.head.statusSize }}>{L.workerText[state]}</text>
              </g>
            );
          })}

          {/* customers' connections: drawn first, so the Pods sit on top */}
          {frame.pods.map(p => {
            const ok = p.state === 'ready';
            const fail = !!p.routed && (p.state === 'dead' || p.state === 'restarting');
            if (!ok && !fail) return null;
            const e = L.edge(p.w, p.slot);
            return (
              <line key={`c${p.id}`} x1={L.service.x + L.service.w / 2} y1={L.service.y} x2={e.x} y2={e.y}
                style={{ stroke: ok ? GOOD : BAD, strokeWidth: 2, strokeDasharray: ok ? undefined : '6 5', opacity: ok ? 0.55 : 0.9, transition: 'stroke .25s' }} />
            );
          })}

          {/* Pods */}
          {frame.pods.map(p => {
            const b = L.pod(p.w, p.slot);
            const st = POD_STYLE[p.state];
            const cx = b.x + b.w / 2;
            return (
              <g key={p.id}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={10}
                  style={{ fill: st.fill, stroke: st.stroke, strokeWidth: 1.6, strokeDasharray: st.dash, transition: 'fill .25s, stroke .25s' }} />
                <text x={cx} y={b.y + L.podText.idDy} textAnchor="middle" style={{ fill: '#fff', fontSize: L.podText.idSize, fontWeight: 700 }}>{`Pod ${p.id}`}</text>
                <text x={cx} y={b.y + L.podText.stateDy} textAnchor="middle" style={{ fill: st.stroke, fontSize: L.podText.stateSize }}>{p.note ?? st.text}</text>
                {p.v && (
                  <text x={b.x + b.w + L.badgeDx} y={b.y + 14} textAnchor="end" style={{ fill: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 700 }}>{p.v}</text>
                )}
              </g>
            );
          })}

          {/* the Service and the customers */}
          <rect x={L.service.x} y={L.service.y} width={L.service.w} height={L.service.h} rx={10} style={{ fill: 'rgba(8,8,14,0.7)', stroke: 'rgba(255,255,255,0.28)' }} />
          <text x={L.service.x + L.service.w / 2} y={L.service.y + 25} textAnchor="middle" style={{ fill: '#fff', fontSize: L.serviceFont, fontWeight: 700 }}>Service (one address)</text>
          <line x1={L.customers.x} y1={L.customers.stub[0]} x2={L.customers.x} y2={L.customers.stub[1]} style={{ stroke: 'rgba(255,255,255,0.4)', strokeWidth: 2 }} />
          <text x={L.customers.x} y={L.customers.y} textAnchor="middle" style={{ fill: 'rgba(255,255,255,0.7)', fontSize: L.customers.font }}>Customers, 50 requests a second</text>
        </svg>
      </div>

      {/* the slider */}
      <div style={{ ...FROST, borderRadius: 14, padding: '0.7rem 0.9rem', marginTop: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button type="button" aria-label="Previous moment" onClick={() => go(index - 1)} disabled={index === 0} style={arrowBtn(index === 0)}><ChevronLeft size={16} /></button>
          <input
            type="range" min={0} max={last} step={1} value={index} onChange={e => go(Number(e.target.value))}
            aria-label={`Moment in the test: ${frame.at}`} style={{ flex: 1, minWidth: 0, accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          <button type="button" aria-label="Next moment" onClick={() => go(index + 1)} disabled={index === last} style={arrowBtn(index === last)}><ChevronRight size={16} /></button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem', gap: '0.5rem' }}>
          <span className="mono" style={{ fontSize: '0.72rem', letterSpacing: '0.08em', color: 'var(--accent)', minWidth: 0, overflowWrap: 'anywhere' }}>{frame.at}</span>
          <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--muted)', flexShrink: 0 }}>{index + 1} / {flow.frames.length}</span>
        </div>
      </div>

      {/* what is happening now */}
      <div style={{ ...FROST, borderRadius: 16, padding: '0.9rem 1rem', marginTop: '0.6rem' }}>
        <h3 className="lab-title" style={{ fontSize: '1.02rem', fontWeight: 800 }}>{frame.title}</h3>
        <p style={{ fontSize: '0.88rem', lineHeight: 1.6, marginTop: 4, color: 'rgba(255,255,255,0.82)' }}>{frame.text}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.7rem' }}>
          {frame.readouts.map(r => (
            <span key={r.label} style={{ padding: '0.3rem 0.65rem', borderRadius: 10, fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', border: `1px solid ${r.tone ? TONE[r.tone] : 'rgba(255,255,255,0.15)'}` }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>{r.label}: </span>
              <strong style={{ color: r.tone ? TONE[r.tone] : '#fff' }}>{r.value}</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const arrowBtn = (disabled: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
});
