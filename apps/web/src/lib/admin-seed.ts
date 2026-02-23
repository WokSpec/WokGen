/**
 * Bootstrap admin status for the ADMIN_EMAIL user.
 * Called once at startup to ensure the admin user has isAdmin=true in DB.
 * Safe to call multiple times (upsert-style).
 */
import { prisma } from '@/lib/db';

export async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;
  try {
    await prisma.user.updateMany({
      where: { email: adminEmail, isAdmin: false },
      data: { isAdmin: true },
    });
  } catch {
    // Non-fatal — admin access falls back to ADMIN_EMAIL env check
  }
}
