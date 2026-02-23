import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

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

const GROQ_URL    = 'https://api.groq.com/openai/v1/chat/completions';
const TOGETHER_URL = 'https://api.together.xyz/v1/chat/completions';
const GROQ_MODEL  = 'llama-3.3-70b-versatile';
const TOGETHER_MODEL = 'meta-llama/Llama-3.1-70B-Instruct-Turbo';

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

async function callLLM(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
): Promise<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.8,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM error ${res.status}: ${errText}`);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? '';
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
  const groqKey     = process.env.GROQ_API_KEY;
  const togetherKey = process.env.TOGETHER_API_KEY;

  if (!groqKey && !togetherKey) {
    return NextResponse.json(
      { error: 'No LLM provider configured. Set GROQ_API_KEY or TOGETHER_API_KEY.' },
      { status: 503 },
    );
  }

  let content = '';
  let modelUsed = '';

  // Try Groq first
  if (groqKey) {
    try {
      content   = await callLLM(GROQ_URL, groqKey, GROQ_MODEL, messages, maxTokens);
      modelUsed = GROQ_MODEL;
    } catch (err) {
      // Fall through to Together if Groq fails
      if (!togetherKey) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : 'Generation failed' },
          { status: 502 },
        );
      }
    }
  }

  // Fallback to Together
  if (!content && togetherKey) {
    try {
      content   = await callLLM(TOGETHER_URL, togetherKey, TOGETHER_MODEL, messages, maxTokens);
      modelUsed = TOGETHER_MODEL;
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Generation failed' },
        { status: 502 },
      );
    }
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
