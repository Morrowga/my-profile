'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { FROST } from '@/lib/styles';

/**
 * Search millions of research papers (OpenAlex) with several search approaches at once:
 * words (title only or everything), filters with live counts, and a sort order.
 * Results load as you scroll (cursor paging) and only the rows on screen are drawn.
 * The screen never calls OpenAlex itself: it calls /api/works and /api/facets, which hold the key.
 */

type Work = { id: string; title: string; year: number | null; type: string | null; openAccess: boolean; citations: number; source: string | null };
type ListRes = { total: number; nextCursor: string | null; results: Work[]; cached: boolean; ms: number };
type Group = { key: string; label: string; count: number };
type FacetRes = { field: string; groups: Group[]; cached: boolean; ms: number };

type Mode = 'title' | 'all';
type Sort = 'relevance' | 'cited' | 'new';
type F = { q: string; mode: Mode; sort: Sort; types: string[]; oa: 'any' | 'true' | 'false'; minCites: number; country: string; yearFrom: string; yearTo: string };

const EMPTY: F = { q: '', mode: 'title', sort: 'cited', types: [], oa: 'any', minCites: 0, country: '', yearFrom: '', yearTo: '' };
const FACETS = ['type', 'open_access.is_oa', 'authorships.countries'] as const;
type FacetField = (typeof FACETS)[number];

const ROW_H = 92;        // every row has the same height, so we can work out which rows are on screen
const OVERSCAN = 4;      // extra rows drawn above and below the visible ones
const PAGE = 25;
const DEBOUNCE_MS = 350;

const nice = (s: string) => s.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase());
const num = (n: number) => n.toLocaleString('en-US');

function toParams(f: F): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q.trim()) { p.set('q', f.q.trim()); p.set('mode', f.mode); }
  p.set('sort', f.sort);
  if (f.types.length) p.set('types', f.types.join(','));
  if (f.oa !== 'any') p.set('oa', f.oa);
  if (f.minCites > 0) p.set('minCites', String(f.minCites));
  if (f.country) p.set('country', f.country);
  if (/^\d{4}$/.test(f.yearFrom)) p.set('yearFrom', f.yearFrom);
  if (/^\d{4}$/.test(f.yearTo)) p.set('yearTo', f.yearTo);
  return p;
}

async function api<T>(path: string, p: URLSearchParams, signal: AbortSignal): Promise<T> {
  const res = await fetch(`${path}?${p}`, { signal });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? 'The request failed.');
  return body as T;
}

const label: React.CSSProperties = { fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 };
const chipStyle = (on: boolean): React.CSSProperties => ({
  padding: '0.3rem 0.7rem', borderRadius: 999, cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600, fontFamily: 'inherit',
  color: on ? '#fff' : 'rgba(255,255,255,0.72)', background: on ? 'color-mix(in srgb, var(--accent) 22%, transparent)' : 'rgba(255,255,255,0.05)',
  border: `1px solid ${on ? 'var(--accent)' : 'rgba(255,255,255,0.14)'}`,
});
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.85rem', borderRadius: 10, fontSize: '0.9rem', color: '#fff', fontFamily: 'inherit',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', outline: 'none',
};

