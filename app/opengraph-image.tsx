import { ImageResponse } from 'next/og';
import { SITE_HOST } from '@/lib/site';

// No `runtime = 'edge'` here: without it the picture is made once when the site is built and then served from the cache,
// which is faster and safer for the crawlers of WhatsApp, LinkedIn and the others (they give up quickly).
export const alt = 'THIHA AUNG — Software Engineer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    <div style={{
      width: '100%', height: '100%',
      background: '#050508',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16,
    }}>
      <p style={{ color: '#4ade80', fontSize: 20, letterSpacing: 8 }}>
        Software Engineer
      </p>
      <p style={{ color: '#fff', fontSize: 72, fontWeight: 800, margin: 0 }}>
        THIHA AUNG
      </p>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20 }}>
        {SITE_HOST}
      </p>
    </div>
  );
}