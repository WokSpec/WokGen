import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// POST /api/eral/simulate
//
// Multi-agent AI conversation simulator.
// Given N personas and a topic/scenario, generates a turn-by-turn debate,
// roast battle, brainstorm, or interview. Each agent speaks in character.
//
// Body:
//   personas  — array of { name, personality, role } (2–6)
//   topic     — the subject/scenario
//   tone      — 'roast' | 'debate' | 'brainstorm' | 'interview' | 'casual'
//   turns     — number of turns (2–20, default 6)
//   model     — optional: 'eral-7c' | 'eral-mini' | 'eral-creative'
//
// Returns a streaming SSE where each event is a JSON line:
//   { turn: number, agent: string, message: string, done: false }
// Final event:
//   { done: true, transcript: TurnMessage[] }
// ---------------------------------------------------------------------------

export const runtime  = 'nodejs';
export const dynamic  = 'force-dynamic';
export const maxDuration = 90;

const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';
const TOGETHER_URL = 'https://api.together.xyz/v1/chat/completions';

const MODEL_MAP: Record<string, { model: string; provider: 'groq' | 'together' }> = {
  'eral-7c':       { model: 'llama-3.3-70b-versatile',              provider: 'groq'     },
  'eral-mini':     { model: 'llama3-8b-8192',                       provider: 'groq'     },
  'eral-creative': { model: 'mistralai/Mixtral-8x7B-Instruct-v0.1', provider: 'together' },
};

const TONE_PROMPTS: Record<string, string> = {
  roast:      'This is a roast battle. Be funny, sharp, and brutal. Roast the other personas by name. Keep it comedic, not genuinely mean.',
  debate:     'This is a structured debate. Argue your position with logic and evidence. Acknowledge counterpoints before rebutting.',
  brainstorm: 'This is a collaborative brainstorm. Build on each other\'s ideas, push boundaries, and introduce wild angles.',
  interview:  'This is an interview. One persona is the interviewer asking questions; others answer in character.',
  casual:     'This is a casual conversation. Be natural, opinionated, and use your personality freely.',
};

interface Persona {
  name: string;
  personality: string;
  role?: string;
}

interface TurnMessage {
  turn: number;
  agent: string;
  message: string;
}

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  provider: 'groq' | 'together',
): Promise<string> {
  const key = provider === 'groq' ? process.env.GROQ_API_KEY : process.env.TOGETHER_API_KEY;
  const url = provider === 'groq' ? GROQ_URL : TOGETHER_URL;
  if (!key) throw new Error(`No ${provider.toUpperCase()}_API_KEY configured`);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      temperature: 0.9,
      max_tokens:  300,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? '').trim();
}

export async function POST(req: NextRequest) {
  // Auth (not required in self-hosted)
  if (!process.env.SELF_HOSTED) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Rate-limit: 5 simulations per minute
    const limited = await checkRateLimit(`eral-simulate:${session.user.id}`, 5, 60);
    if (!limited.allowed) {
      return NextResponse.json({ error: 'Rate limited. Slow down.' }, { status: 429 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const {
    personas = [],
    topic    = '',
    tone     = 'casual',
    turns    = 6,
    model: modelKey = 'eral-7c',
  } = body as {
    personas: Persona[];
    topic: string;
    tone: string;
    turns: number;
    model?: string;
  };

  // Validate
  if (!topic.trim()) return NextResponse.json({ error: '`topic` is required' }, { status: 400 });
  if (personas.length < 2) return NextResponse.json({ error: 'Need at least 2 personas' }, { status: 400 });
  if (personas.length > 6) return NextResponse.json({ error: 'Max 6 personas' }, { status: 400 });

  const clampedTurns = Math.min(Math.max(Number(turns) || 6, 2), 20);
  const { model: llmModel, provider } = MODEL_MAP[modelKey] ?? MODEL_MAP['eral-7c'];
  const toneInstructions = TONE_PROMPTS[tone] ?? TONE_PROMPTS['casual'];

  // Build streaming response
  const encoder = new TextEncoder();
  const transcript: TurnMessage[] = [];

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Conversation history for context window
        const history: { agent: string; message: string }[] = [];

        for (let t = 0; t < clampedTurns; t++) {
          // Pick which persona speaks (round-robin)
          const persona = personas[t % personas.length];

          // Build system prompt for this persona
          const systemPrompt = [
            `You are ${persona.name}. ${persona.personality}.`,
            persona.role ? `Your role: ${persona.role}.` : '',
            toneInstructions,
            `Topic/scenario: "${topic}".`,
            `Other participants: ${personas.filter(p => p.name !== persona.name).map(p => `${p.name} (${p.personality})`).join(', ')}.`,
            'Respond as yourself in 1–3 sentences. Stay in character. Do NOT narrate actions or describe the conversation. Just speak.',
          ].filter(Boolean).join('\n');

          // Build user prompt (recent conversation context)
          const recentHistory = history.slice(-6).map(h => `${h.agent}: ${h.message}`).join('\n');
          const userPrompt = recentHistory
            ? `Recent conversation:\n${recentHistory}\n\nYour turn, ${persona.name}:`
            : `Start the conversation about "${topic}", ${persona.name}:`;

          let message: string;
          try {
            message = await callLLM(systemPrompt, userPrompt, llmModel, provider);
          } catch (err) {
            message = `[${persona.name} had a technical difficulty]`;
          }

          const turn: TurnMessage = { turn: t + 1, agent: persona.name, message };
          transcript.push(turn);
          history.push({ agent: persona.name, message });

          send({ ...turn, done: false });
        }

        send({ done: true, transcript });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Simulation failed';
        send({ done: true, error: message, transcript });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection:      'keep-alive',
    },
  });
}
