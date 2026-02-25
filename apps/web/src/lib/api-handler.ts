import { type NextRequest, NextResponse } from 'next/server';
import { apiError } from './api-response';

type RouteHandler = (req: NextRequest, ctx?: { params?: Record<string, string> }) => Promise<NextResponse>;

/**
 * Wraps an API route handler with global error catching.
 * Prevents unhandled exceptions from returning HTML 500 error pages.
 *
 * Usage:
 *   export const POST = withErrorHandler(async (req) => { ... });
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal server error';

      // Don't log client abort errors
      if (message.includes('aborted') || message.includes('socket hang up')) {
        return new NextResponse(null, { status: 499 });
      }

      console.error('[API Error]', req.method, req.url, err);
      return apiError({ message: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 });
    }
  };
}

/**
 * Wraps a Prisma query with a timeout to prevent hanging Vercel functions.
 * Default timeout: 8 seconds (Vercel Hobby functions timeout at 10s).
 */
export async function dbQuery<T>(query: Promise<T>, timeoutMs = 8000): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Database query timed out after ${timeoutMs}ms`)), timeoutMs),
  );
  return Promise.race([query, timeout]);
}
