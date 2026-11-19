/**
 * Server only. Reads the PUBLIC GitHub profile of the site's owner: no secret key and no login.
 *   - api.github.com/users/<name>                     name, avatar, bio, followers
 *   - github.com/users/<name>/contributions?from&to   one cell per day of the CURRENT calendar year (GitHub's own calendar)
 *   - github.com/<name>                               the achievement badges and the pinned repositories
 * The answer is kept for an hour, so visitors never reach GitHub directly (and its rate limit is no worry).
 * The calendar, the badges and the pinned repositories are read from GitHub's HTML; if GitHub changes it, only the pieces
 * that can no longer be read are left out (the profile and the graph fail on their own, badges and pins simply disappear).
 */
import { GITHUB_USER, type Achievement, type Day, type GithubData, type Level, type Pinned } from './github-shared';

const TTL_MS = 60 * 60 * 1000;
let cache: { at: number; data: GithubData } | null = null;

const HEADERS = { 'User-Agent': 'portfolio-site', 'Accept-Language': 'en' };

async function get(url: string, accept: string): Promise<Response> {
  const res = await fetch(url, { headers: { ...HEADERS, Accept: accept }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res;
}
const json = async <T>(url: string) => (await get(url, 'application/vnd.github+json')).json() as Promise<T>;
const text = async (url: string) => (await get(url, 'text/html')).text();

type ApiUser = { login: string; name: string | null; avatar_url: string; bio: string | null; followers: number; following: number; html_url: string };

/** Turns &amp; &quot; &#39; and the like back into plain text. */
const decode = (s: string) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/**
 * The calendar: every <td data-date data-level> is one day, and a <tool-tip for="that td's id"> says how many contributions.
 * GitHub also lists the days of the year that have not happened yet; `until` (YYYY-MM-DD) leaves those out.
 */
export function parseContributions(html: string, until?: string): { total: number; days: Day[] } {
  const tips = new Map<string, string>();
  for (const m of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) tips.set(m[1], m[2].trim());

  const days: Day[] = [];
  for (const m of html.matchAll(/<td\b[^>]*\bdata-date="(\d{4}-\d{2}-\d{2})"[^>]*>/g)) {
    if (until && m[1] > until) continue;
    const id = /\bid="([^"]+)"/.exec(m[0])?.[1];
    const level = Number(/\bdata-level="(\d)"/.exec(m[0])?.[1] ?? 0);
    const count = Number(/^(\d+)\s+contribution/.exec((id && tips.get(id)) || '')?.[1] ?? 0);
    days.push({ date: m[1], count, level: (level >= 0 && level <= 4 ? level : 0) as Level });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  return { total: days.reduce((sum, d) => sum + d.count, 0), days };
}

/** The badges in the sidebar: <img class="achievement-badge-sidebar" alt="Achievement: Pull Shark" src="..."> and, next to it, a label like "x2". */
export function parseAchievements(html: string): Achievement[] {
  const found = new Map<string, Achievement>();
  for (const m of html.matchAll(/<img\b[^>]*achievement-badge-sidebar[^>]*>/g)) {
    const alt = /\balt="Achievement:\s*([^"]+)"/.exec(m[0])?.[1];
    const src = /\bsrc="([^"]+)"/.exec(m[0])?.[1];
    if (!alt || !src || found.has(alt)) continue;
    const times = Number(/>x(\d+)</.exec(html.slice(m.index, m.index + 900))?.[1] ?? 1);
    found.set(alt, { name: alt.trim(), image: src.replace(/&amp;/g, '&'), times });
  }
  return [...found.values()].slice(0, 8);
}

/** The pinned repositories: one <li class="pinned-item-list-item"> each, in the order GitHub shows them. */
export function parsePinned(html: string): Pinned[] {
  const pins: Pinned[] = [];
  for (const chunk of html.split(/<li\b[^>]*pinned-item-list-item[^>]*>/).slice(1)) {
    const item = chunk.split('</li>')[0];
    const name = /<span class="repo">([^<]+)<\/span>/.exec(item)?.[1];
    const path = /href="(\/[^"]+)"/.exec(item)?.[1];
    if (!name || !path) continue;
    const description = /<p class="pinned-item-desc[^"]*"[^>]*>\s*([^<]*?)\s*<\/p>/.exec(item)?.[1];
    pins.push({
      name: decode(name.trim()),
      url: `https://github.com${path}`,
      description: description ? decode(description) : null,
      language: /itemprop="programmingLanguage">([^<]+)</.exec(item)?.[1]?.trim() ?? null,
      color: /repo-language-color"[^>]*style="background-color:\s*([^;"]+)/.exec(item)?.[1]?.trim() ?? null,
    });
  }
  return pins.slice(0, 6);
}

export async function getGithub(): Promise<GithubData> {
  if (cache && cache.data.pinned && Date.now() - cache.at < TTL_MS) return cache.data;   // an older-shaped answer (before `pinned` existed) is refetched
  try {
    const now = new Date();
    const year = now.getFullYear();
    const [user, calendar, profile] = await Promise.allSettled([
      json<ApiUser>(`https://api.github.com/users/${GITHUB_USER}`),
      text(`https://github.com/users/${GITHUB_USER}/contributions?from=${year}-01-01&to=${year}-12-31`),
      text(`https://github.com/${GITHUB_USER}`),
    ]);
    if (user.status !== 'fulfilled' || calendar.status !== 'fulfilled') throw new Error('GitHub did not answer');   // the page needs these two

    const contributions = parseContributions(calendar.value, now.toISOString().slice(0, 10));
    if (contributions.days.length === 0) throw new Error('The contribution calendar could not be read');
    const u = user.value;
    const data: GithubData = {
      user: { login: u.login, name: u.name, avatar: u.avatar_url, bio: u.bio, followers: u.followers, following: u.following, url: u.html_url },
      achievements: profile.status === 'fulfilled' ? parseAchievements(profile.value) : [],
      pinned: profile.status === 'fulfilled' ? parsePinned(profile.value) : [],
      contributions: { year, ...contributions },
    };
    cache = { at: Date.now(), data };
    return data;
  } catch (e) {
    if (cache) return cache.data;          // GitHub is down right now: show the last good answer, however old
    throw e;
  }
}
