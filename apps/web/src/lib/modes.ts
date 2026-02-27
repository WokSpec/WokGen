// ---------------------------------------------------------------------------
// @/lib/modes.ts
// Single source of truth for WokGen studio modes.
// Used by: generate route, projects route, ModeSwitcher component.
// ---------------------------------------------------------------------------

export type ModeId = 'pixel' | 'vector' | 'business' | 'uiux' | 'voice' | 'code';
export type ModeStatus = 'stable' | 'beta' | 'coming_soon';

export interface ModeContract {
  id: ModeId;
  label: string;
  shortLabel: string;
  accentColor: string;
  status: ModeStatus;
  routes: {
    landing: string;
    studio: string;
    gallery?: string;
  };
  models: {
    defaultModelId?: string;
    hdModelId?: string;
  };
}

export const MODES_LIST: ModeContract[] = [
  {
    id: 'pixel',
    label: 'Pixel Art',
    shortLabel: 'Pixel',
    accentColor: '#a78bfa',
    status: 'stable',
    routes: { landing: '/pixel', studio: '/pixel/studio', gallery: '/pixel/gallery' },
    models: { defaultModelId: 'fal-ai/flux/dev', hdModelId: 'fal-ai/flux-pro' },
  },
  {
    id: 'vector',
    label: 'Vector',
    shortLabel: 'Vector',
    accentColor: '#34d399',
    status: 'stable',
    routes: { landing: '/vector', studio: '/vector/studio', gallery: '/vector/gallery' },
    models: {},
  },
  {
    id: 'business',
    label: 'Brand',
    shortLabel: 'Brand',
    accentColor: '#60a5fa',
    status: 'stable',
    routes: { landing: '/business', studio: '/business/studio', gallery: '/business/gallery' },
    models: {},
  },
  {
    id: 'uiux',
    label: 'UI/UX',
    shortLabel: 'UI/UX',
    accentColor: '#f472b6',
    status: 'beta',
    routes: { landing: '/uiux', studio: '/uiux/studio', gallery: '/uiux/gallery' },
    models: {},
  },
  {
    id: 'voice',
    label: 'Voice',
    shortLabel: 'Voice',
    accentColor: '#f59e0b',
    status: 'stable',
    routes: { landing: '/voice', studio: '/voice/studio' },
    models: {},
  },
  {
    id: 'code',
    label: 'Code',
    shortLabel: 'Code',
    accentColor: '#10b981',
    status: 'beta',
    routes: { landing: '/code', studio: '/code/studio' },
    models: {},
  },
];

const MODES_MAP = new Map(MODES_LIST.map(m => [m.id, m]));

export function isSupportedMode(mode: unknown): mode is ModeId {
  return typeof mode === 'string' && MODES_MAP.has(mode as ModeId);
}

export function getMode(id: ModeId): ModeContract {
  const mode = MODES_MAP.get(id);
  if (!mode) throw new Error(`Unknown mode: ${id}`);
  return mode;
}
