'use client';
import { motion } from 'framer-motion';
import { FROST } from '@/lib/styles';

/**
 * GitHub issues I solved. Add one object per issue:
 *   issue    — the issue name / title
 *   repo     — link to the repository, e.g. 'https://github.com/owner/repo'
 *   issueUrl — link to the issue
 *   prUrl    — (optional) link to my pull request
 */
type Problem = { id: string; issue: string; repo: string; issueUrl: string; prUrl?: string };

const PROBLEMS: Problem[] = [
  {
    id: 'traverse-1361',
    issue: 'Minimal TypeScript consume example for traverse-embedder-web',
    repo: 'https://github.com/traverse-framework/traverse',
    issueUrl: 'https://github.com/traverse-framework/traverse/issues/1361',
    prUrl: 'https://github.com/traverse-framework/traverse/pull/1375',
  },
  {
    id: 'planarity-85',
    issue: 'draw() renders ghost circles, false edge-crossings, and flipped orientation',
    repo: 'https://github.com/graph-algorithms/planarity',
    issueUrl: 'https://github.com/graph-algorithms/planarity/issues/85',
    prUrl: 'https://github.com/graph-algorithms/planarity/pull/86',
  },
  {
    id: 'planarity-87',
    issue: 'Need better control of draw() image output',
    repo: 'https://github.com/graph-algorithms/planarity',
    issueUrl: 'https://github.com/graph-algorithms/planarity/issues/87',
    prUrl: 'https://github.com/graph-algorithms/planarity/pull/93',
  },
  {
    id: 'planarity-92',
    issue: 'Express API: draw() should center labels',
    repo: 'https://github.com/graph-algorithms/planarity',
    issueUrl: 'https://github.com/graph-algorithms/planarity/issues/92',
    prUrl: 'https://github.com/graph-algorithms/planarity/pull/96',
  },
  {
    id: 'rest-api-41',
    issue: '[bug] Numeric columns emit invalid JSON (nan/inf/hex-float) as bare tokens',
    repo: 'https://github.com/LAA-Software-Engineering/ultra-minimal-fast-rest-api',
    issueUrl: 'https://github.com/LAA-Software-Engineering/ultra-minimal-fast-rest-api/issues/41',
  },
  {
    id: 'hflow-540',
    issue: 'Repeated critical-check failures leave an episode marked ok after an intervening success',
    repo: 'https://github.com/Hebbian-Robotics/hflow',
    issueUrl: 'https://github.com/Hebbian-Robotics/hflow/issues/540',
  },
  {
    id: 'cubic-589',
    issue: '[Bug]: VM instances can be created with unusable CPU, memory and disk sizes',
    repo: 'https://github.com/cubic-vm/cubic',
    issueUrl: 'https://github.com/cubic-vm/cubic/issues/589',
  },
  {
    id: 'teamai-585',
    issue: 'pull / init --agent silently claim success while writing nothing',
    repo: 'https://github.com/Tencent/teamai-cli',
    issueUrl: 'https://github.com/Tencent/teamai-cli/issues/585',
  },
];

export const PROBLEM_COUNT = PROBLEMS.length;

/** 'https://github.com/owner/repo' -> 'owner/repo' */
const repoLabel = (url: string) => url.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '');
/** '.../issues/585' -> '#585' */
const numberLabel = (url: string) => '#' + url.replace(/\/$/, '').split('/').pop();

const CHIP: React.CSSProperties = {
  padding: '0.3rem 0.7rem', borderRadius: 4,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  fontSize: '0.7rem', letterSpacing: '0.04em', textDecoration: 'none',
};

function GitHubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export default function ProblemSolving() {
  if (PROBLEMS.length === 0) {
    return (
      <div style={{ ...FROST, borderStyle: 'dashed', borderRadius: 14, padding: '2rem', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.7 }}>
        Solved GitHub issues are coming soon.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '1.25rem' }}>
      {PROBLEMS.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: i * 0.08 }}
          style={{ ...FROST, borderRadius: 14, padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--accent)', marginTop: 3, flexShrink: 0 }}><GitHubMark /></span>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 700, lineHeight: 1.45, color: '#fff' }}>
              {p.issue}
            </h3>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <a href={p.repo} target="_blank" rel="noopener noreferrer" className="mono" style={{ ...CHIP, color: 'var(--accent)' }}>
              {repoLabel(p.repo)} ↗
            </a>
            <a href={p.issueUrl} target="_blank" rel="noopener noreferrer" className="mono" style={{ ...CHIP, color: 'rgba(255,255,255,0.78)' }}>
              Issue {numberLabel(p.issueUrl)} ↗
            </a>
            {p.prUrl && (
              <a href={p.prUrl} target="_blank" rel="noopener noreferrer" className="mono" style={{ ...CHIP, color: 'rgba(255,255,255,0.78)' }}>
                PR {numberLabel(p.prUrl)} ↗
              </a>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
