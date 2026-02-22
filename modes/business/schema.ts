/**
 * WokGen Business Mode — Schema
 */

import type { BaseGenerateRequest, ModeContract } from '../../packages/core/src/index';

export const BUSINESS_MODE_CONTRACT: Pick<ModeContract, 'id' | 'name' | 'description' | 'targetAudience' | 'outputTypes' | 'exportFormats'> = {
  id:             'business',
  name:           'WokGen Business',
  description:    'Brand and marketing asset generation',
  targetAudience: 'Startups, marketing teams, brand designers, agencies',
  outputTypes:    ['image/png', 'image/webp'],
  exportFormats:  ['png', 'webp', 'zip'],
};

export type BusinessTool =
  | 'logo'
  | 'brand-kit'
  | 'slide'
  | 'banner'
  | 'web-hero'
  | 'icon';

export type BusinessStyle =
  | 'minimal'
  | 'bold'
  | 'corporate'
  | 'playful'
  | 'luxury'
  | 'tech'
  | 'organic';

export type BusinessMood =
  | 'professional'
  | 'energetic'
  | 'trustworthy'
  | 'innovative'
  | 'friendly'
  | 'premium';

export interface BusinessGenerateRequest extends BaseGenerateRequest {
  mode: 'business';
  tool?: BusinessTool;
  style?: BusinessStyle;
  mood?: BusinessMood;
  industry?: string;
  platform?: string;
  colorDirection?: string;
}
