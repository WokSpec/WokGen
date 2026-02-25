import { NextRequest } from 'next/server';
import { checkSsrf } from '@/lib/ssrf-check';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limiter';

const MEDIA_EXTENSIONS = {
  image: ['jpg','jpeg','png','gif','webp','avif','svg','ico','bmp','tiff'],
  video: ['mp4','webm','mov','avi','mkv','ogv'],
  audio: ['mp3','wav','ogg','flac','aac','m4a','opus'],
  document: ['pdf','doc','docx','xls','xlsx','ppt','pptx','zip','tar','gz'],
};

function detectType(url: string, contentType?: string): 'image'|'video'|'audio'|'document'|'unknown' {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  if (contentType?.startsWith('image/') || MEDIA_EXTENSIONS.image.includes(ext)) return 'image';
  if (contentType?.startsWith('video/') || MEDIA_EXTENSIONS.video.includes(ext)) return 'video';
  if (contentType?.startsWith('audio/') || MEDIA_EXTENSIONS.audio.includes(ext)) return 'audio';
  if (MEDIA_EXTENSIONS.document.includes(ext)) return 'document';
  return 'unknown';
}

function getFilename(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('/');
    return parts[parts.length - 1] || 'download';
  } catch {
    return 'download';
  }
}

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(getRateLimitKey(req, 'media-dl'), 20, 60_000);
  if (!rl.ok) {
    return Response.json({ error: 'Too many requests. Try again in a minute.' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    });
  }

  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return Response.json({ error: 'URL is required', code: 'BAD_REQUEST' }, { status: 400 });
    }

    let parsed: URL;
    try { parsed = new URL(url); } catch {
      return Response.json({ error: 'Invalid URL', code: 'BAD_REQUEST' }, { status: 400 });
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return Response.json({ error: 'Only HTTP/HTTPS URLs are supported', code: 'BAD_REQUEST' }, { status: 400 });
    }

    const ssrf = checkSsrf(url);
    if (!ssrf.ok) {
      return Response.json({ error: 'URL not allowed', code: 'FORBIDDEN' }, { status: 403 });
    }

    const ext = parsed.pathname.split('.').pop()?.toLowerCase() ?? '';
    const allExts = [...MEDIA_EXTENSIONS.image, ...MEDIA_EXTENSIONS.video, ...MEDIA_EXTENSIONS.audio, ...MEDIA_EXTENSIONS.document];

    if (allExts.includes(ext)) {
      // Direct media URL
      const type = detectType(url);
      return Response.json({
        media: [{
          url,
          type,
          filename: getFilename(url),
          contentType: undefined,
          size: undefined,
        }]
      });
    }

    // HTML page — fetch and parse for media
    let html: string;
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
        headers: { 'User-Agent': 'WokGen-MediaDownloader/1.0' },
      });
      if (!res.ok) return Response.json({ error: `Upstream returned ${res.status}`, code: 'UPSTREAM_ERROR' }, { status: 502 });
      html = await res.text();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      return Response.json({ error: `Failed to fetch URL: ${msg}`, code: 'FETCH_ERROR' }, { status: 502 });
    }

    const media: Array<{ url: string; type: string; filename: string; contentType?: string }> = [];
    const seen = new Set<string>();

    // Extract src/href with media extensions
    const srcRegex = /(?:src|href|data-src)=["']([^"']+)["']/gi;
    let m;
    while ((m = srcRegex.exec(html)) !== null) {
      const raw = m[1];
      if (!raw || raw.startsWith('data:') || raw.startsWith('#')) continue;
      try {
        const abs = new URL(raw, url).toString();
        const extCheck = abs.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
        if (allExts.includes(extCheck) && !seen.has(abs)) {
          seen.add(abs);
          media.push({ url: abs, type: detectType(abs), filename: getFilename(abs) });
        }
      } catch { /* skip malformed */ }
    }

    // Also check og:image, twitter:image meta
    const metaRegex = /<meta[^>]+(?:og:image|twitter:image)[^>]+content=["']([^"']+)["'][^>]*>/gi;
    while ((m = metaRegex.exec(html)) !== null) {
      try {
        const abs = new URL(m[1], url).toString();
        if (!seen.has(abs)) {
          seen.add(abs);
          media.push({ url: abs, type: 'image', filename: getFilename(abs) });
        }
      } catch { /* skip */ }
    }

    return Response.json({ media: media.slice(0, 50) });
  } catch (e) {
    return Response.json({ error: 'Failed to process URL', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
