#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# claude.sh <project_folder>
#
# Start Claude Code in the given project folder.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $(basename "$0") <project_folder>"
  exit 1
fi

PROJECT_DIR="$(cd "$1" && pwd)"

cd "${PROJECT_DIR}"
exec claude --dangerously-skip-permissions
