'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Play } from 'lucide-react';
import { FROST } from '@/lib/styles';
import PillTabs from '@/components/ui/PillTabs';

/**
 * ── Content ─────────────────────────────────────────────────────────────────
 * Paste links; the cover and title are fetched from the link automatically.
 *
 *  FAV_TRACKS  spotify  — a Spotify track link ("Share → Copy link to song").
 *                         The real Spotify player card is shown directly: cover, title,
 *                         artist and play button all come from Spotify.
 *              title / artist — only a note for yourself (used as the player's accessible name)
 *  MY_TRACKS   youtube  — a YouTube video link        (or)
 *              facebook — a Facebook video link
 *              title / artist — shown under the video
 *              thumbnail — (optional) your own picture, e.g. '/images/life/tracks/fake-friend.webp'
 *                          YouTube videos get their thumbnail automatically
 *  GAMES       logo     — transparent logo image, e.g. '/images/life/games/wow.webp' (shown alone, no card or title)
 *              title    — the game's name (used as the image's alt text; shown only if the logo is missing)
 */
// One string per paragraph.
const DESCRIPTION: string[] = [
  "I'm a quiet, chill person who cares about craft and works hard. Once I start a job, I don't leave until it's finished. Even in games, I set a goal and reach it.",
  "I've worked in IT for many years. I never studied computer science, so I learned everything on the job, picking up whatever the company needed. That experience brought me here.",
  "I don't have a popular project yet, and I sometimes feel underrated. But I won't stop until I reach my goals.",
  "I prefer working alone. In a team, I support everyone's needs when they fit the plan, but I don't like depending on other people's work, so I always finish my tasks first. I don't work only for the money. I work for the company's future and its success, like it's mine.",
];

type FavTrack = { id: string; spotify: string; title?: string; artist?: string };
type MyTrack = { id: string; youtube?: string; facebook?: string; title?: string; artist?: string; thumbnail?: string };
type Game = { id: string; title: string; logo?: string };

const FAV_TRACKS: FavTrack[] = [
  { id: 'f1', title: '66', artist: 'Trippie Redd, Lil Yachty', spotify: 'https://open.spotify.com/track/6tarvNiKnEjYMj1VZhlDqR' },
  { id: 'f2', title: 'Springsteen', artist: 'Eric Church', spotify: 'https://open.spotify.com/track/05ZACkzW8YbRq3eFgIfSNB' },
  { id: 'f3', title: 'Fast Car', artist: 'Luke Combs', spotify: 'https://open.spotify.com/track/0eBFgRxyVSeuT4iyrbukdn' },
  { id: 'f4', title: 'Red Moon', artist: 'Lil Uzi Vert', spotify: 'https://open.spotify.com/track/6odqveUIgvpWWvtANLcZpH' },
  // { id: 'f1', spotify: 'https://open.spotify.com/track/...', artist: 'Artist name' },
];

const MY_TRACKS: MyTrack[] = [
  { id: 'm1', title: 'Broke', artist: 'Reload, Tag, Myat Amara Maung', youtube: 'https://www.youtube.com/watch?v=J_iI22tTTWA&list=RDJ_iI22tTTWA' },
  { id: 'm2', title: 'Home', artist: 'Reload, Tag', youtube: 'https://www.youtube.com/watch?v=2n0ELQFuFyQ&list=RD2n0ELQFuFyQ' },
  { id: 'm3', title: 'Moment', artist: 'Reload, Tag', youtube: 'https://www.youtube.com/watch?v=_3vcmqH1Fr0&list=RD_3vcmqH1Fr0' },
  { id: 'm4', title: 'Fake Friend', artist: 'John (feat. Tag)', facebook: 'https://www.facebook.com/watch/?v=494508027891024', thumbnail: '/images/life/tracks/fake-friend.webp' },
  { id: 'm5', title: 'Go Away', artist: 'Tag', youtube: 'https://www.youtube.com/watch?v=vN_9zgIeubw' },
  // { id: 'm1', youtube: 'https://www.youtube.com/watch?v=...' },
];

const GAMES: Game[] = [
  { id: 'g1', title: 'World of Warcraft', logo: '/images/life/games/wow.webp' },
  { id: 'g2', title: 'Dota 2', logo: '/images/life/games/dota2.webp' },
  { id: 'g3', title: 'League of Legends', logo: '/images/life/games/lol.webp' },
];

