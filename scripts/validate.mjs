import path from 'node:path';
import { promises as fs } from 'node:fs';
import { ensureDir, exists, parseArgs, readJson, readJsonl, runCommand, sha256File, writeJson } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const specRaw = await readJson('spec.json');
const spec = resolveSpecProfile(specRaw, args.profile);
const reportPath = path.resolve(String(args.report ?? 'registry/validation-report.json'));
const identifyCmd = (await hasCmd('magick')) ? ['magick', 'identify'] : (await hasCmd('identify')) ? ['identify'] : null;
const colorScanCmd = (await hasCmd('magick')) ? 'magick' : (await hasCmd('convert')) ? 'convert' : null;

const errors = [];
const warnings = [];

await validateStructure();
await validatePromptsUnique();
await validateRenderedAssets();

const report = {
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  errors,
  warnings
};

await ensureDir(path.dirname(reportPath));
await writeJson(reportPath, report);

if (report.ok) {
  console.log(`Validation passed with ${warnings.length} warning(s). Report: ${path.relative(process.cwd(), reportPath)}`);
} else {
  console.error(`Validation failed with ${errors.length} error(s). Report: ${path.relative(process.cwd(), reportPath)}`);
  process.exitCode = 1;
}

async function validateStructure() {
  const requiredDirs = [
    'art/source',
    'art/parts/base',
    'art/parts/material',
    'art/parts/modifier',
    'art/parts/frame',
    'assets/raw',
    'assets/clean',
    'assets/rendered/sheets',
    'registry',
    'prompts',
    'scripts',
    'comfyui/workflows'
  ];
  for (const size of spec.exportSizes) {
    requiredDirs.push(`assets/rendered/icons/${size}`);
  }

  for (const dir of requiredDirs) {
    if (!(await exists(path.resolve(dir)))) {
      errors.push(`Missing required directory: ${dir}`);
    }
  }

  if (!Array.isArray(spec.palette) || spec.palette.length < 24) {
    errors.push('spec.json palette must include at least 24 colors');
  }

  if (!Number.isFinite(Number(spec.baseSize)) || Number(spec.baseSize) <= 0) {
    errors.push('spec baseSize must be a positive number');
  }
}

async function validatePromptsUnique() {
  const prompts = await readJsonl(path.resolve('prompts/prompts.jsonl'));
  if (!prompts.length) {
    warnings.push('prompts/prompts.jsonl does not exist yet or has no records');
    return;
  }

  const seen = new Set();
  for (const row of prompts) {
    if (!row.id) {
      errors.push('Prompt record missing id');
      continue;
    }
    if (seen.has(row.id)) {
      errors.push(`Duplicate prompt id: ${row.id}`);
    }
    seen.add(row.id);
  }
}

async function validateRenderedAssets() {
  const paletteSet = new Set(spec.palette.map((h) => h.toUpperCase()));
  let anyImages = false;
  const hashByFile = [];

  for (const size of spec.exportSizes) {
    const sizeDir = path.resolve(`assets/rendered/icons/${size}`);
    const files = (await fs.readdir(sizeDir).catch(() => [])).filter((f) => f.endsWith('.png'));

    for (const file of files) {
      anyImages = true;
      const full = path.join(sizeDir, file);

      const identify = await safeIdentify(full);
      if (!identify) {
        errors.push(`Unable to inspect image metadata: assets/rendered/icons/${size}/${file}`);
        continue;
      }

      if (identify.width !== Number(size) || identify.height !== Number(size)) {
        errors.push(`Invalid dimensions for ${file}: expected ${size}x${size}, got ${identify.width}x${identify.height}`);
      }

      if (spec.limits.alphaRequired && identify.alpha !== true) {
        errors.push(`Alpha channel missing for ${file}`);
      }

      const kb = (await fs.stat(full)).size / 1024;
      const maxKb = Number(spec.limits?.maxFileKB?.[String(size)] ?? 99999);
      if (kb > maxKb) {
        errors.push(`File too large for ${file} at ${size}px: ${kb.toFixed(1)}KB > ${maxKb}KB`);
      }

      const paletteOK = await validatePaletteMembership(full, paletteSet);
      if (!paletteOK.ok) {
        errors.push(`Palette violation in ${file}: found ${paletteOK.badColor}`);
      }

      if (Number(size) === Number(spec.baseSize)) {
        hashByFile.push({ file, hash: await sha256File(full) });
      }
    }
  }

  if (!anyImages) {
    warnings.push('No rendered icon images found yet; image-level validation skipped');
    return;
  }

  const seenHash = new Map();
  for (const row of hashByFile) {
    if (!seenHash.has(row.hash)) {
      seenHash.set(row.hash, row.file);
      continue;
    }
    errors.push(`Duplicate visual asset content: ${row.file} matches ${seenHash.get(row.hash)}`);
  }

  const nearDupes = await findNearDuplicateIcons(spec.baseSize);
  for (const pair of nearDupes) {
    warnings.push(`Near-duplicate visual similarity: ${pair.a} ~ ${pair.b} (distance ${pair.distance})`);
  }
}

