# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository is the scaffold for an **Agent Orchestration & Observability Web App** — a real-time dashboard for monitoring and orchestrating multi-agent Claude Code workflows. The PRD lives at `docs/prd/feature.md`. Implementation has not started yet; the repo contains the agentic infrastructure to build it.

## Planned Tech Stack

| Layer | Technology |
|---|---|
| Hook scripts | Python 3.11+, Astral uv |
| Server | Bun, TypeScript, SQLite (WAL mode) |
| Client | Vue 3, TypeScript, Vite, Tailwind CSS |
| Communication | HTTP REST + WebSocket |
| Ports | Server `4000`, Client `5173` |

Once the application exists, the typical commands will be:

```bash
# Server
cd server && bun install
bun run dev          # development server on :4000
bun test             # run all tests
bun test --watch     # watch mode
bun test path/to/file.test.ts  # single test file

# Client
cd client && bun install
bun run dev          # Vite dev server on :5173
bun run build        # production build
bun run typecheck    # vue-tsc type check
bun run lint         # ESLint
```

## Agentic Workflow Infrastructure

### Launching the Lead Agent

The repo uses a Superpowers-powered agentic loop. There are three launch modes:

```bash
# PRD mode (recommended — spec is already approved, skips brainstorm)
bash .agentic-loop.sh --prd docs/prd/feature.md

# Task mode (inline task, runs brainstorm first)
bash .agentic-loop.sh --task "describe what to build"

# Resume mode (after session interruption)
bash .agentic-loop.sh --resume-context

# Interactive (no task pre-loaded)
bash .agentic-loop.sh
```

`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set automatically. Do not pre-create agent panes in tmux — Claude Code auto-spawns them in Window 1.

### Cross-Pane Shell Functions

Source `.tmux-helpers.sh` to get these in scope. The Lead agent calls them to coordinate across the tmux session (`SESSION=agentic-dev`, Window 0):

| Function | Purpose |
|---|---|
| `read_prd` | Print the active PRD |
| `prd_section "Heading"` | Extract a section by `## Heading` |
| `critic_review "prompt"` | Send a review prompt to the Codex pane (PRD injected automatically) |
| `critic_read` | Capture Codex response (waits 6s) |
| `auditor_read` | Snapshot lazygit pane (Window 0, Pane 0) |
| `read_all_panes` | Snapshot all Window 0 panes |
| `read_agent_panes` | Snapshot all Window 1 agent panes |
| `log "msg"` | Append to `.agent-logs/agent-activity.log` |
| `log_test "msg"` | Append to `.agent-logs/test-results.log` |
| `pane_send <target> "cmd"` | Send raw command to `auditor` / `critic` / `lead` |

Pane layout (Window 0): `0.0` = Auditor (lazygit), `0.1` = Critic (Codex), `0.2` = Lead (Claude Code).

### Active PRD Tracking

`.agent-logs/.active-prd` stores the absolute path to the current PRD file. `read_prd` and `prd_section` read from this path. `--prd` mode sets it automatically; in manual sessions run:

```bash
echo "$(pwd)/docs/prd/feature.md" > .agent-logs/.active-prd
```

## Agent Roles (`.claude/agents/`)

**spec-reviewer** (Haiku, read-only tools): Verifies implementation matches PRD requirement IDs exactly. Reports `COMPLIANT` or `NON-COMPLIANT` with specific requirement IDs. Does not review code quality.

**quality-reviewer** (Haiku, read-only tools): Reviews code quality only (not spec compliance). Rates issues `Critical / Important / Minor`. Critical issues block progress and require a fix subagent — the quality reviewer never self-fixes.

**Lead Agent responsibilities**: Runs the full Superpowers workflow (write-plan → execute-plan → finish-branch). Per task dispatches: Implementer → Spec Reviewer → Quality Reviewer. On Critical: dispatch a Fix subagent, do not fix manually (context pollution).

## Superpowers Workflow (PRD Mode)

1. **[Skip brainstorm]** — PRD is already approved
2. `using-git-worktrees` skill — create branch `feat/<feature>`, verify clean test baseline
3. `write-plan` skill — save to `docs/plans/<feature>-plan.md`; each task references a PRD requirement ID (e.g. `REQ-1`); tasks are 2–5 minutes each
4. `execute-plan` via `subagent-driven-development` — per task: Implementer (TDD: RED→GREEN→REFACTOR) → Spec Reviewer → Quality Reviewer
5. `critic_review` after every 3–5 task batch; address critical PRD gaps before next batch
6. `finishing-a-development-branch` skill — verify tests, `gh pr create`, clean up worktree

Implementer commit format: `feat(REQ-N): <description>`
Test naming convention: include the requirement ID, e.g. `test_REQ1_<description>`

## Repository Structure

```
.
├── .agentic-loop.sh        # Lead agent launcher (gitignored)
├── .tmux-helpers.sh        # Cross-pane shell functions (gitignored)
├── .setup-superpowers.sh   # Superpowers plugin installer (gitignored)
├── .claude/
│   └── agents/
│       ├── spec-reviewer.md    # Spec Reviewer agent definition
│       └── quality-reviewer.md # Quality Reviewer agent definition
├── .agent-logs/            # Runtime logs (gitignored)
│   ├── .active-prd         # Path to current active PRD
│   ├── agent-activity.log  # Timestamped activity events
│   └── test-results.log    # Timestamped test outcomes
├── docs/
│   ├── prd/
│   │   └── feature.md      # The approved PRD (committed)
│   └── plans/              # Generated plan files (created during execution)
└── .worktrees/             # Git worktrees for feature branches (gitignored)
```

## Three-Layer Architecture (to be built)

```
Layer 1 (Orchestration):  Lead Agent → Agent Teams → Specialized Subagents
Layer 2 (Hook System):    12 Hook Events → HTTP POST → Bun Server (:4000) → SQLite
Layer 3 (Dashboard):      WebSocket → Vue Client (:5173) → Real-time visualization
```

Hook scripts (Python) live in `.claude/` of any instrumented project and POST events to the server. The observability server collects from multiple projects simultaneously — portability requires only copying the `.claude/` directory and setting `--source-app YOUR_PROJECT_NAME` in `settings.json`.
