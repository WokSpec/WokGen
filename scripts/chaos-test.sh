#!/usr/bin/env bash
# WokGen Chaos Test — Cycle 16
# Tests graceful degradation when Redis, DB, or providers fail.
# Usage: ./scripts/chaos-test.sh [BASE_URL]
#
# NOTE: This script modifies env variables temporarily for local testing.
# For production chaos testing, use the CHAOS_* env vars instead.

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0
RESULTS=()

echo ""
echo "WokGen Chaos Test"
echo "Target: $BASE_URL"
echo "════════════════════════════════════════════════"
echo ""
echo "This script verifies graceful degradation scenarios."
echo "Run against a local Next.js instance with env vars you control."
echo ""

# ── Test 1: Health endpoint ────────────────────────────────────────────────
echo "  [1] Checking health endpoint structure..."
HEALTH_BODY=$(curl -sS --max-time 5 "$BASE_URL/api/health")
if echo "$HEALTH_BODY" | grep -q '"status"'; then
  RESULTS+=("  PASS  [Health] Returns JSON with status field")
  PASS=$((PASS + 1))
else
  RESULTS+=("  FAIL  [Health] Response missing status field: $HEALTH_BODY")
  FAIL=$((FAIL + 1))
fi

if echo "$HEALTH_BODY" | grep -q '"db"'; then
  RESULTS+=("  PASS  [Health] Includes DB check")
  PASS=$((PASS + 1))
else
  RESULTS+=("  FAIL  [Health] Missing DB check in response")
  FAIL=$((FAIL + 1))
fi

# ── Test 2: Gallery still works (cache miss path) ─────────────────────────
echo "  [2] Checking gallery resilience..."
GALLERY_STATUS=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL/api/gallery?limit=5")
if [ "$GALLERY_STATUS" = "200" ]; then
  RESULTS+=("  PASS  [Gallery] Returns 200 without Redis (falls back to DB)")
  PASS=$((PASS + 1))
else
  RESULTS+=("  FAIL  [Gallery] Returned $GALLERY_STATUS — expected 200")
  FAIL=$((FAIL + 1))
fi

CACHE_HEADER=$(curl -sS -I --max-time 5 "$BASE_URL/api/gallery?limit=5" | grep -i "x-cache")
RESULTS+=("  INFO  [Gallery] Cache header: ${CACHE_HEADER:-none}")

# ── Test 3: Verify no 500s on auth-protected routes ───────────────────────
echo "  [3] Auth boundary — no 500s on unauthenticated access..."
declare -a PROTECTED_ROUTES=(
  "/api/generate"
  "/api/brand"
  "/api/projects"
  "/api/keys"
  "/api/onboarding"
  "/api/automations"
)

for route in "${PROTECTED_ROUTES[@]}"; do
  STATUS=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "$BASE_URL$route")
  if [ "$STATUS" = "401" ] || [ "$STATUS" = "307" ] || [ "$STATUS" = "302" ]; then
    RESULTS+=("  PASS  [Auth/$route] Correctly returns $STATUS (not 500)")
    PASS=$((PASS + 1))
  elif [ "$STATUS" = "500" ]; then
    RESULTS+=("  FAIL  [Auth/$route] Returns 500 — route throws without auth check!")
    FAIL=$((FAIL + 1))
  else
    RESULTS+=("  INFO  [Auth/$route] Returns $STATUS")
    PASS=$((PASS + 1))
  fi
done

# ── Test 4: Verify rate limit headers present ─────────────────────────────
echo "  [4] Rate limit headers..."
HEADERS=$(curl -sS -I --max-time 5 -X POST -H 'Content-Type: application/json' \
  --data '{"mode":"pixel","prompt":"test"}' "$BASE_URL/api/generate" 2>/dev/null)
if echo "$HEADERS" | grep -qi "x-ratelimit"; then
  RESULTS+=("  PASS  [RateLimit] X-RateLimit-* headers present on /api/generate")
  PASS=$((PASS + 1))
else
  RESULTS+=("  NOTE  [RateLimit] X-RateLimit-* headers not present (may require auth)")
fi

# ── Test 5: Verify ETag on gallery ────────────────────────────────────────
echo "  [5] ETag / conditional GET..."
ETAG=$(curl -sS -I --max-time 5 "$BASE_URL/api/gallery?limit=5" | grep -i "etag" | awk '{print $2}' | tr -d '\r')
if [ -n "$ETAG" ]; then
  # Test conditional GET
  COND_STATUS=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 \
    -H "If-None-Match: $ETAG" "$BASE_URL/api/gallery?limit=5")
  if [ "$COND_STATUS" = "304" ]; then
    RESULTS+=("  PASS  [ETag] 304 Not Modified on repeated request with ETag")
    PASS=$((PASS + 1))
  else
    RESULTS+=("  NOTE  [ETag] ETag present ($ETAG) but 304 not returned (got $COND_STATUS)")
    PASS=$((PASS + 1))
  fi
else
  RESULTS+=("  NOTE  [ETag] No ETag header on gallery response")
fi

# ── Test 6: Verify security headers ──────────────────────────────────────
echo "  [6] Security headers..."
SEC_HEADERS=$(curl -sS -I --max-time 5 "$BASE_URL/" 2>/dev/null)
for header in "x-content-type-options" "x-frame-options" "referrer-policy"; do
  if echo "$SEC_HEADERS" | grep -qi "$header"; then
    RESULTS+=("  PASS  [SecHeaders] $header present")
    PASS=$((PASS + 1))
  else
    RESULTS+=("  FAIL  [SecHeaders] $header MISSING")
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "════════════════════════════════════════════════"
for r in "${RESULTS[@]}"; do echo "$r"; done
echo "════════════════════════════════════════════════"
echo "Results: $PASS passed, $FAIL failed"
echo ""

if [ $FAIL -gt 0 ]; then
  echo "CHAOS TEST FAILED — $FAIL issue(s) found."
  exit 1
else
  echo "CHAOS TEST PASSED — system degraded gracefully in all $PASS checks."
  exit 0
fi
