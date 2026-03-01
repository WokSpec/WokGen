import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signEralToken } from '@/lib/eral-token';

// ---------------------------------------------------------------------------
// POST /api/eral/simulate
//
// Multi-agent simulator: builds a simulation prompt and proxies to the Eral
// Worker /v1/chat to generate a turn-by-turn conversation transcript.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ERAL_API = process.env.ERAL_API_URL ?? 'https://eral.wokspec.org/api';

const TONE_INSTRUCTIONS: Record<string, string> = {
  roast:      'This is a roast battle. Be funny, sharp, and brutal. Roast each other by name. Keep it comedic, not genuinely mean.',
  debate:     'This is a structured debate. Argue positions with logic and evidence. Acknowledge counterpoints before rebutting.',
  brainstorm: 'This is a collaborative brainstorm. Build on each other\'s ideas, push boundaries, and introduce wild angles.',
  interview:  'This is an interview. One persona is the interviewer asking questions; others answer in character.',
  casual:     'This is a casual conversation. Be natural, opinionated, and use each persona\'s personality freely.',
};

interface Persona {
  name: string;
  personality: string;
  role?: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = signEralToken(session.user);
  if (!token) {
    return NextResponse.json(
      { error: 'Eral service not configured (ERAL_JWT_SECRET missing)' },
      { status: 503 },
    );
  }

  let body: {
    personas?: Persona[];
    topic?: string;
    tone?: string;
    turns?: number;
    sessionId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { personas = [], topic = '', tone = 'casual', turns = 6, sessionId } = body;

  if (!topic.trim()) {
    return NextResponse.json({ error: 'topic is required' }, { status: 400 });
  }
  if (personas.length < 2) {
    return NextResponse.json({ error: 'At least 2 personas are required' }, { status: 400 });
  }

  const personaDescriptions = personas
    .map((p) => `- ${p.name}${p.role ? ` (${p.role})` : ''}: ${p.personality}`)
    .join('\n');

  const simulationPrompt = [
    `Generate a ${turns}-turn ${tone} conversation between the following personas:`,
    '',
    personaDescriptions,
    '',
    `Topic/Scenario: ${topic}`,
    '',
    TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS.casual,
    '',
    'Format the output as a JSON array of turn objects:',
    '[{ "turn": 1, "agent": "PersonaName", "message": "..." }, ...]',
    'Output ONLY valid JSON. No markdown, no commentary outside the JSON.',
  ].join('\n');

  const eralRes = await fetch(`${ERAL_API}/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Eral-Source': 'wokgen',
    },
    body: JSON.stringify({
      message: simulationPrompt,
      sessionId: sessionId ?? `wokgen-simulate-${Date.now()}`,
      product: 'wokgen',
    }),
  });

  const data = await eralRes.json() as { data?: { response?: string; model?: string }; error?: unknown };

  if (!eralRes.ok) {
    return NextResponse.json(data.error ?? data, { status: eralRes.status });
  }

  let transcript: unknown[] = [];
  try {
    const raw = data.data?.response ?? '[]';
    transcript = JSON.parse(raw);
  } catch {
    // Return raw text if parsing fails
    return NextResponse.json({ transcript: [], raw: data.data?.response, model: data.data?.model });
  }

  return NextResponse.json({ transcript, model: data.data?.model ?? 'eral' });
}
