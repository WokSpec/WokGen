import path from 'node:path';
import { promises as fs } from 'node:fs';
import { ensureDir, parseArgs, readJson, relFromCwd, runCommand } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const cleanDir = path.resolve(String(args.cleanDir ?? 'assets/clean'));
const iconsRoot = path.resolve('assets/rendered/icons');
const sheetsDir = path.resolve('assets/rendered/sheets');
const specRaw = await readJson('spec.json');
const spec = resolveSpecProfile(specRaw, args.profile);
const magickCmd = await pickImageCmd();

const files = (await fs.readdir(cleanDir).catch(() => [])).filter((f) => f.endsWith('.png')).sort();
if (!files.length) {
  console.log('No clean assets found. Nothing to package.');
  process.exit(0);
}

await ensureDir(sheetsDir);
for (const size of spec.exportSizes) {
  await ensureDir(path.join(iconsRoot, String(size)));
}

for (const file of files) {
  const src = path.join(cleanDir, file);
  for (const size of spec.exportSizes) {
    const dest = path.join(iconsRoot, String(size), file);
      if (Number(size) === Number(spec.baseSize)) {
      await fs.copyFile(src, dest);
    } else {
      await runCommand(magickCmd, [
        src,
        '-filter',
        'point',
        '-resize',
        `${size}x${size}`,
        'PNG32:' + dest
      ]);
    }
  }
}

for (const size of spec.exportSizes) {
  await buildSheetsForSize(size, files, iconsRoot, sheetsDir);
}

console.log(`Packaged ${files.length} clean assets into icon variants and sheets.`);

async function buildSheetsForSize(size, fileNames, iconsRootDir, outDir) {
  const chunk = 64;
  for (let start = 0; start < fileNames.length; start += chunk) {
    const pageFiles = fileNames.slice(start, start + chunk).map((name) => path.join(iconsRootDir, String(size), name));
    const page = Math.floor(start / chunk) + 1;
    const out = path.join(outDir, `sheet_${size}_p${String(page).padStart(2, '0')}.png`);
    await runCommand('montage', [
      ...pageFiles,
      '-background',
      'none',
      '-geometry',
      `${size}x${size}+0+0`,
      '-tile',
      '8x8',
      out
    ]);
    console.log(`Built ${relFromCwd(out)}`);
  }
}

async function pickImageCmd() {
  if (await hasCmd('magick')) return 'magick';
  if (await hasCmd('convert')) return 'convert';
  throw new Error('Missing required image command: expected `magick` or `convert`');
}

async function hasCmd(cmd) {
  try {
    await runCommand('bash', ['-lc', `command -v ${cmd}`]);
    return true;
  } catch {
    return false;
  }
}

function resolveSpecProfile(spec, profile) {
  if (!profile) return spec;
  const p = spec.profiles?.[String(profile)];
  if (!p) throw new Error(`Unknown spec profile: ${profile}`);
  return { ...spec, ...p };
}
