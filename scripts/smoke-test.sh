#!/usr/bin/env bash
# WokGen smoke test — curl-based checks against the live deployment.
# Usage: ./scripts/smoke-test.sh [BASE_URL]
# Example: ./scripts/smoke-test.sh https://wokgen.app
#
# Returns exit code 0 if all critical checks pass, 1 otherwise.

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0
RESULTS=()

check() {
  local name="$1"
  local url="$2"
  local expected_status="${3:-200}"
  local extra_flags="${4:-}"

  local response
  # shellcheck disable=SC2086
  response=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 $extra_flags "$url")

  if [ "$response" = "$expected_status" ]; then
    RESULTS+=("  PASS  $name ($response)")
    PASS=$((PASS + 1))
  else
    RESULTS+=("  FAIL  $name — expected $expected_status, got $response  ← $url")
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "WokGen Smoke Test"
echo "Target: $BASE_URL"
echo "────────────────────────────────────────────────"

# ── Infrastructure ──────────────────────────────────
check "Health endpoint"            "$BASE_URL/api/health"                        200
check "Health returns JSON"        "$BASE_URL/api/health" 200 "-H 'Accept: application/json'"

# ── Public pages ────────────────────────────────────
check "Homepage"                   "$BASE_URL/"                                  200
check "Gallery page"               "$BASE_URL/gallery"                           200
check "Docs page"                  "$BASE_URL/docs"                              200
check "Changelog page"             "$BASE_URL/changelog"                         200
check "Sign-in page"               "$BASE_URL/sign-in"                           200

# ── API — unauthenticated ───────────────────────────
check "Gallery API (public)"       "$BASE_URL/api/gallery?limit=5"               200
check "Gallery search API"         "$BASE_URL/api/gallery/search?q=pixel"        200

# ── Auth guards (should redirect, not 500) ──────────
check "Projects (auth redirect)"   "$BASE_URL/projects"                          307
check "Account (auth redirect)"    "$BASE_URL/account"                           307
check "API Keys (auth redirect)"   "$BASE_URL/account/api-keys"                  307

# ── Known 404 ───────────────────────────────────────
check "404 page"                   "$BASE_URL/__nonexistent_route__9z3"          404

# ── API — 401 on protected routes ───────────────────
check "Generate (no auth → 401)"   "$BASE_URL/api/generate"                     401
check "Brand API (no auth → 401)"  "$BASE_URL/api/brand"                        401

echo "────────────────────────────────────────────────"
for r in "${RESULTS[@]}"; do echo "$r"; done
echo "────────────────────────────────────────────────"
echo "Results: $PASS passed, $FAIL failed"
echo ""

if [ $FAIL -gt 0 ]; then
  echo "SMOKE TEST FAILED — $FAIL check(s) did not pass."
  exit 1
else
  echo "SMOKE TEST PASSED — all $PASS checks OK."
  exit 0
fi
