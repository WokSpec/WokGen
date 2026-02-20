// AI Provider interface — all adapters implement this contract

export type Tool = 'generate' | 'animate' | 'rotate' | 'inpaint' | 'scene';

export interface GenerateParams {
  tool: Tool;
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  // Tool-specific
  inputImageUrl?: string;   // for rotate, inpaint, animate
  maskImageUrl?: string;    // for inpaint
  directions?: 4 | 8;      // for rotate
  frames?: number;          // for animate
  style?: string;           // pixel art style hint
}

export interface GenerateResult {
  outputUrls: string[];
  providerJobId?: string;
}

export interface ProviderCapabilities extends Record<string, boolean> {
  generate: boolean;
  animate: boolean;
  rotate: boolean;
  inpaint: boolean;
  scene: boolean;
}

export interface AIProvider {
  name: string;
  capabilities: ProviderCapabilities;
  isAvailable(): boolean;
  generate(params: GenerateParams): Promise<GenerateResult>;
}
