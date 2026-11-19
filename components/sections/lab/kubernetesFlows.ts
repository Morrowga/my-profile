import type { Flow, Frame, Pod, PodState, Readout } from './ClusterView';

/**
 * The moments of each test, for the slider in ClusterView.
 * Written by hand from the real runs of the experiment (kubernetes-deployment-experiment): the timings are the measured ones
 * (a median where several runs were made) and the numbers are the ones in the results. Where a moment is a rule and not a
 * measurement (the update), the text says so.
 */
const p = (id: string, w: 1 | 2, slot: 0 | 1 | 2, state: PodState, extra: Partial<Pod> = {}): Pod => ({ id, w, slot, state, ...extra });
const r = (label: string, value: string, tone?: Readout['tone']): Readout => ({ label, value, tone });
const UP: Frame['workers'] = ['up', 'up'];

/* ───────── delete a Pod ───────── */

const three = [p('1', 1, 0, 'ready'), p('2', 1, 1, 'ready'), p('3', 2, 0, 'ready')];

export const DELETE_FLOWS: Flow[] = [{
  id: 'delete', label: 'Delete a Pod',
  frames: [
    { at: 'Before', title: 'Three copies serve the customers', text: 'The Service spreads the requests over the three Pods.', workers: UP, pods: three,
      readouts: [r('Healthy', '3 of 3', 'good'), r('Customers failing', '0', 'good')] },
    { at: 'You delete Pod 2', title: 'Pod 2 leaves the line first', text: 'The Service stops sending customers to Pod 2 before it stops. The Deployment sees 2 copies instead of 3 and starts Pod 4.', workers: UP,
      pods: [p('1', 1, 0, 'ready'), p('2', 1, 1, 'stopping'), p('3', 2, 0, 'ready'), p('4', 2, 1, 'starting')],
      readouts: [r('Healthy', '2 of 3', 'warn'), r('Customers failing', '0', 'good')] },
    { at: 'About 6 s later (median)', title: 'Back to three', text: 'Pod 4 is ready and Pod 2 is gone. Pod 4 has a new name: a deleted Pod is replaced, not repaired.', workers: UP,
      pods: [p('1', 1, 0, 'ready'), p('3', 2, 0, 'ready'), p('4', 2, 1, 'ready')],
      readouts: [r('Healthy', '3 of 3', 'good'), r('Customers failing', '0 (5 runs)', 'good'), r('New Pod ready after', '6.4 s (median)')] },
  ],
}];

/* ───────── crash the app ───────── */

export const CRASH_FLOWS: Flow[] = [{
  id: 'crash', label: 'Crash the app',
  frames: [
    { at: 'Before', title: 'Three copies serve the customers', text: 'Everything is normal.', workers: UP, pods: three,
      readouts: [r('Healthy', '3 of 3', 'good'), r('Customers failing', '0', 'good')] },
    { at: 'You kill the app in Pod 2', title: 'Nobody knows yet', text: 'The process inside Pod 2 dies. For about a second the Service still sends customers to it, and those requests fail.', workers: UP,
      pods: [p('1', 1, 0, 'ready'), p('2', 1, 1, 'dead', { routed: true, note: 'crashed' }), p('3', 2, 0, 'ready')],
      readouts: [r('The Service thinks', '3 of 3', 'warn'), r('Customers failing', 'a few (about 7)', 'bad')] },
    { at: 'About 1 s later', title: 'Kubernetes notices', text: 'The Service stops sending customers to Pod 2. The agent on that worker restarts the container inside the same Pod.', workers: UP,
      pods: [p('1', 1, 0, 'ready'), p('2', 1, 1, 'restarting'), p('3', 2, 0, 'ready')],
      readouts: [r('Healthy', '2 of 3', 'warn'), r('Customers failing', '0', 'good'), r('Restarts of Pod 2', '1')] },
    { at: 'About 5 s later (median)', title: 'Same Pod, running again', text: 'A crash restarts the container; it does not replace the Pod, so the name stays the same.', workers: UP, pods: three,
      readouts: [r('Healthy', '3 of 3', 'good'), r('Back to 3 healthy after', '4.7 s (median of 5)')] },
    { at: 'If it crashes again soon', title: 'Kubernetes waits longer each time', text: 'After repeated crashes it waits before each restart (the restart back-off, shown as CrashLoopBackOff). The second recovery was slower.', workers: UP,
      pods: [p('1', 1, 0, 'ready'), p('2', 1, 1, 'restarting', { note: 'waiting' }), p('3', 2, 0, 'ready')],
      readouts: [r('Healthy', '2 of 3', 'warn'), r('Second recovery', '14.9 s (median of 3)', 'warn')] },
  ],
}];

/* ───────── update, then a broken update ───────── */

