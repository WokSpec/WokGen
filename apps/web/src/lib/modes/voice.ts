import type { ModeContract } from './types';

export const voiceMode: ModeContract = {
  id: 'voice',
  label: 'WokGen Voice',
  shortLabel: 'Voice',
  tagline: 'Speech & Audio Generation',
  description: 'Generate natural speech, character voices, and audio clips with AI.',
  accentColor: '#f59e0b',
  outputs: ['audio'],
  exportFormats: ['mp3', 'wav', 'zip'],
  sizeConstraints: { min: 1, max: 300, defaults: [30, 60, 120], defaultSize: 30 },
  tools: [
    { id: 'narration', label: 'Narration', description: 'Generate character narration or voiceover', icon: '🎙️', outputType: 'audio', exportFormats: ['mp3', 'wav'] },
    { id: 'dialogue', label: 'Dialogue', description: 'Generate NPC or character dialogue clips', icon: '💬', outputType: 'audio', exportFormats: ['mp3', 'wav', 'zip'] },
  ],
  presets: [
    { id: 'narrator', label: 'Narrator', tokens: ['clear narration', 'neutral tone', 'professional voice'] },
    { id: 'character', label: 'Character', tokens: ['character voice', 'expressive', 'distinct personality'] },
    { id: 'ambient', label: 'Ambient', tokens: ['ambient audio', 'background sound', 'atmospheric'] },
  ],
  promptBuilder: 'voice',
  models: { standardProvider: 'pollinations', hdProvider: 'replicate', standardRateLimit: 5, hdCreditsPerGeneration: 3 },
  galleryAspect: 'wide',
  galleryFilters: ['tool', 'mood', 'style'],
  licenseKey: 'commercial_brand',
  routes: { landing: '/voice', studio: '/voice/studio', gallery: '/voice/gallery', docs: '/docs/voice' },
  servicePairing: { label: 'WokSpec Audio Production', description: 'Need full audio production? WokSpec delivers complete voice and sound pipelines.', href: 'https://wokspec.org' },
  status: 'beta',
  targetUsers: ['Game developers', 'Podcast creators', 'Marketing teams', 'Content creators'],
  notFor: ['Music composition', 'Live transcription', 'Real-time voice changing'],
  examplePrompts: [
    { prompt: 'Friendly narrator introducing a mobile game, warm and energetic', label: 'Game Intro' },
    { prompt: 'Mysterious NPC dialogue, medieval fantasy setting, gravelly voice', label: 'NPC Dialogue' },
    { prompt: 'Upbeat podcast intro, 30 seconds, professional', label: 'Podcast Intro' },
    { prompt: 'Product demo narration, clear and confident, SaaS tool', label: 'Product Demo' },
  ],
};
