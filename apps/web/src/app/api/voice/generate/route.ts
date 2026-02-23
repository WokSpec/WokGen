import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { log as logger } from '@/lib/logger';
import { prisma } from '@/lib/db';
import {
  preprocessTextForTTS,
  detectContentType,
  selectOptimalVoice,
  getVoiceSettings,
  estimateCharCount,
  type VoiceStyle,
} from '@/lib/tts-intelligence';
import { getUserPlanId, TTS_MAX_CHARS } from '@/lib/quota';

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

/** Apply natural pauses via SSML break tags (ElevenLabs only). */
function applyNaturalPauses(text: string): string {
  return text
    .replace(/,(\s)/g, ',<break time="200ms"/>$1')
    .replace(/\.(\s)/g, '.<break time="400ms"/>$1');
}

async function generateElevenLabsStream(
  text: string,
  voiceId: string,
  style: VoiceStyle,
  hd: boolean,
  emotionIntensity?: number,
  voiceClarity?: number,
): Promise<Response | null> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return null;

  const baseSettings = getVoiceSettings(style);
  const modelId = hd ? 'eleven_multilingual_v2' : 'eleven_turbo_v2_5';

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': key,
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        ...baseSettings,
        ...(emotionIntensity !== undefined ? { style: emotionIntensity } : {}),
        ...(voiceClarity !== undefined ? { stability: voiceClarity } : {}),
      },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (response.ok && response.body) {
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-store',
        'X-Provider': 'elevenlabs',
        'X-Voice-Id': voiceId,
      },
    });
  }

  const err = await response.text().catch(() => '');
  logger.error({ status: response.status, err }, '[TTS/ElevenLabs] Streaming error');
  return null;
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
    logger.error({ status: response.status }, '[TTS/OpenAI] Error');
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
    emotionIntensity?: number;
    voiceClarity?: number;
    naturalPauses?: boolean;
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
  const emotionIntensity = body.emotionIntensity;
  const voiceClarity     = body.voiceClarity;
  const naturalPauses    = body.naturalPauses ?? true;

  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  // ── Tier-based char limit ─────────────────────────────────────────────────
  const planId = authedUserId ? await getUserPlanId(authedUserId) : 'guest';
  const maxChars = TTS_MAX_CHARS[planId] ?? TTS_MAX_CHARS.free;

  if (text.length > maxChars) {
    return NextResponse.json(
      {
        error: `Text too long. ${planId === 'guest' ? 'Sign up for' : 'Upgrade to Plus for'} longer TTS (${maxChars} char limit on your current plan).`,
        limit: maxChars,
        current: text.length,
        code: 'TTS_CHAR_LIMIT',
      },
      { status: 413 },
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
      logger.error({ err: reserveErr }, '[TTS] Credit reservation error');
      return NextResponse.json({ error: 'Could not reserve credits' }, { status: 500 });
    }
  }

  // ── Pre-process & select voice ───────────────────────────────────────────
  const processedText = preprocessTextForTTS(text);
  const contentType   = detectContentType(processedText);
  const selectedVoice = customVoiceId
    ? { id: customVoiceId, name: 'Custom' }
    : selectOptimalVoice(style, contentType);

  logger.info(
    `[TTS] style=${style}, contentType=${contentType}, voice=${selectedVoice.name}, hd=${hd}, chars=${estimateCharCount(processedText)}`,
  );

  // ── Provider chain: ElevenLabs streaming → OpenAI → HuggingFace ──────────
  // Apply natural pauses (SSML) for ElevenLabs only
  const elevenLabsText = naturalPauses ? applyNaturalPauses(processedText) : processedText;

  // 1. ElevenLabs streaming (primary — lowest latency)
  try {
    const streamResponse = await generateElevenLabsStream(
      elevenLabsText, selectedVoice.id, style, hd, emotionIntensity, voiceClarity,
    );
    if (streamResponse) return streamResponse;
  } catch (e) {
    logger.warn({ err: e }, '[TTS] ElevenLabs streaming failed');
  }

  // 2. OpenAI TTS (secondary)
  let audioBuffer: Buffer | null = null;
  let provider = 'none';
  let format: 'mp3' | 'wav' = 'mp3';

  try {
    audioBuffer = await generateOpenAI(processedText, style, hd);
    if (audioBuffer) { provider = 'openai'; format = 'mp3'; }
  } catch (e) {
    logger.warn({ err: e }, '[TTS] OpenAI failed');
  }

  // 3. HuggingFace Kokoro (fallback)
  if (!audioBuffer) {
    try {
      audioBuffer = await generateHuggingFace(processedText);
      if (audioBuffer) { provider = 'huggingface'; format = 'wav'; }
    } catch (e) {
      logger.warn({ err: e }, '[TTS] HuggingFace failed');
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
        logger.error({ err: refundErr }, '[TTS] Credit refund failed');
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
