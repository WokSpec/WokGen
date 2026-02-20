import path from 'node:path';
import { promises as fs } from 'node:fs';
import { ensureDir, exists, parseArgs, readJson, readJsonl, relFromCwd, sleep } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const host = String(args.host ?? 'http://127.0.0.1:8188').replace(/\/$/, '');
const workflowPath = path.resolve(String(args.workflow ?? 'comfyui/workflows/pixel_icon_workflow.json'));
const promptsPath = path.resolve(String(args.prompts ?? 'prompts/prompts.jsonl'));
const outDir = path.resolve(String(args.outDir ?? 'assets/raw'));
const checkpointOverride = args.checkpoint ? String(args.checkpoint) : null;
const dryRun = Boolean(args.dryRun);

await ensureDir(outDir);
const workflow = await readJson(workflowPath);
const jobs = await readJsonl(promptsPath);

if (!jobs.length) {
  console.log('No prompt jobs found. Run npm run prompts first.');
  process.exit(0);
}

const checkpointNode = findNode(workflow, 'CheckpointLoaderSimple');
if (checkpointNode) {
  if (checkpointOverride) {
    workflow[checkpointNode].inputs.ckpt_name = checkpointOverride;
  }
  const ckpt = workflow[checkpointNode].inputs?.ckpt_name;
  if (String(ckpt || '').includes('PUT_YOUR_MODEL')) {
    console.warn('Workflow checkpoint is still placeholder. Edit comfyui/workflows/pixel_icon_workflow.json before generation.');
  }
}

let generated = 0;
let skipped = 0;

for (const job of jobs) {
  const targetFile = path.join(outDir, `${job.id}.png`);
  if (await exists(targetFile)) {
    skipped += 1;
    continue;
  }

  if (dryRun) {
    console.log(`[dryRun] would generate ${relFromCwd(targetFile)}`);
    continue;
  }

  const promptGraph = buildPromptGraph(workflow, job);
  const promptId = await queuePrompt(host, promptGraph);
  const image = await waitForImage(host, promptId);
  await fs.writeFile(targetFile, image);
  generated += 1;
  console.log(`Generated ${relFromCwd(targetFile)}`);
}

console.log(`Done. Generated ${generated}, skipped ${skipped}.`);

function findNode(graph, classType, titleIncludes) {
  for (const [id, node] of Object.entries(graph)) {
    if (node.class_type !== classType) continue;
    if (!titleIncludes) return id;
    const title = String(node._meta?.title ?? '').toLowerCase();
    if (title.includes(titleIncludes.toLowerCase())) return id;
  }
  return null;
}

function buildPromptGraph(baseGraph, job) {
  const graph = JSON.parse(JSON.stringify(baseGraph));
  const pos = findNode(graph, 'CLIPTextEncode', 'positive') || findNode(graph, 'CLIPTextEncode');
  const neg = findNode(graph, 'CLIPTextEncode', 'negative');
  const sampler = findNode(graph, 'KSampler');
  const saver = findNode(graph, 'SaveImage');

  if (!pos || !sampler || !saver) {
    throw new Error('Workflow missing required nodes: CLIPTextEncode(positive), KSampler, SaveImage');
  }

  graph[pos].inputs.text = job.prompt;
  if (neg) graph[neg].inputs.text = job.negative_prompt;
  graph[sampler].inputs.seed = Number(job.seed);
  graph[saver].inputs.filename_prefix = `asset_factory/${job.id}`;

  return graph;
}

async function queuePrompt(base, graph) {
  const res = await retryFetch(`${base}/prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: graph })
  });

  if (!res.ok) {
    const body = await safeText(res);
    throw new Error(`ComfyUI queue failed (${res.status}): ${body}`);
  }

  const json = await res.json();
  if (!json.prompt_id) {
    throw new Error('ComfyUI did not return prompt_id');
  }

  return json.prompt_id;
}

async function waitForImage(base, promptId) {
  const timeoutMs = 8 * 60 * 1000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const res = await retryFetch(`${base}/history/${promptId}`);
    if (res.ok) {
      const data = await res.json();
      const run = data[promptId];
      if (run?.outputs) {
        const imageMeta = findOutputImage(run.outputs);
        if (imageMeta) {
          return fetchImage(base, imageMeta);
        }
      }
    }
    await sleep(1200);
  }

  throw new Error(`Timed out waiting for ComfyUI prompt ${promptId}`);
}

function findOutputImage(outputs) {
  for (const nodeOut of Object.values(outputs)) {
    if (!Array.isArray(nodeOut.images)) continue;
    if (!nodeOut.images.length) continue;
    const img = nodeOut.images[0];
    if (img?.filename) return img;
  }
  return null;
}

async function fetchImage(base, imgMeta) {
  const query = new URLSearchParams({
    filename: String(imgMeta.filename),
    subfolder: String(imgMeta.subfolder ?? ''),
    type: String(imgMeta.type ?? 'output')
  });
  const res = await retryFetch(`${base}/view?${query.toString()}`);
  if (!res.ok) {
    const body = await safeText(res);
    throw new Error(`Failed to download ComfyUI image (${res.status}): ${body}`);
  }
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return '<no body>';
  }
}

async function retryFetch(url, options = {}, retries = 8, waitMs = 1200) {
  let lastErr;
  for (let i = 0; i < retries; i += 1) {
    try {
      return await fetch(url, options);
    } catch (err) {
      lastErr = err;
      await sleep(waitMs);
    }
  }
  throw lastErr;
}
