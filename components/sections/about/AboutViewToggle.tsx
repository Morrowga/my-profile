'use client';
import { User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAboutView } from '@/store/slices/navigationSlice';
import GitHubMark from './github/GitHubMark';

/** Beside the Back button on the About page: swaps the page between About and the GitHub profile. */
export default function AboutViewToggle() {
  const dispatch = useAppDispatch();
  const view = useAppSelector(s => s.navigation.aboutView);
  const onGithub = view === 'github';

  return (
    <button
      type="button"
      onClick={() => dispatch(setAboutView(onGithub ? 'about' : 'github'))}
      className="mono"
      aria-label={onGithub ? 'Show the About page' : 'Show my GitHub profile'}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.55rem 0.9rem',
        background: 'rgba(5,5,8,0.55)', backdropFilter: 'blur(8px)',
        border: `1px solid ${onGithub ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 999,
        color: 'var(--text)', fontSize: '0.72rem', letterSpacing: '0.14em',
        textTransform: 'uppercase', cursor: 'pointer',
      }}
    >
      {onGithub ? <User size={14} /> : <GitHubMark size={14} />}
      <span>{onGithub ? 'About' : 'GitHub'}</span>
    </button>
  );
}