const v = (id: string, w: 1 | 2, slot: 0 | 1 | 2, state: PodState, version: string) => p(id, w, slot, state, { v: version });

export const UPDATE_FLOWS: Flow[] = [{
  id: 'update', label: 'Update and a broken update',
  frames: [
    { at: 'Before', title: 'Three copies of v1', text: 'Customers get v1.', workers: UP,
      pods: [v('1', 1, 0, 'ready', 'v1'), v('2', 1, 1, 'ready', 'v1'), v('3', 2, 0, 'ready', 'v1')],
      readouts: [r('Ready Pods', '3', 'good'), r('Customers get', 'v1')] },
    { at: 'You roll out v2', title: 'A new Pod starts first', text: 'The rule is: start a new Pod, wait until it is ready, and only then stop an old one. Nothing old is stopped yet.', workers: UP,
      pods: [v('1', 1, 0, 'ready', 'v1'), v('2', 1, 1, 'ready', 'v1'), v('3', 2, 0, 'ready', 'v1'), v('4', 2, 1, 'starting', 'v2')],
      readouts: [r('Ready Pods', '3', 'good'), r('Customers get', 'v1')] },
    { at: 'Step 1 done', title: 'v2 is ready, so one v1 stops', text: 'Pod 4 answered "ready", so Pod 1 can stop and the next v2 Pod starts. For a few seconds both versions serve customers.', workers: UP,
      pods: [v('1', 1, 0, 'stopping', 'v1'), v('2', 1, 1, 'ready', 'v1'), v('3', 2, 0, 'ready', 'v1'), v('4', 2, 1, 'ready', 'v2'), v('5', 2, 2, 'starting', 'v2')],
      readouts: [r('Ready Pods', '3', 'good'), r('Customers get', 'v1 and v2')] },
    { at: 'Step 2 done', title: 'The same again', text: 'Pod 5 is ready, so Pod 2 stops and the last v2 Pod starts.', workers: UP,
      pods: [v('2', 1, 1, 'stopping', 'v1'), v('3', 2, 0, 'ready', 'v1'), v('4', 2, 1, 'ready', 'v2'), v('5', 2, 2, 'ready', 'v2'), v('6', 1, 0, 'starting', 'v2')],
      readouts: [r('Ready Pods', '3', 'good'), r('Customers get', 'v1 and v2')] },
    { at: 'Step 3 done', title: 'The last v1 stops', text: 'Pod 6 is ready, so the last old Pod, Pod 3, can stop.', workers: UP,
      pods: [v('3', 2, 0, 'stopping', 'v1'), v('4', 2, 1, 'ready', 'v2'), v('5', 2, 2, 'ready', 'v2'), v('6', 1, 0, 'ready', 'v2')],
      readouts: [r('Ready Pods', '3', 'good'), r('Customers get', 'v2')] },
    { at: 'Update done', title: 'Three copies of v2', text: 'There were never fewer than 3 ready Pods. That is the rule (maxUnavailable 0); it is a setting, not a measurement.', workers: UP,
      pods: [v('4', 2, 1, 'ready', 'v2'), v('5', 2, 2, 'ready', 'v2'), v('6', 1, 0, 'ready', 'v2')],
      readouts: [r('Ready Pods', '3', 'good'), r('Customers get', 'v2')] },
    { at: 'You roll out a broken v3', title: 'The new Pod never says ready', text: 'Pod 7 starts, but the app inside never answers "ready".', workers: UP,
      pods: [v('4', 2, 1, 'ready', 'v2'), v('5', 2, 2, 'ready', 'v2'), v('6', 1, 0, 'ready', 'v2'), v('7', 1, 1, 'stuck', 'v3')],
      readouts: [r('Ready Pods', '3 of 4', 'warn'), r('Customers get', 'v2')] },
    { at: '30 s later', title: 'The update is stuck, customers are safe', text: 'Kubernetes does not stop any old Pod, because the new one is not ready. Customers keep getting the old version. Someone has to roll back.', workers: UP,
      pods: [v('4', 2, 1, 'ready', 'v2'), v('5', 2, 2, 'ready', 'v2'), v('6', 1, 0, 'ready', 'v2'), v('7', 1, 1, 'stuck', 'v3')],
      readouts: [r('Ready Pods', '3 of 4', 'warn'), r('Customers get', 'v2 only', 'good')] },
    { at: 'You roll back', title: 'Back to the working version', text: 'The broken Pod is removed and there are three ready Pods again.', workers: UP,
      pods: [v('4', 2, 1, 'ready', 'v2'), v('5', 2, 2, 'ready', 'v2'), v('6', 1, 0, 'ready', 'v2')],
      readouts: [r('Ready Pods', '3', 'good'), r('Customers get', 'v2')] },
  ],
}];

