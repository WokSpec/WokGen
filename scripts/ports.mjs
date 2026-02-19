import { parseArgs, runCommand } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const action = String(args.action ?? 'status');
const ports = parsePorts(String(args.ports ?? '8188,8190,9015,9016,9017,9020'));

if (action === 'status') {
  await status();
} else if (action === 'kill') {
  await kill();
} else {
  throw new Error('--action must be status or kill');
}

function parsePorts(raw) {
  return raw
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

async function status() {
  for (const port of ports) {
    const comfy = await isComfyUp(port);
    if (comfy) {
      console.log(`${port}: COMFY_UP`);
      continue;
    }
    const open = await isOpen(port);
    console.log(`${port}: ${open ? 'IN_USE' : 'FREE'}`);
  }
}

async function kill() {
  for (const port of ports) {
    try {
      const { stdout } = await runCommand('bash', ['-lc', `lsof -ti tcp:${port} || true`]);
      const pids = stdout
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!pids.length) {
        console.log(`${port}: no pid`);
        continue;
      }
      for (const pid of pids) {
        await runCommand('kill', ['-TERM', pid]);
      }
      console.log(`${port}: terminated pid(s) ${pids.join(',')}`);
    } catch {
      console.log(`${port}: failed to terminate`);
    }
  }
}

async function isComfyUp(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/system_stats`);
    return res.ok;
  } catch {
    return false;
  }
}

async function isOpen(port) {
  try {
    await runCommand('bash', ['-lc', `ss -ltn | rg -q ':${port} '`]);
    return true;
  } catch {
    return false;
  }
}
