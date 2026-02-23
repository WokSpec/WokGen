// WokGen — Vector Prompt Builder
// Clean SVG icon / illustration vocabulary.
// Completely separate from pixel and business builders.

// ---------------------------------------------------------------------------
// Vector types
// ---------------------------------------------------------------------------

export type VectorTool =
  | 'icon'
  | 'illustration'
  | 'logo-mark'
  | 'pattern'
  | 'ui-component';

export type VectorStyle =
  | 'outline'
  | 'filled'
  | 'duotone'
  | 'rounded'
  | 'sharp'
  | 'minimal'
  | 'detailed'
  | 'monoline';

export type VectorWeight = 'thin' | 'regular' | 'medium' | 'bold';

// ---------------------------------------------------------------------------
// Vector style tokens (internal — not exported to OSS packages)
// ---------------------------------------------------------------------------

const VECTOR_STYLE_TOKENS: Record<VectorStyle, string[]> = {
  outline:   ['outline style', 'stroke only', 'no fill', 'clean lines', 'consistent stroke weight'],
  filled:    ['filled solid', 'flat filled shapes', 'bold silhouette', 'no gradients', 'flat design'],
  duotone:   ['duotone', 'two-color', 'layered fills', 'depth through color', 'minimal palette'],
  rounded:   ['rounded corners', 'soft shapes', 'friendly style', 'rounded terminals', 'smooth curves'],
  sharp:     ['sharp corners', 'geometric', 'angular', 'precise', 'technical aesthetic'],
  minimal:   ['ultra minimal', 'reduced to essentials', 'negative space', 'clean', 'one or two strokes'],
  detailed:  ['detailed line art', 'intricate', 'complex geometry', 'fine detail', 'skilled illustration'],
  monoline:  ['monoline', 'single stroke weight', 'consistent line thickness', 'unified stroke'],
};

const VECTOR_TOOL_TOKENS: Record<VectorTool, string[]> = {
  'icon':         ['simple icon', 'scalable icon', 'UI icon', 'single concept', '24x24 grid', 'optical weight balanced'],
  'illustration': ['vector illustration', 'editorial style', 'spot illustration', 'expressive', 'composed scene'],
  'logo-mark':    ['logo mark', 'brand symbol', 'logomark', 'clean geometric symbol', 'memorable mark'],
  'pattern':      ['seamless pattern', 'repeating tile', 'surface design', 'tiling motif', 'repeat vector'],
  'ui-component': ['UI element', 'interface graphic', 'button state', 'card illustration', 'UI decoration'],
};

const VECTOR_WEIGHT_TOKENS: Record<VectorWeight, string[]> = {
  thin:    ['thin weight', '1pt stroke', 'hairline', 'delicate'],
  regular: ['regular weight', '2pt stroke', 'balanced'],
  medium:  ['medium weight', '2.5pt stroke', 'slightly bold'],
  bold:    ['bold weight', '3pt stroke', 'heavy', 'strong presence'],
};

// ---------------------------------------------------------------------------
// Vector prompt builder
// ---------------------------------------------------------------------------

export interface VectorPromptParams {
  tool: VectorTool;
  concept: string;
  style?: VectorStyle;
  strokeWeight?: VectorWeight;
  colorCount?: number;
  category?: string;
}

export interface BuiltPrompt {
  prompt: string;
  negPrompt: string;
  width: number;
  height: number;
}

export function buildVectorPrompt(params: VectorPromptParams): BuiltPrompt {
  const {
    tool,
    concept,
    style = 'outline',
    strokeWeight = 'regular',
    colorCount = 1,
    category,
  } = params;

  const parts: string[] = [];

  // Tool framing
  parts.push(...VECTOR_TOOL_TOKENS[tool]);

  // Style tokens
  parts.push(...VECTOR_STYLE_TOKENS[style]);

  // Stroke weight
  parts.push(...VECTOR_WEIGHT_TOKENS[strokeWeight]);

  // Color limit framing
  if (colorCount === 1) {
    parts.push('monochrome', 'single color', 'one-color design');
  } else if (colorCount === 2) {
    parts.push('two-color palette', 'limited colors', 'restrained palette');
  } else if (colorCount <= 4) {
    parts.push('limited color palette', 'curated colors');
  }

  // Category context
  if (category) {
    parts.push(`${category} context`);
  }

  // Core concept
  parts.push(concept.trim());

  // Universal quality anchors
  parts.push('clean vector art', 'crisp edges', 'professional quality', 'print ready');

  const negParts = [
    'photorealistic',
    'raster effects',
    'blurry',
    'inconsistent stroke weight',
    'amateur',
    'complex texture',
    'gradient overuse',
    'drop shadow',
    'lens flare',
    'busy',
    'multiple unrelated elements',
    'watermark',
    'signature',
  ];

  return {
    prompt: parts.join(', '),
    negPrompt: negParts.join(', '),
    width: 1024,
    height: 1024,
  };
}
