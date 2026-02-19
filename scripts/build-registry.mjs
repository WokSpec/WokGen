import path from 'node:path';
import { promises as fs } from 'node:fs';
import { exists, parseArgs, readJson, readJsonl, sha256File, writeJson } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const outFile = path.resolve(String(args.out ?? 'registry/assets.json'));
const iconsBase = path.resolve('assets/rendered/icons');
const prompts = await readJsonl(path.resolve('prompts/prompts.jsonl'));
const promptById = new Map(prompts.map((p) => [p.id, p]));
const specRaw = await readJson('spec.json');
const spec = resolveSpecProfile(specRaw, args.profile);

const baseSizeDir = path.join(iconsBase, String(spec.baseSize));
const files = (await fs.readdir(baseSizeDir).catch(() => [])).filter((f) => f.endsWith('.png')).sort();

const assets = [];
for (const file of files) {
  const id = file.replace(/\.png$/i, '');

  const paths = {};
  let complete = true;
  for (const size of spec.exportSizes) {
    const full = path.join(iconsBase, String(size), file);
    if (!(await exists(full))) {
      complete = false;
      break;
    }
    paths[String(size)] = path.relative(process.cwd(), full).replace(/\\/g, '/');
  }

  if (!complete) continue;

  const hash = await sha256File(path.join(iconsBase, String(spec.baseSize), file));
  const promptMeta = promptById.get(id);

  assets.push({
    id,
    category: promptMeta?.category ?? 'unknown',
    rarity: promptMeta?.rarity ?? 'unknown',
    tags: buildTags(promptMeta),
    seed: Number(promptMeta?.seed ?? 0),
    paths,
    hash
  });
}

await writeJson(outFile, assets);
console.log(`Registry updated: ${path.relative(process.cwd(), outFile)} (${assets.length} assets)`);

function buildTags(promptMeta) {
  if (!promptMeta?.prompt) return [];
  const tokens = promptMeta.prompt
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(tokens)).slice(0, 16);
}

function resolveSpecProfile(spec, profile) {
  if (!profile) return spec;
  const p = spec.profiles?.[String(profile)];
  if (!p) throw new Error(`Unknown spec profile: ${profile}`);
  return { ...spec, ...p };
}
