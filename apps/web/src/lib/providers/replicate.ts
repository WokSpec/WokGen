import type { AIProvider, GenerateParams, GenerateResult } from './types';

// Replicate model IDs for each tool
const MODELS = {
  generate: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
  scene:    'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
  inpaint:  'stability-ai/stable-diffusion-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3',
  animate:  'lucataco/animate-diff:1531004ee4c98894ab11f8a4ce6206099e5a4133bc5d27b3c2d1bb8f5bb6b345',
  rotate:   'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
};

function pixelArtPrompt(prompt: string, style?: string): string {
  const base = 'pixel art style, 32x32 icon, crisp edges, limited palette, transparent background';
  return style ? `${base}, ${style}, ${prompt}` : `${base}, ${prompt}`;
}

async function waitForPrediction(getUrl: string, apiKey: string): Promise<string[]> {
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`Replicate poll error: ${res.status}`);
    const data = await res.json();
    if (data.status === 'succeeded') return Array.isArray(data.output) ? data.output : [data.output];
    if (data.status === 'failed') throw new Error(data.error ?? 'Replicate generation failed');
  }
  throw new Error('Replicate generation timed out');
}

export class ReplicateProvider implements AIProvider {
  name = 'replicate';
  capabilities = { generate: true, animate: true, rotate: true, inpaint: true, scene: true };

  isAvailable(): boolean {
    return Boolean(process.env.REPLICATE_API_TOKEN);
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    const apiKey = process.env.REPLICATE_API_TOKEN!;
    const model = MODELS[params.tool];
    const [owner_model, version] = model.split(':');

    const input: Record<string, unknown> = {
      prompt: pixelArtPrompt(params.prompt, params.style),
      negative_prompt: params.negativePrompt ?? 'blurry, anti-aliased, smooth, 3d render, photo',
      width: params.width ?? 1024,
      height: params.height ?? 1024,
      num_inference_steps: params.steps ?? 20,
      ...(params.seed ? { seed: params.seed } : {}),
    };

    if (params.tool === 'inpaint' && params.inputImageUrl) {
      input.image = params.inputImageUrl;
      input.mask = params.maskImageUrl;
    }
    if (params.tool === 'animate' && params.inputImageUrl) {
      input.image = params.inputImageUrl;
      input.num_frames = params.frames ?? 16;
    }

    const res = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify({ version, input }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Replicate error: ${res.status} ${err}`);
    }

    const prediction = await res.json();
    if (prediction.status === 'succeeded') {
      const urls = Array.isArray(prediction.output) ? prediction.output : [prediction.output];
      return { outputUrls: urls.filter(Boolean), providerJobId: prediction.id };
    }
    if (prediction.status === 'failed') {
      throw new Error(prediction.error ?? 'Replicate generation failed');
    }
    // If not done yet, poll
    const urls = await waitForPrediction(prediction.urls.get, apiKey);
    return { outputUrls: urls.filter(Boolean), providerJobId: prediction.id };
  }
}
