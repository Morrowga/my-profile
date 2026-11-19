'use client';
import { useCallback, useEffect, useState } from 'react';
import type { GithubData } from '@/lib/github-shared';

// Kept for the whole visit: switching between About and GitHub never asks twice.
let cached: GithubData | null = null;

/** Loads the public GitHub profile from /api/github the first time the GitHub view is shown. */
export function useGithub() {
  const [data, setData] = useState<GithubData | null>(cached);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cached) return;
    const controller = new AbortController();
    fetch('/api/github', { signal: controller.signal })
      .then(async res => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((body as { error?: string }).error ?? 'GitHub is not answering right now.');
        return body as GithubData;
      })
      .then(d => { cached = d; setData(d); })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'GitHub is not answering right now.'); });
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => { setError(null); setAttempt(a => a + 1); }, []);
  return { data, error, retry };
}
