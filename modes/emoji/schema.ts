/**
 * WokGen Emoji Mode — Schema
 */

import type { BaseGenerateRequest, ModeContract } from '../../packages/core/src/index';

export const EMOJI_MODE_CONTRACT: Pick<ModeContract, 'id' | 'name' | 'description' | 'targetAudience' | 'outputTypes' | 'exportFormats'> = {
  id:             'emoji',
  name:           'WokGen Emoji',
  description:    'Emoji pack and sticker generation',
  targetAudience: 'Community managers, Discord/Slack users, brand teams',
  outputTypes:    ['image/png', 'image/webp'],
  exportFormats:  ['png', 'webp', 'zip'],
};

export type EmojiStyle =
  | 'cartoon'
  | 'flat'
  | 'blob'
  | 'pixel'
  | 'illustrated'
  | 'minimal';

export type EmojiPlatform =
  | 'discord'
  | 'slack'
  | 'ios'
  | 'android'
  | 'web'
  | 'twitch';

export type EmojiSize = 16 | 32 | 64 | 128 | 256;

export interface EmojiGenerateRequest extends BaseGenerateRequest {
  mode: 'emoji';
  style?: EmojiStyle;
  platform?: EmojiPlatform;
  size?: EmojiSize;
  expression?: string;
  theme?: string;
}
