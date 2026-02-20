import path from 'node:path';
import { promises as fs } from 'node:fs';
import { ensureDir, exists, parseArgs, readJsonl, relFromCwd, sleep } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const model = String(args.model ?? 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b');
const promptsPath = path.resolve(String(args.prompts ?? 'prompts/prompts.jsonl'));
const outDir = path.resolve(String(args.outDir ?? 'assets/raw'));
const apiKey = process.env.REPLICATE_API_TOKEN;

if (!apiKey) {
  console.error('Please set REPLICATE_API_TOKEN environment variable');
  process.exit(1);
}

await ensureDir(outDir);
const jobs = await readJsonl(promptsPath);

if (!jobs.length) {
  console.log('No prompt jobs found. Run npm run prompts first.');
  process.exit(0);
}

let generated = 0;
let skipped = 0;

for (const job of jobs) {
  const targetFile = path.join(outDir, `${job.id}.png`);
  if (await exists(targetFile)) {
    skipped += 1;
    continue;
  }

  console.log(`Generating ${relFromCwd(targetFile)}...`);
  const imageUrl = await generateImage(job.prompt, job.negative_prompt);
  const imageBuffer = await fetchImage(imageUrl);
  await fs.writeFile(targetFile, imageBuffer);
  generated += 1;
  console.log(`Generated ${relFromCwd(targetFile)}`);
  await sleep(1000); // rate limit
}

console.log(`Done. Generated ${generated}, skipped ${skipped}.`);

async function generateImage(prompt, negativePrompt) {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: model.split(':')[1],
      input: {
        prompt: `pixel art style, ${prompt}`,
        negative_prompt: negativePrompt,
        width: 1024,
        height: 1024,
        num_inference_steps: 20,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Replicate API error: ${response.status} ${response.statusText}`);
  }

  const prediction = await response.json();
  return waitForPrediction(prediction.urls.get);
}

async function waitForPrediction(getUrl) {
  while (true) {
    const response = await fetch(getUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status} ${response.statusText}`);
    }

    const prediction = await response.json();
    if (prediction.status === 'succeeded') {
      return prediction.output[0];
    } else if (prediction.status === 'failed') {
      throw new Error(`Prediction failed: ${prediction.error}`);
    }

    await sleep(5000); // wait 5 seconds
  }
}

async function fetchImage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}