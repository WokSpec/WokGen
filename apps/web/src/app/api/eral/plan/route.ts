import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// POST /api/eral/plan
//
// Eral Director: Given a project brief (free-text), returns a structured
// generation plan — a list of assets to create with preset configurations.
//
// Returns: { plan: PlanItem[] }
// Each plan item has everything needed to call POST /api/generate directly.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';
const TOGETHER_URL = 'https://api.together.xyz/v1/chat/completions';

interface PlanItem {
  id: string;
  label: string;        // human-readable: "Hero warrior sprite"
  mode: string;         // pixel | business | vector | uiux | voice | code
  tool: string;         // generate | animate | scene etc.
  prompt: string;       // ready-to-use generation prompt
  size: number;         // 64 | 128 | 256 | 512
  style?: string;       // preset style name if applicable
  description: string;  // one-line explanation of why this asset is needed
}

const SYSTEM_PROMPT = `You are Eral 7c, WokGen's AI asset director.

Your job: Given a project brief, return a structured JSON plan listing the assets to generate.
The user will review the plan, then execute it to build their project.

Output format — respond with ONLY valid JSON, no markdown, no extra text:
{
  "plan": [
    {
      "id": "asset-1",
      "label": "Hero warrior sprite",
      "mode": "pixel",
      "tool": "generate",
      "prompt": "warrior hero character, pixel art, top-down view, 16 colors, outlined, transparent background",
      "size": 128,
      "style": "rpg_hero",
      "description": "The main playable character"
    }
  ]
}

Rules:
- mode must be one of: pixel, business, vector, uiux, voice, code
- tool must be: generate (for most), animate (for animation sheets), scene (for multi-view)
- size: 64 for icons, 128 for characters, 256 for tilesets, 512 for detailed art or business assets
- prompt must be specific, production-ready, with art style keywords
- Generate between 4 and 16 items depending on project scope
- For game projects: include hero, enemies, tileset, items, UI elements
- For brand projects: include logo variants, icons, social assets, UI components
- Keep prompts concise but precise — they go directly to AI image models
- Do not include explanations outside the JSON`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in to use Eral Director.' }, { status: 401 });
  }

  // Rate limit: 5 plans per hour (plans are expensive LLM calls)
  const rl = await checkRateLimit(`eral:plan:${session.user.id}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` },
      { status: 429 },
    );
  }

  let body: { projectBrief: string; mode?: string; count?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { projectBrief, mode, count = 8 } = body;
  if (!projectBrief?.trim()) {
    return NextResponse.json({ error: 'projectBrief is required.' }, { status: 400 });
  }

  const clampedCount = Math.min(16, Math.max(2, count));
  const modeHint     = mode ? ` Focus on assets for the "${mode}" mode.` : '';
  const countHint    = ` Generate exactly ${clampedCount} assets.`;

  const userMessage  = `Project brief: ${projectBrief.trim()}${modeHint}${countHint}`;

  // Resolve provider
  const groqKey     = process.env.GROQ_API_KEY;
  const togetherKey = process.env.TOGETHER_API_KEY;

  let url: string;
  let apiKey: string;
  let model: string;

  if (groqKey) {
    url = GROQ_URL; apiKey = groqKey; model = 'llama-3.3-70b-versatile';
  } else if (togetherKey) {
    url = TOGETHER_URL; apiKey = togetherKey; model = 'meta-llama/Llama-3.1-70B-Instruct-Turbo';
  } else {
    return NextResponse.json({ error: 'No AI provider configured.' }, { status: 503 });
  }

  let raw: string;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userMessage },
        ],
        max_tokens: 3000,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      return NextResponse.json({ error: `Provider error: ${err}` }, { status: 502 });
    }

    const data = await res.json();
    raw = data.choices?.[0]?.message?.content ?? '';
  } catch {
    return NextResponse.json({ error: 'Provider unreachable.' }, { status: 502 });
  }

  // Parse the JSON response
  let plan: PlanItem[];
  try {
    // Strip any markdown code fences the model may have added
    const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/```\s*$/m, '').trim();
    const parsed  = JSON.parse(cleaned);
    plan = Array.isArray(parsed.plan) ? parsed.plan : parsed;
    if (!Array.isArray(plan)) throw new Error('plan is not an array');
  } catch {
    // Return raw if JSON parsing fails so the UI can show a fallback
    return NextResponse.json({ error: 'Could not parse generation plan.', raw }, { status: 422 });
  }

  return NextResponse.json({ plan });
}
