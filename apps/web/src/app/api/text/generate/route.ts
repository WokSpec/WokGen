import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { callLLMWithFallback } from '@/lib/llm';

// ---------------------------------------------------------------------------
// POST /api/text/generate
//
// Generates text content using:
//   Primary:  Groq llama-3.3-70b-versatile (if GROQ_API_KEY set)
//   Fallback: Together meta-llama/Llama-3.1-70B-Instruct-Turbo
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const maxDuration = 60;

type ContentType =
  | 'headline' | 'tagline' | 'blog' | 'product-desc' | 'email'
  | 'social' | 'code-snippet' | 'story' | 'essay' | 'ad-copy';
type Tone   = 'professional' | 'casual' | 'creative' | 'technical' | 'persuasive' | 'playful';
type Length = 'micro' | 'short' | 'medium' | 'long';

const MAX_TOKENS: Record<Length, number> = {
  micro:  80,
  short:  350,
  medium: 800,
  long:   1600,
};

const SYSTEM_PROMPTS: Record<ContentType, string> = {
  headline:      'You are a world-class headline writer. Generate a single powerful headline (under 15 words). No explanation. Just the headline.',
  tagline:       'You are a branding expert. Generate a single memorable tagline (under 10 words). No explanation. Just the tagline.',
  blog:          'You are a professional content writer. Write a well-structured blog post with an engaging introduction, clear sections, and a strong conclusion.',
  'product-desc':'You are a conversion copywriter. Write a compelling product description that highlights benefits, features, and drives purchase intent.',
  email:         'You are an email marketing specialist. Write a compelling email with a strong subject line, engaging body, and clear call-to-action.',
  social:        'You are a social media strategist. Write an engaging post optimised for maximum engagement and shareability. Include relevant hashtags.',
  'code-snippet':'You are a senior software engineer. Provide clean, well-commented code that solves the problem efficiently. Include brief usage instructions.',
  story:         'You are a creative fiction writer. Write an engaging story with vivid characters, compelling conflict, and satisfying resolution.',
  essay:         'You are an academic writer. Write a well-structured essay with a clear thesis, supporting arguments, and a thoughtful conclusion.',
  'ad-copy':     'You are a direct response copywriter. Write persuasive ad copy that grabs attention, builds desire, and drives immediate action.',
};

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export async function POST(req: NextRequest) {
  // ── Auth & rate limit ────────────────────────────────────────────────────
  let authedUserId: string | null = null;
  try {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    authedUserId = session?.user?.id ?? null;
  } catch {
    // auth not available in self-hosted mode
  }

  const rateLimitKey =
    authedUserId ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  // free: 20/hr  |  paid (authed): 100/hr
  const maxReqs = authedUserId ? 100 : 20;
  const rl = await checkRateLimit(rateLimitKey, maxReqs, 3600 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let body: {
    prompt?: string;
    contentType?: ContentType;
    tone?: Tone;
    length?: Length;
    language?: string;
    userId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const prompt      = (body.prompt ?? '').trim();
  const contentType = (body.contentType ?? 'headline') as ContentType;
  const tone        = (body.tone ?? 'professional') as Tone;
  const length      = (body.length ?? 'short') as Length;

  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  const systemPrompt = `${SYSTEM_PROMPTS[contentType]}\nTone: ${tone}.`;
  const maxTokens    = MAX_TOKENS[length];

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: prompt },
  ];

  // ── Provider routing ─────────────────────────────────────────────────────
  let content = '';
  let modelUsed = '';
  try {
    const result = await callLLMWithFallback(messages as import('@/lib/llm').ChatMessage[], {
      maxTokens,
      temperature: 0.8,
    });
    content  = result.content;
    modelUsed = result.model;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 503 },
    );
  }

  if (!content) {
    return NextResponse.json({ error: 'Generation returned empty content' }, { status: 502 });
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return NextResponse.json({
    content,
    wordCount,
    charCount,
    model:        modelUsed,
    creditsUsed:  0,
  });
}
