#!/usr/bin/env bash
set -euo pipefail
OUT=$(mktemp -d /tmp/studysync-smoke.XXXX)
echo "Running smoke tests, output in $OUT"

echo "Test 1: visit protected page (expect redirect)"
curl -s -D "$OUT/test1-headers.txt" -o "$OUT/test1-body.html" "http://localhost:3001/pages/home/index.html" || true

echo "Test 2: API without auth (expect 401)"
curl -s -D "$OUT/test2-headers.txt" -H "Accept: application/json" -o "$OUT/test2-body.json" "http://localhost:3001/api/v1/subjects" || true

echo "Test 3: invalid bearer for HTML (expect redirect)"
curl -s -D "$OUT/test3-headers.txt" -H "Accept: text/html" -H "Authorization: Bearer invalidtoken" -o "$OUT/test3-body.html" "http://localhost:3001/pages/home/index.html" || true

echo "Test 4: login with invalid creds (expect 4xx)"
curl -s -D "$OUT/test4-headers.txt" -H "Content-Type: application/json" -d '{"email":"noone@example.com","password":"wrongpass"}' -o "$OUT/test4-body.json" "http://localhost:3001/api/v1/auth/login" || true

echo
for i in 1 2 3 4; do
  echo "--- Test $i headers ---"
  sed -n '1,120p' "$OUT/test${i}-headers.txt" || true
  echo
  echo "--- Test $i body (first 400 chars) ---"
  head -c 400 "$OUT/test${i}-body.html" 2>/dev/null || head -c 400 "$OUT/test${i}-body.json" 2>/dev/null || true
  echo
  echo
done

echo "Smoke tests completed. Full output dir: $OUT"
