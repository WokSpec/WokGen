import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { WAP_CAPABILITIES, parseWAPFromResponse } from '@/lib/wap';
import { pollinationsChat } from '@/lib/providers/pollinations-text';
import { groqChat } from '@/lib/providers/groq';
import { cerebrasChat } from '@/lib/providers/cerebras';

// ---------------------------------------------------------------------------
// POST /api/eral/chat
//
// Eral 7c — WokGen's AI companion. Routes to Groq / Together based on
// model variant. Supports streaming SSE and conversation persistence.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ─── Constants ──────────────────────────────────────────────────────────────

const GROQ_URL    = 'https://api.groq.com/openai/v1/chat/completions';
const TOGETHER_URL = 'https://api.together.xyz/v1/chat/completions';
const GEMINI_URL   = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const MISTRAL_URL  = 'https://api.mistral.ai/v1/chat/completions';
const COHERE_URL   = 'https://api.cohere.ai/v2/chat';

const MODEL_MAP: Record<string, { model: string; provider: 'groq' | 'together' | 'gemini' | 'mistral' | 'anthropic' | 'cohere' | 'cerebras' }> = {
  'eral-7c':       { model: 'llama-3.3-70b-versatile',              provider: 'groq'      },
  'eral-mini':     { model: 'llama3-8b-8192',                       provider: 'groq'      },
  'eral-code':     { model: 'deepseek-ai/DeepSeek-V3',              provider: 'together'  },
  'eral-creative': { model: 'mistralai/Mixtral-8x7B-Instruct-v0.1', provider: 'together'  },
  'eral-gemini':   { model: 'gemini-1.5-flash',                     provider: 'gemini'    },
  'eral-fast':     { model: 'mistral-small-latest',                  provider: 'mistral'   },
  'eral-haiku':    { model: 'claude-haiku-4-5',                      provider: 'anthropic' },
  'eral-cohere':   { model: 'command-r-plus-08-2024',                provider: 'cohere'    },
  'eral-speed':    { model: 'llama-4-scout-17b-16e',                 provider: 'cerebras'  },
  'eral-cerebras': { model: 'llama3.1-70b',                          provider: 'cerebras'  },
};

// Fallback for eral-7c when Groq key is absent
const ERAL_7C_TOGETHER_FALLBACK = 'meta-llama/Llama-3.1-70B-Instruct-Turbo';

// ─── Rate limiting (Redis → Postgres → in-memory, shared across all instances) ─

const ERAL_RL_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ─── System prompt ──────────────────────────────────────────────────────────

