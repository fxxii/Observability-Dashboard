# Product Requirements Document

## Agent Orchestration & Observability Web App

**Version:** 2.0  
**Sources:** Multi-Agent Observability System (disler/github) + Agentic Coding Environment (tmux + Claude Code + Superpowers + Codex)  
**Date:** February 2026

---

## 1. Executive Summary

A web application that provides a unified control plane for **orchestrating** and **observing** multi-agent Claude Code workflows. The system combines real-time event monitoring (hook-based observability) with a structured agent orchestration layer that enforces a quality-gated development lifecycle: brainstorm → plan → implement (TDD) → review → PR. Engineers go from "vibe coding at scale" to having complete situational awareness and control over their entire agent fleet.

---

## 2. Problem Statement

Two compounding problems exist today:

**Observability gap:** When multiple Claude Code agents run in parallel — each with independent context windows, session IDs, and task assignments — there is no unified view of what's happening. Failures cascade silently, tool calls are invisible, and task handoffs are opaque.

**Orchestration gap:** Without a structured workflow enforced at the system level, agents implement without specs, skip tests, produce inconsistent quality, and require constant human intervention to correct course. The brainstorm → plan → TDD → review → PR chain exists in the engineer's head but not in the system.

The solution is a web app that closes both gaps simultaneously: a live dashboard that shows _what agents are doing_, combined with an orchestration layer that controls _how they do it_.

---

## 3. Target Users

**Primary:** AI/agentic engineers who run Claude Code locally or in orchestrated multi-agent pipelines and need operational visibility and workflow governance.

**Secondary:** Engineering team leads who want to monitor autonomous coding sessions across team members or projects.

---

## 4. Core Concepts

### 4.1 The Three-Layer Architecture

```
Layer 1 (Orchestration):  Lead Agent  →  Agent Teams  →  Specialized Subagents
Layer 2 (Hook System):    12 Hook Events  →  HTTP POST  →  Bun Server  →  SQLite
Layer 3 (Dashboard):      WebSocket  →  Vue Client  →  Real-time visualization
```

### 4.2 Agent Roles

|Agent|Role|Capabilities|
|---|---|---|
|**Lead**|Planner & coordinator|Full CLI access, spawns subagents, calls critic, opens PRs|
|**Implementer**|TDD code writer|Writes failing test → min implementation → self-review → commit|
|**Spec Reviewer**|Compliance checker|Read-only, verifies implementation matches spec exactly|
|**Quality Reviewer**|Code quality gatekeeper|Rates: Critical / Important / Minor; blocks on Critical|
|**Fix Subagent**|Targeted repair|Dispatched by Lead when reviews fail; prevents context pollution|
|**Codex Critic**|Cross-tool sanity check|Independent second opinion via OpenAI Codex; called between task batches|
|**Auditor**|Commit monitor|lazygit view; watches commits land from each subagent|

### 4.3 Trace ID & Parent-Child Hierarchy

Every event carries a `trace_id` (root session UUID) and an optional `parent_session_id`. When the Lead spawns a subagent, the `SubagentStart` hook captures the parent's UUID. This enables the dashboard to render a **Node-Link Diagram** showing the full swarm hierarchy — not just _what_ each agent did, but _why_ it exists and who spawned it.

Without `parent_session_id`, multi-agent runs look like a flat list of independent sessions. With it, the dashboard can answer: "Agent B was spawned by Agent A at 10:43 to fix a Quality Review failure on Task 3."

### 4.4 Workflow Pipeline (Superpowers Skill Chain)

```
1. Brainstorm    → Socratic spec refinement, saves design doc
2. Git Worktree  → Isolated branch + clean test baseline
3. Write Plan    → 2–5 min tasks, exact file paths, verification steps
4. Execute Plan  → Per task: Implementer → Spec Review → Quality Review
5. Critic Review → Codex cross-tool review after each task batch
6. Finish Branch → Verify tests → gh pr create → clean up worktree
```

**Per-task subagent count:**

```
Minimum:  N tasks × 3 subagents (Implementer + Spec Reviewer + Quality Reviewer)
Per fix:  +1 Fix subagent per Critical issue found
Parallel: Independent tasks can run multiple Implementers concurrently
```

---

## 5. Architecture

### 5.1 System Data Flow

```
Claude Agents → Hook Scripts (Python/uv) → HTTP POST → Bun Server → SQLite → WebSocket → Vue Client
                     ↑                                                             ↓
              .claude/settings.json                                    Dashboard (port 5173)
              (12 event types)                                         - Event Timeline
                                                                       - Live Pulse Chart
                                                                       - Orchestration Panel
                                                                       - Agent Swim Lanes
```

