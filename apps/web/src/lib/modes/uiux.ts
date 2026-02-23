import type { ModeContract } from './types';

export const uiuxMode: ModeContract = {
  id: 'uiux',
  label: 'WokGen UI/UX',
  shortLabel: 'UI/UX',
  tagline: 'For product teams',
  description: 'Generate React components, Tailwind sections, and complete page layouts with live code output.',
  accentColor: '#f472b6',
  outputs: ['code', 'image'],
  exportFormats: ['tsx', 'html', 'css', 'zip'],
  sizeConstraints: { min: 320, max: 1920, defaults: [375, 768, 1280, 1440, 1920], defaultSize: 1280 },
  tools: [
    { id: 'section', label: 'Section', description: 'Generate a complete page section (hero, pricing, CTA, etc.)', outputType: 'code', exportFormats: ['tsx', 'html'] },
    { id: 'component', label: 'Component', description: 'Generate a reusable UI component (button, card, modal, etc.)', outputType: 'code', exportFormats: ['tsx', 'html'] },
    { id: 'page', label: 'Page', description: 'Generate a complete page layout from multiple sections', outputType: 'code', exportFormats: ['tsx', 'zip'] },
  ],
  presets: [
    { id: 'dark_saas', label: 'Dark SaaS', tokens: ['dark mode', 'SaaS design', 'minimal', 'Tailwind CSS'] },
    { id: 'light_minimal', label: 'Light Minimal', tokens: ['light mode', 'minimal', 'clean', 'white background'] },
    { id: 'bold_startup', label: 'Bold Startup', tokens: ['bold', 'startup', 'gradient accents', 'modern'] },
  ],
  promptBuilder: 'uiux',
  models: { standardProvider: 'pollinations', hdProvider: 'replicate', standardRateLimit: 5, hdCreditsPerGeneration: 3 },
  galleryAspect: 'wide',
  galleryFilters: ['tool', 'style'],
  licenseKey: 'code_ownership',
  routes: { landing: '/uiux', studio: '/uiux/studio', gallery: '/uiux/gallery', docs: '/docs/uiux' },
  servicePairing: { label: 'WokSpec Product Engineering', description: 'Need this in production? WokSpec builds products.', href: 'https://wokspec.org' },
  status: 'live',
  targetUsers: ['Startup founders', 'Front-end developers', 'Product designers', 'Indie hackers'],
  notFor: ['Pixel art', 'Image generation', 'SVG icons'],
  examplePrompts: [
    { prompt: 'Pricing section, 3 tiers, dark SaaS style, most popular highlighted', label: 'Pricing Section' },
    { prompt: 'Navigation bar with logo, links, and CTA button, minimal dark', label: 'Navbar' },
  ],
};
