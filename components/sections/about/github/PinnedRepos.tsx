import { BookMarked } from 'lucide-react';
import type { Pinned } from '@/lib/github-shared';

/** My pinned repositories, in the same cards GitHub shows (the whole card opens the repository). */
export default function PinnedRepos({ pinned }: { pinned: Pinned[] }) {
  return (
    <section aria-label="Pinned repositories">
      <h3 className="lab-title" style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>Pinned</h3>
      <div className="gh-pinned">
        {pinned.map(p => (
          <a key={p.url} className="gh-repo" href={p.url} target="_blank" rel="noopener noreferrer">
            <span className="gh-repo-top">
              <BookMarked size={16} aria-hidden="true" style={{ flex: '0 0 auto', color: 'rgba(255,255,255,0.55)' }} />
              <span className="gh-repo-name">{p.name}</span>
              <span className="gh-pill">Public</span>
            </span>
            <span className="gh-repo-desc">{p.description}</span>
            {p.language && (
              <span className="gh-repo-lang">
                <span className="gh-dot" style={{ background: p.color ?? '#8b949e' }} aria-hidden="true" />
                {p.language}
              </span>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