### 5.2 Window Layout (tmux-inspired UI metaphor)

The dashboard mirrors the proven 3-window tmux layout as distinct UI panels:

```
┌─────────────────────┬───────────────────────────────────────────┐
│ 🔍 Auditor Panel    │ ⚡ Lead Agent Panel                        │
│ Commit log viewer   │                                            │
│                     │ Current phase: execute-plan               │
│ Commits land here   │ Active task: 3 of 7                        │
│ as each subagent    │ Dispatched: Implementer T3                 │
│ finishes            │                                            │
├─────────────────────┤                                            │
│ 🧠 Critic Panel     │                                            │
│                     │                                            │
│ Idle / last review  │                                            │
│ output from Codex   │                                            │
│                     │                                            │
└─────────────────────┴───────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────────────┐
│ 📋 Event Timeline            │ 📊 Live Pulse Chart              │
│ (real-time hook events)      │ (activity density per agent)     │
└──────────────────────────────┴──────────────────────────────────┘
```

---

## 6. Feature Requirements

### 6.1 Hook System (12 Event Types)

Python scripts intercept all Claude Code lifecycle events and POST to the observability server. Each is portable — copy `.claude/` to any project to enable emission.

|Hook|Event|What It Captures|
|---|---|---|
|`pre_tool_use.py`|PreToolUse 🔧|Blocks dangerous commands, validates tool usage, summarizes inputs|
|`post_tool_use.py`|PostToolUse ✅|Execution results, MCP tool detection|
|`post_tool_use_failure.py`|PostToolUseFailure ❌|Failures, interrupt status|
|`permission_request.py`|PermissionRequest 🔐|Permission requests and suggestions|
|`notification.py`|Notification 🔔|User interactions with TTS support|
|`user_prompt_submit.py`|UserPromptSubmit 💬|User prompts with optional blocking|
|`stop.py`|Stop 🛑|Session completion (with infinite-loop guard)|
|`subagent_stop.py`|SubagentStop 👥|Completion + transcript path|
|`subagent_start.py`|SubagentStart 🟢|Subagent lifecycle start|
|`pre_compact.py`|PreCompact 📦|Context compaction with custom instructions|
|`session_start.py`|SessionStart 🚀|Agent type, model, source|
|`session_end.py`|SessionEnd 🏁|End reason tracking|

**Hook payload metadata:** Every event payload includes an optional `tags` field (e.g. `feature-branch-x`, `experiment-v2`). Tags are set in `settings.json` per project and are filterable in the dashboard. This lets engineers distinguish runs across branches or experiments without changing source-app names.

**Separation of concerns — blocking vs. logging:** Blocking logic (dangerous command interception, `.env` access prevention) lives in a dedicated `guard_hook.py` that runs _before_ the observability hooks. The observability server only receives _log_ events — including a record that a block occurred — but is never in the critical path of allowing/denying tool execution. This prevents observer-effect latency bugs where the monitoring layer inadvertently slows down or disrupts the agent.

**Security hardening (built into hooks):**

- Blocks `rm -rf` commands outside allowed directories via `deny_tool()` JSON pattern
- Prevents access to `.env` and private key files
- `stop_hook_active` guard prevents infinite hook loops
- Stop hook validators ensure plan files contain required sections before completion

### 6.2 Server

**Runtime:** Bun + TypeScript  
**Storage:** SQLite with WAL mode for concurrent agent access

**Endpoints:**

- `POST /events` — receive events from agents
- `GET /events/recent` — paginated retrieval with filtering
- `GET /events/filter-options` — available filter values
- `WS /stream` — real-time broadcast to all connected clients

Features: automatic schema migrations, event validation, WebSocket broadcast, chat transcript storage, configurable **TTL (Time-to-Live)** for log pruning (default: 7 days) to prevent unbounded disk growth during long autonomous runs.

### 6.3 Dashboard (Vue 3 Client)

#### Event Timeline

- Live event stream with auto-scroll and manual override
- Dual-color system: app color (left border) + session color (second border) for visual agent swim lanes
- Tool emoji system: Bash 💻, Read 📖, Write ✍️, Edit ✏️, Task 🤖, MCP tools 🔌
- Multi-criteria filtering: by app, session, event type, and tags
- Chat Transcript Modal with syntax highlighting
- **Parent-Child Trace View:** toggle between flat timeline and hierarchical Node-Link Diagram showing which agent spawned which, with SubagentStart/Stop brackets

#### Context Window Heatmap (new)

- Per-agent gauge showing estimated context window fill level (0–100%)
- Turns **amber at 80%** — agent is approaching compaction and may start forgetting constraints
- Turns **red after 3 PreCompact events within 10 minutes** — agent is likely in a context death spiral
- PreCompact events are timestamped and counted per session so the pattern is immediately visible

