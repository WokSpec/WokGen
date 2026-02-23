import { pixelMode } from './pixel';
import { businessMode } from './business';
import { vectorMode } from './vector';
import { uiuxMode } from './uiux';
import { voiceMode } from './voice';
import { textMode } from './text';
import type { ModeContract, ModeId } from './types';

// ---------------------------------------------------------------------------
// Mode registry — all product lines
// ---------------------------------------------------------------------------
export const MODES: Record<ModeId, ModeContract> = {
  pixel:    pixelMode,
  business: businessMode,
  vector:   vectorMode,
  uiux:     uiuxMode,
  voice:    voiceMode,
  text:     textMode,
};

export const MODES_LIST: ModeContract[] = Object.values(MODES);

export const LIVE_MODES = MODES_LIST.filter(m => m.status === 'live' || m.status === 'beta');
export const COMING_SOON_MODES = MODES_LIST.filter(m => m.status === 'coming_soon');

export function getMode(id: string): ModeContract {
  return MODES[id as ModeId] ?? MODES.pixel;
}

export function isSupportedMode(id: unknown): id is ModeId {
  return typeof id === 'string' && id in MODES;
}

export type { ModeContract, ModeId } from './types';