const ERAL_SYSTEM_PROMPT = `You are Eral 7c, WokGen Studio's AI creative companion. You help with creative direction, copywriting, strategy, and code.

WokSpec is a creative technology company. WokGen is their multi-engine AI asset generation platform at wokgen.wokspec.org, offering:
- WokGen Pixel: Sprites, tilesets, animations for game developers
- WokGen Business: Logos, brand kits, slide decks, social assets for brands
- WokGen Vector: SVG icon sets, illustrations, design system components
- WokGen Emoji: Custom emoji packs, reactions, sticker sets
- WokGen UI/UX: React/HTML/Vue/Svelte components, design systems, page templates
- WokGen Voice: Text-to-speech, character voices, audio generation
- WokGen Text: Headlines, copy, blog posts, code snippets, creative writing

Your 7 capabilities (the "7c"):
1. Create: Generate, improve, and refine prompts for any WokGen mode
2. Code: Explain, scaffold, debug front-end and back-end code
3. Chat: Natural conversation on any topic — no restriction on subject matter
4. Context: Deep WokSpec product knowledge; always link to relevant studios when appropriate
5. Copy: Write headlines, descriptions, marketing copy, emails, social posts
6. Critique: Review and improve prompts, designs, code, business ideas
7. Connect: Research, synthesize, reason through problems

TONE AND STYLE:
- Respond in a professional, direct tone. Be concise.
- Never use filler phrases like "Certainly!", "Of course!", "Great question!", "Absolutely!", or "Sure!".
- Get straight to the point. No preamble.
- Honest about uncertainty — say "I'm not sure" rather than hallucinating.

RESPONSE FORMAT:
- Use markdown for code blocks, lists, and headers.
- Keep responses focused — do not pad unnecessarily.
- For prompting help, always output the exact prompt the user should paste.

WOKGEN TOOLS REFERENCE (recommend these when relevant):
- Background Remover (/tools/background-remover): Remove backgrounds from any image — ideal after generating pixel art characters or product shots.
- Sprite Packer (/tools/sprite-packer): Pack multiple sprites into a single spritesheet — use after generating a set of pixel art frames.
- Mockup Generator (/tools/mockup): Place logos or designs onto product mockups — use after Business Studio generation.
- Color Tools (/tools/color-tools): Palette extraction, contrast checker, color harmonies.
- Font Pairer (/tools/font-pairer): Find complementary font combinations for brand projects.
- Whiteboard (/tools/whiteboard): Visual planning and wireframing before generating assets.
- OG Analyzer (/tools/og-analyzer): Analyze any URL's Open Graph metadata and social preview.
- JSON Tools (/tools/json-tools): Format, validate, and transform JSON data.
- CSS Generator (/tools/css-generator): Generate CSS from design tokens or descriptions.
- Markdown Editor (/tools/markdown): Write and preview markdown documents.

MULTI-STEP WORKFLOW GUIDANCE:
When a user asks to create something complex, suggest the full workflow across tools. Examples:
- "Create a game character" → Pixel Studio (generate character) → Background Remover (isolate it) → Sprite Packer (pack animation frames) → Voice Studio (character sound effects)
- "Create a brand identity" → Business Studio (logo + brand kit) → Background Remover (transparent logo) → Mockup Generator (product mockups) → Text Studio (brand copy)
- "Build a game world" → Pixel Studio (tiles and characters) → Whiteboard (map layout) → Voice Studio (ambient audio) → Business Studio (game logo)
- "Launch a product" → Business Studio (logo, hero images) → Text Studio (landing page copy) → UI/UX Studio (page components) → Mockup Generator (preview mockups)
Always suggest the next logical step after generating an asset.

BRAND CONTEXT INSTRUCTIONS:
When brand context is available in the conversation (brand name, colors, industry, mood), ALWAYS reference the brand's colors, mood, and industry in generation suggestions. For example: "Given your brand's navy and gold palette with a professional mood, I'd suggest..." — Never give generic suggestions when brand context exists.

IMAGE PROMPT CRAFTING:
When generating image prompts, always include these elements:
1. Subject and action
2. Art style (pixel art, vector, watercolor, 3D render, etc.)
3. Lighting (dramatic side lighting, soft ambient, rim light, etc.)
4. Color palette reference (warm earth tones, neon blues and pinks, muted pastels, etc.)
5. Mood/atmosphere (dark and moody, vibrant and energetic, calm and minimal, etc.)

Example well-crafted prompt: "a pixel art knight in blue and gold armor, dramatic side lighting, dark dungeon background, determined expression, rich jewel tones, high contrast"

Always output the complete prompt the user can paste directly, not just a description of what to include.

CROSS-MODE WORKFLOWS (proactively suggest these):
- After pixel character → suggest Background Remover, then Sprite Packer
- After business logo → suggest Background Remover (transparent version), then Mockup Generator
- After voice generation → suggest Text Studio for the script
- After text headline → suggest Business Studio for a visual treatment
- After vector icon set → suggest Emoji Studio for a matching emoji pack
- After any generation → suggest related tools from WOKGEN TOOLS REFERENCE above

You were created by WokSpec. Do not claim to be any other AI system.

${WAP_CAPABILITIES}`;

