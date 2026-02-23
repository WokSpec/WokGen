import type { ModeContract } from './types';

export const vectorMode: ModeContract = {
  id: 'vector',
  label: 'WokGen Vector',
  shortLabel: 'Vector',
  tagline: 'For design systems',
  description: 'Generate scalable SVG icons, illustration sets, and design system components.',
  accentColor: '#34d399',
  outputs: ['svg'],
  exportFormats: ['svg', 'zip'],
  sizeConstraints: { min: 24, max: 512, defaults: [24, 32, 48, 64, 128, 256], defaultSize: 48 },
  tools: [
    { id: 'icon', label: 'Icon', description: 'Generate a scalable icon or symbol', outputType: 'svg', exportFormats: ['svg'] },
    { id: 'illustration', label: 'Illustration', description: 'Generate scalable spot illustrations', outputType: 'svg', exportFormats: ['svg', 'zip'] },
  ],
  presets: [
    { id: 'outline', label: 'Outline', tokens: ['outline icon', 'stroke style', 'line icon', 'consistent stroke width'] },
    { id: 'filled', label: 'Filled', tokens: ['filled icon', 'solid shape', 'filled vector'] },
    { id: 'rounded', label: 'Rounded', tokens: ['rounded icon', 'soft corners', 'friendly style'] },
    { id: 'sharp', label: 'Sharp', tokens: ['sharp icon', 'angular', 'precise geometry'] },
  ],
  promptBuilder: 'vector',
  models: { standardProvider: 'pollinations', hdProvider: 'replicate', hdModelId: 'recraft-ai/recraft-v3-svg', standardRateLimit: 10, hdCreditsPerGeneration: 2 },
  galleryAspect: 'square',
  galleryFilters: ['tool', 'style'],
  licenseKey: 'design_system',
  routes: { landing: '/vector', studio: '/vector/studio', gallery: '/vector/gallery', docs: '/docs/vector' },
  servicePairing: { label: 'WokSpec Design Systems', description: 'Need a complete icon system? WokSpec builds consistent design systems.', href: 'https://wokspec.org' },
  status: 'beta',
  targetUsers: ['UI/UX designers', 'Design system maintainers', 'Front-end engineers'],
  notFor: ['Pixel art', 'Photography', 'Code generation'],
  examplePrompts: [
    { prompt: 'Settings gear icon, outline style, rounded corners', label: 'Settings Icon' },
    { prompt: 'Shopping cart icon, filled style, minimal', label: 'Cart Icon' },
  ],
};
