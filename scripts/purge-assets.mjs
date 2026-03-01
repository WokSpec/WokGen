#!/usr/bin/env node
/**
 * purge-assets.mjs
 *
 * Wipes all generated asset records from the database:
 *   GalleryAsset, AssetTag, AssetComment, AssetRelationship → cascade via Job FK
 *   Job (all records)
 *
 * Usage:
 *   node scripts/purge-assets.mjs            # dry run — prints counts only
 *   node scripts/purge-assets.mjs --confirm  # actually deletes
 *
 * Requires DATABASE_URL to be set (reads apps/web/.env automatically).
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const confirm = process.argv.includes('--confirm');

// Load .env from apps/web if DATABASE_URL not already set
if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, '../apps/web/.env');
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const match = line.match(/^([^#=\s]+)=(.*)$/);
      if (match) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set. Add it to apps/web/.env or export it.');
  process.exit(1);
}

// Resolve Prisma client from the web app
const require = createRequire(import.meta.url);
const { PrismaClient } = require(
  path.resolve(__dirname, '../apps/web/node_modules/@prisma/client')
);

const prisma = new PrismaClient();

async function main() {
  // Count before
  const [jobCount, galleryCount] = await Promise.all([
    prisma.job.count(),
    prisma.galleryAsset.count(),
  ]);

  console.log('\n── WokGen Asset Purge ─────────────────────────');
  console.log(`  Jobs:          ${jobCount}`);
  console.log(`  Gallery assets: ${galleryCount}`);
  console.log('────────────────────────────────────────────────');

  if (jobCount === 0 && galleryCount === 0) {
    console.log('  Nothing to delete. Database is already clean.\n');
    return;
  }

  if (!confirm) {
    console.log('\n  DRY RUN — no changes made.');
    console.log('  Re-run with --confirm to delete.\n');
    return;
  }

  console.log('\n  Deleting...');

  // GalleryAsset has onDelete: Cascade from Job, but delete explicitly first
  // to avoid FK constraint issues on DBs that don't enforce cascade order.
  const [deletedGallery, deletedJobs] = await prisma.$transaction([
    prisma.galleryAsset.deleteMany({}),
    prisma.job.deleteMany({}),
  ]);

  console.log(`  ✓ Deleted ${deletedGallery.count} gallery assets`);
  console.log(`  ✓ Deleted ${deletedJobs.count} jobs`);
  console.log('\n  Done. All generated asset records have been purged.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
