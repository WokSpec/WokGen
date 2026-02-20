import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { getProvider } from '@/lib/providers';
import { prisma } from '@/lib/db/prisma';
import type { Tool } from '@/lib/providers';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      tool = 'generate',
      prompt,
      negativePrompt,
      width = 1024,
      height = 1024,
      steps = 20,
      seed,
      inputImageUrl,
      maskImageUrl,
      directions = 4,
      frames = 16,
      style,
      provider: preferredProvider,
      // Anonymous usage — user brings their own API key
      apiKey: userApiKey,
      apiProvider: userApiProvider,
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const validTools: Tool[] = ['generate', 'animate', 'rotate', 'inpaint', 'scene'];
    if (!validTools.includes(tool)) {
      return NextResponse.json({ error: `Invalid tool. Must be one of: ${validTools.join(', ')}` }, { status: 400 });
    }

    // If user provides their own API key, set it temporarily in process.env scope
    // (Next.js API routes run in isolation per request in serverless, this is safe)
    const envOverrides: Record<string, string> = {};
    if (userApiKey && userApiProvider) {
      const keyMap: Record<string, string> = {
        replicate: 'REPLICATE_API_TOKEN',
        fal: 'FAL_KEY',
        together: 'TOGETHER_API_KEY',
      };
      const envKey = keyMap[userApiProvider];
      if (envKey) envOverrides[envKey] = userApiKey;
    }

    // Apply temp env overrides
    const restore: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(envOverrides)) {
      restore[k] = process.env[k];
      process.env[k] = v;
    }

    let job;
    try {
      // Create job record
      job = await prisma.job.create({
        data: {
          userId: session?.user?.id ?? null,
          tool,
          status: 'running',
          prompt,
          negPrompt: negativePrompt,
          params: JSON.stringify({ width, height, steps, seed, directions, frames, style }),
          provider: preferredProvider ?? null,
        },
      });

      const aiProvider = getProvider(tool as Tool, preferredProvider);
      const result = await aiProvider.generate({
        tool: tool as Tool,
        prompt,
        negativePrompt,
        width,
        height,
        steps,
        seed,
        inputImageUrl,
        maskImageUrl,
        directions,
        frames,
        style,
      });

      // Save assets
      const assets = await Promise.all(
        result.outputUrls.map((url) =>
          prisma.generatedAsset.create({
            data: {
              jobId: job!.id,
              userId: session?.user?.id ?? null,
              url,
              tool,
              prompt,
              format: url.endsWith('.gif') ? 'gif' : url.endsWith('.webp') ? 'webp' : 'png',
              isPublic: false,
            },
          })
        )
      );

      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'done',
          provider: aiProvider.name,
          providerJobId: result.providerJobId,
          finishedAt: new Date(),
        },
      });

      return NextResponse.json({
        jobId: job.id,
        status: 'done',
        provider: aiProvider.name,
        assets: assets.map((a) => ({ id: a.id, url: a.url, format: a.format })),
      });
    } catch (err) {
      if (job) {
        await prisma.job.update({
          where: { id: job.id },
          data: { status: 'failed', error: String(err), finishedAt: new Date() },
        });
      }
      throw err;
    } finally {
      // Restore env
      for (const [k, v] of Object.entries(restore)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  } catch (err) {
    console.error('[/api/generate]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
