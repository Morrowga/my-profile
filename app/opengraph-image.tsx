import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { SITE_HOST } from '@/lib/site';

// No `runtime = 'edge'` here: without it the picture is made once when the site is built and then served from the cache,
// which is faster and safer for the crawlers of WhatsApp, LinkedIn and the others (they give up quickly).
export const alt = 'THIHA AUNG — Software Engineer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// A fixed sprinkle of stars (same every build): [x%, y%, size px, opacity]
const STARS: [number, number, number, number][] = Array.from({ length: 70 }, (_, i) => [
  (i * 37.7) % 100, (i * 53.3 + 11) % 100, 1 + (i % 3), 0.25 + ((i * 7) % 10) / 14,
]);

export default async function OGImage() {
  // The Earth is the same texture as the Home planet, drawn as a ball (assets/og-earth.png) because the image maker cannot draw 3D.
  const earth = `data:image/png;base64,${(await readFile(path.join(process.cwd(), 'assets', 'og-earth.png'))).toString('base64')}`;

  return new ImageResponse(
    <div style={{
      width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center',
      background: 'radial-gradient(circle at 78% 50%, #0b1630 0%, #050508 62%)',
    }}>
      {STARS.map(([x, y, s, o], i) => (
        <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: s, height: s, borderRadius: 9999, background: '#fff', opacity: o }} />
      ))}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={earth} width={640} height={640} alt="" style={{ position: 'absolute', right: -40, top: -5 }} />
      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 80, gap: 18 }}>
        <p style={{ color: '#5aa2ff', fontSize: 26, letterSpacing: 10, margin: 0, textTransform: 'uppercase' }}>Software Engineer</p>
        <p style={{ color: '#fff', fontSize: 104, fontWeight: 800, margin: 0, lineHeight: 1, letterSpacing: 4 }}>THIHA</p>
        <p style={{ color: '#fff', fontSize: 104, fontWeight: 800, margin: 0, lineHeight: 1, letterSpacing: 4 }}>AUNG</p>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 26, margin: 0, marginTop: 14 }}>{SITE_HOST}</p>
      </div>
    </div>,
    size,
  );
}
