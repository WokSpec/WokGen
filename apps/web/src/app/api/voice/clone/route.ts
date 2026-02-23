import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { log as logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: 'Voice cloning requires ElevenLabs API key. Set ELEVENLABS_API_KEY.' },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const audioFile = formData.get('audio') as File | null;
  const voiceName = (formData.get('name') as string | null) ?? `WokGen Voice ${Date.now()}`;

  if (!audioFile) {
    return NextResponse.json({ error: 'Audio file required (field: audio)' }, { status: 400 });
  }

  // Validate file type
  const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-wav'];
  if (!validTypes.includes(audioFile.type) && !audioFile.name.match(/\.(wav|mp3)$/i)) {
    return NextResponse.json({ error: 'Only WAV and MP3 files are supported' }, { status: 400 });
  }

  // Validate file size (max 25MB for ElevenLabs)
  if (audioFile.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: 'Audio file must be under 25MB' }, { status: 400 });
  }

  try {
    // Call ElevenLabs Voice Cloning API
    const elFormData = new FormData();
    elFormData.append('name', voiceName);
    elFormData.append('description', `Cloned voice from WokGen by user ${session.user.id}`);
    elFormData.append('files', audioFile, audioFile.name || 'sample.wav');
    elFormData.append('labels', JSON.stringify({ source: 'wokgen', userId: session.user.id }));

    const res = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
      body: elFormData,
    });

    if (!res.ok) {
      const errBody = await res.text();
      logger.warn({ status: res.status, errBody }, 'ElevenLabs voice clone failed');
      return NextResponse.json(
        { error: 'Voice cloning failed', details: res.status === 429 ? 'Rate limit exceeded' : 'Provider error' },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    const data = await res.json() as { voice_id: string };
    logger.info({ userId: session.user.id, voiceId: data.voice_id }, 'Voice cloned');

    return NextResponse.json({
      voiceId: data.voice_id,
      name: voiceName,
      message: 'Voice cloned successfully. Use this voice ID in /api/voice/generate.',
    });
  } catch (err) {
    logger.error({ err }, 'Voice clone error');
    return NextResponse.json({ error: 'Internal error during voice cloning' }, { status: 500 });
  }
}
