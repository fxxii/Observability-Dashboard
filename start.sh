#!/bin/bash
# Start the observability server + Vue client
set -e

echo "=== Starting Observability Dashboard ==="

# Server
cd "$(dirname "$0")/server"
bun install --frozen-lockfile 2>/dev/null || bun install
bun src/index.ts &
SERVER_PID=$!
echo "Server PID=$SERVER_PID on :4000"
cd ..

# Client
cd client
bun install --frozen-lockfile 2>/dev/null || bun install
bun run dev &
CLIENT_PID=$!
cd ..

echo ""
echo "  Dashboard: http://localhost:5173"
echo "  Server:    http://localhost:4000/health"
echo ""
echo "Press Ctrl+C to stop"
trap "kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit 0" INT TERM
wait
