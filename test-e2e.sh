#!/bin/bash
# Smoke test: start server, POST event, verify GET returns it
set -e

cd "$(dirname "$0")/server"
bun src/index.ts &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null" EXIT
sleep 1

echo "Testing POST /events..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:4000/events \
  -H "Content-Type: application/json" \
  -d '{"session_id":"e2e-test","event_type":"SessionStart","source_app":"smoke","payload":{"model":"test"}}')
[ "$STATUS" = "201" ] || { echo "FAIL: POST returned $STATUS"; exit 1; }
echo "  POST /events: OK (201)"

echo "Testing GET /events/recent..."
COUNT=$(curl -s "http://localhost:4000/events/recent" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['events']))")
[ "$COUNT" -ge 1 ] || { echo "FAIL: no events"; exit 1; }
echo "  GET /events/recent: OK ($COUNT events)"

echo "Testing GET /health..."
curl -sf http://localhost:4000/health | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['ok']"
echo "  GET /health: OK"

echo ""
echo "E2E smoke test PASSED"
