/**
 * WokGen BullMQ Generation Worker
 *
 * Processes generation jobs queued by /api/generate when
 * ENABLE_JOB_QUEUE=true env var is set.
 *
 * Run with: node apps/web/src/worker/generate-worker.mjs
 * (or import in a separate process alongside Next.js)
 *
 * The worker reads job data, calls the appropriate provider,
 * and updates the Job record in the database.
 */

import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';

// ── Queue connection ───────────────────────────────────────────────────────
const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;

if (!REDIS_URL) {
  console.error('[worker] REDIS_URL or UPSTASH_REDIS_URL required for BullMQ');
  process.exit(1);
}

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const generateQueue = new Queue('wokgen:generate', { connection });

// ── Worker ─────────────────────────────────────────────────────────────────
export const worker = new Worker(
  'wokgen:generate',
  async (job) => {
    const { jobId, userId, mode, prompt, tool, options: genOptions } = job.data;

    console.log(`[worker] Processing job ${jobId} (mode: ${mode})`);

    try {
      // Dynamic import so this worker can be run standalone without
      // pulling in the full Next.js request stack.
      const { runGeneration } = await import('../lib/generation-pipeline.js');
      const result = await runGeneration({ jobId, userId, mode, prompt, tool, options: genOptions });
      return result;
    } catch (err) {
      console.error(`[worker] Job ${jobId} failed:`, err);
      throw err; // BullMQ will retry based on job options
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
    limiter: {
      max: 20,
      duration: 60_000, // max 20 jobs per minute
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 1000, age: 24 * 3600 },
      removeOnFail: { count: 500 },
    },
  },
);

worker.on('completed', (job, result) => {
  console.log(`[worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[worker] Job ${job?.id} failed after retries:`, err?.message);
});

worker.on('error', (err) => {
  console.error('[worker] Worker error:', err);
});

console.log('[worker] WokGen generation worker started');
console.log(`[worker] Concurrency: ${process.env.WORKER_CONCURRENCY || 5}`);
