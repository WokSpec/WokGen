import path from 'node:path';
import { promises as fs } from 'node:fs';

const roots = [
  'assets/raw',
  'assets/clean',
  'assets/rendered'
].map((p) => path.resolve(p));

for (const root of roots) {
  await deletePng(root);
}

for (const file of [
  'prompts/prompts.jsonl',
  'registry/assets.json',
  'registry/validation-report.json'
]) {
  await fs.rm(path.resolve(file), { force: true });
}

console.log('Cleaned generated assets and registry artifacts.');

async function deletePng(dir) {
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await deletePng(full);
      continue;
    }
    if (ent.isFile() && ent.name.toLowerCase().endsWith('.png')) {
      await fs.rm(full, { force: true });
    }
  }
}
