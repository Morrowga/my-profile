'use client';
import { motion } from 'framer-motion';

// TODO: replace with your real side-client testimonials
type Testimonial = {
  id: string;
  name: string;
  role: string;        // e.g. "Founder, XYZ Studio"
  photo: string;        // path or URL to profile image
  quote: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Kan',
    role: 'Content Creator',
    photo: '/images/clients/1.webp',
    quote:
      'Working with them was a game changer for our brand — fast, thoughtful, and genuinely invested in the outcome.',
  },
  {
    id: 't2',
    name: 'Toshiyuki Asai',
    role: 'Founder, Voyager Co,ltd',
    photo: '/images/clients/2.png',
    quote:
        `Beyond his technical competence, Mr. Thiha Aung is a sincere, dedicated, and highly
        motivated professional. He continuously seeks to expand his knowledge and improve his
        skills while approaching new challenges with determination and professionalism. His
        positive attitude and commitment have earned him the trust and respect of everyone
        within our company.`,
  },
];

export default function Activities2026() {
  return (
    <div
      className="activities-section"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 2rem' }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '1.5rem' }}
      >
        <p
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.25em',
            color: 'var(--accent)',
            textTransform: 'uppercase',
            marginBottom: '0.4rem',
          }}
        >
          // Client Notes
        </p>
        <h1
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
            color: '#fff',
            lineHeight: 1,
            marginBottom: '0.4rem',
          }}
        >
          2026 Activities
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', lineHeight: 1.6 }}>
          A few words from side-project clients I worked with this year.
        </p>
      </motion.div>

      {/* Testimonials grid */}
      <div
        className="activities-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '18px',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          paddingBottom: '2rem',
          alignContent: 'start',
        }}
      >
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16,
              padding: '22px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* Quote */}
            <p
              style={{
                fontSize: '0.85rem',
                lineHeight: 1.75,
                color: 'rgba(255,255,255,0.55)',
                fontStyle: 'italic',
                borderLeft: '2px solid rgba(74,222,128,0.25)',
                paddingLeft: 13,
              }}
            >
              &ldquo;{t.quote}&rdquo;
            </p>

            {/* Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)',
                }}
              >
                {/* Swap for next/image if this is a Next.js project */}
                <img
                  src={t.photo}
                  alt={t.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <p
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#fff',
                    lineHeight: 1.3,
                  }}
                >
                  {t.name}
                </p>
                <p
                  style={{
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '0.6rem',
                    letterSpacing: '0.05em',
                    marginTop: 4,
                    color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase',
                  }}
                >
                  {t.role}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}