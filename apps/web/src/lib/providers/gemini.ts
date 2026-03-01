/**
 * Google Gemini Flash provider — free tier, 15 RPM, 1M tokens/day.
 * No billing required. Get key at https://aistudio.google.com/app/apikey
 * Env: GEMINI_API_KEY
 *
 * Supports: text generation + multimodal image analysis
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface GeminiTextOptions {
  model?: string;            // default: 'gemini-2.0-flash'
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
}

export interface GeminiImageAnalysisResult {
  description: string;
  tags: string[];
  suggestedPrompt: string;
  dominantColors: string[];
}

// ---------------------------------------------------------------------------
// geminiChat — text generation
// ---------------------------------------------------------------------------

export async function geminiChat(
  prompt: string,
  options?: GeminiTextOptions,
  apiKey?: string,
): Promise<string> {
  const key = apiKey ?? process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY ?? '';
  if (!key) throw new Error('Gemini requires GEMINI_API_KEY. Get free key at https://aistudio.google.com/app/apikey');

  const {
    model = 'gemini-2.0-flash',
    temperature = 0.7,
    maxOutputTokens = 1024,
    systemInstruction,
  } = options ?? {};

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(
      `${GEMINI_BASE}/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    );

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      const e = new Error(`Gemini API error ${res.status}: ${err}`);
      (e as NodeJS.ErrnoException & { skipProvider?: boolean }).skipProvider = res.status === 429 || res.status >= 500;
      throw e;
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) throw new Error('Gemini returned empty response');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// geminiAnalyzeImage — multimodal image analysis
// ---------------------------------------------------------------------------

export async function geminiAnalyzeImage(
  imageUrl: string,
  question?: string,
  apiKey?: string,
): Promise<GeminiImageAnalysisResult> {
  const key = apiKey ?? process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY ?? '';
  if (!key) throw new Error('Gemini requires GEMINI_API_KEY');

  // Fetch image and convert to base64
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch image: HTTP ${imgRes.status}`);
  const imgBuf = await imgRes.arrayBuffer();
  const base64 = Buffer.from(imgBuf).toString('base64');
  const mimeType = (imgRes.headers.get('content-type') ?? 'image/jpeg').split(';')[0].trim();

  const analysisPrompt = question
    ?? 'Analyze this image in detail. Return JSON only with keys: description (string), tags (string[]), suggestedPrompt (string for AI image regeneration), dominantColors (string[] of hex or color names).';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(
      `${GEMINI_BASE}/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: analysisPrompt },
            ],
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
        }),
        signal: controller.signal,
      },
    );

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Gemini image analysis error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

    // Strip markdown code fences if present
    const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    let parsed: Partial<GeminiImageAnalysisResult> = {};
    try {
      parsed = JSON.parse(clean);
    } catch {
      // Fallback to raw description
      parsed = { description: raw, tags: [], suggestedPrompt: raw, dominantColors: [] };
    }

    return {
      description:     parsed.description     ?? '',
      tags:            parsed.tags            ?? [],
      suggestedPrompt: parsed.suggestedPrompt ?? parsed.description ?? '',
      dominantColors:  parsed.dominantColors  ?? [],
    };
  } finally {
    clearTimeout(timer);
  }
}
