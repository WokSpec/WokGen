/**
 * GET /api/assets/search?q=mountain+sunset&type=photo&per_page=20
 * Search Pixabay for free CC0 stock images and videos.
 * No auth required — uses server-side API key.
 */

import { NextRequest, NextResponse } from 'next/server';
import { pixabaySearch, pixabayVideoSearch } from '@/lib/providers/pixabay';

export const revalidate = 300; // cache 5 minutes

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q        = searchParams.get('q')?.trim() ?? '';
  const type     = searchParams.get('type') ?? 'photo';
  const perPage  = Math.min(parseInt(searchParams.get('per_page') ?? '20', 10), 50);

  if (!q) {
    return NextResponse.json({ results: [], count: 0 });
  }

  if (!process.env.PIXABAY_API_KEY) {
    return NextResponse.json({
      results: [],
      count: 0,
      note: 'PIXABAY_API_KEY not configured — asset search unavailable',
    });
  }

  try {
    if (type === 'video') {
      const results = await pixabayVideoSearch(q);
      return NextResponse.json({ results, count: results.length });
    }

    const imageType = (['photo', 'illustration', 'vector'].includes(type)
      ? type
      : 'photo') as 'photo' | 'illustration' | 'vector';

    const results = await pixabaySearch({ q, image_type: imageType, per_page: perPage });
    return NextResponse.json({ results, count: results.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Asset search failed';
    return NextResponse.json({ error: message, results: [], count: 0 }, { status: 502 });
  }
}
