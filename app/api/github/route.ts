import { getGithub } from '@/lib/github';

// Always answered by the server (never frozen at build time); the CDN keeps each answer for an hour.
export const dynamic = 'force-dynamic';

/** GET /api/github : the public GitHub profile of the site's owner, see lib/github.ts */
export async function GET() {
  try {
    return Response.json(await getGithub(), {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch {
    return Response.json({ error: 'GitHub is not answering right now.' }, { status: 502 });
  }
}
