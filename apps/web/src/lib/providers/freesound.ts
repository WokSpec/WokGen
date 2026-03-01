/**
 * Freesound.org provider — search for CC-licensed sound effects.
 * Free account required. Get key at https://freesound.org/apiv2/apply
 * Env: FREESOUND_API_KEY
 */

const FREESOUND_API = 'https://freesound.org/apiv2';

export interface FreesoundResult {
  id: number;
  name: string;
  tags: string[];
  duration: number;       // seconds
  previewUrl: string;     // MP3 preview (always public, no auth)
  downloadUrl: string;    // full download (requires OAuth)
  license: string;
  username: string;
}

export interface FreesoundSearchOptions {
  query: string;
  duration_max?: number;
  filter?: string;
  fields?: string;
  page_size?: number;
}

interface FreesoundRawResult {
  id: number;
  name: string;
  tags: string[];
  duration: number;
  previews: Record<string, string>;
  download: string;
  license: string;
  username: string;
}

export async function freesoundSearch(
  options: FreesoundSearchOptions,
  apiKey?: string,
): Promise<FreesoundResult[]> {
  const key = apiKey ?? process.env.FREESOUND_API_KEY ?? '';
  if (!key) throw new Error('Freesound requires FREESOUND_API_KEY. Get free key at https://freesound.org/apiv2/apply');

  const fields = options.fields ?? 'id,name,tags,duration,previews,download,license,username';
  const pageSize = Math.min(options.page_size ?? 20, 150);

  const url = new URL(`${FREESOUND_API}/search/text/`);
  url.searchParams.set('query',     options.query);
  url.searchParams.set('token',     key);
  url.searchParams.set('fields',    fields);
  url.searchParams.set('page_size', String(pageSize));
  if (options.filter) url.searchParams.set('filter', options.filter);
  if (options.duration_max) {
    url.searchParams.set('filter', `duration:[0 TO ${options.duration_max}]`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Freesound API error ${res.status}: ${body}`);
    }

    const data = await res.json() as { results: FreesoundRawResult[] };

    return (data.results ?? []).map((r) => ({
      id:          r.id,
      name:        r.name,
      tags:        r.tags ?? [],
      duration:    r.duration,
      previewUrl:  r.previews?.['preview-lq-mp3'] ?? r.previews?.['preview-hq-mp3'] ?? '',
      downloadUrl: r.download ?? '',
      license:     r.license,
      username:    r.username,
    }));
  } finally {
    clearTimeout(timer);
  }
}
