/**
 * WokGen Vector Mode — Schema
 */

import type { BaseGenerateRequest, ModeContract } from '../../packages/core/src/index';

export const VECTOR_MODE_CONTRACT: Pick<ModeContract, 'id' | 'name' | 'description' | 'targetAudience' | 'outputTypes' | 'exportFormats'> = {
  id:             'vector',
  name:           'WokGen Vector',
  description:    'Scalable icon and illustration generation',
  targetAudience: 'UI/UX designers, design system owners, illustrators',
  outputTypes:    ['image/svg+xml', 'image/png'],
  exportFormats:  ['svg', 'png', 'zip'],
};

export type VectorStyle =
  | 'outline'
  | 'filled'
  | 'rounded'
  | 'sharp'
  | 'duotone'
  | 'gradient';

export type VectorCategory =
  | 'icon'
  | 'illustration'
  | 'pattern'
  | 'logo-mark'
  | 'component';

export interface VectorGenerateRequest extends BaseGenerateRequest {
  mode: 'vector';
  style?: VectorStyle;
  category?: VectorCategory;
  strokeWidth?: number;
  colorCount?: number;
}
