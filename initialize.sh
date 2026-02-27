#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# initialize.sh <project_name> [target_path]
#
# Sets up a new project to be monitored by the observability dashboard.
#
#   project_name  Label shown in the dashboard (SOURCE_APP). Required.
#   target_path   Where to create the project. Defaults to ./<project_name>
#
# What it does:
#   1. Checks prerequisites (bun, python3)
#   2. Installs dashboard server + client dependencies (once)
#   3. Creates the target directory if it does not exist
#   4. Copies observability hooks into <target>/.claude/hooks/
#   5. Generates <target>/.claude/settings.json with all 12 hooks wired up
#   6. Optionally initialises a git repository in the target project
#
# Run from anywhere — the script locates the dashboard directory automatically.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}  →${RESET} $*"; }
success() { echo -e "${GREEN}  ✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}  ⚠${RESET} $*"; }
error()   { echo -e "${RED}  ✗${RESET} $*" >&2; exit 1; }
header()  { echo -e "\n${BOLD}$*${RESET}"; }

# ── Argument parsing ──────────────────────────────────────────────────────────
if [[ $# -lt 1 ]]; then
  echo -e "${BOLD}Usage:${RESET} $(basename "$0") <project_name> [target_path]"
  echo ""
  echo "  project_name   Label shown in the dashboard (e.g. my-api)"
  echo "  target_path    Where to create the project (default: ./<project_name>)"
  echo ""
  echo -e "${BOLD}Examples:${RESET}"
  echo "  $(basename "$0") my-api"
  echo "  $(basename "$0") backend ~/projects/my-api"
  exit 1
fi

PROJECT_NAME="$1"
TARGET_PATH="${2:-$(pwd)/${PROJECT_NAME}}"
TARGET_PATH="$(cd "$(dirname "${TARGET_PATH}")" 2>/dev/null && pwd)/$(basename "${TARGET_PATH}")" || TARGET_PATH="${TARGET_PATH}"

# Dashboard root = directory this script lives in
DASHBOARD_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOKS_SRC="${DASHBOARD_DIR}/hooks"

# ── Prerequisite checks ───────────────────────────────────────────────────────
header "Checking prerequisites"

check_cmd() {
  if command -v "$1" &>/dev/null; then
    success "$1 found ($(command -v "$1"))"
  else
    error "$1 is required but not found. Install it from $2"
  fi
}

check_cmd bun   "https://bun.sh"
check_cmd python3 "https://python.org"

if ! command -v claude &>/dev/null; then
  warn "claude CLI not found — install it from https://claude.ai/code before running agents"
fi

# ── Install dashboard dependencies (idempotent) ───────────────────────────────
header "Installing dashboard dependencies"

if [[ ! -d "${DASHBOARD_DIR}/server/node_modules" ]]; then
  info "Installing server dependencies…"
  (cd "${DASHBOARD_DIR}/server" && bun install --silent)
  success "Server dependencies installed"
else
  success "Server dependencies already installed"
fi

if [[ ! -d "${DASHBOARD_DIR}/client/node_modules" ]]; then
  info "Installing client dependencies…"
  (cd "${DASHBOARD_DIR}/client" && bun install --silent)
  success "Client dependencies installed"
else
  success "Client dependencies already installed"
fi

# ── Create project directory ──────────────────────────────────────────────────
header "Setting up project: ${BOLD}${PROJECT_NAME}${RESET}"
info "Target: ${TARGET_PATH}"

mkdir -p "${TARGET_PATH}"
mkdir -p "${TARGET_PATH}/.claude/hooks"
mkdir -p "${TARGET_PATH}/doc/prd"
touch "${TARGET_PATH}/doc/prd/PRD.md"

# ── Copy hooks ────────────────────────────────────────────────────────────────
info "Copying hook scripts…"

if [[ ! -d "${HOOKS_SRC}" ]]; then
  error "Hooks directory not found at ${HOOKS_SRC} — is this running from the dashboard repo root?"
fi

cp "${HOOKS_SRC}"/*.py "${TARGET_PATH}/.claude/hooks/"
success "Copied $(ls "${HOOKS_SRC}"/*.py | wc -l | tr -d ' ') hook scripts"

HOOKS_ABS="${TARGET_PATH}/.claude/hooks"

# ── Generate settings.json ────────────────────────────────────────────────────
info "Generating .claude/settings.json…"

SETTINGS_FILE="${TARGET_PATH}/.claude/settings.json"

# Detect python binary
PYTHON_BIN="$(command -v python3 || command -v python)"

cat > "${SETTINGS_FILE}" <<EOF
{
  "env": {
    "CLAUDE_SOURCE_APP": "${PROJECT_NAME}",
    "OBS_SERVER": "http://localhost:4000",
    "HOOK_TAGS": "[]"
  },
  "hooks": {
    "SessionStart": [
      {"matcher": "*", "hooks": [{"type": "command", "command": "${PYTHON_BIN} ${HOOKS_ABS}/session_start.py"}]}
    ],
    "SessionEnd": [
      {"matcher": "*", "hooks": [{"type": "command", "command": "${PYTHON_BIN} ${HOOKS_ABS}/session_end.py"}]}
    ],
    "Stop": [
      {"matcher": "*", "hooks": [{"type": "command", "command": "STOP_HOOK_ACTIVE=1 ${PYTHON_BIN} ${HOOKS_ABS}/stop.py"}]}
    ],
    "SubagentStart": [
      {"matcher": "*", "hooks": [{"type": "command", "command": "${PYTHON_BIN} ${HOOKS_ABS}/subagent_start.py"}]}
    ],
    "SubagentStop": [
      {"matcher": "*", "hooks": [{"type": "command", "command": "${PYTHON_BIN} ${HOOKS_ABS}/subagent_stop.py"}]}
    ],
    "PreToolUse": [
      {"matcher": "*", "hooks": [{"type": "command", "command": "${PYTHON_BIN} ${HOOKS_ABS}/pre_tool_use.py"}]}
    ],
    "PostToolUse": [
      {"matcher": "*", "hooks": [{"type": "command", "command": "${PYTHON_BIN} ${HOOKS_ABS}/post_tool_use.py"}]}
    ],
    "PostToolUseFailure": [
      {"matcher": "*", "hooks": [{"type": "command", "command": "${PYTHON_BIN} ${HOOKS_ABS}/post_tool_use_failure.py"}]}
    ],
    "Notification": [
      {"matcher": "*", "hooks": [{"type": "command", "command": "${PYTHON_BIN} ${HOOKS_ABS}/notification.py"}]}
    ],
    "PermissionRequest": [
      {"matcher": "*", "hooks": [{"type": "command", "command": "${PYTHON_BIN} ${HOOKS_ABS}/permission_request.py"}]}
    ],
    "UserPromptSubmit": [
      {"matcher": "*", "hooks": [{"type": "command", "command": "${PYTHON_BIN} ${HOOKS_ABS}/user_prompt_submit.py"}]}
    ],
    "PreCompact": [
      {"matcher": "*", "hooks": [{"type": "command", "command": "${PYTHON_BIN} ${HOOKS_ABS}/pre_compact.py"}]}
    ]
  }
}
EOF

success "settings.json written"

# ── Optional git init ─────────────────────────────────────────────────────────
if [[ ! -d "${TARGET_PATH}/.git" ]]; then
  echo ""
  read -r -p "  Initialise a git repository in ${TARGET_PATH}? [y/N] " INIT_GIT
  if [[ "${INIT_GIT}" == "y" || "${INIT_GIT}" == "Y" ]]; then
    git -C "${TARGET_PATH}" init -q
    # Add a minimal .gitignore if one doesn't exist
    if [[ ! -f "${TARGET_PATH}/.gitignore" ]]; then
      cat > "${TARGET_PATH}/.gitignore" <<'GITIGNORE'
node_modules/
.env
.env.*
*.db
*.db-shm
*.db-wal
__pycache__/
*.pyc
.DS_Store
GITIGNORE
    fi
    success "Git repository initialised"
  fi
else
  success "Git repository already exists — skipping init"
fi

# ── Configure OBS_SERVER (optional override) ──────────────────────────────────
echo ""
read -r -p "  Observability server URL [http://localhost:4000]: " OBS_SERVER_INPUT
OBS_SERVER_INPUT="${OBS_SERVER_INPUT:-http://localhost:4000}"

if [[ "${OBS_SERVER_INPUT}" != "http://localhost:4000" ]]; then
  # Use python3 for portable in-place JSON edit
  python3 - <<PYEOF
import json, sys
with open("${SETTINGS_FILE}") as f:
    s = json.load(f)
s["env"]["OBS_SERVER"] = "${OBS_SERVER_INPUT}"
with open("${SETTINGS_FILE}", "w") as f:
    json.dump(s, f, indent=2)
print("  Updated OBS_SERVER to ${OBS_SERVER_INPUT}")
PYEOF
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}✓ Project '${PROJECT_NAME}' is ready${RESET}"
echo ""
echo -e "  ${BOLD}Location:${RESET}  ${TARGET_PATH}"
echo -e "  ${BOLD}Hooks:${RESET}     ${TARGET_PATH}/.claude/hooks/"
echo -e "  ${BOLD}Settings:${RESET}  ${TARGET_PATH}/.claude/settings.json"
echo -e "  ${BOLD}PRD:${RESET}       ${TARGET_PATH}/doc/prd/PRD.md"
echo ""
echo -e "${BOLD}Next steps:${RESET}"
echo ""
echo -e "  1. Start the dashboard:"
echo -e "     ${CYAN}$(dirname "${BASH_SOURCE[0]}")/start.sh${RESET}"
echo ""
echo -e "  2. Write PRD.md:"
echo -e "     ${CYAN}${TARGET_PATH}/doc/plans/prd/PRD.md{RESET}"
echo ""
echo -e "  3. Start Claude Code in your project:"
echo -e "     ${CYAN}$(dirname "${BASH_SOURCE[0]}")/claude.sh ${TARGET_PATH}${RESET}"
echo ""
echo -e "  4. Open the dashboard: ${CYAN}http://localhost:5173${RESET}"
echo ""
echo -e "  ${YELLOW}Tip:${RESET} Edit ${TARGET_PATH}/.claude/settings.json to add custom tags:"
echo -e "       ${CYAN}\"HOOK_TAGS\": \"[\\\"feat/my-branch\\\", \\\"sprint-1\\\"]\"${RESET}"
echo ""
