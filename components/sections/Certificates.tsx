'use client';
import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';

const CERTS = [
  {
    id: 1,
    title: 'Working with OpenAI',
    issuer: 'DataCamp',
    date: '2026',
    color: 'var(--accent)',
    pdf: '/certs/1.pdf',
  },
  {
    id: 2,
    title: 'Prompting Engineering with OpenAI',
    issuer: 'DataCamp',
    date: '2026',
    color: 'var(--accent2)',
    pdf: '/certs/2.pdf',
  },
  {
    id: 3,
    title: 'Working with Hugging Face',
    issuer: 'DataCamp',
    date: '2026',
    color: 'var(--accent3)',
    pdf: '/certs/3.pdf',
  },
  {
    id: 4,
    title: 'Developing OpenAI with the OpenAI API',
    issuer: 'DataCamp',
    date: '2026',
    color: 'var(--accent)',
    pdf: '/certs/4.pdf',
  },
  {
    id: 5,
    title: 'Introduction to Embeddings with the OpenAI API',
    issuer: 'DataCamp',
    date: '2026',
    color: 'var(--accent)',
    pdf: '/certs/4.pdf',
  },
];

const IFRAME_STYLE: React.CSSProperties = {
  width: '100%',
  height: '115%',      // taller than wrapper so scrollbar is pushed out of view
  marginTop: '-1px',
  border: 'none',
  display: 'block',
  pointerEvents: 'none', // prevents user from interacting/scrolling inside
};

const PDF_WRAPPER_STYLE: React.CSSProperties = {
  width: '100%',
  position: 'relative',
  background: '#0a0a0a',
  overflow: 'hidden', // clips any scrollbar the iframe tries to show
};

// ── Desktop card — compact, with embedded PDF viewer ─────────────────────────
function DesktopCertCard({ cert, index, inView }: { cert: typeof CERTS[0]; index: number; inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* PDF embed */}
      <div style={{ ...PDF_WRAPPER_STYLE, aspectRatio: '18/10' }}>
        <iframe
          src={`${cert.pdf}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=page-fit`}
          style={IFRAME_STYLE}
          title={cert.title}
          scrolling="no"
        />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${cert.color}, transparent)`,
          opacity: 0.7,
        }} />
      </div>

      {/* Info row */}
      <div style={{
        padding: '0.75rem 1rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: '0.5rem',
      }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#fff', marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {cert.title}
          </p>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', color: 'var(--muted)' }}>
            {cert.issuer} · {cert.date}
          </p>
        </div>
        <a
          href={cert.pdf}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flexShrink: 0,
            padding: '0.3rem 0.7rem',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.58rem', color: cert.color,
            textDecoration: 'none', letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}
        >
          PDF ↗
        </a>
      </div>
    </motion.div>
  );
}

// ── Mobile tree item — title node + PDF viewer below ─────────────────────────
function MobileCertItem({ cert, index, inView, isLast }: { cert: typeof CERTS[0]; index: number; inView: boolean; isLast: boolean }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : -16 }}
      transition={{ duration: 0.45, delay: index * 0.1 }}
      style={{ display: 'flex', gap: '0.75rem' }}
    >
      {/* Tree spine */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 20 }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
          background: cert.color,
          border: '2px solid rgba(0,0,0,0.5)',
          boxShadow: `0 0 8px ${cert.color}55`,
          marginTop: 4,
        }} />
        {!isLast && (
          <div style={{
            flex: 1, width: 1,
            background: 'rgba(255,255,255,0.08)',
            marginTop: 4,
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : '1.5rem' }}>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            gap: '0.5rem', padding: 0, marginBottom: expanded ? '0.75rem' : 0,
            textAlign: 'left',
          }}
        >
          <div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginBottom: '0.2rem' }}>
              {cert.title}
            </p>
            <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', color: 'var(--muted)' }}>
              {cert.issuer} · {cert.date}
            </p>
          </div>
          <span style={{
            fontFamily: 'Space Mono, monospace', fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.3)',
            marginTop: 2, flexShrink: 0,
            transition: 'transform 0.2s',
            display: 'inline-block',
            transform: expanded ? 'rotate(90deg)' : 'none',
          }}>▶</span>
        </button>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <div style={{ ...PDF_WRAPPER_STYLE, aspectRatio: '5.5/3' }}>
              <iframe
                src={`${cert.pdf}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=page-fit`}
                style={IFRAME_STYLE}
                title={cert.title}
                scrolling="no"
              />
            </div>
            <div style={{ padding: '0.6rem 0.75rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <a
                href={cert.pdf}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'Space Mono, monospace', fontSize: '0.6rem',
                  color: cert.color, textDecoration: 'none', letterSpacing: '0.08em',
                }}
              >
                Open PDF ↗
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Certificates() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <section id="certificates" className='certificates-section' style={{ padding: '0rem 2rem' }}>
      <div ref={ref} style={{ maxWidth: 1100, margin: '0 auto' }}>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 30 }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: '2rem' }}
        >
          <p className="mono" style={{ color: 'var(--accent)', fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            {'// certificates'}
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Earned Badges
          </h2>
        </motion.div>

        {/* ── DESKTOP: 2-col compact grid ── */}
        <div className="cert-desktop" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1.25rem',
        }}>
          {CERTS.map((cert, i) => (
            <DesktopCertCard key={cert.id} cert={cert} index={i} inView={inView} />
          ))}
        </div>

        {/* ── MOBILE: tree with expandable PDFs ── */}
        <div className="cert-mobile" style={{ display: 'none', flexDirection: 'column' }}>
          {CERTS.map((cert, i) => (
            <MobileCertItem
              key={cert.id}
              cert={cert}
              index={i}
              inView={inView}
              isLast={i === CERTS.length - 1}
            />
          ))}
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .cert-desktop { display: none !important; }
          .cert-mobile  { display: flex !important; }
          #certificates { padding: 0rem 0rem !important; }
        }
      `}</style>
    </section>
  );
}