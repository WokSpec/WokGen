/**
 * WokGen structured logger — pino in production, pino-pretty in dev.
 *
 * Usage:
 *   import { log } from '@/lib/logger';
 *   log.info({ userId, mode }, 'generation started');
 *   log.error({ err, jobId }, 'generation failed');
 */

import pino from 'pino';

const isDev  = process.env.NODE_ENV !== 'production';
const isEdge = process.env.NEXT_RUNTIME === 'edge';

// Edge runtime doesn't support pino transport — use plain pino there
const transport = (isDev && !isEdge)
  ? { target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname', translateTime: 'HH:MM:ss' } }
  : undefined;

export const log = pino({
  level:     process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  transport,
  base:      { service: 'wokgen-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact:    ['req.headers.authorization', '*.keyHash', '*.password'],
});

/** Wrap an error into a loggable shape */
export function serializeErr(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { message: err.message, name: err.name, stack: err.stack };
  }
  return { raw: String(err) };
}

/** Log drain for Axiom/Betterstack — sends logs via HTTP to Axiom's NDJSON ingest endpoint */
export function createLogDrain() {
  if (!process.env.AXIOM_TOKEN || !process.env.AXIOM_DATASET) return null;

  return {
    send: async (logs: string) => {
      try {
        await fetch(`https://cloud.axiom.co/api/v1/datasets/${process.env.AXIOM_DATASET}/ingest`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.AXIOM_TOKEN}`,
            'Content-Type': 'application/x-ndjson',
          },
          body: logs,
        });
      } catch {
        // silent — log drain should never crash the app
      }
    },
  };
}