const PERSONALITY_MODIFIERS: Record<string, string> = {
  balanced:  '',
  technical: '\n\nAdditional instruction: This user prefers technical depth. Use precise terminology. Include implementation details. Show code when relevant.',
  creative:  '\n\nAdditional instruction: This user prefers creative exploration. Suggest unconventional approaches. Think expansively.',
  concise:   '\n\nAdditional instruction: This user prefers brevity. Be extremely concise. One or two sentences when possible. Bullet points over paragraphs.',
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatRequest {
  message: string;
  conversationId?: string;
  modelVariant?: 'eral-7c' | 'eral-mini' | 'eral-code' | 'eral-creative' | 'eral-gemini' | 'eral-fast' | 'eral-haiku' | 'eral-cohere' | 'eral-speed' | 'eral-cerebras';
  context?: {
    mode?: string;
    tool?: string;
    prompt?: string;
    studioContext?: string;
    projectId?: string;
  };
  stream?: boolean;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function resolveEndpointAndKey(variant: string): {
  url: string;
  apiKey: string;
  model: string;
  provider?: string;
} {
  const mapping = MODEL_MAP[variant] ?? MODEL_MAP['eral-7c'];
  const groqKey      = process.env.GROQ_API_KEY;
  const togetherKey  = process.env.TOGETHER_API_KEY;
  const geminiKey    = process.env.GOOGLE_AI_API_KEY;
  const mistralKey   = process.env.MISTRAL_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const cohereKey    = process.env.COHERE_API_KEY;

  if (mapping.provider === 'cerebras') {
    const cerebrasKey = process.env.CEREBRAS_API_KEY;
    if (cerebrasKey) {
      return { url: 'cerebras', apiKey: cerebrasKey, model: mapping.model, provider: 'cerebras' };
    }
    // Fall through to groq fallback
  }

  if (mapping.provider === 'anthropic') {    if (anthropicKey) {
      return { url: 'anthropic', apiKey: anthropicKey, model: mapping.model, provider: 'anthropic' };
    }
    // Fall through to groq fallback
  }

  if (mapping.provider === 'cohere') {
    if (cohereKey) {
      return { url: COHERE_URL, apiKey: cohereKey, model: mapping.model, provider: 'cohere' };
    }
    // Fall through to groq fallback
  }

  if (mapping.provider === 'gemini') {
    if (geminiKey) {
      return { url: `${GEMINI_URL}?key=${geminiKey}`, apiKey: geminiKey, model: mapping.model, provider: 'gemini' };
    }
    // Fall through to groq fallback
  }

  if (mapping.provider === 'mistral') {
    if (mistralKey) {
      return { url: MISTRAL_URL, apiKey: mistralKey, model: mapping.model, provider: 'mistral' };
    }
    // Fall through to groq fallback
  }

  if (mapping.provider === 'groq') {
    if (groqKey) {
      return { url: GROQ_URL, apiKey: groqKey, model: mapping.model };
    }
    // Fallback eral-7c and eral-mini to Together when Groq key is missing
    if (togetherKey) {
      return {
        url: TOGETHER_URL,
        apiKey: togetherKey,
        model: variant === 'eral-mini'
          ? 'meta-llama/Llama-3.1-8B-Instruct-Turbo'
          : ERAL_7C_TOGETHER_FALLBACK,
      };
    }
    return { url: 'pollinations', apiKey: '', model: 'openai' };
  }

  // Together models
  if (!togetherKey) {
    // Try Groq as last resort
    if (groqKey) {
      return { url: GROQ_URL, apiKey: groqKey, model: 'llama-3.3-70b-versatile' };
    }
    return { url: 'pollinations', apiKey: '', model: 'openai' };
  }
  return { url: TOGETHER_URL, apiKey: togetherKey, model: mapping.model };
}

function buildContextNote(ctx: ChatRequest['context']): string | null {
  if (!ctx) return null;
  const parts: string[] = [];
  if (ctx.mode) parts.push(`User is in WokGen ${ctx.mode} Studio`);
  if (ctx.tool) parts.push(`currently working on: ${ctx.tool}`);
  if (ctx.prompt) parts.push(`"${ctx.prompt}"`);
  if (ctx.studioContext) parts.push(ctx.studioContext);
  if (parts.length === 0) return null;
  return `[Studio Context: ${parts.join(', ')}]`;
}

async function getOrCreateConversation(
  conversationId: string | undefined,
  userId: string | undefined,
  mode: string | undefined,
): Promise<{ id: string; isNew: boolean }> {
  if (conversationId) {
    const existing = await prisma.eralConversation.findFirst({
      where: { id: conversationId, userId: userId ?? null },
    });
    if (existing) return { id: existing.id, isNew: false };
  }

  const created = await prisma.eralConversation.create({
    data: { userId: userId ?? null, mode: mode ?? null },
  });
  return { id: created.id, isNew: true };
}

async function fetchHistory(conversationId: string): Promise<OpenAIMessage[]> {
  const messages = await prisma.eralMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 10, // last 10 messages
  });
  return messages.map((m) => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
  }));
}

