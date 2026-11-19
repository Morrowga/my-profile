import type { NextRequest } from 'next/server';
import { ApiError, listWorks, readCursor, readFilters, readPerPage } from '@/lib/openalex';

/** GET /api/works?types=article&oa=true&yearFrom=2020&country=TH&q=learning&cursor=*&perPage=25 */
export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams;
    const data = await listWorks(readFilters(p), readCursor(p), readPerPage(p));
    return Response.json(data);
  } catch (e) {
    if (e instanceof ApiError) return Response.json({ error: e.message }, { status: e.status });
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
