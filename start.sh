#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# start.sh
#
# Starts the observability dashboard (Bun server on :4000 + Vue client on :5173).
# Processes run in the background. Use stop.sh to shut them down cleanly.
#
# Usage:  ./start.sh
#
# Logs:   /tmp/obs-dashboard-<user>/server.log
#         /tmp/obs-dashboard-<user>/client.log
#
# PIDs:   /tmp/obs-dashboard-<user>/pids
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}  →${RESET} $*"; }
success() { echo -e "${GREEN}  ✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}  ⚠${RESET} $*"; }
error()   { echo -e "${RED}  ✗${RESET} $*" >&2; exit 1; }

# ── Paths ─────────────────────────────────────────────────────────────────────
DASHBOARD_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="/tmp/obs-dashboard-${USER:-default}"
PID_FILE="${RUN_DIR}/pids"
SERVER_LOG="${RUN_DIR}/server.log"
CLIENT_LOG="${RUN_DIR}/client.log"

mkdir -p "${RUN_DIR}"

# ── Already running? ──────────────────────────────────────────────────────────
if [[ -f "${PID_FILE}" ]]; then
  SERVER_PID=$(sed -n '1p' "${PID_FILE}" 2>/dev/null || echo "")
  CLIENT_PID=$(sed -n '2p' "${PID_FILE}" 2>/dev/null || echo "")
  STALE=true
  if [[ -n "${SERVER_PID}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then STALE=false; fi
  if [[ -n "${CLIENT_PID}" ]] && kill -0 "${CLIENT_PID}" 2>/dev/null; then STALE=false; fi
  if [[ "${STALE}" == "false" ]]; then
    warn "Dashboard appears to already be running."
    echo ""
    echo -e "  Dashboard:  ${CYAN}http://localhost:5173${RESET}"
    echo -e "  Server API: ${CYAN}http://localhost:4000/health${RESET}"
    echo -e "  Stop with:  ${CYAN}${DASHBOARD_DIR}/stop.sh${RESET}"
    echo ""
    exit 0
  else
    # Stale PID file — clean up
    rm -f "${PID_FILE}"
  fi
fi

echo ""
echo -e "${BOLD}  Agent Observability Dashboard${RESET}"
echo -e "  ─────────────────────────────"
echo ""

# ── Prerequisite checks ───────────────────────────────────────────────────────
command -v bun &>/dev/null    || error "bun not found — install from https://bun.sh"
command -v python3 &>/dev/null || error "python3 not found"

# ── Install dependencies (if needed) ─────────────────────────────────────────
if [[ ! -d "${DASHBOARD_DIR}/server/node_modules" ]]; then
  info "Installing server dependencies…"
  (cd "${DASHBOARD_DIR}/server" && bun install --silent)
  success "Server dependencies installed"
fi

if [[ ! -d "${DASHBOARD_DIR}/client/node_modules" ]]; then
  info "Installing client dependencies…"
  (cd "${DASHBOARD_DIR}/client" && bun install --silent)
  success "Client dependencies installed"
fi

# ── Start server ──────────────────────────────────────────────────────────────
info "Starting server (port 4000)…"

(cd "${DASHBOARD_DIR}/server" && bun run start >> "${SERVER_LOG}" 2>&1) &
SERVER_PID=$!

# ── Start client ──────────────────────────────────────────────────────────────
info "Starting client (port 5173)…"

(cd "${DASHBOARD_DIR}/client" && bun run dev >> "${CLIENT_LOG}" 2>&1) &
CLIENT_PID=$!

# ── Save PIDs ────────────────────────────────────────────────────────────────
printf '%s\n%s\n' "${SERVER_PID}" "${CLIENT_PID}" > "${PID_FILE}"

# ── Wait for server health check ─────────────────────────────────────────────
info "Waiting for server to be ready…"

READY=false
for i in $(seq 1 20); do
  if curl -sf "http://localhost:4000/health" &>/dev/null; then
    READY=true
    break
  fi
  # Check the process is still alive
  if ! kill -0 "${SERVER_PID}" 2>/dev/null; then
    echo ""
    error "Server process died unexpectedly. Check logs: ${SERVER_LOG}"
  fi
  sleep 0.5
done

if [[ "${READY}" == "false" ]]; then
  warn "Server did not respond within 10s — it may still be starting up"
  warn "Check logs: ${SERVER_LOG}"
else
  success "Server is ready"
fi

# Check client is alive (Vite starts fast)
sleep 1
if ! kill -0 "${CLIENT_PID}" 2>/dev/null; then
  warn "Client process exited unexpectedly. Check logs: ${CLIENT_LOG}"
else
  success "Client is ready"
fi

# ── Open browser ──────────────────────────────────────────────────────────────
DASHBOARD_URL="http://localhost:5173"

open_browser() {
  if command -v open &>/dev/null; then        # macOS
    open "${DASHBOARD_URL}"
  elif command -v xdg-open &>/dev/null; then  # Linux (GUI)
    xdg-open "${DASHBOARD_URL}" &>/dev/null &
  fi
}

open_browser 2>/dev/null || true

# ── Status summary ────────────────────────────────────────────────────────────
echo ""
echo -e "  ${GREEN}${BOLD}Dashboard is running${RESET}"
echo ""
echo -e "  ${BOLD}Dashboard:${RESET}   ${CYAN}http://localhost:5173${RESET}"
echo -e "  ${BOLD}Server API:${RESET}  ${CYAN}http://localhost:4000/health${RESET}"
echo ""
echo -e "  ${BOLD}Server log:${RESET}  ${SERVER_LOG}"
echo -e "  ${BOLD}Client log:${RESET}  ${CLIENT_LOG}"
echo ""
echo -e "  ${BOLD}Stop:${RESET}        ${CYAN}${DASHBOARD_DIR}/stop.sh${RESET}"
echo ""
echo -e "  ${YELLOW}Tip:${RESET} Instrument a project with:"
echo -e "       ${CYAN}${DASHBOARD_DIR}/initialize.sh <project_name>${RESET}"
echo ""