// ─── Non-streaming handler ───────────────────────────────────────────────────

async function handleAnthropicNonStreaming(
  messages: OpenAIMessage[],
  apiKey: string,
  model: string,
): Promise<{ reply: string; durationMs: number }> {
  const start = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Anthropic = require('@anthropic-ai/sdk').default as typeof import('@anthropic-ai/sdk').default;
  const client = new Anthropic({ apiKey });

  // Extract system message
  const system = messages.find(m => m.role === 'system')?.content ?? '';
  const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system,
    messages: userMessages,
  });

  const reply = response.content[0]?.type === 'text' ? response.content[0].text : '';
  return { reply, durationMs: Date.now() - start };
}

async function handleCohereNonStreaming(
  messages: OpenAIMessage[],
  url: string,
  apiKey: string,
  model: string,
): Promise<{ reply: string; durationMs: number }> {
  const start = Date.now();
  const system = messages.find(m => m.role === 'system')?.content ?? '';
  const chatHistory = messages
    .filter(m => m.role !== 'system')
    .slice(0, -1)
    .map(m => ({ role: m.role === 'user' ? 'USER' : 'CHATBOT', message: m.content }));
  const lastMessage = messages.filter(m => m.role === 'user').at(-1)?.content ?? '';

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, message: lastMessage, chat_history: chatHistory, preamble: system, max_tokens: 2048 }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Cohere error ${res.status}: ${errText}`);
  }

  const data = await res.json() as { text?: string; message?: { content?: Array<{ text?: string }> } };
  const reply = data.text ?? data.message?.content?.[0]?.text ?? '';
  return { reply, durationMs: Date.now() - start };
}

async function handleNonStreaming(
  messages: OpenAIMessage[],
  url: string,
  apiKey: string,
  model: string,
  provider?: string,
): Promise<{ reply: string; durationMs: number }> {
  const start = Date.now();

  if (provider === 'anthropic') {
    return handleAnthropicNonStreaming(messages, apiKey, model);
  }

  if (provider === 'cohere') {
    return handleCohereNonStreaming(messages, url, apiKey, model);
  }

  if (provider === 'cerebras') {
    const systemMsg = messages.find(m => m.role === 'system')?.content ?? '';
    const userMsg = messages.filter(m => m.role === 'user').at(-1)?.content ?? '';
    const result = await cerebrasChat(systemMsg, userMsg, { model, maxTokens: 2048 });
    return { reply: result.text, durationMs: Date.now() - start };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, stream: false, max_tokens: 2048 }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Provider error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const reply: string = data.choices?.[0]?.message?.content ?? '';
  return { reply, durationMs: Date.now() - start };
}

// ─── Main handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  // Rate limiting — Redis → Postgres → in-memory (correct at scale on Vercel multi-instance)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rlKey = `eral:${userId ?? ip}`;
  const rlMax = userId ? 50 : 10;
  const rl = await checkRateLimit(rlKey, rlMax, ERAL_RL_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rl.retryAfter },
      { status: 429, headers: {
        'Retry-After':           String(rl.retryAfter ?? 60),
        'X-RateLimit-Limit':     String(rlMax),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset':     String(Math.floor(Date.now() / 1000) + (rl.retryAfter ?? 60)),
      } },
    );
  }

  let body: ChatRequest;
  try {
    const raw = await req.json();
    const Schema = z.object({
      message:       z.string().min(1).max(4000),
      conversationId: z.string().cuid().optional(),
      modelVariant:  z.enum(['eral-7c','eral-mini','eral-code','eral-creative','eral-gemini','eral-fast','eral-haiku','eral-cohere','eral-speed','eral-cerebras']).optional(),
      stream:        z.boolean().optional(),
      context:       z.object({
        mode:      z.string().optional(),
        projectId: z.string().optional(),
        prompt:    z.string().max(2000).optional(),
      }).optional(),
    });
    const parsed = Schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }
    body = parsed.data as ChatRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { message, conversationId, modelVariant = 'eral-7c', context, stream } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  // Resolve provider config
  let providerConfig: { url: string; apiKey: string; model: string; provider?: string };
  try {
    providerConfig = resolveEndpointAndKey(modelVariant);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Provider configuration error' },
      { status: 503 },
    );
  }

  // Get or create conversation
  let conv: { id: string; isNew: boolean };
  try {
    conv = await getOrCreateConversation(conversationId, userId, context?.mode);
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Record activity event for new conversations in a project context (non-blocking)
  if (conv.isNew && userId && context?.projectId) {
    prisma.activityEvent.create({
      data: {
        projectId: context.projectId,
        userId,
        type: 'eral.conversation',
        message: `Started Eral conversation`,
        refId: conv.id,
      },
    }).catch(() => {});
  }

  // Build message list
  const contextNote = buildContextNote(context);

  // Fetch user preferences and inject as context
  let userPrefsContext = '';
  let personalityModifier = '';
  if (userId) {
    const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }).catch(() => null);
    if (userRecord?.name) {
      userPrefsContext += `\n\n[User's name: ${userRecord.name}]`;
    }
    const userPrefs = await prisma.userPreference.findUnique({ where: { userId } }).catch(() => null);
    if (userPrefs) {
      const recentModePrefs: string[] = [];
      if (userPrefs.pixelPrefs)    recentModePrefs.push(`Pixel preferences: ${userPrefs.pixelPrefs}`);
      if (userPrefs.businessPrefs) recentModePrefs.push(`Business preferences: ${userPrefs.businessPrefs}`);
      if (userPrefs.voicePrefs)    recentModePrefs.push(`Voice preferences: ${userPrefs.voicePrefs}`);
      if (recentModePrefs.length > 0) {
        userPrefsContext = `\n\n[User Preferences: ${recentModePrefs.join('; ')}]`;
      }
      // Inject Eral memory (user-saved facts)
      if (userPrefs.eralMemory) {
        try {
          const memFacts = JSON.parse(userPrefs.eralMemory) as Array<{ key: string; value: string }>;
          if (memFacts.length > 0) {
            const memStr = memFacts.slice(0, 10).map(f => `- ${f.key}: ${f.value}`).join('\n');
            userPrefsContext += `\n\n[Things this user wants you to remember:\n${memStr}]`;
          }
        } catch { /* non-fatal */ }
      }
      // Inject Eral context (intro answers)
      if (userPrefs.eralContext) {
        try {
          const ctx = JSON.parse(userPrefs.eralContext) as { projectType?: string; mainTool?: string; stylePreference?: string };
          const parts: string[] = [];
          if (ctx.projectType)     parts.push(`working on: ${ctx.projectType}`);
          if (ctx.mainTool)        parts.push(`main tool: ${ctx.mainTool}`);
          if (ctx.stylePreference) parts.push(`style preference: ${ctx.stylePreference}`);
          if (parts.length > 0) {
            userPrefsContext += `\n\n[User context: ${parts.join(', ')}]`;
          }
        } catch { /* non-fatal */ }
      }
      const personality = userPrefs.eralPersonality ?? 'balanced';
      personalityModifier = PERSONALITY_MODIFIERS[personality] ?? '';
    }
  }

  // Inject project context: last 20 generated assets for this project
  let projectContext = '';
  if (context?.projectId && userId) {
    try {
      const projectJobs = await prisma.job.findMany({
        where:   { projectId: context.projectId, userId, status: 'completed' },
        orderBy: { createdAt: 'desc' },
        take:    20,
        select:  { tool: true, mode: true, prompt: true, createdAt: true },
      });
      if (projectJobs.length > 0) {
        const assetList = projectJobs
          .map(j => `- [${j.mode}/${j.tool}] "${j.prompt.slice(0, 80)}"`)
          .join('\n');
        projectContext = `\n\n[Project Context — last ${projectJobs.length} assets generated in this project:\n${assetList}\nUse this context to give consistent, project-aware suggestions. If the user asks "what am I missing?", analyze the asset types present and suggest what would complete the project.]`;
      }

      // Inject project brief if available
      const brief = await prisma.projectBrief.findUnique({
        where:  { projectId: context.projectId },
        select: { content: true, projectType: true },
      });
      if (brief?.content) {
        projectContext += `\n[Project Brief: ${brief.content.slice(0, 500)}${brief.projectType ? ` | Type: ${brief.projectType}` : ''}]`;
      }

      // Also inject brand kit if available
      const kit = await prisma.brandKit.findFirst({
        where:  { projectId: context.projectId },
        select: { name: true, industry: true, mood: true, styleGuide: true, paletteJson: true },
      });
      if (kit) {
        const palette = JSON.parse(kit.paletteJson || '[]') as { hex?: string; role?: string; name?: string }[];
        const palStr = palette.slice(0, 5).map(c => `${c.role ?? 'color'}: ${c.hex ?? '?'}`).join(', ');
        projectContext += `\n[Brand Kit: "${kit.name}" | Industry: ${kit.industry ?? 'unknown'} | Mood: ${kit.mood ?? 'unknown'} | Palette: ${palStr}]`;
      }
    } catch { /* non-fatal */ }
  }

  // Fetch recent EralNotes to inject into system prompt
  let notesSection = '';
  if (userId) {
    try {
      const eralNotes = await prisma.eralNote.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: { title: true, content: true, color: true },
      });
      if (eralNotes.length > 0) {
        notesSection = `\n\nUSER NOTES (things the user has saved for Eral to remember):\n${eralNotes.map(n => `- [${n.color || 'note'}] ${n.title}: ${n.content?.slice(0, 200)}`).join('\n')}`;
      }
    } catch { /* non-fatal */ }
  }

  // ─── Web augmentation (Jina Reader + Exa) ─────────────────────────────────
  let webContext = '';

  const urlMatch = message.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const jinaRes = await fetch(`https://r.jina.ai/${urlMatch[0]}`, {
        headers: { 'Accept': 'text/markdown', 'X-Return-Format': 'markdown' },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (jinaRes.ok) {
        const pageText = await jinaRes.text();
        webContext = `\n\n[Page content from ${urlMatch[0]}]:\n${pageText.slice(0, 3000)}`;
      }
    } catch { /* graceful fallback */ }
  }

  const searchKeywords = /search for|look up|find me|what is.*latest|current|news about|recent/i;
  if (searchKeywords.test(message) && process.env.EXA_API_KEY) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const exaRes = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          num_results: 5,
          use_autoprompt: true,
          text: { max_characters: 500 },
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (exaRes.ok) {
        const exaData = await exaRes.json();
        const results = exaData.results?.slice(0, 3).map((r: { title: string; url: string; text?: string }) =>
          `[${r.title}](${r.url}): ${r.text?.slice(0, 200) || ''}`
        ).join('\n');
        if (results) webContext += `\n\n[Web search results for "${message}"]:\n${results}`;
      }
    } catch { /* graceful fallback */ }
  }

  const systemContent = [
    ERAL_SYSTEM_PROMPT,
    personalityModifier,
    contextNote ? `\n\n${contextNote}` : '',
    userPrefsContext,
    projectContext,
    notesSection,
    webContext,
    '\n\nKeep responses focused. Use markdown for structure when helpful.',
  ].join('').trim();

  const history = conv.isNew ? [] : await fetchHistory(conv.id);
  const llmMessages: OpenAIMessage[] = [
    { role: 'system', content: systemContent },
    ...history,
    { role: 'user', content: message.trim() },
  ];

  // Save user message to DB
  const userMsg = await prisma.eralMessage.create({
    data: {
      conversationId: conv.id,
      role: 'user',
      content: message.trim(),
    },
  });

  // Auto-title conversation on first message
  if (conv.isNew) {
    const trimmed = message.trim();
    const title = trimmed.slice(0, 60) + (trimmed.length > 60 ? '...' : '');
    prisma.eralConversation.update({
      where: { id: conv.id },
      data: { title },
    }).catch(() => {});
  }

  // ── Pollinations fallback (no API key configured) ─────────────────────────
  if (providerConfig.url === 'pollinations') {
    const lastUserMessage = message.trim();
    try {
      const text = await pollinationsChat(systemContent, lastUserMessage);
      const { cleanReply, wap } = parseWAPFromResponse(text);
      await prisma.eralMessage.create({
        data: {
          conversationId: conv.id,
          role: 'assistant',
          content: cleanReply,
          modelUsed: 'pollinations-openai',
          durationMs: 0,
        },
      }).catch(() => {});
      return NextResponse.json({
        reply: cleanReply,
        wap: wap ?? null,
        conversationId: conv.id,
        messageId: userMsg.id,
        model: 'pollinations-openai',
        variant: modelVariant,
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Generation failed' },
        { status: 502 },
      );
    }
  }

  // ── Streaming path ────────────────────────────────────────────────────────
  if (stream) {
    const { url, apiKey, model } = providerConfig;
    const start = Date.now();

    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages: llmMessages, stream: true, max_tokens: 2048 }),
      });
    } catch (err) {
      return NextResponse.json({ error: 'Provider unreachable' }, { status: 502 });
    }

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => upstreamRes.statusText);
      return NextResponse.json(
        { error: `Provider error ${upstreamRes.status}: ${errText}` },
        { status: 502 },
      );
    }

    const encoder = new TextEncoder();
    let fullReply = '';

    const readable = new ReadableStream({
      async start(controller) {
        const reader = upstreamRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;
              const data = trimmed.slice(5).trim();
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                const token: string = parsed.choices?.[0]?.delta?.content ?? '';
                if (token) {
                  fullReply += token;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        } finally {
          reader.releaseLock();

          // Parse WAP from accumulated reply
          const { cleanReply, wap } = parseWAPFromResponse(fullReply);

          // Emit WAP event before closing if actions were found
          if (wap) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ wap })}\n\n`));
          }

          controller.close();

          // Persist assistant message after stream ends (store clean reply without <wap> tags)
          const durationMs = Date.now() - start;
          prisma.eralMessage.create({
            data: {
              conversationId: conv.id,
              role: 'assistant',
              content: cleanReply,
              modelUsed: model,
              durationMs,
            },
          }).catch(() => {});
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Conversation-Id': conv.id,
        'X-User-Message-Id': userMsg.id,
        Connection: 'keep-alive',
      },
    });
  }

  // ── Non-streaming path ────────────────────────────────────────────────────
  let reply: string;
  let durationMs: number;
  let modelUsed = providerConfig.model;
  try {
    ({ reply, durationMs } = await handleNonStreaming(
      llmMessages,
      providerConfig.url,
      providerConfig.apiKey,
      providerConfig.model,
      providerConfig.provider,
    ));
  } catch (primaryErr) {
    // Fallback to Groq (free tier) when primary provider fails
    if (process.env.GROQ_API_KEY && providerConfig.url !== GROQ_URL) {
      try {
        const start = Date.now();
        const systemContent = llmMessages.find(m => m.role === 'system')?.content ?? '';
        const userContent = llmMessages.filter(m => m.role === 'user').at(-1)?.content ?? message.trim();
        const groqResult = await groqChat(systemContent, userContent, { maxTokens: 2048 });
        reply = groqResult.text;
        durationMs = Date.now() - start;
        modelUsed = 'llama-3.3-70b-versatile';
      } catch {
        return NextResponse.json(
          { error: primaryErr instanceof Error ? primaryErr.message : 'Generation failed' },
          { status: 502 },
        );
      }
    } else {
      return NextResponse.json(
        { error: primaryErr instanceof Error ? primaryErr.message : 'Generation failed' },
        { status: 502 },
      );
    }
  }

  // Persist assistant message
  const { cleanReply, wap } = parseWAPFromResponse(reply);
  const assistantMsg = await prisma.eralMessage.create({
    data: {
      conversationId: conv.id,
      role: 'assistant',
      content: cleanReply,
      modelUsed: modelUsed,
      durationMs,
    },
  });

  return NextResponse.json({
    reply: cleanReply,
    wap: wap ?? null,
    conversationId: conv.id,
    messageId: assistantMsg.id,
    modelUsed: modelUsed,
    durationMs,
  });
}
