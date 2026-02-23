/**
 * TTS Intelligence Layer
 * Pre-processes text before sending to TTS providers to improve quality.
 * Post-processes audio for normalization.
 */

// Expand common abbreviations for better pronunciation
const ABBREVIATION_MAP: Record<string, string> = {
  'AI': 'A.I.',
  'ML': 'machine learning',
  'API': 'A.P.I.',
  'UI': 'user interface',
  'UX': 'user experience',
  'SaaS': 'software as a service',
  'CEO': 'C.E.O.',
  'CTO': 'C.T.O.',
  'SDK': 'S.D.K.',
  'CLI': 'C.L.I.',
  'GPU': 'G.P.U.',
  'CPU': 'C.P.U.',
  'RAM': 'ram',
  'URL': 'U.R.L.',
  'HTML': 'H.T.M.L.',
  'CSS': 'C.S.S.',
  'JS': 'JavaScript',
  'TS': 'TypeScript',
  'DB': 'database',
  'e.g.': 'for example',
  'i.e.': 'that is',
  'vs.': 'versus',
  'etc.': 'and so on',
  'approx.': 'approximately',
  'Dr.': 'Doctor',
  'Mr.': 'Mister',
  'Mrs.': 'Missus',
  'Prof.': 'Professor',
};

// Content type detection for voice selection
export type ContentType = 'narrative' | 'technical' | 'marketing' | 'dialogue' | 'news' | 'casual';

export function detectContentType(text: string): ContentType {
  const lower = text.toLowerCase();

  // Technical indicators
  if (/\b(function|const|let|var|import|export|interface|class|return|async|await)\b/.test(lower)) {
    return 'technical';
  }
  // Marketing indicators
  if (/\b(discount|sale|offer|free|premium|exclusive|limited|boost|grow|transform)\b/.test(lower)) {
    return 'marketing';
  }
  // News/formal indicators
  if (/\b(according to|reported|announced|statement|official|confirmed|sources)\b/.test(lower)) {
    return 'news';
  }
  // Dialogue indicators
  if (/["'].*["']/.test(text) && text.split('"').length > 4) {
    return 'dialogue';
  }
  // Casual indicators
  if (/\b(hey|hi|hello|yeah|nah|gonna|wanna|kinda|sorta|btw|tbh|lol)\b/.test(lower)) {
    return 'casual';
  }
  return 'narrative';
}

export function preprocessTextForTTS(text: string): string {
  let processed = text;

  // Expand abbreviations (word boundary match)
  for (const [abbr, expansion] of Object.entries(ABBREVIATION_MAP)) {
    const regex = new RegExp(`\\b${abbr.replace('.', '\\.')}\\b`, 'g');
    processed = processed.replace(regex, expansion);
  }

  // Add pauses at list items
  processed = processed.replace(/^[-•*]\s/gm, '... ');

  // Normalize ellipsis to actual pause
  processed = processed.replace(/\.\.\./g, ', ');

  // Add breathing pause at paragraph breaks
  processed = processed.replace(/\n\n+/g, '\n');

  // Remove markdown formatting (bold, italic, headers)
  processed = processed.replace(/\*\*(.*?)\*\*/g, '$1');
  processed = processed.replace(/\*(.*?)\*/g, '$1');
  processed = processed.replace(/^#+\s+/gm, '');
  processed = processed.replace(/`([^`]+)`/g, '$1');

  // Normalize multiple spaces
  processed = processed.replace(/ {2,}/g, ' ').trim();

  return processed;
}

// Map voice style + content type to best ElevenLabs voice
export type VoiceStyle = 'natural' | 'character' | 'whisper' | 'energetic' | 'news' | 'asmr' | 'narrative' | 'deep';

const ELEVENLABS_VOICE_MAP: Record<VoiceStyle, Record<ContentType | 'default', { id: string; name: string }>> = {
  natural: {
    default:   { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
    narrative: { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
    technical: { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' },
    marketing: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
    dialogue:  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
    news:      { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' },
    casual:    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi' },
  },
  character: {
    default:   { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
    narrative: { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam' },
    technical: { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
    marketing: { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam' },
    dialogue:  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
    news:      { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
    casual:    { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam' },
  },
  whisper: {
    default:   { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
    narrative: { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
    technical: { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
    marketing: { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
    dialogue:  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
    news:      { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
    casual:    { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
  },
  energetic: {
    default:   { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam' },
    narrative: { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam' },
    technical: { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam' },
    marketing: { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi' },
    dialogue:  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam' },
    news:      { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam' },
    casual:    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi' },
  },
  news: {
    default:   { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' },
    narrative: { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' },
    technical: { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' },
    marketing: { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' },
    dialogue:  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
    news:      { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' },
    casual:    { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' },
  },
  asmr: {
    default:   { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
    narrative: { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
    technical: { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
    marketing: { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
    dialogue:  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
    news:      { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
    casual:    { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
  },
  narrative: {
    default:   { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
    narrative: { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
    technical: { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' },
    marketing: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
    dialogue:  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
    news:      { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' },
    casual:    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi' },
  },
  deep: {
    default:   { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
    narrative: { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
    technical: { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
    marketing: { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
    dialogue:  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
    news:      { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
    casual:    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
  },
};

export function selectOptimalVoice(style: VoiceStyle, contentType: ContentType): { id: string; name: string } {
  const styleMap = ELEVENLABS_VOICE_MAP[style] ?? ELEVENLABS_VOICE_MAP.natural;
  return styleMap[contentType] ?? styleMap.default;
}

// Generate voice settings based on style
export function getVoiceSettings(style: VoiceStyle): {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
} {
  const settings: Record<VoiceStyle, { stability: number; similarity_boost: number; style: number; use_speaker_boost: boolean }> = {
    natural:   { stability: 0.75, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
    character: { stability: 0.45, similarity_boost: 0.85, style: 0.5, use_speaker_boost: true },
    whisper:   { stability: 0.90, similarity_boost: 0.60, style: 0.0, use_speaker_boost: false },
    energetic: { stability: 0.30, similarity_boost: 0.90, style: 0.8, use_speaker_boost: true },
    news:      { stability: 0.85, similarity_boost: 0.80, style: 0.0, use_speaker_boost: true },
    asmr:      { stability: 0.95, similarity_boost: 0.55, style: 0.0, use_speaker_boost: false },
    narrative: { stability: 0.70, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true },
    deep:      { stability: 0.80, similarity_boost: 0.85, style: 0.1, use_speaker_boost: true },
  };
  return settings[style] ?? settings.natural;
}

// Estimate character count for billing awareness
export function estimateCharCount(text: string): number {
  return preprocessTextForTTS(text).length;
}
