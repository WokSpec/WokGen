/**
 * Recraft v3 — premium image generation with vector/icon/illustration focus
 * Excellent for brand-consistent assets, icons, UI illustrations
 * API: https://www.recraft.ai/docs
 * Key: RECRAFT_API_KEY (get free at https://www.recraft.ai/)
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, API_ERRORS } from '@/lib/api-response';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

const STYLES = [
  'any', 'realistic_image', 'digital_illustration', 'vector_illustration',
  'icon', 'realistic_image/b_and_w', 'digital_illustration/pixel_art',
  'digital_illustration/hand_drawn', 'digital_illustration/grain',
  'digital_illustration/infantile_sketch', 'digital_illustration/2d_art_poster',
  'vector_illustration/line_art', 'vector_illustration/flat_2',
  'vector_illustration/bold_stroke', 'vector_illustration/kawaii',
];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return apiError(API_ERRORS.UNAUTHORIZED);

  const apiKey = process.env.RECRAFT_API_KEY;
  if (!apiKey) {
    return apiError({
      code: 'NOT_CONFIGURED',
      message: 'Recraft API key not configured. Add RECRAFT_API_KEY. Free credits at https://www.recraft.ai/',
      status: 503,
    });
  }

  const body = await req.json().catch(() => null);
  if (!body?.prompt?.trim()) return apiError(API_ERRORS.BAD_REQUEST);

  const { prompt, style = 'digital_illustration', n = 1, size = '1024x1024' } = body;

  const res = await fetch('https://external.api.recraft.ai/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, style, n, size }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    return apiError({ code: 'RECRAFT_ERROR', message: errBody.message || `Recraft error ${res.status}`, status: res.status });
  }

  const data = await res.json();
  const images = data.data?.map((img: { url: string }) => img.url) || [];

  return apiSuccess({ images, style, prompt });
}

export async function GET() {
  return apiSuccess({ styles: STYLES });
}