/* ───────── lose a whole server ───────── */

const onTwo = [p('1', 2, 0, 'ready'), p('2', 2, 1, 'ready'), p('3', 1, 0, 'ready')];
const gone = (id: string, slot: 0 | 1 | 2, routed = false): Pod => p(id, 2, slot, 'dead', { note: 'unreachable', routed });

const serverStart: Frame[] = [
  { at: 'Before', title: 'Two Pods on Worker 2, one on Worker 1', text: 'Everything is normal.', workers: UP, pods: onTwo,
    readouts: [r('Healthy', '3 of 3', 'good'), r('Customers failing', '0', 'good')] },
  { at: 'You stop Worker 2', title: 'A whole server disappears', text: 'Two of the three Pods are on it. The control plane cannot log in to ask: it can only notice that the heartbeats stop.', workers: ['up', 'silent'],
    pods: [gone('1', 0, true), gone('2', 1, true), p('3', 1, 0, 'ready')],
    readouts: [r('The control plane thinks', '3 of 3', 'warn'), r('Customers failing', 'about 65%', 'bad')] },
  { at: 'About 40 s of silence', title: 'Nobody knows yet', text: 'The control plane waits for missing heartbeats before it believes the server is gone. The Service still sends customers to the dead Pods. This stretch cost about 1,700 requests in the run.', workers: ['up', 'silent'],
    pods: [gone('1', 0, true), gone('2', 1, true), p('3', 1, 0, 'ready')],
    readouts: [r('The control plane thinks', '3 of 3', 'warn'), r('Customers failing', 'about 65%', 'bad'), r('Lost in this stretch', 'about 1,700 requests', 'bad')] },
  { at: 'About 50 s: it notices', title: 'The server is marked NotReady', text: 'The Service stops sending customers to the dead Pods, so the failures stop. One Pod now serves everyone.', workers: ['up', 'notready'],
    pods: [gone('1', 0), gone('2', 1), p('3', 1, 0, 'ready')],
    readouts: [r('Healthy', '1 of 3', 'warn'), r('Customers failing', '0', 'good')] },
];

const afterSwap = (ghosts: boolean): Pod[] => [
  ...(ghosts ? [gone('1', 0), gone('2', 1)] : []),
  p('3', 1, 0, 'ready'), p('4', 1, 1, 'ready'), p('5', 1, 2, 'ready'),
];
const spread = [p('6', 1, 0, 'ready'), p('7', 1, 1, 'ready'), p('8', 2, 0, 'ready')];

export const SERVER_FLOWS: Flow[] = [
  {
    id: 'tuned', label: 'Short patience (10 s)',
    frames: [
      ...serverStart,
      { at: 'About 70 s: replaced', title: 'Two new Pods on Worker 1', text: 'After the 10 s patience, Kubernetes gave up on the dead Pods and started replacements on the other worker. The dead ones stay listed as "Terminating" until the server returns.', workers: ['up', 'notready'],
        pods: afterSwap(true), readouts: [r('Healthy', '3 of 3', 'good'), r('Time on 1 of 3', 'about 18 s', 'warn'), r('Full capacity after', 'about 70 s')] },
      { at: 'You start Worker 2 again', title: 'It comes back empty', text: 'The old Pods are cleaned up. Nothing moves back by itself, so all three Pods stay on Worker 1.', workers: UP,
        pods: afterSwap(false), readouts: [r('Healthy', '3 of 3', 'good'), r('Worker 2', 'back, with no Pods', 'warn')] },
      { at: 'Rolling restart', title: 'The Pods spread out again', text: 'Pods are replaced one at a time and land on both workers again.', workers: UP,
        pods: spread, readouts: [r('Healthy', '3 of 3', 'good'), r('Pods on', 'both workers', 'good')] },
    ],
  },
  {
    id: 'default', label: 'Default patience (300 s)',
    frames: [
      ...serverStart,
      { at: 'About 1 to 5 minutes', title: 'Still one Pod', text: 'The Pods wait out the default patience of 300 seconds before Kubernetes gives up on them. The app runs on a single Pod for about five minutes.', workers: ['up', 'notready'],
        pods: [gone('1', 0), gone('2', 1), p('3', 1, 0, 'ready')], readouts: [r('Healthy', '1 of 3', 'warn'), r('Time on 1 of 3', 'about 295 s', 'warn')] },
      { at: 'About 6 minutes: replaced', title: 'Two new Pods on Worker 1', text: 'Only now does Kubernetes replace the dead Pods.', workers: ['up', 'notready'],
        pods: afterSwap(true), readouts: [r('Healthy', '3 of 3', 'good'), r('Full capacity after', 'about 6 minutes')] },
      { at: 'Worker back, then restart', title: 'The Pods spread out again', text: 'Worker 2 returns empty. A rolling restart spreads the Pods over both workers, and no customer was lost in that step.', workers: UP,
        pods: spread, readouts: [r('Healthy', '3 of 3', 'good'), r('Customers lost in this step', '0', 'good')] },
    ],
  },
];

