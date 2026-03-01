/**
 * MusicGen — free background music generation via HuggingFace.
 * Model: facebook/musicgen-small (fast, free, ~10s of audio per call)
 * Env: HF_TOKEN
 */

const HF_MUSICGEN_URL =
  'https://router.huggingface.co/hf-inference/models/facebook/musicgen-small';

export interface MusicGenParams {
  prompt: string;
  duration?: number;    // seconds, default: 10, max: 30
  temperature?: number; // default: 1.0
}

export interface MusicGenResult {
  audioUrl: string;  // base64 data URL (audio/wav)
  duration: number;
  prompt: string;
  durationMs: number;
}

export async function musicgenGenerate(
  params: MusicGenParams,
  hfToken?: string,
): Promise<MusicGenResult> {
  const t0 = Date.now();
  const token = hfToken ?? process.env.HF_TOKEN ?? '';
  if (!token) throw new Error('MusicGen requires HF_TOKEN. Get free token at https://huggingface.co/settings/tokens');

  const duration = Math.min(params.duration ?? 10, 30);
  // max_new_tokens ≈ 50 tokens per second for musicgen-small
  const maxNewTokens = Math.ceil(duration * 50);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000); // 2 min timeout

  try {
    const res = await fetch(HF_MUSICGEN_URL, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept:         'audio/wav',
      },
      body: JSON.stringify({
        inputs: params.prompt,
        parameters: {
          max_new_tokens: maxNewTokens,
          temperature:    params.temperature ?? 1.0,
          do_sample:      true,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const e = new Error(`MusicGen error ${res.status}: ${body}`);
      (e as NodeJS.ErrnoException & { skipProvider?: boolean }).skipProvider =
        res.status === 503 || res.status === 429;
      throw e;
    }

    const audioBuf = await res.arrayBuffer();
    const base64   = Buffer.from(audioBuf).toString('base64');
    const audioUrl = `data:audio/wav;base64,${base64}`;

    return {
      audioUrl,
      duration,
      prompt:     params.prompt,
      durationMs: Date.now() - t0,
    };
  } finally {
    clearTimeout(timer);
  }
}
