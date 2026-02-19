import path from 'node:path';
import { promises as fs } from 'node:fs';
import { ensureDir } from './lib.mjs';

const base = path.resolve('dataset');
const dirs = [
  'inbox',
  'accepted',
  'rejected',
  'train/images',
  'manifests'
];

await fs.rm(base, { recursive: true, force: true });
for (const d of dirs) {
  await ensureDir(path.join(base, d));
}

await fs.writeFile(path.join(base, 'inbox', '_licenses.csv'), 'path,license,source_url,title,author\n', 'utf8');
await fs.writeFile(path.join(base, 'LICENSES.md'), defaultLicenseGuide(), 'utf8');

console.log('Reset dataset workspace at dataset/.');

function defaultLicenseGuide() {
  return [
    '# Dataset Intake License Guide',
    '',
    'Drop downloaded assets/folders into `dataset/inbox/`.',
    '',
    'Provide license metadata via one of these:',
    '1. Put assets under a license folder (example `dataset/inbox/CC0/my_pack/...`).',
    '2. Fill `dataset/inbox/_licenses.csv`.',
    '',
    'Recognized allow-for-training licenses by default:',
    '- `CC0`',
    '- `CC-BY-3.0`',
    '- `CC-BY-4.0`',
    '- `OGA-BY`',
    '',
    'Assets with missing/unsupported licenses are moved to `dataset/rejected/`.'
  ].join('\n') + '\n';
}
