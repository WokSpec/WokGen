import type { AIProvider, GenerateParams, GenerateResult } from './types';

// Fal.ai model IDs for each tool
const MODELS = {
  generate: 'fal-ai/flux/schnell',
  scene:    'fal-ai/flux/schnell',
  inpaint:  'fal-ai/flux/dev/image-to-image',
  animate:  'fal-ai/animatediff-v2-v',
  rotate:   'fal-ai/flux/schnell',
};

function pixelArtPrompt(prompt: string, style?: string): string {
  const base = 'pixel art style, 32x32 sprite, crisp edges, limited palette, transparent background';
  return style ? `${base}, ${style}, ${prompt}` : `${base}, ${prompt}`;
}

export class FalProvider implements AIProvider {
  name = 'fal';
  capabilities = { generate: true, animate: true, rotate: true, inpaint: true, scene: true };

  isAvailable(): boolean {
    return Boolean(process.env.FAL_KEY);
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    const apiKey = process.env.FAL_KEY!;
    const modelId = MODELS[params.tool];

    const input: Record<string, unknown> = {
      prompt: pixelArtPrompt(params.prompt, params.style),
      negative_prompt: params.negativePrompt ?? 'blurry, anti-aliased, smooth, 3d render',
      image_size: { width: params.width ?? 1024, height: params.height ?? 1024 },
      num_inference_steps: params.steps ?? 4,
      ...(params.seed ? { seed: params.seed } : {}),
    };

    if (params.tool === 'inpaint' && params.inputImageUrl) {
      input.image_url = params.inputImageUrl;
    }
    if (params.tool === 'animate' && params.inputImageUrl) {
      input.image_url = params.inputImageUrl;
    }

    const res = await fetch(`https://fal.run/${modelId}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Fal error: ${res.status} ${err}`);
    }

    const data = await res.json();
    const images: Array<{ url: string }> = data.images ?? [];
    const video: string | undefined = data.video?.url;

    const urls = video ? [video] : images.map((i) => i.url).filter(Boolean);
    return { outputUrls: urls, providerJobId: data.request_id };
  }
}
