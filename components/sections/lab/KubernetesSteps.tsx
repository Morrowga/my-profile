'use client';
import StepsTree, { type Branch } from './StepsTree';

/**
 * "How it works" for the Kubernetes experiment: how it is built, how it was broken on purpose, how it is protected and shipped.
 * The numbers come from the experiment repo (a few runs each, on an 8 GB laptop) and can change.
 */
const BRANCHES: Branch[] = [
  {
    id: 'built',
    title: 'How it is built',
    hint: 'The pieces of a cluster',
    steps: [
      {
        title: 'A control plane decides',
        text: 'The brain. Its front door (the API server) takes every request and keeps the cluster’s state in a small database (etcd). Controllers keep what you asked for equal to what exists.',
        example: { label: 'You ask for', value: '3 copies, and the controllers create them' },
      },
      {
        title: 'Workers do the work',
        text: 'Each worker runs an agent that starts the containers the brain assigns and reports back every few seconds. The brain cannot log in to a worker: it can only notice silence.',
        example: { label: 'My cluster', value: '1 control plane + 2 workers (kind, on a laptop)' },
      },
      {
        title: 'A Deployment keeps 3 copies',
        text: 'A Pod is one running copy of the app. The Deployment says how many should exist and starts a new one when a copy disappears.',
        example: { label: 'Delete a Pod', value: 'a new one is ready in 6.4 s (median)' },
      },
      {
        title: 'A Service and two health checks',
        text: 'One stable address sends customers only to Pods that say they are ready. “Not ready” takes a Pod out of the line; “not alive” restarts it.',
        example: { label: 'A sick Pod', value: 'out of the line in 1.5 s, not restarted' },
      },
    ],
  },
  {
    id: 'broken',
    title: 'How it was broken',
    hint: 'Each failure on purpose, with customers still coming',
    steps: [
      {
        title: 'Kill a Pod',
        text: 'Delete one of the 3 copies. It stops getting customers before it stops running, so nothing is lost.',
        example: { label: 'Failed requests', value: '0 in 5 runs' },
      },
      {
        title: 'Crash the app',
        text: 'Kill the process inside a Pod. The agent restarts it in the same Pod, but the Service needs about a second to notice.',
        example: { label: 'Failed requests', value: 'about 7 (median of 5 runs)' },
      },
      {
        title: 'Lose a whole server',
        text: 'Stop a worker that holds 2 of the 3 Pods. For about 50 seconds nothing knows, then the Pods are replaced on the other worker. A shorter patience setting makes the recovery much faster.',
        example: { label: 'Time on 1 of 3 healthy', value: '18 s tuned, 295 s default' },
      },
      {
        title: 'Update, then update badly',
        text: 'A rolling update starts a new Pod and waits until it is ready before it stops an old one. A broken version never becomes ready, so customers stay on the old one.',
        example: { label: 'The rule', value: 'never fewer than 3 ready Pods' },
      },
    ],
  },
  {
    id: 'safe',
    title: 'How it is protected and shipped',
    hint: 'Load, security, network, release',
    steps: [
      {
        title: 'Scale under load',
        text: 'An autoscaler watches CPU and adds Pods up to a limit of 6, then removes them when it is quiet again.',
        example: { label: 'A moderate load', value: '3 → 5 Pods, CPU 74% → 48%' },
      },
      {
        title: 'Lock the Pod down',
        text: 'A non-root user, a read-only disk, no extra Linux powers, no API token, and a namespace that refuses unsafe Pods. Each check is shown next to an unhardened copy.',
        example: { label: 'Checks passed', value: '7 of 7 (image scan not run)' },
      },
      {
        title: 'Close the network',
        text: 'Deny all incoming traffic, then allow only what is needed. My first rule blocked about a third of real customers, because the network’s tunnel hid the servers’ addresses. The test found it.',
        example: { label: 'Customers answered', value: '28 of 40 → 60 of 60 after the fix' },
      },
      {
        title: 'Staging before prod',
        text: 'A version goes to staging first and must pass 20 checks. Only then the same image is promoted to prod. A broken version is stopped in staging and prod is never touched.',
        example: { label: 'A broken v3', value: 'stopped in staging, prod untouched' },
      },
    ],
  },
];

export default function KubernetesSteps() {
  return (
    <StepsTree
      goal={{ title: 'Keep an app online while things break', text: 'Three branches of four steps: how it is built, how it was broken, and how it is protected and shipped.' }}
      branches={BRANCHES}
      note="The numbers are from a few runs each, on an 8 GB laptop, and are not production figures. AWS and a CI/CD server are not part of this experiment."
    />
  );
}
