// GET /api/sfx/search?q=&page=1&pageSize=10
// Searches Freesound.org for Creative Commons sound effects
// No auth required — read-only public search

import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 300; // cache 5 minutes

interface FreesoundResult {
  id: number;
  name: string;
  description: string;
  duration: number;
  url: string;
  previews: Record<string, string>;
  license: string;
}

interface FreesoundResponse {
  count: number;
  results: FreesoundResult[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q        = searchParams.get('q')?.trim() ?? '';
  const page     = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') ?? '10', 10), 50);

  const apiKey = process.env.FREESOUND_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      results: [],
      count: 0,
      note: 'FREESOUND_API_KEY not configured — sound browsing unavailable',
    });
  }

  if (!q) {
    return NextResponse.json({ results: [], count: 0 });
  }

  try {
    const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(q)}&token=${apiKey}&fields=id,name,description,duration,url,previews,license&page=${page}&page_size=${pageSize}&filter=duration:[0.5 TO 30]`;
    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) {
      return NextResponse.json({ error: 'Freesound API error', results: [], count: 0 }, { status: 502 });
    }

    const data: FreesoundResponse = await res.json();

    const results = (data.results ?? []).map((r) => ({
      id:          r.id,
      name:        r.name,
      description: r.description,
      duration:    r.duration,
      url:         r.url,
      preview_url: r.previews?.['preview-hq-mp3'] ?? r.previews?.['preview-lq-mp3'] ?? null,
      license:     r.license,
    }));

    return NextResponse.json({ results, count: data.count ?? 0 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch sounds', results: [], count: 0 }, { status: 500 });
  }
}
