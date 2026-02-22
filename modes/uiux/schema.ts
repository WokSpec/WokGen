/**
 * WokGen UI/UX Mode — Schema
 */

import type { ModeContract } from '../../packages/core/src/index';

export const UIUX_MODE_CONTRACT: Pick<ModeContract, 'id' | 'name' | 'description' | 'targetAudience' | 'outputTypes' | 'exportFormats'> = {
  id:             'uiux',
  name:           'WokGen UI/UX',
  description:    'React, HTML, and Tailwind component generation',
  targetAudience: 'Frontend developers, product designers, full-stack teams',
  outputTypes:    ['text/html', 'text/typescript', 'text/css'],
  exportFormats:  ['tsx', 'html', 'css', 'zip'],
};

export type UIUXFramework =
  | 'react'
  | 'next'
  | 'html-tailwind'
  | 'vanilla-css';

export type UIUXComponentType =
  | 'hero'
  | 'navbar'
  | 'footer'
  | 'pricing'
  | 'features'
  | 'cta'
  | 'testimonials'
  | 'form'
  | 'card'
  | 'dashboard'
  | 'table'
  | 'modal'
  | 'sidebar'
  | 'login'
  | 'signup'
  | 'blog-post'
  | 'landing-page'
  | 'portfolio'
  | 'changelog';

export type UIUXStylePreset =
  | 'minimal'
  | 'bold'
  | 'glassmorphism'
  | 'neomorphism'
  | 'corporate'
  | 'dark-mode'
  | 'colorful'
  | 'brutalist';

export interface UIUXGenerateRequest {
  componentType: UIUXComponentType;
  framework: UIUXFramework;
  stylePreset?: UIUXStylePreset;
  prompt: string;
  colorScheme?: string;
  darkMode?: boolean;
  responsive?: boolean;
  projectId?: string;
}

export interface UIUXGenerateResponse {
  ok: boolean;
  code?: string;
  jobId?: string;
  error?: string;
}
