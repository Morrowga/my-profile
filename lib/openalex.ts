/**
 * Server-only helper for the Lab "search" experiment.
 * The screen never talks to OpenAlex directly: it calls /api/works and /api/facets (our routes),
 * and this file adds the secret key, checks every input and remembers recent answers.
 * Do not import this file from a client component.
 */

const BASE = 'https://api.openalex.org/works';
const FIELDS = 'id,title,publication_year,type,open_access,cited_by_count,primary_location';

export const TYPES = ['article', 'review', 'book-chapter', 'preprint', 'dataset', 'book', 'dissertation', 'letter', 'editorial', 'report'] as const;
export const FACET_FIELDS = ['type', 'open_access.is_oa', 'authorships.countries', 'publication_year'] as const;
export type FacetField = (typeof FACET_FIELDS)[number];

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/* ───────── inputs: only these are accepted, everything else is ignored ───────── */

export const SORTS = { relevance: 'relevance_score:desc', cited: 'cited_by_count:desc', new: 'publication_date:desc' } as const;
export type SortKey = keyof typeof SORTS;
/** title = look only in the title; all = look in title, abstract and full text (OpenAlex's own relevance search) */
export type SearchMode = 'title' | 'all';

type Filters = { yearFrom?: number; yearTo?: number; types: string[]; oa?: boolean; minCites?: number; country?: string; q?: string; mode: SearchMode; sort: SortKey };

function int(v: string | null, min: number, max: number, name: string): number | undefined {
  if (v === null || v === '') return undefined;
  if (!/^\d{1,5}$/.test(v)) throw new ApiError(400, `${name} must be a whole number`);
  const n = Number(v);
  if (n < min || n > max) throw new ApiError(400, `${name} must be between ${min} and ${max}`);
  return n;
}

export function readFilters(p: URLSearchParams): Filters {
  const types = (p.get('types') ?? '').split(',').map(s => s.trim()).filter(Boolean);
  for (const t of types) if (!(TYPES as readonly string[]).includes(t)) throw new ApiError(400, `unknown type "${t}"`);

  const country = p.get('country')?.trim().toUpperCase();
  if (country && !/^[A-Z]{2}$/.test(country)) throw new ApiError(400, 'country must be a 2-letter code');

  const oaRaw = p.get('oa');
  if (oaRaw && oaRaw !== 'true' && oaRaw !== 'false') throw new ApiError(400, 'oa must be true or false');

  // the search text goes into a filter, so keep only letters, numbers, spaces, apostrophes and hyphens
  const q = (p.get('q') ?? '').replace(/[^\p{L}\p{N} '-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

  const mode = p.get('mode') ?? 'title';
  if (mode !== 'title' && mode !== 'all') throw new ApiError(400, 'mode must be title or all');
  const sort = p.get('sort') ?? (q ? 'relevance' : 'cited');
  if (!(sort in SORTS)) throw new ApiError(400, 'sort must be relevance, cited or new');

  const f: Filters = {
    mode,
    sort: sort as SortKey,
    yearFrom: int(p.get('yearFrom'), 1500, 2100, 'yearFrom'),
    yearTo: int(p.get('yearTo'), 1500, 2100, 'yearTo'),
    types,
    oa: oaRaw ? oaRaw === 'true' : undefined,
    minCites: int(p.get('minCites'), 0, 1_000_000, 'minCites'),
    country: country || undefined,
    q: q || undefined,
  };
  if (f.yearFrom && f.yearTo && f.yearFrom > f.yearTo) throw new ApiError(400, 'yearFrom is after yearTo');
  return f;
}

/** Turns the filters into OpenAlex's filter text. `omit` leaves one group out (a facet does not filter by itself). */
export function buildFilter(f: Filters, omit?: FacetField): string {
  const parts: string[] = [];
  if (omit !== 'publication_year') {
    if (f.yearFrom && f.yearTo) parts.push(`publication_year:${f.yearFrom}-${f.yearTo}`);
    else if (f.yearFrom) parts.push(`publication_year:>${f.yearFrom - 1}`);
    else if (f.yearTo) parts.push(`publication_year:<${f.yearTo + 1}`);
  }
  if (omit !== 'type' && f.types.length) parts.push(`type:${f.types.join('|')}`);
  if (omit !== 'open_access.is_oa' && f.oa !== undefined) parts.push(`open_access.is_oa:${f.oa}`);
  if (f.minCites) parts.push(`cited_by_count:>${f.minCites - 1}`);
  if (omit !== 'authorships.countries' && f.country) parts.push(`authorships.countries:${f.country}`);
  if (f.q && f.mode === 'title') parts.push(`title.search:${f.q}`);
  return parts.join(',');
}

/** Words for OpenAlex's own relevance search (only in "all" mode). */
function searchWords(f: Filters): string | undefined {
  return f.q && f.mode === 'all' ? f.q : undefined;
}

export function readCursor(p: URLSearchParams): string {
  const c = p.get('cursor') ?? '*';
  if (c !== '*' && !/^[A-Za-z0-9+/=_-]{1,300}$/.test(c)) throw new ApiError(400, 'bad cursor');
  return c;
}

export function readPerPage(p: URLSearchParams): number {
  return int(p.get('perPage'), 1, 50, 'perPage') ?? 25;
}

/* ───────── calling OpenAlex (key stays here) ───────── */

type Raw = {
  meta: { count: number; next_cursor?: string | null };
  results: {
    id: string; title?: string | null; publication_year?: number | null; type?: string | null; cited_by_count?: number;
    open_access?: { is_oa?: boolean }; primary_location?: { source?: { display_name?: string } | null } | null;
  }[];
  group_by: { key: string; key_display_name: string; count: number }[];
};
type Cached = { at: number; data: Raw };
const cache = new Map<string, Cached>();
const TTL_MS = 60_000;
const MAX_ENTRIES = 300;

async function ask(params: Record<string, string>): Promise<{ data: Raw; cached: boolean; ms: number }> {
  const key = process.env.OPENALEX_API_KEY;
  if (!key) throw new ApiError(503, 'The search service is not set up yet.');

  const cacheKey = new URLSearchParams(params).toString();   // the key is not part of it
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL_MS) return { data: hit.data, cached: true, ms: 0 };

  const url = `${BASE}?${new URLSearchParams({ ...params, api_key: key })}`;
  const t0 = Date.now();
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  } catch {
    throw new ApiError(504, 'The data source did not answer in time. Try again.');
  }
  const ms = Date.now() - t0;
  if (res.status === 429 || res.status === 402) throw new ApiError(503, 'The daily request limit of the data source is used up. Try again tomorrow.');
  if (!res.ok) throw new ApiError(502, 'The data source returned an error.');   // never pass its text on: it can contain the url

  const data = (await res.json()) as Raw;
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  cache.set(cacheKey, { at: Date.now(), data });
  return { data, cached: false, ms };
}

