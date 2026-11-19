'use client';
import { useState } from 'react';
import { FROST } from '@/lib/styles';
import PillTabs from '@/components/ui/PillTabs';
import ClusterView, { type Flow } from './ClusterView';
import { CRASH_FLOWS, DELETE_FLOWS, SCALE_FLOWS, SERVER_FLOWS, UPDATE_FLOWS } from './kubernetesFlows';

/**
 * Initial version: the Kubernetes experiment as six short stories with the real numbers.
 * The numbers come from the experiment repo (kubernetes-deployment-experiment): a few runs each, on an 8 GB laptop.
 * Runs where the laptop itself stalled are not used. Nothing here is live: it is a record of what was measured.
 */
type Stat = { value: string; label: string };
type Story = { id: string; tab: string; did: string; happened: string; stats: Stat[]; learned: string; flows?: Flow[] };   // flows: the slider picture

const STORIES: Story[] = [
  {
    id: 'delete',
    tab: 'Delete a Pod',
    did: 'Delete one of the 3 copies while 50 customers a second keep coming.',
    happened: 'The Deployment saw 2 copies instead of 3 and started a new one. The Service stopped sending customers to the old Pod before it stopped.',
    stats: [
      { value: '0', label: 'failed requests (5 runs)' },
      { value: '6.4 s', label: 'until the new Pod is ready (median)' },
      { value: '2 of 3', label: 'lowest number of healthy copies' },
    ],
    learned: 'A planned stop costs nothing, because the Pod leaves the line before it leaves.',
    flows: DELETE_FLOWS,
  },
  {
    id: 'crash',
    tab: 'Crash the app',
    did: 'Kill the app process inside one Pod, hard.',
    happened: 'The agent on that worker restarted the container in the same Pod. The Service needed about a second to notice, so a few requests failed first.',
    stats: [
      { value: '≈ 7', label: 'failed requests (median of 5 runs)' },
      { value: '4.7 s', label: 'back to 3 healthy (median)' },
      { value: '14.9 s', label: 'if it crashes again soon: the restart back-off' },
    ],
    learned: 'A crash nobody planned costs a few requests. Crashing again and again makes Kubernetes wait longer before each restart.',
    flows: CRASH_FLOWS,
  },
  {
    id: 'update',
    tab: 'Update',
    did: 'Roll out a new version, then a broken one that never becomes ready.',
    happened: 'A rolling update starts a new Pod and waits until it is ready before it stops an old one. The broken version never became ready, so customers stayed on the old version until it was rolled back.',
    stats: [
      { value: 'v1 → v2', label: 'one Pod at a time' },
      { value: 'never < 3', label: 'ready Pods, by the rule maxUnavailable 0 (a setting, not a measurement)' },
      { value: 'v1 only', label: 'what customers got while the broken v3 was stuck' },
    ],
    learned: 'The readiness check is the only thing that tells Kubernetes a new version does not work.',
    flows: UPDATE_FLOWS,
  },
  {
    id: 'server',
    tab: 'Lose a server',
    did: 'Stop a whole worker that held 2 of the 3 Pods.',
    happened: 'For about 50 seconds the control plane did not know, because it waits for missing heartbeats, so customers were still sent to dead Pods. Then it replaced the Pods on the other worker. A shorter patience setting (10 s instead of 300 s) made that much faster.',
    stats: [
      { value: '≈ 1,700', label: 'requests lost in the first 50 s, before Kubernetes knew' },
      { value: '18 s vs 295 s', label: 'time on 1 of 3 healthy: short vs default patience' },
      { value: '70 s vs 6 min', label: 'until full capacity again' },
    ],
    learned: 'The damage is done before Kubernetes notices. The patience setting only changes how fast it recovers.',
    flows: SERVER_FLOWS,
  },
  {
    id: 'scale',
    tab: 'Scale under load',
    did: 'Send CPU-heavy requests, with an autoscaler allowed to use 3 to 6 Pods.',
    happened: 'A moderate load pushed CPU above the 50% target, so the autoscaler asked for 5 Pods and CPU settled near 48%. A much heavier load hit the limit of 6 Pods, and CPU stayed about 130%.',
    stats: [
      { value: '3 → 5', label: 'Pods for the moderate load, CPU 74% → 48%' },
      { value: '6 of 6', label: 'the limit, with the heavy load (CPU ≈ 130%)' },
      { value: '0', label: 'failed customer requests in both runs' },
    ],
    learned: 'A limit protects the cost, not the site: at the limit, an alert should tell a person. Only the part of the moderate run before my laptop stalled is used.',
    flows: SCALE_FLOWS,
  },
  {
    id: 'ship',
    tab: 'Protect and ship',
    did: 'Lock the Pod down, close the network, and move a version from staging to prod.',
    happened: 'Seven security checks passed, each next to an unhardened copy. The first network rule blocked customers, which a test found. A new version passed staging, then the same image went to prod; a broken version was stopped in staging.',
    stats: [
      { value: '7 of 7', label: 'security checks (image scan not run)' },
      { value: '12 of 40 → 0', label: 'customers dropped by my own network rule, then fixed' },
      { value: 'same image', label: 'staging and prod run the identical image id' },
    ],
    learned: 'Test the real customer path, not only the Pod that should be blocked.',
  },
];

