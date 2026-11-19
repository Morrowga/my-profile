'use client';
import { useEffect, useMemo, useRef } from 'react';
import type { Day } from '@/lib/github-shared';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const dayName = (d: string) => fmt.format(new Date(`${d}T00:00:00Z`));
const weekday = (d: string) => new Date(`${d}T00:00:00Z`).getUTCDay();   // 0 = Sunday, the first row, as on GitHub

/**
 * One year of contributions as a grid: a column per week, a row per weekday.
 * The days that have contributions blink softly, each at its own pace (the CSS is .gh-cell in globals.css).
 */
export default function ContributionGraph({ days }: { days: Day[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  const { cells, months, weeks } = useMemo(() => {
    const lead = weekday(days[0].date);                       // empty slots before the first day, so Sundays line up
    const cells = days.map((d, i) => ({ d, col: Math.floor((i + lead) / 7) + 1, row: ((i + lead) % 7) + 1, i }));
    const weeks = cells[cells.length - 1].col;
    // a month name above the first week in which that month starts, never closer than 3 columns to the previous name
    const months: { name: string; col: number }[] = [];
    let last = -3;
    for (let col = 1; col <= weeks; col++) {
      const first = cells.find(c => c.col === col);
      if (!first) continue;
      const m = Number(first.d.date.slice(5, 7)) - 1;
      if (months.length === 0 ? true : MONTHS[m] !== months[months.length - 1].name) {
        if (col - last >= 3) { months.push({ name: MONTHS[m], col }); last = col; }
      }
    }
    return { cells, months, weeks };
  }, [days]);

  // like GitHub: open on the most recent weeks
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weeks]);

  return (
    <div>
      <div className="gh-graph">
        <div className="gh-days" aria-hidden="true">
          <span style={{ gridRow: 2 }}>Mon</span>
          <span style={{ gridRow: 4 }}>Wed</span>
          <span style={{ gridRow: 6 }}>Fri</span>
        </div>
        <div ref={scroller} className="gh-scroll">
          <div className="gh-months" style={{ gridTemplateColumns: `repeat(${weeks}, var(--c))` }} aria-hidden="true">
            {months.map(m => <span key={`${m.name}${m.col}`} style={{ gridColumn: `${m.col} / span 3` }}>{m.name}</span>)}
          </div>
          <div className="gh-cells" role="img" aria-label="Contributions over the last year" style={{ gridTemplateColumns: `repeat(${weeks}, var(--c))` }}>
            {cells.map(({ d, col, row, i }) => (
              <span
                key={d.date}
                className="gh-cell"
                data-level={d.level}
                title={`${d.count === 0 ? 'No contributions' : `${d.count} contribution${d.count === 1 ? '' : 's'}`} on ${dayName(d.date)}`}
                style={{
                  gridColumn: col, gridRow: row,
                  // each blinking day gets its own speed and its own starting point (a negative delay), so they never blink together
                  ...(d.level > 0 ? ({ '--dur': `${(2.6 + ((i * 7) % 11) * 0.37).toFixed(2)}s`, '--delay': `-${(((i * 13) % 17) * 0.41).toFixed(2)}s` } as React.CSSProperties) : null),
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="gh-legend" aria-hidden="true">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map(l => <span key={l} className="gh-cell gh-cell--legend" data-level={l} />)}
        <span>More</span>
      </div>
    </div>
  );
}
