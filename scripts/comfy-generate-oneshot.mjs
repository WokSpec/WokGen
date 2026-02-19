import { spawn } from 'node:child_process';
import path from 'node:path';
import { parseArgs, sleep } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const comfyDir = path.resolve(String(args.comfyDir ?? '/home/user9007/ComfyUI'));
const python = String(args.python ?? path.join(comfyDir, '.venv/bin/python'));
const workflow = String(args.workflow ?? 'comfyui/workflows/pixel_icon_hq_workflow.json');
const checkpoint = args.checkpoint ? String(args.checkpoint) : null;
const prompts = String(args.prompts ?? 'prompts/prompts.jsonl');
const outDir = String(args.outDir ?? 'assets/raw');
const keepServer = Boolean(args.keepServer);

const ports = parsePorts(args);
const hosts = args.host
  ? [String(args.host)]
  : ports.map((p) => `http://127.0.0.1:${p}`);

let pickedHost = null;
let startedProc = null;

for (const host of hosts) {
  if (await isUp(host)) {
    pickedHost = host;
    console.log(`Using existing ComfyUI at ${host}`);
    break;
  }

  const port = Number(new URL(host).port || 8188);
  const attempt = await tryStartComfy({ python, comfyDir, host, port });
  if (attempt.ok) {
    pickedHost = host;
    startedProc = attempt.proc;
    break;
  }
  console.warn(`Port ${port} unavailable or Comfy failed to start there. Trying next port...`);
}

if (!pickedHost) {
  throw new Error(`Could not find a usable ComfyUI host. Tried: ${hosts.join(', ')}`);
}

try {
  await runNode('scripts/comfy-generate.mjs', [
    '--host', pickedHost,
    '--workflow', workflow,
    '--prompts', prompts,
    '--outDir', outDir,
    ...(checkpoint ? ['--checkpoint', checkpoint] : [])
  ]);
} finally {
  if (startedProc && !keepServer) {
    startedProc.kill('SIGTERM');
  }
}

function parsePorts(cliArgs) {
  const explicit = String(cliArgs.ports ?? '').trim();
  if (!explicit) return [8188, 8190, 9015, 9016, 9017, 9020];
  return explicit
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

async function tryStartComfy({ python: py, comfyDir: cwd, host, port }) {
  console.log(`Starting ComfyUI on ${host}...`);
  const proc = spawn(py, ['main.py', '--listen', '127.0.0.1', '--port', String(port), '--cpu'], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let exited = false;
  proc.stdout?.on('data', (d) => process.stdout.write(`[comfy:${port}] ${d}`));
  proc.stderr?.on('data', (d) => process.stderr.write(`[comfy:${port}] ${d}`));
  proc.on('close', () => { exited = true; });

  const ok = await waitForUp(host, 120000, () => exited);
  if (!ok) {
    if (!proc.killed) proc.kill('SIGTERM');
    return { ok: false, proc: null };
  }
  return { ok: true, proc };
}

async function waitForUp(base, timeoutMs, hasExited) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (hasExited()) return false;
    if (await isUp(base)) return true;
    await sleep(1200);
  }
  return false;
}

async function isUp(base) {
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/system_stats`);
    return res.ok;
  } catch {
    return false;
  }
}

async function runNode(script, nodeArgs) {
  await new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [script, ...nodeArgs], { stdio: 'inherit' });
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} failed with code ${code}`));
    });
    p.on('error', reject);
  });
}
