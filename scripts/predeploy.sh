#!/usr/bin/env bash
# =============================================================================
# WokGen — Gated production deploy script
#
# Usage: bash scripts/predeploy.sh
#
# Runs all checks locally BEFORE deploying to Vercel.
# Saves Vercel free-tier deploy budget (100/day).
#
# Rules:
#   - Agents must NEVER run `vercel deploy` directly.
#   - This script is the ONLY path to production.
#   - One deploy per work session — batch commits, run once.
# =============================================================================

set -e  # abort on any error

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$REPO_ROOT/apps/web"

RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[1;33m'
NC='\033[0m'

step() { echo -e "\n${YLW}▶ $1${NC}"; }
ok()   { echo -e "${GRN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

echo -e "${YLW}╔══════════════════════════════════════╗"
echo    "║   WokGen Pre-Deploy Gate              ║"
echo -e "╚══════════════════════════════════════╝${NC}"

# ── 1. Must be on main branch ──────────────────────────────────────────────
step "Checking branch"
BRANCH=$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  fail "Not on main branch (current: $BRANCH). Deploy from main only."
fi
ok "On main branch"

# ── 2. Working tree must be clean ─────────────────────────────────────────
step "Checking working tree"
if ! git -C "$REPO_ROOT" diff --quiet || ! git -C "$REPO_ROOT" diff --cached --quiet; then
  fail "Uncommitted changes detected. Commit or stash before deploying."
fi
ok "Working tree clean"

# ── 3. TypeScript check ───────────────────────────────────────────────────
step "TypeScript check"
cd "$WEB_DIR"
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
  echo -e "${RED}TypeScript errors found:${NC}"
  npx tsc --noEmit 2>&1 | grep "error TS" | head -20
  fail "TypeScript check failed"
fi
ok "TypeScript clean"

# ── 4. Next.js build ─────────────────────────────────────────────────────
step "Next.js build"
if ! npm run build 2>&1; then
  fail "next build failed — fix build errors before deploying"
fi
ok "Build succeeded"

# ── 5. Tests ─────────────────────────────────────────────────────────────
step "Vitest tests"
if ! npx vitest run --reporter=verbose 2>&1; then
  fail "Tests failed — fix before deploying"
fi
ok "All tests passed"

# ── 6. Deploy ────────────────────────────────────────────────────────────
step "Deploying to Vercel production"
echo "  Current deploys today:"
vercel ls --prod 2>/dev/null | head -5 || true
echo ""

read -r -p "  Proceed with deployment? [y/N] " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Deployment cancelled."
  exit 0
fi

vercel deploy --prod --yes

ok "Deployed successfully"
echo -e "\n${GRN}╔══════════════════════════════════════╗"
echo    "║   Deploy complete ✓                   ║"
echo -e "╚══════════════════════════════════════╝${NC}"
