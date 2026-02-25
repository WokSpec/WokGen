import { NextRequest } from 'next/server';
import { apiSuccess, apiError, API_ERRORS } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { validateBody } from '@/lib/validate';

const ExaSearchSchema = z.object({
  query:              z.string().min(1, 'query is required').max(500),
  numResults:         z.number().int().min(1).max(20).optional().default(10),
  startPublishedDate: z.string().optional(),
  category:           z.string().optional(),
});

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await auth();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rlKey = session?.user?.id ? `exa:user:${session.user.id}` : `exa:ip:${ip}`;
  const rl = await checkRateLimit(rlKey, session?.user?.id ? 30 : 20, session?.user?.id ? 3_600_000 : 60_000);
  if (!rl.allowed) return API_ERRORS.RATE_LIMITED();

  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return apiError({ message: 'Exa API not configured. Add EXA_API_KEY to your environment.', code: 'NOT_CONFIGURED', status: 503 });

  const { data: body, error: bodyError } = await validateBody(req, ExaSearchSchema);
  if (bodyError) return bodyError as Response;

  const exaBody: Record<string, unknown> = {
    query: body.query,
    num_results: body.numResults || 10,
    use_autoprompt: true,
    text: { max_characters: 800 },
    highlights: { num_sentences: 2, highlights_per_url: 1 },
  };
  if (body.startPublishedDate) exaBody.start_published_date = body.startPublishedDate;
  if (body.category) exaBody.category = body.category;

  const res = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(exaBody),
  });

  if (!res.ok) return API_ERRORS.INTERNAL();
  const data = await res.json();
  return apiSuccess({ results: data.results });
}
