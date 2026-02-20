import type { AIProvider, GenerateParams, GenerateResult } from './types';

export class TogetherProvider implements AIProvider {
  name = 'together';
  capabilities = { generate: true, animate: false, rotate: true, inpaint: false, scene: true };

  isAvailable(): boolean {
    return Boolean(process.env.TOGETHER_API_KEY);
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    const apiKey = process.env.TOGETHER_API_KEY!;

    const prompt =
      `pixel art style, 32x32 sprite, crisp edges, limited palette, transparent background, ${params.prompt}`;

    const res = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-schnell-Free',
        prompt,
        negative_prompt: params.negativePrompt ?? 'blurry, anti-aliased, smooth',
        width: params.width ?? 1024,
        height: params.height ?? 1024,
        steps: params.steps ?? 4,
        n: 1,
        ...(params.seed ? { seed: params.seed } : {}),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Together error: ${res.status} ${err}`);
    }

    const data = await res.json();
    const urls: string[] = (data.data ?? []).map((d: { url?: string; b64_json?: string }) => {
      if (d.url) return d.url;
      if (d.b64_json) return `data:image/png;base64,${d.b64_json}`;
      return null;
    }).filter(Boolean);

    return { outputUrls: urls };
  }
}
