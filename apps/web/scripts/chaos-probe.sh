#!/usr/bin/env bash
# WokGen Chaos Probe — tests resilience of key endpoints under adversarial conditions
# Usage: BASE_URL=https://yourapp.com bash scripts/chaos-probe.sh

set -euo pipefail

BASE="${BASE_URL:-http://localhost:3000}"
PASS=0
FAIL=0

check() {
  local label="$1"; local url="$2"; local method="${3:-GET}"
  local expected="${4:-200}"; local payload="${5:-}"
  local extra_headers="${6:-}"

  if [ -n "$payload" ]; then
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
      -H "Content-Type: application/json" $extra_headers \
      -d "$payload" --max-time 10 "$url")
  else
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
      $extra_headers --max-time 10 "$url")
  fi

  if [ "$status" = "$expected" ]; then
    echo "  PASS  $label ($status)"
    ((PASS++))
  else
    echo "  FAIL  $label — expected $expected got $status"
    ((FAIL++))
  fi
}

echo "WokGen Chaos Probe → $BASE"
echo "---"
echo "[Auth boundary]"
check "Generate requires auth"           "$BASE/api/generate"       "POST" "401" '{"prompt":"test"}'
check "Projects requires auth"           "$BASE/api/projects"       "GET"  "401"
check "Keys requires auth"               "$BASE/api/keys"           "GET"  "401"
check "Admin requires auth"              "$BASE/api/admin/stats"    "GET"  "401"

echo "[SSRF probe]"
check "SSRF file://"  "$BASE/api/automations/test-ssrf/test" "POST" "404"
check "Webhook SSRF block" "$BASE/api/automations" "POST" "401" '{"webhookUrl":"file:///etc/passwd","name":"ssrf","triggerType":"manual"}'

echo "[Input validation]"
check "Oversized name 422" "$BASE/api/projects" "POST" "401" "{\"name\":\"$(python3 -c 'print("A"*2001)')\"}"
check "XSS in project name" "$BASE/api/projects" "POST" "401" '{"name":"<script>alert(1)</script>"}'

echo "[Rate limit sanity]"
for i in {1..6}; do
  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"prompt":"test","mode":"pixel"}' \
    --max-time 5 "$BASE/api/generate")
  echo "  Request $i: $status"
done

echo "[Stripe webhook without signature]"
check "Stripe no-sig 400" "$BASE/api/webhooks/stripe" "POST" "400" '{"type":"checkout.session.completed"}'

echo "---"
echo "Results: $PASS passed, $FAIL failed"
