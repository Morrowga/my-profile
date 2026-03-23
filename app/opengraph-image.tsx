import { ImageResponse } from 'next/og';

export const runtime = 'edge';
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
        AI ENGINEER / VIBE CODER
      </p>
      <p style={{ color: '#fff', fontSize: 72, fontWeight: 800, margin: 0 }}>
        THIHA AUNG
      </p>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20 }}>
        thihaeung.com
      </p>
    </div>
  );
}