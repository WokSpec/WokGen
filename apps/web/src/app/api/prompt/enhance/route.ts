import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// POST /api/prompt/enhance
//
// Takes a user prompt + mode and returns 3 enhanced variations.
// Uses the cheapest/fastest model — this is always free (no credit cost).
// Rate limit: 20/min per user.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL    = 'llama3-8b-8192'; // fast, cheap

const MODE_CONTEXT: Record<string, string> = {
  pixel:    'pixel art sprites and game assets (16x16 to 512x512, retro aesthetics, limited palettes)',
  business: 'professional business graphics (logos, banners, social media, brand assets)',
  vector:   'vector illustrations and icon sets (scalable, clean lines, design systems)',
  emoji:    'custom emoji and reaction packs (expressive, clear at small sizes)',
  uiux:     'UI/UX components and interface designs (React-ready, accessible)',
  voice:    'text-to-speech narration (tone, pacing, emotional delivery)',
};

const RequestSchema = z.object({
  prompt: z.string().min(1).max(500),
  mode:   z.string().optional().default('pixel'),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId  = session?.user?.id;

  if (!userId && !process.env.SELF_HOSTED) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // Rate limit: 20/min
  const rlKey = `prompt-enhance:${userId ?? 'guest'}`;
  const rl    = await checkRateLimit(rlKey, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 60) } });
  }

  const rawBody = await req.json().catch(() => null);
  if (!rawBody) return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });

  const parsed = RequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { prompt, mode } = parsed.data;
  const modeCtx = MODE_CONTEXT[mode] ?? MODE_CONTEXT.pixel;

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json({ error: 'LLM provider not configured.' }, { status: 503 });
  }

  const systemPrompt = `You are a prompt engineer specializing in ${modeCtx}.
Given a user's generation prompt, return exactly 3 improved variations.
Rules:
- Each variation must be a single line, no preamble, no numbering
- Add specific technical details: art style, lighting, composition, color palette, technique
- Keep the user's core intent intact
- Rank by specificity: variation 1 is closest to original + slightly improved, variation 3 is most detailed and directive
- Never add disclaimers or explanations
- Output: JSON array of 3 strings only`;

  const userMessage = `Original prompt: "${prompt}"`;

  let llmResponse: Response;
  try {
    llmResponse = await fetch(GROQ_URL, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        model:       MODEL,
        temperature: 0.7,
        max_tokens:  400,
        messages:    [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userMessage  },
        ],
        response_format: { type: 'json_object' },
      }),
    });
  } catch {
    return NextResponse.json({ error: 'LLM request failed.' }, { status: 502 });
  }

  if (!llmResponse.ok) {
    return NextResponse.json({ error: 'LLM provider error.' }, { status: 502 });
  }

  const llmJson = await llmResponse.json().catch(() => null);
  const raw = llmJson?.choices?.[0]?.message?.content ?? '';

  let variations: string[] = [];
  try {
    const parsed = JSON.parse(raw);
    // Handle both { variations: [...] } and bare array
    const arr = Array.isArray(parsed) ? parsed : (parsed.variations ?? parsed.prompts ?? Object.values(parsed));
    variations = arr.filter((v: unknown) => typeof v === 'string').slice(0, 3);
  } catch {
    // Fallback: extract quoted strings
    const matches = raw.match(/"([^"]{10,})"/g);
    if (matches) variations = matches.map((m: string) => m.slice(1, -1)).slice(0, 3);
  }

  if (!variations.length) {
    return NextResponse.json({ error: 'Failed to generate variations.' }, { status: 500 });
  }

  return NextResponse.json({ variations });
}
