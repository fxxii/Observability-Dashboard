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
PROJECT_NAME="$(basename "${PROJECT_DIR}")"

cd "${PROJECT_DIR}"
exec claude --dangerously-skip-permissions \
  "/using-superpowers
/superpowers:writing-plans Read PRD at ${PROJECT_DIR}/doc/prd/PRD.md and write-plan to doc/plans/${PROJECT_NAME}-plan.md"
