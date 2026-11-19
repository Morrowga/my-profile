'use client';
import { FROST } from '@/lib/styles';

/**
 * "How it works" for the search experiment: a tree of nodes.
 * One root, three branches (find the rules, make it safe, make it fast), and each branch is a chain of steps.
 * Every step has one sentence and one real example. The numbers are from when it was tested and can change.
 */
type Step = { title: string; text: string; example: { label: string; value: string } };
type Branch = { id: string; title: string; hint: string; steps: Step[] };

const BRANCHES: Branch[] = [
  {
    id: 'rules',
    title: 'Find the rules',
    hint: 'Test the data source before building anything',
    steps: [
      {
        title: 'Pick a huge public dataset',
        text: 'OpenAlex holds research papers, is free, and can be called from a browser.',
        example: { label: 'Papers it holds', value: 'about 295,000,000' },
      },
      {
        title: 'Call the real API first',
        text: 'Before any screen, a small script asked the API what it allows and what it refuses.',
        example: { label: 'Page 401 by number', value: 'refused: 10,000 results is the limit' },
      },
      {
        title: 'Cursor paging needs a key',
        text: 'To go past the first page the API wants a free key. Without it, scrolling would stop after 25 results.',
        example: { label: 'Answer without a key', value: '401: API key required for cursor paging' },
      },
      {
        title: 'Choose how people can search',
        text: 'Words in the title or everywhere, filters, and a sort order, all working together on one search.',
        example: { label: 'Words "graph neural"', value: '28,422 in titles, 1,224,905 everywhere' },
      },
    ],
  },
  {
    id: 'safe',
    title: 'Make it safe',
    hint: 'The server sits between the page and the API',
    steps: [
      {
        title: 'Keep the key on the server',
        text: 'The page calls my own route, and the route adds the secret key. The key never reaches the browser.',
        example: { label: 'Path of a request', value: 'Browser → /api/works → OpenAlex' },
      },
      {
        title: 'Accept only known inputs',
        text: 'The route takes a fixed list of filters and checks each one, so nobody can use my key for other queries.',
        example: { label: 'perPage=500', value: '400: must be between 1 and 50' },
      },
      {
        title: 'Remember repeated searches',
        text: 'The same search within a minute is answered from memory, so it costs no request budget.',
        example: { label: 'Same search twice', value: '1,715 ms, then 0.15 s' },
      },
      {
        title: 'Turn failures into clear messages',
        text: 'If the data source is slow or the daily limit is used up, the server sends a short message and the screen shows it with a retry.',
        example: { label: 'Daily limit used up', value: '"Try again tomorrow."' },
      },
    ],
  },
  {
    id: 'fast',
    title: 'Make it fast',
    hint: 'How the screen handles the data',
    steps: [
      {
        title: 'Search once, trust the newest',
        text: 'The screen searches only after you stop changing things for 350 ms, and an old slow answer can never replace a newer one.',
        example: { label: 'Typing "graph neural"', value: '1 request, not 12' },
      },
      {
        title: 'Load the next page early',
        text: 'The cursor from the last page asks for the next 25 rows before you reach the bottom.',
        example: { label: 'Cursor (shortened)', value: 'IlsyNi4xMjkw…' },
      },
      {
        title: 'Draw only what you can see',
        text: 'Every row has the same height, so the screen can work out which rows are visible and draws only those.',
        example: { label: 'Rows loaded / drawn', value: '200 loaded, 9 drawn' },
      },
      {
        title: 'Count each filter live',
        text: 'Every filter shows how many results it would give, and the counts change when the other filters change.',
        example: { label: 'Type: Article', value: '182,614,313' },
      },
    ],
  },
];

const tiny: React.CSSProperties = { fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' };

function Link() {
  return <div aria-hidden="true" className="steps-link" />;
}

function StepNode({ n, step }: { n: number; step: Step }) {
  return (
    <div style={{ ...FROST, borderRadius: 14, padding: '1rem 1.05rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span className="mono" style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', border: '1px solid var(--accent)', background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
        }}>{n}</span>
        <h3 className="lab-title" style={{ fontSize: '0.98rem', fontWeight: 800, lineHeight: 1.25 }}>{step.title}</h3>
      </div>
      <p style={{ fontSize: '0.86rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.8)' }}>{step.text}</p>
      <div style={{ marginTop: 'auto', padding: '0.55rem 0.7rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="mono" style={tiny}>{step.example.label}</p>
        <p style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--accent)', marginTop: 3, overflowWrap: 'anywhere' }}>{step.example.value}</p>
      </div>
    </div>
  );
}

/** number of the first step of each branch, so the steps are numbered 1, 2, 3 ... across the branches */
const FIRST = BRANCHES.map((_, i) => BRANCHES.slice(0, i).reduce((sum, b) => sum + b.steps.length, 0) + 1);

export default function SearchSteps() {
  return (
    <div className="steps-wrap">
      {/* root */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ ...FROST, borderRadius: 16, padding: '1rem 1.4rem', textAlign: 'center', maxWidth: 520, border: '1px solid var(--accent)', boxShadow: '0 0 22px var(--glow)' }}>
          <p className="mono" style={{ ...tiny, color: 'var(--accent)' }}>The goal</p>
          <h2 className="lab-title" style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 4 }}>Search 295 million papers without waiting</h2>
          <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.75)', marginTop: 6, lineHeight: 1.5 }}>Three branches of four steps: learn the rules, keep it safe, keep it fast.</p>
        </div>
      </div>

      <div className="steps-tree">
        <div className="steps-rail" aria-hidden="true" />
        {BRANCHES.map((b, bi) => (
          <div key={b.id} className="steps-branch">
            <div style={{ ...FROST, borderRadius: 14, padding: '0.8rem 1rem', textAlign: 'center', width: '100%', border: '1px solid color-mix(in srgb, var(--accent) 55%, transparent)' }}>
              <h3 className="lab-title" style={{ fontSize: '1.02rem', fontWeight: 800 }}>{b.title}</h3>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{b.hint}</p>
            </div>
            {b.steps.map((s, si) => (
              <div key={s.title} style={{ display: 'contents' }}>
                <Link />
                <StepNode n={FIRST[bi] + si} step={s} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <p className="mono" style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '1rem', lineHeight: 1.6 }}>
        The numbers are from when I tested it, and OpenAlex data and limits can change.
      </p>
    </div>
  );
}
