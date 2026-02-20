import path from 'node:path';
import { promises as fs } from 'node:fs';
import { ensureDir, exists, hexToRgb, parseArgs, readJson, relFromCwd, runCommand } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const inDir = path.resolve(String(args.inDir ?? 'assets/raw'));
const outDir = path.resolve(String(args.outDir ?? 'assets/clean'));
const cacheDir = path.resolve('.cache');
const specRaw = await readJson('spec.json');
const spec = resolveSpecProfile(specRaw, args.profile);
const magickCmd = (await hasCmd('magick')) ? 'magick' : (await hasCmd('convert')) ? 'convert' : null;
const hasPngquant = await hasCmd('pngquant');
const hasOxipng = await hasCmd('oxipng');

await ensureDir(outDir);
await ensureDir(cacheDir);

const palettePpm = path.join(cacheDir, 'palette.ppm');
await fs.writeFile(palettePpm, buildPalettePpm(spec.palette), 'utf8');

const files = (await fs.readdir(inDir).catch(() => [])).filter((f) => f.toLowerCase().endsWith('.png'));
if (!files.length) {
  console.log('No raw PNG files found. Nothing to normalize.');
  process.exit(0);
}

if (!magickCmd) {
  throw new Error('Missing required image command: expected `magick` or `convert`');
}
if (!hasPngquant) {
  console.warn('pngquant not found; using ImageMagick remap output without pngquant pass.');
}
if (!hasOxipng) {
  console.warn('oxipng not found; skipping final PNG optimization pass.');
}

let normalized = 0;
for (const file of files) {
  const src = path.join(inDir, file);
  const out = path.join(outDir, file);
  const tmpA = path.join(cacheDir, `${file}.base.png`);
  const tmpB = path.join(cacheDir, `${file}.q.png`);

  await runCommand(magickCmd, [
    src,
    '-alpha',
    'on',
    '-trim',
    '+repage',
    '-background',
    'none',
    '-gravity',
    'center',
    '-filter',
    'point',
    '-resize',
    `${spec.baseSize}x${spec.baseSize}`,
    '-extent',
    `${spec.baseSize}x${spec.baseSize}`,
    'PNG32:' + tmpA
  ]);

  await runCommand(magickCmd, [tmpA, '-dither', 'None', '-remap', palettePpm, 'PNG32:' + tmpB]);

  if (hasPngquant) {
    await runCommand('pngquant', [
      '--force',
      '--skip-if-larger',
      '--output',
      out,
      '--nofs',
      '--strip',
      '256',
      tmpB
    ]);

    if (!(await exists(out))) {
      await fs.copyFile(tmpB, out);
    }
  } else {
    await fs.copyFile(tmpB, out);
  }

  if (hasOxipng) {
    await runCommand('oxipng', ['-o', '4', '--strip', 'safe', out]);
  }
  normalized += 1;
  console.log(`Normalized ${relFromCwd(out)}`);
}

console.log(`Done. Normalized ${normalized} assets.`);

async function hasCmd(cmd) {
  try {
    await runCommand('bash', ['-lc', `command -v ${cmd}`]);
    return true;
  } catch {
    return false;
  }
}

function buildPalettePpm(hexColors) {
  const rgb = hexColors.map((h) => hexToRgb(h));
  const header = `P3\n${rgb.length} 1\n255\n`;
  const body = rgb.map((p) => p.join(' ')).join(' ');
  return header + body + '\n';
}

function resolveSpecProfile(spec, profile) {
  if (!profile) return spec;
  const p = spec.profiles?.[String(profile)];
  if (!p) throw new Error(`Unknown spec profile: ${profile}`);
  return { ...spec, ...p };
}