// ── helpers ──────────────────────────────────────────────────────────────────
const spotifyId = (url: string) => url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?track\/([A-Za-z0-9]+)/)?.[1];
const youtubeId = (url: string) =>
  url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/)?.[1];

/** Title + thumbnail of a Spotify / YouTube link (both allow this from the browser). */
function useOEmbed(endpoint: string | null) {
  const [data, setData] = useState<{ title?: string; thumbnail_url?: string } | null>(null);
  useEffect(() => {
    if (!endpoint) return;
    const ctrl = new AbortController();
    fetch(endpoint, { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (j) setData(j); })
      .catch(() => {});
    return () => ctrl.abort();
  }, [endpoint]);
  return data;
}

const card: React.CSSProperties = { ...FROST, borderRadius: 14, overflow: 'hidden' };
const enter = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: i * 0.06 },
});

// ── Fav tracks (Spotify) ─────────────────────────────────────────────────────
// The Spotify player card itself, shown straight away (no extra "play" step).
// loading="lazy": players below the visible area only load when you scroll to them.
function FavTrackCard({ track, index }: { track: FavTrack; index: number }) {
  const [loaded, setLoaded] = useState(false);
  const id = spotifyId(track.spotify);
  const name = [track.title, track.artist].filter(Boolean).join(' – ') || 'Spotify track';

  return (
    <motion.div {...enter(index)} style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', minHeight: 152 }}>
      {id ? (
        <iframe
          onLoad={() => setLoaded(true)}
          title={`Spotify: ${name}`}
          src={`https://open.spotify.com/embed/track/${id}?utm_source=generator&theme=0`}
          width="100%"
          height="152"
          style={{ border: 0, display: 'block', borderRadius: 14 }}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      ) : (
        <a href={track.spotify} target="_blank" rel="noopener noreferrer" style={{ ...card, display: 'flex', alignItems: 'center', gap: 6, padding: '1.2rem', color: '#fff' }}>
          {name}<ArrowUpRight size={15} aria-hidden="true" />
        </a>
      )}

      {/* loading indicator: covers the card until the Spotify player is ready */}
      {id && (
        <div
          role="status"
          aria-label="Loading player"
          style={{
            position: 'absolute', inset: 0, borderRadius: 14, pointerEvents: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            ...FROST, opacity: loaded ? 0 : 1, transition: 'opacity 0.4s ease',
          }}
        >
          <span className="spin-ring" />
        </div>
      )}
    </motion.div>
  );
}

// ── My tracks (YouTube, video style) ─────────────────────────────────────────
function MyTrackCard({ track, index }: { track: MyTrack; index: number }) {
  const [playing, setPlaying] = useState(false);
  const [thumb, setThumb] = useState<'maxresdefault' | 'hqdefault'>('maxresdefault');
  const ytId = track.youtube ? youtubeId(track.youtube) : undefined;
  const source = track.youtube ? 'YouTube' : 'Facebook';
  const link = track.youtube ?? track.facebook ?? '';
  const meta = useOEmbed(!track.title && ytId ? `https://www.youtube.com/oembed?url=${encodeURIComponent(track.youtube!)}&format=json` : null);
  const title = track.title ?? meta?.title ?? `${source} video`;

  const embedSrc = ytId
    ? `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`
    : track.facebook
      ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(track.facebook)}&show_text=false&autoplay=true`
      : null;
  const poster = track.thumbnail ?? (ytId ? `https://i.ytimg.com/vi/${ytId}/${thumb}.jpg` : undefined);

  return (
    <motion.div {...enter(index)} style={card}>
      <div style={{ position: 'relative', aspectRatio: '16 / 9', background: '#000' }}>
        {playing && embedSrc ? (
          <iframe
            title={title}
            src={embedSrc}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => embedSrc && setPlaying(true)}
            aria-label={`Play ${title}`}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 0, border: 0, cursor: 'pointer',
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 30%, #0b0b12), #0b0b12)',
            }}
          >
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster}
                alt=""
                onError={() => { if (!track.thumbnail) setThumb('hqdefault'); }}
                // YouTube answers a missing large thumbnail with a tiny grey placeholder (120px wide), not an error
                onLoad={e => { if (!track.thumbnail && thumb === 'maxresdefault' && e.currentTarget.naturalWidth <= 120) setThumb('hqdefault'); }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span className="mono" style={{ position: 'absolute', left: 16, top: 14, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
                {source}
              </span>
            )}
            <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0) 55%)' }} />
            <span
              style={{
                position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(8,8,14,0.6)', border: '1.5px solid #fff', color: '#fff',
                backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
              }}
            >
              <Play size={26} fill="currentColor" style={{ marginLeft: 3 }} />
            </span>
          </button>
        )}
      </div>
      <div style={{ padding: '0.9rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{title}</h3>
          {track.artist && (
            <p className="mono" style={{ fontSize: '0.7rem', letterSpacing: '0.04em', color: 'var(--accent)', marginTop: 3 }}>{track.artist}</p>
          )}
        </div>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mono"
          style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', letterSpacing: '0.04em', color: 'var(--muted)', textDecoration: 'none' }}
        >
          {/* a drawn icon, not the "↗" character: phones show that character as a colourful emoji */}
          {source}<ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </div>
    </motion.div>
  );
}

