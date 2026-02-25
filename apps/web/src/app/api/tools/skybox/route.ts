/**
 * Blockade Labs Skybox AI — 360° panoramic scene generation
 * API: https://api-documentation.blockadelabs.com/
 * Key: SKYBOX_API_KEY (free tier at https://skybox.blockadelabs.com/)
 *
 * Creates immersive 360° equirectangular images for games, VR, 3D scenes.
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, API_ERRORS } from '@/lib/api-response';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const SKYBOX_BASE = 'https://backend.blockadelabs.com/api/v1';

// Skybox style IDs (common ones)
const SKYBOX_STYLES: Record<string, number> = {
  'fantasy-landscape':  2,
  'digital-painting':   3,
  'realistic-travel':   5,
  'sci-fi':             7,
  'underwater':        10,
  'space':             12,
  'horror':            20,
  'anime':             24,
  'game-level':        31,
  'interior':          45,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

  const rl = await checkRateLimit(`skybox:${session.user.id}`, 10, 3_600_000);
  if (!rl.allowed) {
    return Response.json({ error: 'Rate limit exceeded. Please try again later.' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter ?? 60) },
    });
  }

  const apiKey = process.env.SKYBOX_API_KEY;
  if (!apiKey) {
    return apiError({
      code: 'NOT_CONFIGURED',
      message: 'Skybox AI key not configured. Add SKYBOX_API_KEY. Get free access at https://skybox.blockadelabs.com/',
      status: 503,
    });
  }

  const body = await req.json().catch(() => null);
  if (!body?.prompt?.trim()) return API_ERRORS.BAD_REQUEST('prompt is required');

  const { prompt, style = 'fantasy-landscape', negativeText = '' } = body;
  const skyboxStyleId = SKYBOX_STYLES[style] || 2;

  const res = await fetch(`${SKYBOX_BASE}/skybox`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      skybox_style_id: skyboxStyleId,
      negative_text: negativeText,
      return_depth: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return apiError({ code: 'SKYBOX_ERROR', message: `Skybox error: ${errText}`, status: res.status });
  }

  const data = await res.json();
  return apiSuccess({
    id: data.id,
    status: data.status,
    thumbUrl: data.thumb_url || null,
    fileUrl: data.file_url || null,
    depthMapUrl: data.depth_map_url || null,
    title: data.title,
    prompt: data.prompt,
  });
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.SKYBOX_API_KEY;
  if (!apiKey) return apiError({ code: 'NOT_CONFIGURED', message: 'SKYBOX_API_KEY not set', status: 503 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return API_ERRORS.BAD_REQUEST('id is required');

  const res = await fetch(`${SKYBOX_BASE}/imagine/requests/${id}`, {
    headers: { 'x-api-key': apiKey },
  });

  if (!res.ok) return API_ERRORS.INTERNAL();
  const data = await res.json();

  return apiSuccess({
    id: data.id,
    status: data.status, // pending | processing | complete | error
    progress: data.queue_position || 0,
    thumbUrl: data.file_url ? data.file_url.replace('.jpg', '-thumb.jpg') : null,
    fileUrl: data.file_url,
    depthMapUrl: data.depth_map_url || null,
  });
}
