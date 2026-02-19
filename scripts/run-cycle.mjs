import { spawn } from 'node:child_process';
import { parseArgs } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const count = 5;
const mode = String(args.mode ?? 'rotate');
const profile = String(args.profile ?? 'detailed');
const engine = String(args.engine ?? 'hq');
const category = args.category ? String(args.category) : null;
const categories = args.categories ? String(args.categories) : null;
const checkpoint = args.checkpoint ? String(args.checkpoint) : null;
const ports = args.ports ? String(args.ports) : null;
const resetRotation = Boolean(args.resetRotation);
const fresh = Boolean(args.fresh);

if (!['hq', 'cpu'].includes(engine)) {
  throw new Error('--engine must be hq or cpu');
}
if (!['rotate', 'random'].includes(mode)) {
  throw new Error('--mode must be rotate or random');
}

if (fresh) {
  await run('npm', ['run', 'clean']);
}

const promptArgs = ['run', 'prompts', '--', '--count', String(count), '--mode', mode];
if (category) promptArgs.push('--category', category);
if (categories) promptArgs.push('--categories', categories);
if (resetRotation) promptArgs.push('--resetRotation');

await run('npm', promptArgs);

if (engine === 'hq') {
  const genArgs = ['run', 'gen:hq'];
  const passthrough = [];
  if (checkpoint) passthrough.push('--checkpoint', checkpoint);
  if (ports) passthrough.push('--ports', ports);
  if (passthrough.length) genArgs.push('--', ...passthrough);
  await run('npm', genArgs);
} else {
  await run('npm', ['run', 'gen:cpu']);
}

await run('npm', ['run', 'normalize', '--', '--profile', profile]);
await run('npm', ['run', 'package', '--', '--profile', profile]);
await run('npm', ['run', 'validate', '--', '--profile', profile]);
await run('npm', ['run', 'registry', '--', '--profile', profile]);

async function run(cmd, cmdArgs) {
  await new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: 'inherit' });
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${cmdArgs.join(' ')} failed with code ${code}`));
    });
    p.on('error', reject);
  });
}
