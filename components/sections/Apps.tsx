'use client';
import { motion } from 'framer-motion';
import { FROST } from '@/lib/styles';

/**
 * ── Content ─────────────────────────────────────────────────────────────────
 * One object per app. `android` / `ios` are the store links (optional):
 * when a link is set, its store logo becomes clickable.
 */
type App = { id: string; name: string; icon: string; android?: string; ios?: string };

const APPS: App[] = [
  { id: 'size-reducer', name: 'Size Reducer', icon: '/images/apps/size-reducer.webp' },
  { id: 'cinematic-cam', name: 'Cinematic Cam', icon: '/images/apps/cinematic-cam.webp' },
];

/** A store logo: a link when the app has a store page, otherwise a disabled "coming soon" logo. */
function StoreLogo({ src, label, url, rounded }: { src: string; label: string; url?: string; rounded?: boolean }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={label} width={40} height={40} style={{ width: 40, height: 40, display: 'block', borderRadius: rounded ? 9 : 0 }} />
  );
  const common: React.CSSProperties = { display: 'block', lineHeight: 0, transition: 'transform 0.2s, filter 0.2s' };

  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" title={`${label} — open store page`} aria-label={`${label} store page`} className="store-logo" style={common}>
      {img}
    </a>
  ) : (
    // no store page yet: shown greyed out, and a "Coming soon" tooltip appears on hover / keyboard focus
    <span
      className="store-logo store-logo--static"
      style={common}
      role="img"
      aria-label={`${label} — coming soon`}
      aria-disabled="true"
      data-tip="Coming soon"
      tabIndex={0}
    >
      {img}
    </span>
  );
}

export default function Apps() {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ width: '100%' }}>
      <div className="mono" style={{ color: 'var(--accent)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        Apps
      </div>
      <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontWeight: 800, margin: '0.6rem 0 0.75rem', letterSpacing: '0.02em' }}>
        Mobile Showroom
      </h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.8, marginBottom: '2rem' }}>The mobile apps I have built, for Android and iOS.</p>

      <div className="apps-grid">
        {APPS.map((app, i) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
            style={{ ...FROST, borderRadius: 20, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.4rem' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={app.icon}
              alt={`${app.name} icon`}
              width={104}
              height={104}
              style={{ width: 104, height: 104, flexShrink: 0, borderRadius: '22.5%', boxShadow: '0 12px 32px rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: '0.9rem' }}>{app.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <StoreLogo src="/images/apps/google-play.webp" label="Android" url={app.android} />
                <StoreLogo src="/images/apps/app-store.webp" label="iOS" url={app.ios} rounded />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
