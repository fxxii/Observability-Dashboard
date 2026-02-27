#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# stop.sh
#
# Stops the observability dashboard processes started by start.sh.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

success() { echo -e "${GREEN}  ✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}  ⚠${RESET} $*"; }
info()    { echo -e "${CYAN}  →${RESET} $*"; }

# ── Paths ─────────────────────────────────────────────────────────────────────
RUN_DIR="/tmp/obs-dashboard-${USER:-default}"
PID_FILE="${RUN_DIR}/pids"

echo ""
echo -e "${BOLD}  Stopping Agent Observability Dashboard${RESET}"
echo -e "  ────────────────────────────────────────"
echo ""

# ── Read PIDs ─────────────────────────────────────────────────────────────────
if [[ ! -f "${PID_FILE}" ]]; then
  warn "PID file not found (${PID_FILE}) — dashboard may not be running"
  echo ""

  # Best-effort: look for processes on the expected ports
  FOUND=false
  for PORT in 4000 5173; do
    if command -v lsof &>/dev/null; then
      PIDS=$(lsof -ti ":${PORT}" 2>/dev/null || true)
      if [[ -n "${PIDS}" ]]; then
        echo -e "${YELLOW}  ⚠${RESET} Found process on port ${PORT}: PID(s) ${PIDS}"
        read -r -p "  Kill process(es) on :${PORT}? [y/N] " CONFIRM
        if [[ "${CONFIRM,,}" == "y" ]]; then
          echo "${PIDS}" | xargs kill 2>/dev/null && success "Killed process(es) on :${PORT}" || warn "Could not kill all processes"
          FOUND=true
        fi
      fi
    fi
  done

  if [[ "${FOUND}" == "false" ]]; then
    warn "Nothing to stop"
  fi
  echo ""
  exit 0
fi

SERVER_PID=$(sed -n '1p' "${PID_FILE}" 2>/dev/null || echo "")
CLIENT_PID=$(sed -n '2p' "${PID_FILE}" 2>/dev/null || echo "")

# ── Stop processes ────────────────────────────────────────────────────────────
stop_pid() {
  local PID="$1"
  local LABEL="$2"
  if [[ -z "${PID}" ]]; then
    warn "${LABEL}: no PID recorded"
    return
  fi
  if kill -0 "${PID}" 2>/dev/null; then
    info "Stopping ${LABEL} (PID ${PID})…"
    kill "${PID}" 2>/dev/null || true
    # Wait up to 3 seconds for graceful shutdown
    for _ in 1 2 3; do
      sleep 1
      if ! kill -0 "${PID}" 2>/dev/null; then
        success "${LABEL} stopped"
        return
      fi
    done
    # Force kill if still alive
    kill -9 "${PID}" 2>/dev/null || true
    success "${LABEL} force-stopped"
  else
    warn "${LABEL} (PID ${PID}) was not running"
  fi
}

stop_pid "${SERVER_PID}" "Server"
stop_pid "${CLIENT_PID}" "Client"

# ── Clean up ──────────────────────────────────────────────────────────────────
rm -f "${PID_FILE}"

# Also kill any orphaned processes on the expected ports (belt-and-suspenders)
if command -v lsof &>/dev/null; then
  for PORT in 4000 5173; do
    ORPHANS=$(lsof -ti ":${PORT}" 2>/dev/null || true)
    if [[ -n "${ORPHANS}" ]]; then
      echo "${ORPHANS}" | xargs kill 2>/dev/null || true
    fi
  done
fi

echo ""
echo -e "  ${GREEN}${BOLD}Dashboard stopped${RESET}"
echo ""
echo -e "  Logs are preserved at:"
echo -e "  ${CYAN}${RUN_DIR}/server.log${RESET}"
echo -e "  ${CYAN}${RUN_DIR}/client.log${RESET}"
echo ""
