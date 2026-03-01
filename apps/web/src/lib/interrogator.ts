/**
 * Image interrogator — reverse-engineers prompts from images using BLIP + Gemini.
 * Models: Salesforce/blip-image-captioning-large (HF) + Gemini (optional enrichment)
 * Env: HF_TOKEN (required), GEMINI_API_KEY (optional, for richer analysis)
 */

import { geminiAnalyzeImage } from './providers/gemini';

const HF_BLIP_URL =
  'https://router.huggingface.co/hf-inference/models/Salesforce/blip-image-captioning-large';

export interface InterrogateResult {
  caption: string;          // BLIP caption
  tags: string[];           // extracted keywords
  suggestedPrompt: string;  // enriched prompt for regeneration
  confidence: number;       // 0-1
}

/** Extract noun and adjective keywords from a caption string */
function extractTags(caption: string): string[] {
  // Simple heuristic: split on spaces/punctuation, filter stopwords, deduplicate
  const stopwords = new Set([
    'a', 'an', 'the', 'is', 'are', 'of', 'in', 'on', 'at', 'to', 'for',
    'with', 'and', 'or', 'but', 'its', 'it', 'there', 'this', 'that', 'as',
    'by', 'from', 'has', 'have', 'be', 'been', 'was', 'were', 'no', 'not',
  ]);
  const words = caption
    .toLowerCase()
    .replace(/[^a-z0-9 '-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));
  return [...new Set(words)].slice(0, 20);
}

export async function interrogateImage(
  imageUrl: string,
  hfToken?: string,
): Promise<InterrogateResult> {
  const token = hfToken ?? process.env.HF_TOKEN ?? '';
  if (!token) throw new Error('Interrogator requires HF_TOKEN. Get free token at https://huggingface.co/settings/tokens');

  // Fetch image
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch image: HTTP ${imgRes.status}`);
  const imgBuf = Buffer.from(await imgRes.arrayBuffer());

  // Call BLIP
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);

  let caption = '';
  try {
    const res = await fetch(HF_BLIP_URL, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'image/jpeg',
        Accept:         'application/json',
      },
      body:   imgBuf,
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`BLIP error ${res.status}: ${body}`);
    }

    const data = await res.json() as Array<{ generated_text?: string }>;
    caption = data?.[0]?.generated_text ?? '';
  } finally {
    clearTimeout(timer);
  }

  const tags = extractTags(caption);
  let suggestedPrompt = caption;

  // Optional Gemini enrichment for richer analysis
  const geminiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY ?? '';
  if (geminiKey && caption) {
    try {
      const geminiResult = await geminiAnalyzeImage(imageUrl, undefined, geminiKey);
      if (geminiResult.suggestedPrompt) suggestedPrompt = geminiResult.suggestedPrompt;
      if (geminiResult.tags.length > 0) tags.push(...geminiResult.tags.filter(t => !tags.includes(t)));
    } catch {
      // Gemini enrichment is best-effort; fall through to BLIP-only result
    }
  }

  // Confidence heuristic: longer captions with more words = higher confidence
  const wordCount = caption.split(/\s+/).filter(Boolean).length;
  const confidence = Math.min(wordCount / 15, 1);

  return {
    caption,
    tags:            tags.slice(0, 20),
    suggestedPrompt,
    confidence,
  };
}
