import { NextResponse } from 'next/server';
import { log as logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// GET /api/voice/voices
// Returns ElevenLabs voice library, cached for 1 hour.
// Falls back to hardcoded defaults if no API key is configured.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const revalidate = 3600; // 1 hour Next.js revalidation

interface VoiceEntry {
  id: string;
  name: string;
  description: string;
  preview_url: string | null;
  labels: Record<string, string>;
}

const DEFAULT_VOICES: VoiceEntry[] = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel',    description: 'Calm, professional',    preview_url: null, labels: { accent: 'American', gender: 'Female' } },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam',      description: 'Deep, authoritative',   preview_url: null, labels: { accent: 'American', gender: 'Male'   } },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella',     description: 'Soft, friendly',        preview_url: null, labels: { accent: 'American', gender: 'Female' } },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh',      description: 'Young, energetic',      preview_url: null, labels: { accent: 'American', gender: 'Male'   } },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel',    description: 'British professional',  preview_url: null, labels: { accent: 'British',  gender: 'Male'   } },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', description: 'Swedish, warm',         preview_url: null, labels: { accent: 'Swedish',  gender: 'Female' } },
];

export async function GET() {
  const key = process.env.ELEVENLABS_API_KEY;

  if (!key) {
    return NextResponse.json({ voices: DEFAULT_VOICES });
  }

  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': key },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      logger.error({ status: res.status }, '[voices] ElevenLabs API error');
      return NextResponse.json({ voices: DEFAULT_VOICES });
    }

    const data = await res.json() as {
      voices: Array<{
        voice_id: string;
        name: string;
        description?: string;
        preview_url?: string;
        labels?: Record<string, string>;
      }>;
    };

    const voices: VoiceEntry[] = data.voices.map(v => ({
      id:          v.voice_id,
      name:        v.name,
      description: v.description ?? '',
      preview_url: v.preview_url ?? null,
      labels:      v.labels ?? {},
    }));

    return NextResponse.json({ voices });
  } catch (e) {
    logger.error({ err: e }, '[voices] Fetch error');
    return NextResponse.json({ voices: DEFAULT_VOICES });
  }
}