#### Stall Detection (new)

- If an agent hasn't emitted any hook event in **60 seconds**, its swim lane highlights in red
- A stall badge appears with elapsed time: `⚠️ No activity — 1m 23s`
- Helps distinguish "agent is thinking" from "agent is silently hung"

#### Token Burn Rate Monitor (new)

- Small widget showing **estimated $USD cost** of the current session based on model pricing
- Breaks down by agent: which subagent is consuming the most tokens
- Alerts if burn rate exceeds a configurable threshold (e.g. $1/min) — prevents "infinite loop running overnight" surprises

#### Live Pulse Chart

- Canvas-based real-time activity visualization
- Session-colored bars with event-type combo emojis on each bar
- Time range selector: 1m / 3m / 5m windows
- Smooth animations and glow effects
- Responsive to filter changes

#### MCP Registry Tab (new)

- Dedicated tab listing all active MCP servers detected from `PostToolUse` events
- Shows: server name, connected tools, last-seen timestamp, and a latency heartbeat indicator
- If a tool call fails, the MCP tab immediately shows whether the failure was agent logic or MCP server timeout — cuts debugging time significantly

#### Orchestration Panel

- **Lead Agent status:** current Superpowers phase (brainstorm / write-plan / execute-plan / finish)
- **Task progress tracker:** N of M tasks complete, active subagent per task
- **Review gate status:** per-task Implementer → Spec Review → Quality Review pipeline with pass/fail badges
- **Critic review log:** timestamped Codex cross-tool review outputs after each task batch
- **Auditor panel:** commit log feed showing atomic TDD commits as they land, linked to task ID

#### Human-in-the-Loop (HITL) Intercept (new)

- The server can **pause an agent's execution** by returning a block signal to `pre_tool_use.py` when a configurable regex matches a tool call
- The dashboard shows the pending tool call with full context and a **Approve / Block** button
- Approved: agent continues. Blocked: agent receives a custom message explaining why
- Use case: intercept any `Bash` command matching `git push` or `gh pr create` for human review before it hits the remote

#### Time-Travel Debugger (new)

- A **scrubbing slider** on the timeline lets engineers rewind the entire swarm's event state to any point in history
- **"Fork from Here"** button: copies the session transcript up to the selected moment into a ready-to-run `claude` CLI command, pre-loaded with the corrected prompt — enabling replay with a fix without re-running the entire plan from scratch

#### Agent Swim Lanes

- Per-session color-coded rows that persist across the timeline
- SubagentStart / SubagentStop events bracket each agent's visible activity window
- Filter to a single agent's entire trace with one click

### 6.4 Cross-Agent Communication (from MD file)

The system exposes shell-callable functions that the Lead agent uses to orchestrate across panes/agents:

|Function|Purpose|
|---|---|
|`critic_review(prompt)`|Sends review request to Codex critic agent|
|`critic_read()`|Reads Codex response (waits for completion)|
|`auditor_read()`|Snapshots current commit log state|
|`read_all_panes()`|Snapshot of all oversight panes|
|`read_agent_panes()`|Snapshot of all active agent panes|
|`log(message)`|Appends to `agent-activity.log`|
|`log_test(message)`|Appends to `test-results.log`|
|`pane_send(target, cmd)`|Send raw command to a named agent|

### 6.5 Agent Team Definitions

**Builder / Implementer Agent**

- Follows TDD: RED (write failing test) → GREEN (minimal code to pass) → REFACTOR → self-review → commit
- PostToolUse hooks run `ruff` and `ty` lint on every Write/Edit operation
- Logs lifecycle events to `agent-activity.log` and test outcomes to `test-results.log`

**Spec Reviewer Agent**

- Read-only — cannot use Write, Edit, or NotebookEdit tools
- Checks spec compliance only; reports compliant / non-compliant with specific gaps

**Quality Reviewer Agent**

- Rates issues: Critical (blocks) / Important / Minor
- Critical issues dispatch a Fix subagent; reviewer re-runs after fix
- Never self-fixes to avoid context pollution

**Codex Critic Agent**

- Independent cross-tool reviewer using OpenAI Codex
- Triggered between task batches via `critic_review()`
- Provides second opinion on design and implementation from outside Claude's context

### 6.6 Planning with Agent Teams

`/plan_w_team "Add a new feature for X"` generates a spec document in `specs/` with:

- Task breakdowns (2–5 min each)
- Team member assignments (which agent type handles each task)
- Dependencies between tasks
- Acceptance criteria
- Parallel execution opportunities (tasks with no shared file writes)

`/build specs/<plan-name>.md` executes the full plan.

