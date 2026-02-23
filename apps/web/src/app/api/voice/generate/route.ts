import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/db';
import {
  preprocessTextForTTS,
  detectContentType,
  selectOptimalVoice,
  getVoiceSettings,
  estimateCharCount,
  type VoiceStyle,
} from '@/lib/tts-intelligence';

// ---------------------------------------------------------------------------
// POST /api/voice/generate
//
// Provider priority:
//   1. ElevenLabs  (ELEVENLABS_API_KEY)  — primary, near-human quality
//   2. OpenAI TTS  (OPENAI_API_KEY)      — secondary, excellent quality
//   3. HuggingFace Kokoro (HF_TOKEN)     — fallback
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const maxDuration = 60;

type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'pl' | 'ja' | 'ko' | 'zh' | 'hi';

// ---------------------------------------------------------------------------
// Provider calls
// ---------------------------------------------------------------------------
async function generateElevenLabs(
  text: string,
  voiceId: string,
  style: VoiceStyle,
  hd: boolean,
): Promise<Buffer | null> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return null;

  const settings = getVoiceSettings(style);
  const modelId = hd ? 'eleven_multilingual_v2' : 'eleven_turbo_v2_5';

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': key,
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: settings,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    console.error('[TTS/ElevenLabs] Error:', response.status, err);
    return null;
  }

  return Buffer.from(await response.arrayBuffer());
}

async function generateOpenAI(
  text: string,
  voiceStyle: VoiceStyle,
  hd: boolean,
): Promise<Buffer | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const voiceMap: Record<VoiceStyle, string> = {
    natural:   'nova',
    character: 'fable',
    whisper:   'shimmer',
    energetic: 'alloy',
    news:      'onyx',
    asmr:      'shimmer',
    narrative: 'nova',
    deep:      'onyx',
  };
  const voice = voiceMap[voiceStyle] ?? 'nova';
  const model = hd ? 'tts-1-hd' : 'tts-1';

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ model, input: text, voice, response_format: 'mp3' }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    console.error('[TTS/OpenAI] Error:', response.status);
    return null;
  }

  return Buffer.from(await response.arrayBuffer());
}

async function generateHuggingFace(text: string): Promise<Buffer | null> {
  const key = process.env.HF_TOKEN;
  if (!key) return null;

  const response = await fetch('https://api-inference.huggingface.co/models/hexgrad/Kokoro-82M', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) return null;

  return Buffer.from(await response.arrayBuffer());
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  let authedUserId: string | null = null;
  try {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    authedUserId = session?.user?.id ?? null;
  } catch {
    // auth not available in self-hosted mode — continue as guest
  }

  // ── Rate limit ───────────────────────────────────────────────────────────
  const rateLimitKey =
    authedUserId ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const maxReqs = authedUserId ? 20 : 10;
  const rl = await checkRateLimit(rateLimitKey, maxReqs, 3600 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let body: {
    text?: string;
    style?: VoiceStyle;
    hd?: boolean;
    voiceId?: string;
    language?: Language;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const text     = (body.text ?? '').trim();
  const style    = (body.style ?? 'natural') as VoiceStyle;
  const hd       = body.hd ?? false;
  const customVoiceId = body.voiceId;

  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const MAX_CHARS = 5000;
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Text too long. Maximum ${MAX_CHARS} characters.` },
      { status: 400 },
    );
  }

  // ── HD tier — reserve credits ────────────────────────────────────────────
  let usedMonthly = false;
  if (hd) {
    if (!authedUserId) {
      return NextResponse.json(
        { error: 'Sign in required for HD voice generation.' },
        { status: 401 },
      );
    }

    try {
      const sub = await prisma.subscription.findUnique({
        where: { userId: authedUserId }, include: { plan: true },
      });
      const monthlyAlloc = sub?.plan?.creditsPerMonth ?? 0;

      const updated = await prisma.user.updateMany({
        where: { id: authedUserId, hdMonthlyUsed: { lt: monthlyAlloc } },
        data:  { hdMonthlyUsed: { increment: 1 } },
      });

      if (updated.count > 0) {
        usedMonthly = true;
      } else {
        const topUpUpdated = await prisma.user.updateMany({
          where: { id: authedUserId, hdTopUpCredits: { gt: 0 } },
          data:  { hdTopUpCredits: { decrement: 1 } },
        });
        if (topUpUpdated.count === 0) {
          return NextResponse.json(
            { error: 'Insufficient credits', creditsRequired: 1, creditsAvailable: 0 },
            { status: 402 },
          );
        }
      }
    } catch (reserveErr) {
      console.error('[TTS] Credit reservation error:', reserveErr);
      return NextResponse.json({ error: 'Could not reserve credits' }, { status: 500 });
    }
  }

  // ── Pre-process & select voice ───────────────────────────────────────────
  const processedText = preprocessTextForTTS(text);
  const contentType   = detectContentType(processedText);
  const selectedVoice = customVoiceId
    ? { id: customVoiceId, name: 'Custom' }
    : selectOptimalVoice(style, contentType);

  console.log(
    `[TTS] style=${style}, contentType=${contentType}, voice=${selectedVoice.name}, hd=${hd}, chars=${estimateCharCount(processedText)}`,
  );

  // ── Provider chain: ElevenLabs → OpenAI → HuggingFace ───────────────────
  let audioBuffer: Buffer | null = null;
  let provider = 'none';
  let format: 'mp3' | 'wav' = 'mp3';

  try {
    audioBuffer = await generateElevenLabs(processedText, selectedVoice.id, style, hd);
    if (audioBuffer) { provider = 'elevenlabs'; format = 'mp3'; }
  } catch (e) {
    console.warn('[TTS] ElevenLabs failed:', e);
  }

  if (!audioBuffer) {
    try {
      audioBuffer = await generateOpenAI(processedText, style, hd);
      if (audioBuffer) { provider = 'openai'; format = 'mp3'; }
    } catch (e) {
      console.warn('[TTS] OpenAI failed:', e);
    }
  }

  if (!audioBuffer) {
    try {
      audioBuffer = await generateHuggingFace(processedText);
      if (audioBuffer) { provider = 'huggingface'; format = 'wav'; }
    } catch (e) {
      console.warn('[TTS] HuggingFace failed:', e);
    }
  }

  // ── Refund credits on failure ────────────────────────────────────────────
  if (!audioBuffer) {
    if (hd && authedUserId) {
      try {
        if (usedMonthly) {
          await prisma.user.update({ where: { id: authedUserId }, data: { hdMonthlyUsed: { decrement: 1 } } });
        } else {
          await prisma.user.update({ where: { id: authedUserId }, data: { hdTopUpCredits: { increment: 1 } } });
        }
      } catch (refundErr) {
        console.error('[TTS] Credit refund failed:', refundErr);
      }
    }
    return NextResponse.json({ error: 'All TTS providers unavailable. Please try again.' }, { status: 503 });
  }

  const mimeType  = format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
  const base64Audio = audioBuffer.toString('base64');

  return NextResponse.json({
    audio:       `data:${mimeType};base64,${base64Audio}`,
    format,
    provider,
    voice:       selectedVoice.name,
    contentType,
    charCount:   estimateCharCount(processedText),
    creditsUsed: hd ? 1 : 0,
  });
}
