/**
 * AssemblyAI Universal-2 — audio transcription with speaker diarization,
 * sentiment analysis, entity detection, auto chapters, key phrases.
 * API: https://www.assemblyai.com/docs
 * Key: ASSEMBLYAI_API_KEY (free tier: 100 hours/month)
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, API_ERRORS } from '@/lib/api-response';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 120;

const ASMBL_BASE = 'https://api.assemblyai.com';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

  const rl = await checkRateLimit(`transcribe:${session.user.id}`, 10, 3_600_000);
  if (!rl.allowed) {
    return Response.json({ error: 'Rate limit exceeded. Please try again later.' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter ?? 60) },
    });
  }

  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return apiError({
      code: 'NOT_CONFIGURED',
      message: 'AssemblyAI key not configured. Add ASSEMBLYAI_API_KEY. Free tier at https://www.assemblyai.com/',
      status: 503,
    });
  }

  const body = await req.json().catch(() => null);
  if (!body?.audioUrl?.trim() && !body?.audioBase64) return API_ERRORS.BAD_REQUEST('audioUrl or audioBase64 is required');

  const { audioUrl, speakerLabels = true, autoChapters = false, entityDetection = true, sentimentAnalysis = false } = body;

  // Step 1: Submit for transcription
  const submitRes = await fetch(`${ASMBL_BASE}/v2/transcript`, {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio_url: audioUrl,
      speaker_labels: speakerLabels,
      auto_chapters: autoChapters,
      entity_detection: entityDetection,
      sentiment_analysis: sentimentAnalysis,
      speech_model: 'universal',
    }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.json().catch(() => ({}));
    return apiError({ code: 'ASSEMBLYAI_ERROR', message: err.error || 'AssemblyAI error', status: submitRes.status });
  }

  const { id } = await submitRes.json();

  // Step 2: Poll for completion (up to 90 seconds)
  const startTime = Date.now();
  while (Date.now() - startTime < 90_000) {
    await new Promise(r => setTimeout(r, 3000));
    const pollRes = await fetch(`${ASMBL_BASE}/v2/transcript/${id}`, {
      headers: { 'Authorization': apiKey },
    });
    const transcript = await pollRes.json();

    if (transcript.status === 'completed') {
      return apiSuccess({
        id: transcript.id,
        text: transcript.text,
        confidence: transcript.confidence,
        audioDuration: transcript.audio_duration,
        words: transcript.words?.slice(0, 100), // first 100 words with timestamps
        utterances: transcript.utterances, // speaker-labeled segments
        chapters: transcript.chapters || [],
        entities: transcript.entities?.slice(0, 20) || [],
        sentimentAnalysisResults: transcript.sentiment_analysis_results?.slice(0, 10) || [],
      });
    }

    if (transcript.status === 'error') {
      return apiError({ code: 'TRANSCRIPTION_FAILED', message: transcript.error || 'Transcription failed', status: 500 });
    }
  }

  return apiError({ code: 'TIMEOUT', message: 'Transcription is taking too long. Try a shorter clip.', status: 408 });
}
