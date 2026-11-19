/** What the browser and the server both need to know about the GitHub profile (no server code here, so it is safe in the browser). */
export const GITHUB_USER = 'Morrowga';

export type Level = 0 | 1 | 2 | 3 | 4;
export type Day = { date: string; count: number; level: Level };
export type Achievement = { name: string; image: string; times: number };
export type Pinned = { name: string; url: string; description: string | null; language: string | null; color: string | null };
export type GithubData = {
  user: { login: string; name: string | null; avatar: string; bio: string | null; followers: number; following: number; url: string };
  achievements: Achievement[];
  pinned: Pinned[];
  /** The days of the current calendar year, up to today */
  contributions: { year: number; total: number; days: Day[] };
};