/* ───────── scale under load ───────── */

const base3 = [p('1', 1, 0, 'ready'), p('2', 1, 1, 'ready'), p('3', 2, 0, 'ready')];
const pod = (n: 3 | 4 | 5 | 6, startingFrom?: number): Pod[] => {
  const all = [p('1', 1, 0, 'ready'), p('2', 1, 1, 'ready'), p('3', 2, 0, 'ready'), p('4', 1, 2, 'ready'), p('5', 2, 1, 'ready'), p('6', 2, 2, 'ready')];
  return all.slice(0, n).map((x, i) => (startingFrom !== undefined && i >= startingFrom ? { ...x, state: 'starting' as PodState } : x));
};
const cpu = (value: string, wants: string, tone?: Readout['tone']): Readout[] => [r('Average CPU', value, tone), r('Pods wanted', wants), r('Customers failing', '0', 'good')];

export const SCALE_FLOWS: Flow[] = [
  {
    id: 'moderate', label: 'Moderate load',
    frames: [
      { at: 'Quiet', title: 'Three Pods, little to do', text: 'The autoscaler may use 3 to 6 Pods and aims for 50% CPU.', workers: UP, pods: base3, readouts: cpu('about 15%', '3', 'good') },
      { at: '5 s: heavy requests start', title: 'CPU has not moved yet', text: '3 requests a second that each burn 25 ms of CPU. The CPU number lags by about 30 seconds.', workers: UP, pods: base3, readouts: cpu('about 15%', '3', 'good') },
      { at: '35 s', title: 'Rising, still under the target', text: 'CPU is 29%, below 50%, so the autoscaler waits.', workers: UP, pods: base3, readouts: cpu('29%', '3', 'good') },
      { at: 'About 40 s', title: 'CPU is 74%: it asks for 5 Pods', text: '3 × 74 ÷ 50 is 4.4, rounded up to 5. Two new Pods start.', workers: UP, pods: pod(5, 3), readouts: cpu('74%', '5', 'warn') },
      { at: 'About 45 s', title: 'Five Pods are ready', text: 'The work is shared over five Pods now.', workers: UP, pods: pod(5), readouts: cpu('74%', '5', 'warn') },
      { at: 'About 85 s', title: 'Balanced', text: 'CPU is back near the 50% target.', workers: UP, pods: pod(5), readouts: cpu('49%', '5', 'good') },
      { at: 'About 150 s', title: 'Five of the six allowed Pods', text: 'It found a balance below the limit. No customer request failed while it scaled up.', workers: UP, pods: pod(5), readouts: cpu('46%', '5 (limit 6)', 'good') },
    ],
  },
  {
    id: 'heavy', label: 'Heavy load',
    frames: [
      { at: 'Quiet', title: 'Three Pods, little to do', text: 'Same setup: 3 to 6 Pods, a 50% CPU target.', workers: UP, pods: base3, readouts: cpu('about 13%', '3', 'good') },
      { at: '25 s', title: 'CPU 79%: it asks for 5 Pods', text: '10 requests a second that each burn 40 ms of CPU, four times the work of the moderate load.', workers: UP, pods: pod(5, 3), readouts: cpu('79%', '5', 'warn') },
      { at: '30 s', title: 'Five Pods are ready', text: 'But the load is still bigger than five Pods can carry.', workers: UP, pods: pod(5), readouts: cpu('79%', '5', 'warn') },
      { at: '40 s', title: 'CPU 160%: it asks for 6', text: 'The sixth Pod starts.', workers: UP, pods: pod(6, 5), readouts: cpu('160%', '6', 'bad') },
      { at: '45 s', title: 'Six Pods: the limit', text: 'This is the most the autoscaler is allowed to use.', workers: UP, pods: pod(6), readouts: cpu('160%', '6 (limit)', 'bad') },
      { at: '55 s', title: 'CPU peaks at 225%', text: 'New Pods take time to warm up, while the requests keep coming.', workers: UP, pods: pod(6), readouts: cpu('225%', '6 (limit)', 'bad') },
      { at: '100 to 150 s', title: 'Stuck at the limit', text: 'CPU stays about 130%, far above the 50% target, but the limit stops it. Customers were still served here. In a real system, an alert should tell a person that the limit is reached.', workers: UP, pods: pod(6), readouts: cpu('about 130%', '6 (limit)', 'bad') },
    ],
  },
];
