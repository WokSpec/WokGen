/**
 * Ideogram API — best-in-class text rendering in AI images
 * Generates images where text actually looks legible and correct.
 * API: https://developer.ideogram.ai/
 * Key: IDEOGRAM_API_KEY
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, API_ERRORS } from '@/lib/api-response';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return API_ERRORS.UNAUTHORIZED();

  const rl = await checkRateLimit(`ideogram:${session.user.id}`, 20, 3_600_000);
  if (!rl.allowed) {
    return Response.json({ error: 'Rate limit exceeded. Please try again later.' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter ?? 60) },
    });
  }

  const apiKey = process.env.IDEOGRAM_API_KEY;
  if (!apiKey) {
    return apiError({
      code: 'NOT_CONFIGURED',
      message: 'Ideogram API key not configured. Add IDEOGRAM_API_KEY. Get key at https://developer.ideogram.ai/',
      status: 503,
    });
  }

  const body = await req.json().catch(() => null);
  if (!body?.prompt?.trim()) return API_ERRORS.BAD_REQUEST('prompt is required');

  const { prompt, negativePrompt = '', aspectRatio = 'ASPECT_1_1', model = 'V_2', styleType = 'AUTO', magicPrompt = 'AUTO' } = body;

  const res = await fetch('https://api.ideogram.ai/generate', {
    method: 'POST',
    headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_request: {
        prompt,
        negative_prompt: negativePrompt,
        aspect_ratio: aspectRatio,
        model,
        style_type: styleType,
        magic_prompt_option: magicPrompt,
        num_images: 1,
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    return apiError({ code: 'IDEOGRAM_ERROR', message: errBody.message || `Ideogram error ${res.status}`, status: res.status });
  }

  const data = await res.json();
  const image = data.data?.[0];
  if (!image) return API_ERRORS.INTERNAL();

  return apiSuccess({
    url: image.url,
    prompt: image.prompt,
    resolution: image.resolution,
    seed: image.seed,
    isImageSafe: image.is_image_safe,
  });
}
