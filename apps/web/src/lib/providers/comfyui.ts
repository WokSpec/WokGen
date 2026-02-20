import type { AIProvider, GenerateParams, GenerateResult } from './types';

// Local ComfyUI adapter — uses the workflow JSON files from packages/asset-pipeline
export class ComfyUIProvider implements AIProvider {
  name = 'comfyui';
  capabilities = { generate: true, animate: true, rotate: false, inpaint: true, scene: true };

  isAvailable(): boolean {
    return Boolean(process.env.COMFYUI_HOST);
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    const host = process.env.COMFYUI_HOST!.replace(/\/$/, '');

    // Build a minimal ComfyUI API workflow prompt
    const workflow = buildWorkflow(params);

    const queueRes = await fetch(`${host}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow }),
    });

    if (!queueRes.ok) {
      throw new Error(`ComfyUI queue error: ${queueRes.status}`);
    }

    const { prompt_id } = await queueRes.json();
    const outputUrls = await pollComfyUI(host, prompt_id);
    return { outputUrls, providerJobId: prompt_id };
  }
}

async function pollComfyUI(host: string, promptId: string): Promise<string[]> {
  const maxAttempts = 120;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await fetch(`${host}/history/${promptId}`);
    if (!res.ok) continue;
    const history = await res.json();
    const entry = history[promptId];
    if (!entry) continue;
    if (entry.status?.completed) {
      const urls: string[] = [];
      for (const nodeOutputs of Object.values(entry.outputs as Record<string, { images?: Array<{ filename: string; subfolder: string; type: string }> }>)) {
        for (const img of nodeOutputs.images ?? []) {
          urls.push(`${host}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${img.subfolder}&type=${img.type}`);
        }
      }
      return urls;
    }
  }
  throw new Error('ComfyUI generation timed out');
}

function buildWorkflow(params: GenerateParams): Record<string, unknown> {
  const prompt = `pixel art style, 32x32 sprite, ${params.prompt}`;
  const negPrompt = params.negativePrompt ?? 'blurry, anti-aliased, smooth, 3d';

  // Minimal KSampler workflow — adapted from asset-pipeline workflows
  return {
    '4': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'v1-5-pruned-emaonly.ckpt' } },
    '6': { class_type: 'CLIPTextEncode', inputs: { text: prompt, clip: ['4', 1] } },
    '7': { class_type: 'CLIPTextEncode', inputs: { text: negPrompt, clip: ['4', 1] } },
    '5': { class_type: 'EmptyLatentImage', inputs: { width: params.width ?? 512, height: params.height ?? 512, batch_size: 1 } },
    '3': { class_type: 'KSampler', inputs: { seed: params.seed ?? Math.floor(Math.random() * 1e9), steps: params.steps ?? 20, cfg: 7, sampler_name: 'euler', scheduler: 'normal', denoise: 1, model: ['4', 0], positive: ['6', 0], negative: ['7', 0], latent_image: ['5', 0] } },
    '8': { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    '9': { class_type: 'SaveImage', inputs: { filename_prefix: 'wokgen', images: ['8', 0] } },
  };
}
