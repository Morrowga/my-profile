import { ArrowUpRight, Users } from 'lucide-react';
import type { GithubData } from '@/lib/github-shared';

/** The left column of the GitHub view: photo, name, followers and achievements. */
export default function ProfileCard({ data }: { data: GithubData }) {
  const { user, achievements } = data;
  return (
    <aside className="gh-profile">
      <div className="gh-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="gh-avatar" src={user.avatar} alt={`${user.name ?? user.login} on GitHub`} width={296} height={296} />
        <div style={{ minWidth: 0 }}>
          <h2 className="lab-title gh-name">{user.name ?? user.login}</h2>
          <p className="gh-login">{user.login}</p>
        </div>
      </div>

      {user.bio && <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>{user.bio}</p>}

      <a className="gh-open" href={user.url} target="_blank" rel="noopener noreferrer">
        View on GitHub <ArrowUpRight size={15} aria-hidden="true" />
      </a>

      <p className="gh-row">
        <span className="gh-row-icon" aria-hidden="true"><Users size={16} /></span>
        <span><strong>{user.followers}</strong> followers <span aria-hidden="true">·</span> <strong>{user.following}</strong> following</span>
      </p>

      {achievements.length > 0 && (
        <div className="gh-section">
          <h3 className="lab-title" style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.7rem' }}>Achievements</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem' }}>
            {achievements.map(a => (
              <span key={a.name} className="gh-badge" title={a.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.image} alt={a.name} width={56} height={56} loading="lazy" />
                {a.times > 1 && <span className="gh-times">x{a.times}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
