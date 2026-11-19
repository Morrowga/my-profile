'use client';
import { FROST } from '@/lib/styles';
import type { ExpNode } from './experiments';

export type NodeState = 'idle' | 'active' | 'done' | 'error';

// The diagram is drawn on a 1000 × 480 canvas; nodes are placed in percent.
const W = 1000;
const H = 480;
const RED = '#ff6b6b';

const centre = (n: ExpNode) => ({ x: (n.x / 100) * W, y: (n.y / 100) * H });

/** A line between two nodes that starts and ends at the nodes' edges. */
function edgePath(a: ExpNode, b: ExpNode, nw: number, nh: number) {
  const p = centre(a);
  const q = centre(b);
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const inset = Math.min((nw / 2) / (Math.abs(ux) || 1e-6), (nh / 2) / (Math.abs(uy) || 1e-6)) + 7;
  return `M ${p.x + ux * inset} ${p.y + uy * inset} L ${q.x - ux * inset} ${q.y - uy * inset}`;
}

const edgeColour = (s: NodeState) =>
  s === 'error' ? RED : s === 'active' ? 'var(--accent)' : s === 'done' ? 'color-mix(in srgb, var(--accent) 55%, transparent)' : 'rgba(255,255,255,0.16)';

/**
 * Draws a set of services and the arrows between them.
 * Each node / arrow has a state: idle, active (running now), done, or error.
 * Arrows are keyed "from>to" in `edgeStates`. A node with a `role` gets a bigger box
 * with its job written under the name.
 */
export default function FlowDiagram({
  nodes, edges, nodeStates, edgeStates = {},
}: {
  nodes: ExpNode[];
  edges: [string, string][];
  nodeStates: Record<string, NodeState>;
  edgeStates?: Record<string, NodeState>;
}) {
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const big = nodes.some(n => n.role);
  const nw = big ? 156 : 124;
  const nh = big ? 104 : 74;

  return (
    <div style={{ ...FROST, borderRadius: 18, padding: '1rem', overflowX: 'auto' }}>
      <div style={{ position: 'relative', minWidth: 820, aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden>
          <defs>
            {(['idle', 'active', 'done', 'error'] as NodeState[]).map(s => (
              <marker key={s} id={`arrow-${s}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" style={{ fill: edgeColour(s) }} />
              </marker>
            ))}
          </defs>
          {edges.map(([from, to]) => {
            const s = edgeStates[`${from}>${to}`] ?? 'idle';
            return (
              <path
                key={`${from}-${to}`}
                d={edgePath(byId[from], byId[to], nw, nh)}
                className={s === 'active' ? 'edge-on' : undefined}
                fill="none"
                strokeWidth={s === 'idle' ? 2 : 3}
                style={{ stroke: edgeColour(s), transition: 'stroke 0.3s' }}
                markerEnd={`url(#arrow-${s})`}
              />
            );
          })}
        </svg>

        {nodes.map(n => {
          const s = nodeStates[n.id] ?? 'idle';
          const Icon = n.icon;
          const on = s !== 'idle';
          const colour = s === 'error' ? RED : 'var(--accent)';
          return (
            <div
              key={n.id}
              title={n.note}
              style={{
                position: 'absolute', left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%, -50%)',
                width: `${(nw / W) * 100}%`, height: `${(nh / H) * 100}%`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, textAlign: 'center',
                borderRadius: 14, padding: '0 8px',
                background: on ? `color-mix(in srgb, ${colour} ${s === 'done' ? 9 : 18}%, rgba(8,8,14,0.9))` : 'rgba(8,8,14,0.82)',
                border: `1.5px solid ${on ? (s === 'done' ? `color-mix(in srgb, ${colour} 55%, transparent)` : colour) : 'rgba(255,255,255,0.14)'}`,
                boxShadow: s === 'active' ? '0 0 22px var(--glow)' : s === 'error' ? `0 0 18px ${RED}55` : 'none',
                color: on ? '#fff' : 'rgba(255,255,255,0.55)',
                transition: 'all 0.45s',
              }}
            >
              <Icon size={20} style={{ color: on ? colour : 'inherit' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.2 }}>{n.label}</span>
              {n.role && <span style={{ fontSize: '0.6rem', lineHeight: 1.3, fontWeight: 500, opacity: on ? 0.85 : 0.7 }}>{n.role}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
