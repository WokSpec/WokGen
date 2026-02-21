#!/usr/bin/env sh
# Helper to run Prisma generate + deploy migrations in production.
# Usage: ./prisma-deploy.sh
set -eu

# Ensure DATABASE_URL is set externally (do not hardcode)
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL must be set before running this script"
  exit 2
fi

echo "Generating Prisma client..."
npx prisma generate

# Prefer migrate deploy if you manage migrations
echo "Applying migrations (prisma migrate deploy)..."
if npx prisma migrate deploy; then
  echo "Migrations applied via prisma migrate deploy"
else
  echo "prisma migrate deploy failed; falling back to prisma db push"
  npx prisma db push
fi

echo "Prisma deploy complete."
