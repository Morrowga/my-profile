'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FROST } from '@/lib/styles';

type Recommendation = {
  id: string;
  name: string;
  role: string;
  photo: string;
  quote: string;
};

const ALL_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 't1',
    name: 'Kan',
    role: 'Content Creator',
    photo: '/images/clients/1.webp',
    quote: '', // add Kan's quote here — the card stays hidden while this is empty
  },
  {
    id: 't2',
    name: 'Toshiyuki Asai',
    role: 'Founder, Voyager Co,ltd',
    photo: '/images/clients/2.webp',
    quote:
      'Beyond his technical competence, Mr. Thiha Aung is a sincere, dedicated, and highly motivated professional. He continuously seeks to expand his knowledge and improve his skills while approaching new challenges with determination and professionalism. His positive attitude and commitment have earned him the trust and respect of everyone within our company.',
  },
  {
    id: 't3',
    name: 'Peach',
    role: 'Mobile Engineer, Voyager Co,ltd',
    photo: '/images/clients/3.webp',
    quote:
      "I had the pleasure of working with him as a mobile developer while he contributed as a full-stack developer on the same team. He's highly efficient, quick to understand requirements, and has a strong grasp of business workflows. I particularly appreciate his ability to translate business needs into practical technical solutions and keep development moving smoothly. He's knowledgeable, proactive, and easy to collaborate with. It was a great experience working alongside him!",
  },
  {
    id: 't5',
    name: 'David',
    role: 'Software Engineer, Cloud Transformation Co,ltd',
    photo: '/images/clients/5.webp',
    quote:
      'A senior colleague whose technical expertise and leadership have been invaluable to our team. He breaks down complex problems into clear, logical solutions, and he is an outstanding mentor who helped the whole junior team grow in confidence and skill. I wholeheartedly recommend him for future roles and leadership opportunities.',
  },
];

// A card without a quote is not shown yet.
const RECOMMENDATIONS = ALL_RECOMMENDATIONS.filter(r => r.quote.trim() !== '');

/** Photo, or the person's initials if the image is missing. */
function Avatar({ name, photo }: { name: string; photo: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {failed ? (
        <span style={{ fontFamily: "'Science Gothic', sans-serif", fontWeight: 800, fontSize: '0.85rem', color: 'var(--accent)' }}>{initials}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={name} onError={() => setFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
    </div>
  );
}

export const RECOMMENDATION_COUNT = RECOMMENDATIONS.length;

export default function Recommendations() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '1.25rem' }}>
      {RECOMMENDATIONS.map((r, i) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: i * 0.1 }}
          style={{
            ...FROST,
            borderRadius: 14,
            padding: '1.5rem',
            display: 'flex', flexDirection: 'column', gap: '1.25rem',
          }}
        >
          <p style={{
            fontSize: '0.92rem', lineHeight: 1.8, fontStyle: 'italic',
            color: 'rgba(255,255,255,0.82)',
            borderLeft: '2px solid var(--accent)', paddingLeft: '0.9rem',
          }}>
            &ldquo;{r.quote}&rdquo;
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: 'auto' }}>
            <Avatar name={r.name} photo={r.photo} />
            <div>
              <p style={{ fontFamily: "'Science Gothic', sans-serif", fontWeight: 700, fontSize: '0.88rem', color: '#fff', lineHeight: 1.3 }}>
                {r.name}
              </p>
              <p className="mono" style={{ fontSize: '0.62rem', letterSpacing: '0.06em', marginTop: 4, color: 'var(--muted)', textTransform: 'uppercase' }}>
                {r.role}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