Stop hook validators ensure plan files contain all required sections before the session can complete.

---

## 7. Technical Stack

|Layer|Technology|
|---|---|
|Hook scripts|Python 3.11+, Astral uv|
|Server|Bun, TypeScript, SQLite|
|Client|Vue 3, TypeScript, Vite, Tailwind CSS|
|Communication|HTTP REST + WebSocket|
|Agent orchestration|Claude Code + `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`|
|Cross-tool critic|OpenAI Codex CLI|
|Commit auditing|lazygit (or git log API in the web app)|
|Optional|ElevenLabs/OpenAI TTS for notifications, Firecrawl MCP for web scraping|

---

## 8. Setup & Integration Requirements

**Dependencies:** Claude Code CLI, Astral uv, Bun, Anthropic API key. OpenAI API key for Codex critic. GitHub CLI for PR workflow.

**Portability contract:** Any project wanting to emit events needs only to copy the `.claude/` directory and set `--source-app YOUR_PROJECT_NAME` in `settings.json`. The observability server collects from any number of instrumented projects simultaneously.

**Agent teams activation:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` must be set in the environment. Claude Code auto-detects tmux and spawns agent panes dynamically — do not pre-create agent panes manually to avoid collision.

**Ports:** Server `4000`, Client `5173`.

---

## 9. Operational Modes

### Semi-Autonomous

Launch the environment; describe your task after the Lead agent opens. Claude runs the full Superpowers workflow autonomously from that point.

### Fully Autonomous

Pass a task at launch time. Claude immediately brainstorms spec, creates a worktree, writes a plan, dispatches subagents, runs TDD, calls Codex critic, and opens a PR with zero human input.

### Delegate Mode

Press `Shift+Tab` after Claude Code starts. The Lead only coordinates — it spawns, messages, and shuts down teammates but never writes code directly.

### Headless / CI-CD Mode

Pass `--headless` flag to disable the Vue UI entirely. The server outputs a structured Markdown summary of the multi-agent run on completion — suitable for posting as a GitHub Actions PR comment. Includes: tasks completed, review outcomes, failures, token cost, and a link to the SQLite artifact for post-mortem inspection. Use Claude Haiku for Spec Reviewer and Quality Reviewer subagents; reserve Sonnet or Opus for the Lead and Implementer. Configure via `settings.json` `agentTeams.defaultModel`.

---

## 10. Observability Metrics

|Metric|Source|Purpose|
|---|---|---|
|Events/minute per agent|Live Pulse Chart|Throughput visibility|
|PostToolUseFailure rate|Event Timeline|Failure detection|
|PreCompact frequency|SessionStart / PreCompact|Context pressure warning|
|Context window fill %|PreCompact event count + token estimates|Context heatmap|
|Estimated $USD cost|Token counts × model pricing|Burn rate monitoring|
|SubagentStart → Stop duration|Subagent events|Per-task time-to-complete|
|Review pass/fail rate|Spec/Quality reviewer events|Quality trend tracking|
|Critic review outcomes|Codex pane capture|Cross-tool alignment signal|
|Commits per task|Auditor panel|TDD cycle compliance|
|Task completion: N of M|Orchestration panel|Overall plan progress|
|Agent stall duration|Last event timestamp delta|Hung agent detection|
|MCP tool latency|PostToolUse timestamps|MCP server health|

---

## 11. Security Requirements

- Block `rm -rf` outside allowed directories via hook-level `deny_tool()` pattern
- Prevent access to `.env` files and private keys via hook validation
- `stop_hook_active` guard prevents infinite hook execution loops
- Stop hook validators enforce plan completeness before session close
- All inputs validated at the server before persistence
- No sensitive API keys stored in the SQLite database

---

## 12. Success Criteria

The system succeeds when:

1. An engineer can open the dashboard during a multi-agent run and immediately answer: which agents are active, what phase of the workflow they're in, what tools they're calling, which tasks have passed review, and which have failed — without touching terminal logs.
    
2. A fully autonomous run from `setup-dev-tmux.sh /path "implement X"` through to `gh pr create` completes without any human intervention, with every step traceable in the dashboard.
    
3. The Codex critic catches at least one issue per task batch that the Lead agent self-corrects before the next batch, demonstrable in the critic review log.
    
4. Any project can adopt the observability layer by copying a single `.claude/` directory and restarting Claude Code.
    

---

## 13. Out of Scope (v1)

- Cloud-hosted multi-user dashboard (v1 is local/single-engineer)
- Support for non-Claude Code agents (LangChain, AutoGPT, etc.)
- Automated PR review from the dashboard UI
- Data export or analytics beyond the live SQLite store
- Mobile-responsive layout
