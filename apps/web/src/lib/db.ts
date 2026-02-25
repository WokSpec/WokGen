import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

/**
 * Wraps a Prisma query with a timeout to prevent hanging requests.
 * Vercel functions timeout at 10-30s — we enforce 8s for DB queries.
 */
export async function dbQuery<T>(
  query: Promise<T>,
  timeoutMs = 8000,
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Database query timeout')), timeoutMs),
  );
  return Promise.race([query, timeout]);
}
