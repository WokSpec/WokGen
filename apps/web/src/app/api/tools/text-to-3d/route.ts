/**
 * Meshy AI — text-to-3D generation
 * API: https://docs.meshy.ai/api-text-to-3d
 * Key: MESHY_API_KEY (get free at https://www.meshy.ai/)
 *
 * Flow: POST /v2/text-to-3d → get taskId → GET /v2/text-to-3d/{taskId} (poll)
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, API_ERRORS } from '@/lib/api-response';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const MESHY_BASE = 'https://api.meshy.ai';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

  const rl = await checkRateLimit(`text-to-3d:${session.user.id}`, 5, 3_600_000);
  if (!rl.allowed) {
    return Response.json({ error: 'Rate limit exceeded. Please try again later.' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter ?? 60) },
    });
  }

  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) {
    return apiError({
      code: 'NOT_CONFIGURED',
      message: 'Meshy AI key not configured. Add MESHY_API_KEY to your environment variables. Get a free key at https://www.meshy.ai/',
      status: 503,
    });
  }

  const body = await req.json().catch(() => null);
  if (!body?.prompt?.trim()) return API_ERRORS.BAD_REQUEST('prompt is required');

  const { prompt, artStyle = 'realistic', negativePrompt = '', topology = 'quad', targetPolycount = 30000 } = body;

  // Step 1: Create task
  const createRes = await fetch(`${MESHY_BASE}/v2/text-to-3d`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'preview',
      prompt,
      art_style: artStyle,
      negative_prompt: negativePrompt,
      topology,
      target_polycount: targetPolycount,
    }),
  });

  if (!createRes.ok) {
    const errBody = await createRes.text().catch(() => '');
    return apiError({ code: 'MESHY_ERROR', message: `Meshy error: ${errBody}`, status: createRes.status });
  }

  const { result: taskId } = await createRes.json();
  return apiSuccess({ taskId, status: 'pending', message: 'Task created. Poll /api/tools/text-to-3d/status with taskId.' });
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) return apiError({ code: 'NOT_CONFIGURED', message: 'MESHY_API_KEY not set', status: 503 });

  const taskId = req.nextUrl.searchParams.get('taskId');
  if (!taskId) return API_ERRORS.BAD_REQUEST('taskId is required');

  const res = await fetch(`${MESHY_BASE}/v2/text-to-3d/${taskId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  if (!res.ok) return API_ERRORS.INTERNAL();
  const data = await res.json();

  return apiSuccess({
    taskId,
    status: data.status, // PENDING | IN_PROGRESS | SUCCEEDED | FAILED
    progress: data.progress || 0,
    modelUrls: data.model_urls || null, // { glb, fbx, usdz, obj, mtl }
    thumbnailUrl: data.thumbnail_url || null,
    videoUrl: data.video_url || null,
  });
}