async function safeIdentify(file) {
  try {
    if (!identifyCmd) {
      warnings.push('No identify command found; skipping deep image metadata checks');
      return null;
    }
    const cmd = identifyCmd[0];
    const args = identifyCmd.length === 2
      ? [identifyCmd[1], '-format', '%w %h %[channels]', file]
      : ['-format', '%w %h %[channels]', file];
    const { stdout } = await runCommand(cmd, args);
    const [w, h, channelsRaw] = stdout.trim().split(/\s+/, 3);
    const channels = String(channelsRaw || '').toLowerCase();
    return {
      width: Number(w),
      height: Number(h),
      alpha: channels.includes('a')
    };
  } catch {
    warnings.push('Image metadata check failed; skipping deep image metadata checks');
    return null;
  }
}

async function validatePaletteMembership(file, paletteSet) {
  try {
    if (!colorScanCmd) return { ok: true };
    const args = colorScanCmd === 'magick'
      ? [file, '-alpha', 'on', '-unique-colors', 'txt:-']
      : [file, '-alpha', 'on', '-unique-colors', 'txt:-'];
    const { stdout } = await runCommand(colorScanCmd, args);
    const lines = stdout.split('\n');
    for (const line of lines) {
      const match = line.match(/#([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6})/);
      if (!match) continue;
      const raw = match[1].toUpperCase();
      if (raw.length === 8) {
        const rgb = '#' + raw.slice(0, 6);
        const alpha = raw.slice(6);
        if (alpha === '00') continue;
        if (!paletteSet.has(rgb)) {
          return { ok: false, badColor: '#' + raw };
        }
      } else {
        const rgb = '#' + raw;
        if (!paletteSet.has(rgb)) {
          return { ok: false, badColor: rgb };
        }
      }
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

async function hasCmd(cmd) {
  try {
    await runCommand('bash', ['-lc', `command -v ${cmd}`]);
    return true;
  } catch {
    return false;
  }
}

async function findNearDuplicateIcons(size) {
  const out = [];
  if (!colorScanCmd) return out;
  const dir = path.resolve(`assets/rendered/icons/${size}`);
  const files = (await fs.readdir(dir).catch(() => [])).filter((f) => f.endsWith('.png')).sort();
  if (files.length < 2) return out;

  const hashes = [];
  for (const file of files) {
    const full = path.join(dir, file);
    const hash = await averageHash(full);
    if (hash) hashes.push({ file, hash });
  }

  for (let i = 0; i < hashes.length; i += 1) {
    for (let j = i + 1; j < hashes.length; j += 1) {
      const d = hamming(hashes[i].hash, hashes[j].hash);
      if (d <= 6) {
        out.push({ a: hashes[i].file, b: hashes[j].file, distance: d });
      }
    }
  }
  return out;
}

async function averageHash(file) {
  try {
    const cmd = colorScanCmd;
    const args = cmd === 'magick'
      ? [file, '-background', '#000000', '-alpha', 'remove', '-resize', '8x8!', '-colorspace', 'Gray', 'txt:-']
      : [file, '-background', '#000000', '-alpha', 'remove', '-resize', '8x8!', '-colorspace', 'Gray', 'txt:-'];
    const { stdout } = await runCommand(cmd, args);
    const values = [];
    for (const line of stdout.split('\n')) {
      const m = line.match(/gray\((\d+)\)/i) || line.match(/#([0-9A-Fa-f]{6})/);
      if (!m) continue;
      if (m[1] && m[1].length === 6) {
        const hex = m[1];
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        values.push(Math.round((r + g + b) / 3));
      } else {
        values.push(Number(m[1]));
      }
    }
    if (values.length < 64) return null;
    const arr = values.slice(0, 64);
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.map((v) => (v >= mean ? '1' : '0')).join('');
  } catch {
    return null;
  }
}

function hamming(a, b) {
  if (!a || !b || a.length !== b.length) return 64;
  let n = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) n += 1;
  }
  return n;
}

function resolveSpecProfile(spec, profile) {
  if (!profile) return spec;
  const p = spec.profiles?.[String(profile)];
  if (!p) throw new Error(`Unknown spec profile: ${profile}`);
  return { ...spec, ...p };
}
