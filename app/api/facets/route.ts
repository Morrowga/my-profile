import type { NextRequest } from 'next/server';
import { ApiError, FACET_FIELDS, facetCounts, readFilters, type FacetField } from '@/lib/openalex';

/** GET /api/facets?field=type&oa=true&yearFrom=2020 : counts for one filter group, given the other filters */
export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams;
    const field = p.get('field') as FacetField;
    if (!FACET_FIELDS.includes(field)) throw new ApiError(400, `field must be one of: ${FACET_FIELDS.join(', ')}`);
    return Response.json(await facetCounts(readFilters(p), field));
  } catch (e) {
    if (e instanceof ApiError) return Response.json({ error: e.message }, { status: e.status });
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
