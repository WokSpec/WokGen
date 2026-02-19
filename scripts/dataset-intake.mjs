import path from 'node:path';
import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import { ensureDir, exists, parseArgs, writeJson, writeJsonl } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args.dryRun);

const base = path.resolve('dataset');
const inbox = path.join(base, 'inbox');
const accepted = path.join(base, 'accepted');
const rejected = path.join(base, 'rejected');
const train = path.join(base, 'train/images');
const manifests = path.join(base, 'manifests');

await ensureLayout();
const csvMeta = await readCsvMeta(path.join(inbox, '_licenses.csv'));
const files = await walkFiles(inbox);
const imageFiles = files.filter((f) => isImageFile(f.abs) && !f.rel.startsWith('_licenses.csv'));

const acceptedRows = [];
const rejectedRows = [];
const seenHash = new Set();

for (const file of imageFiles) {
  const meta = resolveMetadata(file.rel, csvMeta);
  const normalizedLicense = normalizeLicense(meta.license || inferLicenseFromPath(file.rel));
  const policy = policyFor(normalizedLicense);

  if (!policy.allowTrain) {
    rejectedRows.push({
      path: file.rel,
      reason: normalizedLicense ? `unsupported_license:${normalizedLicense}` : 'missing_license',
      license: normalizedLicense || null
    });
    if (!dryRun) {
      const out = path.join(rejected, rejectedRows[rejectedRows.length - 1].reason, file.rel);
      await copyWithDirs(file.abs, out);
    }
    continue;
  }

  const hash = await sha256(file.abs);
  if (seenHash.has(hash)) {
    rejectedRows.push({
      path: file.rel,
      reason: 'duplicate_content',
      license: normalizedLicense
    });
    if (!dryRun) {
      const out = path.join(rejected, 'duplicate_content', file.rel);
      await copyWithDirs(file.abs, out);
    }
    continue;
  }
  seenHash.add(hash);

  const ext = path.extname(file.abs).toLowerCase();
  const outName = `${hash.slice(0, 16)}_${slug(path.basename(file.rel, ext))}${ext}`;
  const outAccepted = path.join(accepted, outName);
  const outTrain = path.join(train, outName);

  const row = {
    id: hash.slice(0, 16),
    sha256: hash,
    src_rel: file.rel,
    accepted_name: outName,
    license: normalizedLicense,
    source_url: meta.source_url || null,
    title: meta.title || null,
    author: meta.author || null,
    requires_attribution: policy.requiresAttribution
  };
  acceptedRows.push(row);

  if (!dryRun) {
    await copyWithDirs(file.abs, outAccepted);
    await copyWithDirs(file.abs, outTrain);
  }
}

const report = {
  ok: true,
  dryRun,
  scannedImages: imageFiles.length,
  accepted: acceptedRows.length,
  rejected: rejectedRows.length,
  generatedAt: new Date().toISOString()
};

if (!dryRun) {
  await writeJson(path.join(manifests, 'dataset-report.json'), report);
  await writeJson(path.join(manifests, 'dataset-rejected.json'), rejectedRows);
  await writeJsonl(path.join(manifests, 'dataset-assets.jsonl'), acceptedRows);
  await fs.writeFile(path.join(manifests, 'ATTRIBUTION.md'), buildAttribution(acceptedRows), 'utf8');
}

console.log(`Dataset intake complete. accepted=${acceptedRows.length} rejected=${rejectedRows.length} scanned=${imageFiles.length}${dryRun ? ' (dryRun)' : ''}`);

async function ensureLayout() {
  await ensureDir(inbox);
  await ensureDir(accepted);
  await ensureDir(rejected);
  await ensureDir(train);
  await ensureDir(manifests);
  const csvPath = path.join(inbox, '_licenses.csv');
  if (!(await exists(csvPath))) {
    await fs.writeFile(csvPath, 'path,license,source_url,title,author\n', 'utf8');
  }
}

