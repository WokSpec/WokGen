/**
 * Per-mode provider preference ranking.
 * Higher score = preferred for this mode/style combination.
 * Used by provider-router to break ties.
 */

export type ProviderScore = {
  provider: string;
  score: number;
  reason: string;
};

const PROVIDER_SCORES: Record<string, ProviderScore[]> = {
  // pixel art — flux fine-tunes beat SDXL here
  'pixel-art': [
    { provider: 'replicate', score: 95, reason: 'Flux pixel art fine-tune available' },
    { provider: 'fal', score: 88, reason: 'Fast SDXL with pixel LoRA' },
    { provider: 'together', score: 70, reason: 'SDXL-turbo, no fine-tune' },
  ],
  'pixel-dithered': [
    { provider: 'replicate', score: 90, reason: 'Better dither reproduction' },
    { provider: 'fal', score: 80, reason: 'Acceptable dither output' },
  ],
  // business/logo — clean vector-like outputs need photorealism model
  'business-logo': [
    { provider: 'fal', score: 92, reason: 'Flux-pro crisp vector-like edges' },
    { provider: 'replicate', score: 88, reason: 'SDXL good for logos' },
    { provider: 'together', score: 72, reason: 'SDXL-turbo sometimes blurs text' },
  ],
  'business-banner': [
    { provider: 'fal', score: 90, reason: 'Wide aspect ratio handling' },
    { provider: 'replicate', score: 85, reason: 'Good composition' },
  ],
  // vector/icon — flat + clean
  'vector-icon': [
    { provider: 'replicate', score: 88, reason: 'Flux-dev handles flat illustration' },
    { provider: 'fal', score: 85, reason: 'Consistent line weight' },
    { provider: 'together', score: 68, reason: 'Occasional detail noise' },
  ],
  // default fallback
  'default': [
    { provider: 'replicate', score: 80, reason: 'General purpose' },
    { provider: 'fal', score: 78, reason: 'Fast and reliable' },
    { provider: 'together', score: 65, reason: 'Free tier fallback' },
  ],
};

export function getProviderRanking(mode: string, style?: string): ProviderScore[] {
  const key = style ? `${mode}-${style}` : mode;
  return (
    PROVIDER_SCORES[key] ??
    PROVIDER_SCORES[mode] ??
    PROVIDER_SCORES['default']
  );
}

export function getBestProvider(mode: string, style?: string, available?: string[]): string {
  const ranking = getProviderRanking(mode, style);
  const filtered = available
    ? ranking.filter(r => available.includes(r.provider))
    : ranking;
  return filtered[0]?.provider ?? 'replicate';
}
