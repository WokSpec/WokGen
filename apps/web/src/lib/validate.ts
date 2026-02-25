import { type ZodSchema } from 'zod';
import { NextResponse } from 'next/server';

/**
 * Parse and validate a Next.js request body against a Zod schema.
 *
 * Returns { data } on success or { error: NextResponse } on failure.
 * Usage:
 *   const { data, error } = await validateBody(req, MySchema);
 *   if (error) return error;
 */
export async function validateBody<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      error: NextResponse.json(
        { error: 'Request body must be valid JSON', code: 'INVALID_JSON' },
        { status: 400 },
      ),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map(issue => ({
      field: issue.path.join('.') || 'root',
      message: issue.message,
    }));
    return {
      error: NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', issues },
        { status: 400 },
      ),
    };
  }

  return { data: result.data };
}

/**
 * Parse query parameters against a Zod schema.
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>,
): { data: T; error?: never } | { data?: never; error: NextResponse } {
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => { raw[key] = value; });

  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map(issue => ({
      field: issue.path.join('.') || 'root',
      message: issue.message,
    }));
    return {
      error: NextResponse.json(
        { error: 'Invalid query parameters', code: 'VALIDATION_ERROR', issues },
        { status: 400 },
      ),
    };
  }

  return { data: result.data };
}
