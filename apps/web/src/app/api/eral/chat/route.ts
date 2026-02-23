import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { WAP_CAPABILITIES, parseWAPFromResponse } from '@/lib/wap';

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

const MODEL_MAP: Record<string, { model: string; provider: 'groq' | 'together' | 'gemini' | 'mistral' }> = {
  'eral-7c':       { model: 'llama-3.3-70b-versatile',              provider: 'groq'    },
  'eral-mini':     { model: 'llama3-8b-8192',                       provider: 'groq'    },
  'eral-code':     { model: 'deepseek-ai/DeepSeek-V3',              provider: 'together' },
  'eral-creative': { model: 'mistralai/Mixtral-8x7B-Instruct-v0.1', provider: 'together' },
  'eral-gemini':   { model: 'gemini-1.5-flash',                     provider: 'gemini'   },
  'eral-fast':     { model: 'mistral-small-latest',                  provider: 'mistral'  },
};

// Fallback for eral-7c when Groq key is absent
const ERAL_7C_TOGETHER_FALLBACK = 'meta-llama/Llama-3.1-70B-Instruct-Turbo';

// ─── Rate limiting (Redis → Postgres → in-memory, shared across all instances) ─

const ERAL_RL_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ─── System prompt ──────────────────────────────────────────────────────────

const ERAL_SYSTEM_PROMPT = `You are Eral 7c, the AI companion built by WokSpec for the WokGen platform.

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

Your personality:
- Direct and concise — no filler phrases like "Great question!" or "Certainly!"
- Technically precise but accessible
- Creative when the task calls for it
- Honest about uncertainty — say "I'm not sure" rather than hallucinating
- When relevant, suggest which WokGen studio could help: "You could generate that in the Pixel Studio"

Response format:
- Use markdown for code blocks, lists, headers
- Keep responses focused — don't pad unnecessarily
- For prompting help, always output the exact prompt the user should paste

Cross-mode workflows you can suggest:
- Pixel character → suggest Business Studio for a matching logo/brand
- Business logo → suggest Pixel Studio for a game-ready icon version
- Voice generation → suggest Text Studio for the script
- Text headline → suggest Business Studio for a visual
- Vector icon set → suggest Emoji Studio for a matching emoji pack

When a user generates something in one mode, proactively suggest related work in other modes.

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
  modelVariant?: 'eral-7c' | 'eral-mini' | 'eral-code' | 'eral-creative' | 'eral-gemini' | 'eral-fast';
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
  const groqKey    = process.env.GROQ_API_KEY;
  const togetherKey = process.env.TOGETHER_API_KEY;
  const geminiKey  = process.env.GOOGLE_AI_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;

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
    throw new Error('No API key configured. Set GROQ_API_KEY or TOGETHER_API_KEY.');
  }

  // Together models
  if (!togetherKey) {
    // Try Groq as last resort
    if (groqKey) {
      return { url: GROQ_URL, apiKey: groqKey, model: 'llama-3.3-70b-versatile' };
    }
    throw new Error('No API key configured. Set TOGETHER_API_KEY.');
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
    const existing = await prisma.eralConversation.findUnique({
      where: { id: conversationId },
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

async function handleNonStreaming(
  messages: OpenAIMessage[],
  url: string,
  apiKey: string,
  model: string,
): Promise<{ reply: string; durationMs: number }> {
  const start = Date.now();

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
      modelVariant:  z.enum(['eral-7c','eral-mini','eral-code','eral-creative','eral-gemini','eral-fast']).optional(),
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
  let providerConfig: { url: string; apiKey: string; model: string };
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

  // Build message list
  const contextNote = buildContextNote(context);

  // Fetch user preferences and inject as context
  let userPrefsContext = '';
  let personalityModifier = '';
  if (userId) {
    const userPrefs = await prisma.userPreference.findUnique({ where: { userId } }).catch(() => null);
    if (userPrefs) {
      const recentModePrefs: string[] = [];
      if (userPrefs.pixelPrefs)    recentModePrefs.push(`Pixel preferences: ${userPrefs.pixelPrefs}`);
      if (userPrefs.businessPrefs) recentModePrefs.push(`Business preferences: ${userPrefs.businessPrefs}`);
      if (userPrefs.voicePrefs)    recentModePrefs.push(`Voice preferences: ${userPrefs.voicePrefs}`);
      if (recentModePrefs.length > 0) {
        userPrefsContext = `\n\n[User Preferences: ${recentModePrefs.join('; ')}]`;
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
        select:  { tool: true, prompt: true, createdAt: true },
      });
      if (projectJobs.length > 0) {
        const assetList = projectJobs
          .map(j => `- [${j.tool}] "${j.prompt.slice(0, 80)}"`)
          .join('\n');
        projectContext = `\n\n[Project Context — last ${projectJobs.length} assets generated in this project:\n${assetList}\nUse this context to give consistent, project-aware suggestions.]`;
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

  const systemContent = [
    ERAL_SYSTEM_PROMPT,
    personalityModifier,
    contextNote ? `\n\n${contextNote}` : '',
    userPrefsContext,
    projectContext,
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
    const title = message.trim().slice(0, 80);
    await prisma.eralConversation.update({
      where: { id: conv.id },
      data: { title },
    }).catch(() => {});
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
  try {
    ({ reply, durationMs } = await handleNonStreaming(
      llmMessages,
      providerConfig.url,
      providerConfig.apiKey,
      providerConfig.model,
    ));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 502 },
    );
  }

  // Persist assistant message
  const { cleanReply, wap } = parseWAPFromResponse(reply);
  const assistantMsg = await prisma.eralMessage.create({
    data: {
      conversationId: conv.id,
      role: 'assistant',
      content: cleanReply,
      modelUsed: providerConfig.model,
      durationMs,
    },
  });

  return NextResponse.json({
    reply: cleanReply,
    wap: wap ?? null,
    conversationId: conv.id,
    messageId: assistantMsg.id,
    modelUsed: providerConfig.model,
    durationMs,
  });
}
