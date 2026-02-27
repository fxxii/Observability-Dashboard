# Claude Code Observability Dashboard

**Real-time visibility and human control over multi-agent Claude Code workflows.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/runtime-Bun-black)](https://bun.sh)
[![Vue 3](https://img.shields.io/badge/frontend-Vue%203-42b883)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-3178c6)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/tests-100%20passing-brightgreen)](#testing)

---

## The Problem

When you run multiple AI coding agents in parallel, you are flying blind.

Each Claude Code session has its own context window, its own tool calls, its own failures — and none of it is visible from the outside. A subagent stalls at 14:03. Another fires 40 Bash commands in 90 seconds. A third silently hits a permission error and halts. You find out 20 minutes later when you check the output.

At scale — 5 agents, 10 agents, an orchestrated swarm — this is not a workflow. It is controlled chaos.

**The Agent Observability Dashboard closes the gap.** It gives you a unified, live view of everything your agent fleet is doing, with tools to intervene when it matters.

---

## What It Does

```
Claude Agents → Hook Scripts (Python) → HTTP POST → Bun Server → SQLite
                                                                     ↓
                                                              WebSocket Broadcast
                                                                     ↓
                                                         Vue Dashboard :5173
                                                    ┌────────────────────────────┐
                                                    │  Event Timeline            │
                                                    │  Live Pulse Chart          │
                                                    │  HITL Intercept UI  ←──── intercept
                                                    │  Time-Travel Debugger      │
                                                    │  Context Heatmap           │
                                                    │  Token Burn Monitor        │
                                                    │  MCP Registry              │
                                                    │  Stall Detection           │
                                                    │  Parent-Child Trace View   │
                                                    └────────────────────────────┘
```

Zero changes to your agents. Drop a `.claude/` directory into any project and events stream into the dashboard immediately.

---

## Why This Matters — and Why Now

Multi-agent AI development is moving from experiment to production workflow. Teams are running 5, 10, 20 parallel agents. The tooling to manage them at that scale doesn't exist yet.

We built the operational layer that makes agentic development **governable**:

- **Visibility** — see what every agent is doing, in real time, across multiple projects
- **Control** — intercept dangerous tool calls before they execute; approve or block from the UI
- **Safety** — catch stalls, context spirals, and cost overruns before they compound
- **Accountability** — a full audit trail of every tool call, test result, and review decision
- **Portability** — one `.claude/` directory instruments any Claude Code project instantly

The market for AI developer tooling is growing fast. The teams that ship reliable multi-agent systems will be the ones with observability from day one. We are building the `htop` for agent swarms.

---

## Feature Overview

### Real-Time Event Timeline

Every tool call, session start, subagent spawn, compaction, and failure — streamed in real time across all connected agents. Dual-color swim lanes: left border = source project, right border = session ID. Tool emoji overlays: Bash 💻, Read 📖, Write ✍️, Edit ✏️, Task 🤖. Auto-scroll with manual override. Click any row to open the full chat transcript.

### Human-in-the-Loop (HITL) Intercept

Define regex rules on the server. When an agent fires a tool call matching a rule, the hook pauses execution and surfaces a card in the dashboard showing the tool name, command, and session ID with **Approve** and **Block** buttons.

- **Approved** — agent continues uninterrupted
- **Blocked** — agent receives a custom message explaining why and can recover
- **Timeout** (60s) — auto-approves; agents are never permanently blocked by observer failure

Common use cases: gate every `git push`, review all `gh pr create` calls, catch `.env` file access.

### Time-Travel Debugger

A scrubbing slider rewinds the entire swarm's event state to any point in history. The **"Fork from Here"** button extracts the conversation context up to that moment and generates a `claude --resume` command pre-loaded with the full transcript — enabling instant replay with a corrected prompt without re-running the full plan from scratch.

### Context Window Heatmap

Tracks `PreCompact` events per session. Turns **amber at 80% estimated fill** (2 compactions). Turns **red** at 3+ compactions in 10 minutes — the signature of an agent in a context death spiral. Acts as an early warning system so you can intervene before the agent loses critical constraints.

### Stall Detection

If any agent goes 60 seconds without emitting a hook event, its swim lane highlights red and shows a badge with elapsed idle time: `⚠️ No activity — 1m 23s`. Distinguishes "agent is thinking" from "agent is hung waiting for a tool response that will never arrive."

### Token Burn Rate Monitor

Live $USD cost estimate per session and per agent, calculated from token counts in `PostToolUse` events against model pricing tables (Opus, Sonnet, Haiku). Alerts when the burn rate exceeds $1/minute. Prevents overnight loop surprises.

### MCP Registry Tab

Auto-discovers every Model Context Protocol server in use from tool call events. Shows: server name, tools available, call count, failure count, and last-seen timestamp. Immediately surfaces whether a failure is agent logic or MCP server unavailability — cuts debugging time significantly.

### Parent-Child Trace View

Renders the full agent spawning hierarchy as a recursive node-link diagram. Every `SubagentStart` event carries its parent's `session_id`. The trace view answers: *"Agent B was spawned by Agent A at 14:23 to fix a quality review failure on Task 3."*

### Orchestration Panel

Tracks the Lead agent's workflow phase (brainstorm → write-plan → execute-plan → finish-branch), task progress (N of M), dispatched subagents, and per-task review gate status (Implementer → Spec Reviewer → Quality Reviewer pass/fail badges).

### Live Pulse Chart

Canvas-based real-time activity density chart. Session-colored bars. Configurable time window: 1m / 3m / 5m. Smooth animations. Responsive to filter state.

### Multi-Criteria Filtering

Filter the entire dashboard simultaneously by: source project, session ID, event type, and custom tag. Tags are set per-project in `settings.json` and survive across sessions — tag a branch, an experiment, or a sprint.

---

## Dashboard Layout

```
┌─────────────────────┬───────────────────────────────────────────┐
│ 🔍 Auditor Panel    │ ⚡ Lead Agent Panel                        │
│                     │                                            │
│ a3f2c1 feat(T3)...  │ Phase: execute-plan                        │
│ b7d891 feat(T4)...  │ Task: 4 of 7 — Implementer dispatched      │
│ c2a445 fix(T4)...   │ Review gates: T1 ✓  T2 ✓  T3 ✓  T4 ⏳    │
│                     │                                            │
├─────────────────────┤ Context: ████████░░ 78%  (amber)           │
│ 🧠 Critic Panel     │ Burn: $0.34/min  ·  Active: 3 agents       │
│                     │ Stall: s4a2 — no activity 47s              │
│ T3 batch: LGTM.     │                                            │
│ Consider extracting │                                            │
│ auth middleware     │                                            │
└─────────────────────┴───────────────────────────────────────────┘
┌──────────────────────────────┬──────────────────────────────────┐
│ 📋 Event Timeline            │ 📊 Live Pulse Chart              │
│ 🚀 SessionStart  s1 [cyan]   │  ████ s1  ██ s2  ████ s3         │
│ 🔧 PreToolUse    s2 [purple] │  ─────────────────────────────   │
│ ✅ PostToolUse   s2 Bash     │  Events/30s per session          │
│ 🟢 SubagentStart s3 [amber]  │                                  │
│ ❌ PostToolFail  s2 Bash     │  [MCP Registry] [Trace View]     │
└──────────────────────────────┴──────────────────────────────────┘
              ⏮ Time-Travel: ─────────────▓──────  14:23:47  [Fork from Here]

                    ┌─────────────────────────────────────┐
                    │ ⚠️ HITL Intercept — session a3f2c1   │
                    │ Tool: Bash                           │
                    │ Command: git push origin main        │
                    │  [✓ Approve]        [✗ Block]        │
                    └─────────────────────────────────────┘
```

---

## Hook Coverage

12 Python scripts intercept every Claude Code lifecycle event and POST to the server. Copy the `.claude/` directory to any project — the server aggregates from multiple projects simultaneously with zero configuration.

| Hook | Event | What It Captures |
|---|---|---|
| `pre_tool_use.py` | PreToolUse 🔧 | Tool inputs + HITL intercept check |
| `post_tool_use.py` | PostToolUse ✅ | Results, token counts, MCP server detection |
| `post_tool_use_failure.py` | PostToolUseFailure ❌ | Failures, interrupt status |
| `permission_request.py` | PermissionRequest 🔐 | Permission requests and suggestions |
| `notification.py` | Notification 🔔 | User interaction events |
| `user_prompt_submit.py` | UserPromptSubmit 💬 | User prompts (with optional blocking) |
| `stop.py` | Stop 🛑 | Session completion (with infinite-loop guard) |
| `subagent_stop.py` | SubagentStop 👥 | Completion + transcript path |
| `subagent_start.py` | SubagentStart 🟢 | Spawn event with parent session ID |
| `pre_compact.py` | PreCompact 📦 | Context compaction with custom instructions |
| `session_start.py` | SessionStart 🚀 | Agent type, model, source project |
| `session_end.py` | SessionEnd 🏁 | End reason tracking |

Hooks are **fire-and-forget**: 1-second network timeout, all failures are silent. Agents are never slowed down or blocked by the observer.

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Hook scripts | Python 3.11+, stdlib only | Zero runtime dependencies — runs anywhere Claude Code runs |
| Server | Bun + TypeScript + Elysia | Built-in SQLite, sub-millisecond startup, native WebSocket |
| Database | SQLite (WAL mode) | Embedded, zero infra, survives process restarts |
| Real-time | WebSocket (native Bun) | Sub-100ms broadcast to all clients with no polling |
| Frontend | Vue 3 + Composition API | Reactive by design, minimal boilerplate |
| State | Pinia | Typed stores, Vue DevTools support |
| Styling | Tailwind CSS | Dark theme, utility-first, no CSS build complexity |
| Build | Vite | Instant HMR, fast cold starts |

**100 tests** across 3 suites: 39 server (Bun test runner), 43 client (Vitest + happy-dom), 18 Python hooks (pytest).

---

## Installation

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- Python 3.11+
- [Claude Code CLI](https://claude.ai/code)
- Git

```bash
git clone https://github.com/your-org/observability-dashboard
cd observability-dashboard
```

### 1. Start the Server

```bash
cd server
bun install
bun run dev
# → Server running on http://localhost:4000
```

### 2. Start the Dashboard

```bash
# In a separate terminal
cd client
bun install
bun run dev
# → Dashboard running on http://localhost:5173
```

### 3. Instrument a Project

Copy the hook scripts to any project you want to monitor:

```bash
cp -r .claude/ /path/to/your-project/.claude/
```

Edit `/path/to/your-project/.claude/settings.json` — at minimum, set `SOURCE_APP`:

```json
{
  "hooks": {
    "PreToolUse":         [{ "type": "command", "command": "python .claude/hooks/pre_tool_use.py" }],
    "PostToolUse":        [{ "type": "command", "command": "python .claude/hooks/post_tool_use.py" }],
    "PostToolUseFailure": [{ "type": "command", "command": "python .claude/hooks/post_tool_use_failure.py" }],
    "PermissionRequest":  [{ "type": "command", "command": "python .claude/hooks/permission_request.py" }],
    "Notification":       [{ "type": "command", "command": "python .claude/hooks/notification.py" }],
    "UserPromptSubmit":   [{ "type": "command", "command": "python .claude/hooks/user_prompt_submit.py" }],
    "Stop":               [{ "type": "command", "command": "python .claude/hooks/stop.py" }],
    "SubagentStop":       [{ "type": "command", "command": "python .claude/hooks/subagent_stop.py" }],
    "SubagentStart":      [{ "type": "command", "command": "python .claude/hooks/subagent_start.py" }],
    "PreCompact":         [{ "type": "command", "command": "python .claude/hooks/pre_compact.py" }],
    "SessionStart":       [{ "type": "command", "command": "python .claude/hooks/session_start.py" }],
    "SessionEnd":         [{ "type": "command", "command": "python .claude/hooks/session_end.py" }]
  },
  "env": {
    "SOURCE_APP": "your-project-name"
  }
}
```

Start Claude Code in your project. Events appear in the dashboard at `http://localhost:5173` immediately.

---

## Configuration

### Server Environment

Create `server/.env` or set these in your shell:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | HTTP/WebSocket server port |
| `TTL_DAYS` | `7` | Days before old events are pruned from SQLite |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed dashboard origin |

### Client Environment

Create `client/.env`:

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000` | Server base URL |
| `VITE_WS_URL` | `ws://localhost:4000/stream` | WebSocket endpoint |

### Hook Scripts (per-project)

Set in the project's environment or `settings.json` under `"env"`:

| Variable | Default | Description |
|---|---|---|
| `OBSERVABILITY_SERVER` | `http://localhost:4000` | Server URL the hooks POST to |
| `SOURCE_APP` | `unknown` | Project name shown in the dashboard |
| `CLAUDE_TAGS` | _(empty)_ | Comma-separated tags, e.g. `feat/auth,sprint-12` |

### Multi-Project Setup

The server aggregates events from any number of instrumented projects simultaneously. Each project sets a unique `SOURCE_APP`. The dashboard's filter panel lets you isolate any one project in a single click.

```
Project A (SOURCE_APP=api-server)   ──┐
Project B (SOURCE_APP=ml-pipeline)  ──┼──▶  :4000  ──▶  :5173
Project C (SOURCE_APP=frontend)     ──┘
```

### HITL Intercept Rules

Configure tool call intercepts via the REST API (UI rule editor coming in v1.1):

```bash
# Gate all git push commands
curl -X POST http://localhost:4000/hitl/rules \
  -H "Content-Type: application/json" \
  -d '{"tool": "Bash", "pattern": "git push", "message": "Review before pushing to remote"}'

# Gate PR creation
curl -X POST http://localhost:4000/hitl/rules \
  -H "Content-Type: application/json" \
  -d '{"tool": "Bash", "pattern": "gh pr create", "message": "Final human review required"}'

# Wildcard across all tools — catch .env access
curl -X POST http://localhost:4000/hitl/rules \
  -H "Content-Type: application/json" \
  -d '{"tool": "*", "pattern": "\\.env", "message": ".env access requires approval"}'

# List active rules
curl http://localhost:4000/hitl/rules

# Remove a rule by ID
curl -X DELETE http://localhost:4000/hitl/rules/<id>
```

Patterns are case-insensitive regex matched against the tool's command input. Multiple rules are evaluated in insertion order; only the first match triggers an intercept.

---

## Running Tests

```bash
# Server (Bun test runner, in-memory SQLite)
cd server && bun test

# Client (Vitest + happy-dom)
cd client && bun run test

# Python hooks (pytest)
python -m pytest .claude/hooks/tests/ -v

# TypeScript type check
cd client && ./node_modules/.bin/vue-tsc --noEmit
```

All 100 tests pass. No mocking of external services — server tests use `:memory:` SQLite; client tests use happy-dom with Pinia.

---

## Project Structure

```
.
├── server/                          # Bun + TypeScript API server
│   ├── src/
│   │   ├── index.ts                 # App entry — route mounting, TTL scheduler
│   │   ├── db.ts                    # SQLite init + schema migrations
│   │   ├── broadcast.ts             # WebSocket client registry + broadcast
│   │   ├── ttl.ts                   # Event pruning (configurable TTL)
│   │   └── routes/
│   │       ├── events.ts            # POST /events, GET /events/recent, /filter-options
│   │       ├── stream.ts            # WS /stream — real-time broadcast
│   │       └── hitl.ts              # HITL rule management + intercept API
│   └── tests/                       # 39 Bun tests
│
├── client/                          # Vue 3 + Vite dashboard
│   └── src/
│       ├── App.vue                  # Root — layout + HitlIntercept + TimeTravelDebugger
│       ├── stores/
│       │   └── events.ts            # Pinia store — ring buffer, filters, rewind state
│       ├── composables/
│       │   ├── useWebSocket.ts      # Auto-reconnect WS + HITL message routing
│       │   ├── useHitl.ts           # HITL intercept state management
│       │   ├── useAgentTree.ts      # Parent-child hierarchy builder
│       │   ├── useContextPressure.ts # Per-session PreCompact tracking
│       │   ├── useStallDetection.ts # 60s silence detection
│       │   ├── useTokenBurn.ts      # Token → $USD cost estimation
│       │   ├── useMcpRegistry.ts    # MCP server auto-discovery
│       │   └── useOrchestration.ts  # Lead agent phase + task tracking
│       ├── components/
│       │   ├── EventTimeline.vue    # Main event feed with auto-scroll
│       │   ├── EventItem.vue        # Single event row with dual-color borders
│       │   ├── FilterPanel.vue      # 4-axis filter (app/session/type/tag)
│       │   ├── PulseChart.vue       # Canvas activity density chart
│       │   ├── TranscriptModal.vue  # Full chat transcript viewer
│       │   ├── HitlIntercept.vue    # Approve/Block overlay UI
│       │   ├── TimeTravelDebugger.vue # Scrubbing slider + Fork from Here
│       │   ├── ContextHeatmap.vue   # Per-session fill gauge (amber/red)
│       │   ├── StallBadge.vue       # Idle agent indicator
│       │   ├── TokenBurnRate.vue    # Cost monitor + alert
│       │   ├── McpRegistryTab.vue   # MCP server list with health metrics
│       │   ├── TraceView.vue        # Agent hierarchy node-link diagram
│       │   ├── TraceNode.vue        # Recursive tree node component
│       │   └── panels/              # Auditor, Critic, Lead, Timeline, Pulse panels
│       └── tests/                   # 43 Vitest tests
│
└── .claude/
    └── hooks/                       # 12 Python lifecycle hook scripts
        ├── utils.py                 # Shared: stdin reader, payload builder, POST
        ├── guard_hook.py            # Security: rm -rf / .env blocking (pre-observer)
        ├── pre_tool_use.py          # HITL intercept check + PreToolUse event
        ├── post_tool_use.py         # PostToolUse + MCP detection + token capture
        └── ...                      # 9 more event-specific hooks
        └── tests/                   # 18 pytest tests
```

---

## Roadmap

**v1.1 — Persistence and alerts**
- HITL rule persistence to SQLite (survive server restarts)
- Configurable burn rate alert webhooks (Slack, email, HTTP)
- HITL rule editor UI in the dashboard

**v1.2 — CI/CD integration**
- Headless mode: structured Markdown summary output for GitHub Actions PR comments
- REST API for querying session data from external tools
- CSV/JSON event export for post-mortem analysis

**v2.0 — Team and cloud**
- Multi-user hosted dashboard (Fly.io / Railway one-command deploy)
- Team-wide aggregation across multiple engineers' sessions
- Role-based HITL: assign intercept approval to specific team members

**Future**
- Adapter layer for LangChain, AutoGPT, and other agent frameworks
- Automated anomaly detection (unusual tool call patterns, cost spikes)
- Mobile-responsive layout for on-call monitoring

---

## Support This Project

Agentic software development is the next shift in how software gets built. The infrastructure layer for governing, auditing, and controlling agent fleets doesn't exist yet — we're building it.

**What your support enables:**
- Full-time development velocity on the roadmap above
- Cloud infrastructure for a hosted multi-user tier
- Documentation, tutorials, and integration guides
- Framework adapters beyond Claude Code (LangChain, AutoGPT, CrewAI)
- Long-term maintenance and Claude Code API compatibility

If this project saves your team time, prevents a costly runaway agent, or helps you ship reliable agentic workflows — consider sponsoring continued development.

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-%E2%9D%A4-red?style=for-the-badge&logo=github)](https://github.com/sponsors/your-org)

---

## Contributing

Issues and pull requests are welcome.

```bash
# Fork the repo, then:
git clone https://github.com/your-org/observability-dashboard
cd observability-dashboard

# Server (auto-reloads on change)
cd server && bun install && bun run dev

# Client (Vite HMR)
cd client && bun install && bun run dev

# Run all tests before submitting
cd server && bun test
cd client && bun run test
python -m pytest .claude/hooks/tests/ -v
```

Commit format: `feat(scope): description` / `fix(scope): description`

Please add tests for any new behavior. See existing test files for patterns.

---

## License

MIT — free to use, modify, and distribute. See [LICENSE](LICENSE).

---

## Acknowledgments

- [Bun](https://bun.sh) — the runtime that makes a zero-config server genuinely pleasant to write
- [Vue 3](https://vuejs.org) — reactivity that just works
- [Claude Code](https://claude.ai/code) — the agent platform this was built to observe (and that built itself)
- Inspired by [disler/multi-agent-observability](https://github.com/disler/multi-agent-observability)

---

*Built with Claude Code. Observed by itself.*