function Chip({ on, onClick, children, disabled }: { on: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={on} style={{ ...chipStyle(on), opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      {children}
    </button>
  );
}

function Count({ n }: { n: number }) {
  return <span className="mono" style={{ marginLeft: 6, fontSize: '0.66rem', color: 'var(--accent)' }}>{num(n)}</span>;
}

export default function SearchShowcase() {
  const [draft, setDraft] = useState<F>(EMPTY);               // what the visitor has chosen right now
  const [items, setItems] = useState<Work[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'more' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [facets, setFacets] = useState<Partial<Record<FacetField, Group[]>>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewH, setViewH] = useState(600);

  const scroller = useRef<HTMLDivElement>(null);
  const run = useRef(0);                                       // numbers each search, so a late answer to an old search is ignored
  const ctrl = useRef<AbortController | null>(null);
  const applied = useRef<F>(EMPTY);
  const nextRef = useRef<string | null>(null);
  const busy = useRef(false);

  /** A new search: forget the old list, ask for the first page and the filter counts. */
  const search = useCallback((f: F) => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    const id = ++run.current;
    applied.current = f;
    busy.current = true;
    setStatus('loading'); setError(null); setMoreError(null); setItems([]); setNext(null);
    nextRef.current = null;
    scroller.current?.scrollTo({ top: 0 });
    setScrollTop(0);

    const base = toParams(f);
    const first = new URLSearchParams(base); first.set('cursor', '*'); first.set('perPage', String(PAGE));
    api<ListRes>('/api/works', first, c.signal)
      .then(r => {
        if (id !== run.current) return;
        setItems(r.results); setNext(r.nextCursor); nextRef.current = r.nextCursor; setStatus('idle'); busy.current = false;
      })
      .catch(e => { if (id !== run.current || c.signal.aborted) return; setError(e.message); setStatus('error'); busy.current = false; });

    for (const field of FACETS) {
      const p = new URLSearchParams(base); p.set('field', field);
      api<FacetRes>('/api/facets', p, c.signal)
        .then(r => { if (id !== run.current) return; setFacets(prev => ({ ...prev, [field]: r.groups })); })
        .catch(() => { /* a missing facet is not an error for the list */ });
    }
  }, []);

  /** The next page, with the cursor we were given. */
  const loadMore = useCallback(() => {
    const cursor = nextRef.current;
    if (!cursor || busy.current) return;
    busy.current = true;
    const id = run.current;
    const c = ctrl.current ?? new AbortController();
    setStatus('more'); setMoreError(null);
    const p = toParams(applied.current); p.set('cursor', cursor); p.set('perPage', String(PAGE));
    api<ListRes>('/api/works', p, c.signal)
      .then(r => {
        if (id !== run.current) return;
        setItems(prev => [...prev, ...r.results]); setNext(r.nextCursor); nextRef.current = r.nextCursor; setStatus('idle'); busy.current = false;
      })
      .catch(e => { if (id !== run.current || c.signal.aborted) return; setMoreError(e.message); setStatus('idle'); busy.current = false; });
  }, []);

  // wait until the visitor stops changing things, then search (the first search runs right away)
  const first = useRef(true);
  useEffect(() => {
    const t = setTimeout(() => search(draft), first.current ? 0 : DEBOUNCE_MS);
    first.current = false;
    return () => clearTimeout(t);
  }, [draft, search]);

  useEffect(() => () => ctrl.current?.abort(), []);

  // measure the list box
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewH(el.clientHeight));
    ro.observe(el);
    setViewH(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  // which rows are on screen
  const n = items.length;
  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const end = Math.min(n, Math.ceil((scrollTop + viewH) / ROW_H) + OVERSCAN);

  // near the bottom: ask for the next page before the visitor gets there
  useEffect(() => {
    if (next && end >= n - 8 && status === 'idle' && !moreError) loadMore();
  }, [end, n, next, status, moreError, loadMore]);

  const set = (patch: Partial<F>) => setDraft(d => ({ ...d, ...patch }));
  const toggleType = (k: string) => set({ types: draft.types.includes(k) ? draft.types.filter(x => x !== k) : [...draft.types, k] });
  const activeCount = (draft.types.length ? 1 : 0) + (draft.oa !== 'any' ? 1 : 0) + (draft.minCites ? 1 : 0) + (draft.country ? 1 : 0) + (draft.yearFrom || draft.yearTo ? 1 : 0);
  const hasQuery = draft.q.trim().length > 0;
  const typeGroups = facets.type ?? [];
  const oaGroups = facets['open_access.is_oa'] ?? [];
  const countryGroups = facets['authorships.countries'] ?? [];
  const oaCount = (k: string) => oaGroups.find(g => g.key === k)?.count;

  return (
    <div className="lab-stack" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1rem' }}>
      <div className="search-grid">
        {/* filters */}
        <div>
          <button type="button" className="search-toggle lab-ctl-btn" onClick={() => setFiltersOpen(o => !o)} aria-expanded={filtersOpen}
            style={{ ...FROST, width: '100%', borderRadius: 12, padding: '0.65rem 1rem', color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', alignItems: 'center', gap: 8 }}>
            <SlidersHorizontal size={15} /> Filters{activeCount ? ` (${activeCount})` : ''}
          </button>

          <div className="search-filters" data-open={filtersOpen} style={{ ...FROST, borderRadius: 14, padding: '1.1rem', display: 'grid', gap: '1.15rem' }}>
            <div>
              <p className="mono" style={label}>Search words</p>
              <input value={draft.q} onChange={e => set({ q: e.target.value })} placeholder="e.g. machine learning" aria-label="Search words" style={inputStyle} />
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <Chip on={draft.mode === 'title'} onClick={() => set({ mode: 'title' })}>In the title</Chip>
                <Chip on={draft.mode === 'all'} onClick={() => set({ mode: 'all' })}>Everywhere</Chip>
              </div>
            </div>

            <div>
              <p className="mono" style={label}>Sort by</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Chip on={draft.sort === 'relevance' && hasQuery && draft.mode === 'all'} disabled={!hasQuery || draft.mode !== 'all'} onClick={() => set({ sort: 'relevance' })}>Best match</Chip>
                <Chip on={draft.sort === 'cited' || (draft.sort === 'relevance' && !(hasQuery && draft.mode === 'all'))} onClick={() => set({ sort: 'cited' })}>Most cited</Chip>
                <Chip on={draft.sort === 'new'} onClick={() => set({ sort: 'new' })}>Newest</Chip>
              </div>
            </div>

            <div>
              <p className="mono" style={label}>Type</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {typeGroups.length === 0 && <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Loading…</span>}
                {typeGroups.slice(0, 8).map(g => (
                  <Chip key={g.key} on={draft.types.includes(g.key)} onClick={() => toggleType(g.key)}>{nice(g.label)}<Count n={g.count} /></Chip>
                ))}
              </div>
            </div>

            <div>
              <p className="mono" style={label}>Open access</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Chip on={draft.oa === 'any'} onClick={() => set({ oa: 'any' })}>Any</Chip>
                <Chip on={draft.oa === 'true'} onClick={() => set({ oa: 'true' })}>Open{oaCount('true') !== undefined && <Count n={oaCount('true')!} />}</Chip>
                <Chip on={draft.oa === 'false'} onClick={() => set({ oa: 'false' })}>Closed{oaCount('false') !== undefined && <Count n={oaCount('false')!} />}</Chip>
              </div>
            </div>

            <div>
              <p className="mono" style={label}>Years</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={draft.yearFrom} onChange={e => set({ yearFrom: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="From" inputMode="numeric" aria-label="From year" style={inputStyle} />
                <span style={{ color: 'var(--muted)' }}>–</span>
                <input value={draft.yearTo} onChange={e => set({ yearTo: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="To" inputMode="numeric" aria-label="To year" style={inputStyle} />
              </div>
            </div>

            <div>
              <p className="mono" style={label}>Cited at least</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[0, 10, 100, 1000].map(v => <Chip key={v} on={draft.minCites === v} onClick={() => set({ minCites: v })}>{v === 0 ? 'Any' : `${num(v)}+`}</Chip>)}
              </div>
            </div>

            <div>
              <p className="mono" style={label}>Author country</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {countryGroups.length === 0 && <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Loading…</span>}
                {countryGroups.slice(0, 10).map(g => (
                  <Chip key={g.key} on={draft.country === g.key} onClick={() => set({ country: draft.country === g.key ? '' : g.key })}>{g.label}<Count n={g.count} /></Chip>
                ))}
              </div>
            </div>

            <button type="button" onClick={() => setDraft(EMPTY)} style={{ ...chipStyle(false), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.5rem 0.9rem' }}>
              <RotateCcw size={13} /> Clear everything
            </button>
          </div>
        </div>

        {/* results */}
        <div style={{ minWidth: 0 }}>
          <div
            ref={scroller}
            onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
            className="search-list"
            style={{ ...FROST, borderRadius: 14, height: 'var(--pane-h)', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}
          >
            {status === 'loading' && Array.from({ length: 7 }).map((_, i) => (
              <div key={i} style={{ height: ROW_H, padding: '1rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ height: 12, width: `${70 - (i % 3) * 12}%`, borderRadius: 6, background: 'rgba(255,255,255,0.09)', marginBottom: 12 }} />
                <div style={{ height: 9, width: '38%', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
              </div>
            ))}

            {status === 'error' && (
              <div style={{ padding: '2rem 1.25rem', textAlign: 'center' }}>
                <p style={{ fontWeight: 700, marginBottom: 6 }}>Could not load results</p>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 14 }}>{error}</p>
                <button type="button" onClick={() => search(draft)} style={{ ...chipStyle(true), padding: '0.5rem 1.1rem' }}>Try again</button>
              </div>
            )}

            {status !== 'loading' && status !== 'error' && n === 0 && (
              <div style={{ padding: '2rem 1.25rem', textAlign: 'center' }}>
                <p style={{ fontWeight: 700, marginBottom: 6 }}>No papers match</p>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 14 }}>Try fewer filters or other words.</p>
                <button type="button" onClick={() => setDraft(EMPTY)} style={{ ...chipStyle(true), padding: '0.5rem 1.1rem' }}>Clear everything</button>
              </div>
            )}

            {n > 0 && (
              <div style={{ position: 'relative', height: (n + 1) * ROW_H }}>
                {items.slice(start, end).map((w, k) => {
                  const i = start + k;
                  return (
                    <a
                      key={w.id}
                      href={`https://openalex.org/${w.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        position: 'absolute', left: 0, right: 0, top: i * ROW_H, height: ROW_H, boxSizing: 'border-box', padding: '0.85rem 1.1rem',
                        display: 'flex', gap: '1rem', alignItems: 'center', color: '#fff', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{w.title}</p>
                        <p className="mono" style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.55)', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {[w.year, w.type && nice(w.type), w.source].filter(Boolean).join('  ·  ')}
                        </p>
                      </div>
                      <div style={{ flex: '0 0 auto', textAlign: 'right' }}>
                        <p className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent)' }}>{num(w.citations)}</p>
                        <p className="mono" style={{ fontSize: '0.56rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>cited{w.openAccess ? ' · open' : ''}</p>
                      </div>
                      <ExternalLink size={13} style={{ flex: '0 0 auto', color: 'rgba(255,255,255,0.4)' }} />
                    </a>
                  );
                })}

                <div style={{ position: 'absolute', left: 0, right: 0, top: n * ROW_H, height: ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  {moreError ? (
                    <>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{moreError}</span>
                      <button type="button" onClick={() => { setMoreError(null); loadMore(); }} style={{ ...chipStyle(true), padding: '0.35rem 0.9rem' }}>Try again</button>
                    </>
                  ) : next ? (
                    <><span className="spin-ring" style={{ width: 16, height: 16, borderWidth: 2 }} /><span className="mono" style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Loading more…</span></>
                  ) : (
                    <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>End of results</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
