/**
 * Pixabay provider — CC0 stock photos, illustrations, vectors, and videos.
 * Free account required. Get key at https://pixabay.com/api/docs/
 * Env: PIXABAY_API_KEY
 */

const PIXABAY_IMAGE_API = 'https://pixabay.com/api/';
const PIXABAY_VIDEO_API = 'https://pixabay.com/api/videos/';

export type PixabayMediaType = 'photo' | 'illustration' | 'vector' | 'video' | 'music';

export interface PixabayResult {
  id: number;
  type: PixabayMediaType;
  tags: string;
  previewURL: string;
  webformatURL: string;     // 640px wide
  largeImageURL?: string;
  pageURL: string;
  user: string;
  downloads?: number;
  likes?: number;
}

export interface PixabaySearchOptions {
  q: string;
  image_type?: 'all' | 'photo' | 'illustration' | 'vector';
  orientation?: 'all' | 'horizontal' | 'vertical';
  per_page?: number;
  safesearch?: boolean;
}

interface PixabayRawHit {
  id: number;
  tags: string;
  previewURL: string;
  webformatURL: string;
  largeImageURL?: string;
  pageURL: string;
  user: string;
  downloads?: number;
  likes?: number;
  type?: string;
}

interface PixabayRawVideoHit {
  id: number;
  tags: string;
  pageURL: string;
  user: string;
  downloads?: number;
  likes?: number;
  videos?: { medium?: { url?: string }; small?: { url?: string } };
}

async function pixabayFetch(url: URL): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(url.toString(), { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function pixabaySearch(
  options: PixabaySearchOptions,
  apiKey?: string,
): Promise<PixabayResult[]> {
  const key = apiKey ?? process.env.PIXABAY_API_KEY ?? '';
  if (!key) throw new Error('Pixabay requires PIXABAY_API_KEY. Get free key at https://pixabay.com/api/docs/');

  const url = new URL(PIXABAY_IMAGE_API);
  url.searchParams.set('key',        key);
  url.searchParams.set('q',          options.q);
  url.searchParams.set('image_type', options.image_type  ?? 'photo');
  url.searchParams.set('safesearch', String(options.safesearch ?? true));
  url.searchParams.set('per_page',   String(Math.min(options.per_page ?? 20, 200)));
  if (options.orientation) url.searchParams.set('orientation', options.orientation);

  const res = await pixabayFetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Pixabay API error ${res.status}: ${body}`);
  }

  const data = await res.json() as { hits: PixabayRawHit[] };
  const imageType = options.image_type ?? 'photo';

  return (data.hits ?? []).map((h) => ({
    id:           h.id,
    type:         (imageType === 'all' ? (h.type as PixabayMediaType) : imageType as PixabayMediaType) ?? 'photo',
    tags:         h.tags,
    previewURL:   h.previewURL,
    webformatURL: h.webformatURL,
    largeImageURL:h.largeImageURL,
    pageURL:      h.pageURL,
    user:         h.user,
    downloads:    h.downloads,
    likes:        h.likes,
  }));
}

export async function pixabayVideoSearch(
  query: string,
  apiKey?: string,
): Promise<PixabayResult[]> {
  const key = apiKey ?? process.env.PIXABAY_API_KEY ?? '';
  if (!key) throw new Error('Pixabay requires PIXABAY_API_KEY');

  const url = new URL(PIXABAY_VIDEO_API);
  url.searchParams.set('key', key);
  url.searchParams.set('q',   query);
  url.searchParams.set('safesearch', 'true');

  const res = await pixabayFetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Pixabay Video API error ${res.status}: ${body}`);
  }

  const data = await res.json() as { hits: PixabayRawVideoHit[] };

  return (data.hits ?? []).map((h) => {
    const previewURL = h.videos?.medium?.url ?? h.videos?.small?.url ?? '';
    return {
      id:           h.id,
      type:         'video' as PixabayMediaType,
      tags:         h.tags,
      previewURL,
      webformatURL: previewURL,
      pageURL:      h.pageURL,
      user:         h.user,
      downloads:    h.downloads,
      likes:        h.likes,
    };
  });
}
