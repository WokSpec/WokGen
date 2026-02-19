import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

export async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

export async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function mulberry32(seed) {
  let t = Number(seed) >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted(list, weightKey, rand) {
  const total = list.reduce((sum, item) => sum + Number(item[weightKey] ?? 0), 0);
  const target = rand() * total;
  let acc = 0;
  for (const item of list) {
    acc += Number(item[weightKey] ?? 0);
    if (target <= acc) return item;
  }
  return list[list.length - 1];
}

export function pickOne(list, rand) {
  return list[Math.floor(rand() * list.length)];
}

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonl(file) {
  if (!(await exists(file))) return [];
  const text = await fs.readFile(file, 'utf8');
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export async function writeJsonl(file, records) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const text = records.map((item) => JSON.stringify(item)).join('\n');
  await fs.writeFile(file, text + (records.length ? '\n' : ''), 'utf8');
}

export function relFromCwd(file) {
  return path.relative(process.cwd(), file) || '.';
}

export async function sha256File(file) {
  const buf = await fs.readFile(file);
  return createHash('sha256').update(buf).digest('hex');
}

export function hexToRgb(hex) {
  const v = hex.replace('#', '');
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export async function runCommand(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd,
      env: { ...process.env, ...(options.env ?? {}) },
      stdio: options.stdio ?? ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${cmd} ${args.join(' ')} failed with code ${code}\n${stderr || stdout}`));
      }
    });
  });
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
