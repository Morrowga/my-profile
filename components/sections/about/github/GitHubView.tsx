'use client';
import { RotateCcw } from 'lucide-react';
import { FROST } from '@/lib/styles';
import { GITHUB_USER } from '@/lib/github-shared';
import ContributionGraph from './ContributionGraph';
import PinnedRepos from './PinnedRepos';
import ProfileCard from './ProfileCard';
import { useGithub } from './useGithub';

const num = (n: number) => n.toLocaleString('en-US');
function Skeleton() {
  const bar = (w: string, h: number): React.CSSProperties => ({ width: w, height: h, borderRadius: 6, background: 'rgba(255,255,255,0.09)' });
  return (
    <div className="gh-grid skeleton" role="status" aria-label="Loading my GitHub profile">
      <div className="gh-profile">
        <div className="gh-head">
          <div className="gh-avatar" style={{ background: 'rgba(255,255,255,0.09)', border: 0 }} />
          <div style={{ display: 'grid', gap: 10, minWidth: 0 }}><span style={bar('70%', 22)} /><span style={bar('40%', 14)} /></div>
        </div>
        <span style={bar('100%', 36)} />
        <div style={{ display: 'grid', gap: 12 }}><span style={bar('60%', 12)} /><span style={bar('75%', 12)} /><span style={bar('50%', 12)} /></div>
      </div>
      <div style={{ ...FROST, borderRadius: 16, padding: '1.1rem', display: 'grid', gap: '1rem', alignContent: 'start' }}>
        <span style={bar('45%', 20)} />
        <span style={bar('100%', 118)} />
      </div>
    </div>
  );
}

/** The About page's GitHub view: shows my public GitHub profile in the layout GitHub itself uses (without the pinned projects). */
export default function GitHubView() {
  const { data, error, retry } = useGithub();

  return (
    <section className="gh-view" aria-label="My GitHub profile">
      <p className="mono" style={{ color: 'var(--accent)', fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '1rem' }}>
        GitHub
      </p>

      {!data && !error && <Skeleton />}

      {error && !data && (
        <div style={{ ...FROST, borderRadius: 16, padding: '2rem 1.25rem', textAlign: 'center', maxWidth: 520 }}>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>Could not load my GitHub profile</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 16 }}>{error}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={retry} className="gh-open" style={{ width: 'auto', padding: '0.5rem 1.1rem' }}><RotateCcw size={14} /> Try again</button>
            <a className="gh-open" href={`https://github.com/${GITHUB_USER}`} target="_blank" rel="noopener noreferrer" style={{ width: 'auto', padding: '0.5rem 1.1rem' }}>Open GitHub</a>
          </div>
        </div>
      )}

      {data && (
        <div className="gh-grid">
          <ProfileCard data={data} />
          {/* minmax(0, 1fr): the column is as wide as the screen allows, and the 53-week graph scrolls inside its own box instead of widening the page */}
          <div style={{ minWidth: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1rem', alignContent: 'start' }}>
            {data.pinned?.length > 0 && <PinnedRepos pinned={data.pinned} />}
            <div style={{ ...FROST, borderRadius: 16, padding: 'clamp(0.9rem, 2.5vw, 1.3rem)' }}>
              <h3 className="lab-title" style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>
                {num(data.contributions.total)} contributions in {data.contributions.year}
              </h3>
              <ContributionGraph days={data.contributions.days} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