/* ───────── the two things the screen can ask for ───────── */

export async function listWorks(f: Filters, cursor: string, perPage: number) {
  const params: Record<string, string> = { 'per-page': String(perPage), cursor, select: FIELDS };
  // "Newest" must not start with papers dated in the future (OpenAlex has some), so cap it at today
  const filter = [buildFilter(f), f.sort === 'new' ? `to_publication_date:${new Date().toISOString().slice(0, 10)}` : ''].filter(Boolean).join(',');
  if (filter) params.filter = filter;
  const words = searchWords(f);
  if (words) params.search = words;
  // "relevance" only exists when there are search words to rank by; otherwise most cited first
  params.sort = SORTS[f.sort === 'relevance' && !words ? 'cited' : f.sort];
  const { data, cached, ms } = await ask(params);
  return {
    total: data.meta.count as number,
    nextCursor: (data.meta.next_cursor ?? null) as string | null,
    results: data.results.map(w => ({
      id: String(w.id).replace('https://openalex.org/', ''),
      title: (w.title ?? 'Untitled') as string,
      year: w.publication_year as number | null,
      type: w.type as string | null,
      openAccess: Boolean(w.open_access?.is_oa),
      citations: (w.cited_by_count ?? 0) as number,
      source: (w.primary_location?.source?.display_name ?? null) as string | null,
    })),
    cached,
    ms,
  };
}

export async function facetCounts(f: Filters, field: FacetField) {
  const params: Record<string, string> = { group_by: field };
  const filter = buildFilter(f, field);
  if (filter) params.filter = filter;
  const words = searchWords(f);
  if (words) params.search = words;
  const { data, cached, ms } = await ask(params);
  return {
    field,
    groups: data.group_by.slice(0, 12).map(g => ({
      key: String(g.key).split('/').pop() as string,
      label: String(g.key_display_name),
      count: g.count as number,
    })),
    cached,
    ms,
  };
}
