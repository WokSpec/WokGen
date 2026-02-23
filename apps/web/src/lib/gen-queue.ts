/**
 * WokGen Generation Queue — p-queue based concurrency control.
 *
 * Prevents thundering-herd: when many users trigger generation simultaneously,
 * this limits in-flight provider calls per process (not per user — that's
 * handled by checkConcurrent in lib/quota.ts).
 *
 * This is a process-local queue. On Vercel, each serverless instance has its
 * own queue — that's intentional. The per-user concurrent limit in quota.ts
 * is the shared (Redis-backed) authoritative guard.
 *
 * Usage:
 *   const result = await genQueue.add(() => generate(params));
 */

import PQueue from 'p-queue';

// Max 10 simultaneous AI provider calls per serverless instance.
// Adjust via GENERATION_CONCURRENCY env var.
const CONCURRENCY = parseInt(process.env.GENERATION_CONCURRENCY || '10', 10);

// Queue with timeout — if a job is waiting more than 45s it's dropped.
const genQueue = new PQueue({
  concurrency: CONCURRENCY,
  timeout: 45_000,
});

genQueue.on('error', () => {
  // Errors are handled by the caller — just prevent unhandled rejection
});

export { genQueue };
export default genQueue;