// ── Games (just the logo, on a transparent background) ───────────────────────
function GameTile({ game, index }: { game: Game; index: number }) {
  const [failed, setFailed] = useState(false);

  return (
    <motion.div
      {...enter(index)}
      whileHover={{ y: -6, scale: 1.05 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 130, padding: '0 1rem' }}
    >
      {game.logo && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={game.logo}
          alt={game.title}
          onError={() => setFailed(true)}
          style={{
            maxWidth: '100%', maxHeight: '100%', width: 260, objectFit: 'contain',
            filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.55))',
          }}
        />
      ) : (
        <span style={{ fontFamily: "'Science Gothic', sans-serif", fontWeight: 800, fontSize: '1.3rem', color: '#fff', textAlign: 'center' }}>{game.title}</span>
      )}
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
type Tab = 'fav' | 'games' | 'mine';

const emptyBox: React.CSSProperties = {
  ...FROST, borderStyle: 'dashed', borderRadius: 14, padding: '2rem',
  color: 'var(--muted)', textAlign: 'center', lineHeight: 1.7,
};
const listGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.25rem', alignItems: 'start',
};

export default function Life() {
  const [tab, setTab] = useState<Tab>('games');

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ width: '100%' }}>
      <div className="mono" style={{ color: 'var(--accent)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        Life
      </div>
      <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontWeight: 800, margin: '0.6rem 0 1.25rem', letterSpacing: '0.02em' }}>
        Personality
      </h1>

      {DESCRIPTION.length > 0 && (
        <div style={{ ...FROST, borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '0.5rem', display: 'grid', gap: '0.9rem' }}>
          {DESCRIPTION.map((text, i) => (
            <p key={i} style={{ color: 'var(--text)', lineHeight: 1.8, fontSize: '0.95rem' }}>{text}</p>
          ))}
        </div>
      )}

      <PillTabs
        tabs={[
          { id: 'games' as Tab, label: 'Games', count: GAMES.length || undefined },
          { id: 'fav' as Tab, label: 'Fav tracks', count: FAV_TRACKS.length || undefined },
          { id: 'mine' as Tab, label: 'My tracks', count: MY_TRACKS.length || undefined },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div key={tab} style={{ marginTop: '1.5rem' }}>
        {tab === 'fav' && (FAV_TRACKS.length === 0
          ? <div style={emptyBox}>My favourite tracks are coming soon.</div>
          : <div style={listGrid}>{FAV_TRACKS.map((t, i) => <FavTrackCard key={t.id} track={t} index={i} />)}</div>)}

        {tab === 'mine' && (MY_TRACKS.length === 0
          ? <div style={emptyBox}>My own tracks are coming soon.</div>
          : <div style={listGrid}>{MY_TRACKS.map((t, i) => <MyTrackCard key={t.id} track={t} index={i} />)}</div>)}

        {tab === 'games' && (GAMES.length === 0
          ? <div style={emptyBox}>The games I play are coming soon.</div>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem 1.5rem', alignItems: 'center' }}>
              {GAMES.map((g, i) => <GameTile key={g.id} game={g} index={i} />)}
            </div>
          ))}
      </div>
    </motion.div>
  );
}