async function readCsvMeta(csvPath) {
  if (!(await exists(csvPath))) return new Map();
  const raw = await fs.readFile(csvPath, 'utf8');
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) return new Map();
  const out = new Map();
  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsv(lines[i]);
    if (!cols.length) continue;
    const key = normalizeRel(cols[0] || '');
    if (!key) continue;
    out.set(key, {
      license: cols[1] || '',
      source_url: cols[2] || '',
      title: cols[3] || '',
      author: cols[4] || ''
    });
  }
  return out;
}

function splitCsv(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"') {
      cur += '"';
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === ',' && !inQ) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function resolveMetadata(rel, csvMeta) {
  const exact = csvMeta.get(normalizeRel(rel));
  if (exact) return exact;
  return {};
}

function inferLicenseFromPath(rel) {
  const parts = normalizeRel(rel).split('/');
  for (const p of parts) {
    const n = normalizeLicense(p);
    if (n) return n;
  }
  return '';
}

function normalizeLicense(value) {
  const s = String(value || '').trim().toUpperCase();
  if (!s) return '';
  const map = {
    'CC0': 'CC0',
    'CC-0': 'CC0',
    'CC BY 3.0': 'CC-BY-3.0',
    'CC-BY-3.0': 'CC-BY-3.0',
    'CC BY 4.0': 'CC-BY-4.0',
    'CC-BY-4.0': 'CC-BY-4.0',
    'OGA-BY': 'OGA-BY',
    'OGA BY': 'OGA-BY',
    'CC-BY-SA-3.0': 'CC-BY-SA-3.0',
    'CC-BY-SA-4.0': 'CC-BY-SA-4.0',
    'GPL-2.0': 'GPL-2.0',
    'GPL-3.0': 'GPL-3.0',
    'LGPL-3.0': 'LGPL-3.0'
  };
  return map[s] || '';
}

function policyFor(license) {
  const rules = {
    'CC0': { allowTrain: true, requiresAttribution: false },
    'CC-BY-3.0': { allowTrain: true, requiresAttribution: true },
    'CC-BY-4.0': { allowTrain: true, requiresAttribution: true },
    'OGA-BY': { allowTrain: true, requiresAttribution: true },
    'CC-BY-SA-3.0': { allowTrain: false, requiresAttribution: true },
    'CC-BY-SA-4.0': { allowTrain: false, requiresAttribution: true },
    'GPL-2.0': { allowTrain: false, requiresAttribution: true },
    'GPL-3.0': { allowTrain: false, requiresAttribution: true },
    'LGPL-3.0': { allowTrain: false, requiresAttribution: true }
  };
  return rules[license] || { allowTrain: false, requiresAttribution: false };
}

function buildAttribution(rows) {
  const lines = [
    '# Attribution',
    '',
    'Generated from dataset intake. Keep this file with any trained outputs.',
    ''
  ];
  for (const r of rows) {
    if (!r.requires_attribution) continue;
    lines.push(`- ${r.title || r.src_rel} | author: ${r.author || 'unknown'} | license: ${r.license} | source: ${r.source_url || 'unknown'}`);
  }
  if (lines.length === 4) lines.push('- No attribution-required assets in this batch.');
  lines.push('');
  return lines.join('\n');
}

async function walkFiles(root) {
  const out = [];
  const stack = [{ abs: root, rel: '' }];
  while (stack.length) {
    const cur = stack.pop();
    const entries = await fs.readdir(cur.abs, { withFileTypes: true });
    for (const ent of entries) {
      const abs = path.join(cur.abs, ent.name);
      const rel = normalizeRel(path.join(cur.rel, ent.name));
      if (ent.isDirectory()) {
        stack.push({ abs, rel });
      } else if (ent.isFile()) {
        out.push({ abs, rel });
      }
    }
  }
  return out;
}

function normalizeRel(p) {
  return String(p || '').replace(/\\/g, '/').replace(/^\.?\//, '');
}

function isImageFile(file) {
  return /\.(png|jpg|jpeg|webp|gif|bmp|tga)$/i.test(file);
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function copyWithDirs(src, dst) {
  await ensureDir(path.dirname(dst));
  await fs.copyFile(src, dst);
}

async function sha256(file) {
  const data = await fs.readFile(file);
  return createHash('sha256').update(data).digest('hex');
}