const chip: React.CSSProperties = {
  padding: '0.3rem 0.7rem', borderRadius: 999, fontSize: '0.74rem', letterSpacing: '0.03em',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.82)',
};

const label: React.CSSProperties = { fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)' };

export default function KubernetesShowcase() {
  const [id, setId] = useState(STORIES[0].id);
  const story = STORIES.find(s => s.id === id) ?? STORIES[0];

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      {/* the setup */}
      <div style={{ ...FROST, borderRadius: 16, padding: '0.8rem 1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 0.6rem' }}>
        <span className="mono" style={label}>The setup</span>
        <span style={chip}>1 control plane</span>
        <span style={chip}>2 workers</span>
        <span style={chip}>3 copies of the app</span>
        <span style={chip}>50 customers a second</span>
        <span style={chip}>on a laptop (kind)</span>
      </div>

      <PillTabs tabs={STORIES.map(s => ({ id: s.id, label: s.tab }))} value={id} onChange={setId} />

      <div key={story.id} style={{ ...FROST, borderRadius: 20, padding: 'clamp(1rem, 3vw, 1.5rem)', marginTop: '1rem', display: 'grid', gap: '1.1rem' }}>
        <div>
          <p className="mono" style={label}>What I did</p>
          <p style={{ fontSize: '0.98rem', lineHeight: 1.6, marginTop: 4 }}>{story.did}</p>
        </div>
        {story.flows && (
          <div>
            <p className="mono" style={{ ...label, marginBottom: '0.6rem' }}>Move the slider to watch it happen</p>
            <ClusterView flows={story.flows} />
          </div>
        )}
        <div>
          <p className="mono" style={label}>What Kubernetes did</p>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.65, marginTop: 4, color: 'rgba(255,255,255,0.82)' }}>{story.happened}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.75rem' }}>
          {story.stats.map(s => (
            <div key={s.label} style={{ borderRadius: 14, padding: '0.9rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="lab-title" style={{ fontSize: 'clamp(1.3rem, 3.2vw, 1.7rem)', fontWeight: 800, color: 'var(--accent)', lineHeight: 1.15, overflowWrap: 'anywhere' }}>{s.value}</p>
              <p style={{ fontSize: '0.8rem', lineHeight: 1.45, marginTop: 6, color: 'rgba(255,255,255,0.7)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, paddingLeft: '0.9rem', borderLeft: '2px solid var(--accent)', color: 'rgba(255,255,255,0.88)' }}>
          <span className="mono" style={{ ...label, display: 'block', marginBottom: 3 }}>What I learned</span>
          {story.learned}
        </p>
      </div>
    </div>
  );
}
