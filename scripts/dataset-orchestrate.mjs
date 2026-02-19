import { spawn } from 'node:child_process';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { parseArgs } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const reset = Boolean(args.reset);

if (reset) {
  await run('npm', ['run', 'data:reset']);
}

await run('npm', ['run', 'data:report']);
await run('npm', ['run', 'data:intake']);

const inbox = path.resolve('dataset/inbox');
const accepted = path.resolve('dataset/accepted');
const rejected = path.resolve('dataset/rejected');
const train = path.resolve('dataset/train/images');
const reportPath = path.resolve('dataset/manifests/dataset-report.json');

const [inboxCount, acceptedCount, rejectedCount, trainCount, reportRaw] = await Promise.all([
  countFiles(inbox),
  countFiles(accepted),
  countFiles(rejected),
  countFiles(train),
  fs.readFile(reportPath, 'utf8').catch(() => '{}')
]);

console.log('');
console.log('Dataset orchestration complete.');
console.log(`inbox files: ${inboxCount}`);
console.log(`accepted files: ${acceptedCount}`);
console.log(`rejected files: ${rejectedCount}`);
console.log(`train files: ${trainCount}`);
console.log(`report: ${path.relative(process.cwd(), reportPath)}`);
console.log(reportRaw);

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

async function countFiles(dir) {
  let n = 0;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let entries = [];
    try {
      entries = await fs.readdir(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.isFile()) n += 1;
    }
  }
  return n;
}
