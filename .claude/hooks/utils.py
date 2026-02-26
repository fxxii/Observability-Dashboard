"""
Shared utilities for Claude Code observability hooks.
Each hook imports this module to build and POST events.
"""
import json
import os
import sys
import time
import uuid
from pathlib import Path

# Server URL — override with OBSERVABILITY_SERVER env var
SERVER_URL = os.environ.get("OBSERVABILITY_SERVER", "http://localhost:4000")

# Stop-hook infinite-loop guard
STOP_FLAG_FILE = Path("/tmp/.claude_stop_hook_active")


def is_stop_hook_active() -> bool:
    return STOP_FLAG_FILE.exists()


def mark_stop_hook_active() -> None:
    STOP_FLAG_FILE.touch()


def clear_stop_hook_flag() -> None:
    STOP_FLAG_FILE.unlink(missing_ok=True)


def read_stdin() -> dict:
    """Read and parse JSON from stdin (Claude Code hook input)."""
    try:
        return json.loads(sys.stdin.read())
    except Exception:
        return {}


def build_payload(
    event_type: str,
    raw: dict,
    source_app: str = "unknown",
    tags: list[str] | None = None,
) -> dict:
    """Build a standardized hook event payload."""
    # Fields that belong at the top level, not inside payload
    top_level = {"session_id", "trace_id", "parent_session_id"}
    return {
        "event_type": event_type,
        "session_id": raw.get("session_id", "unknown"),
        "trace_id": raw.get("trace_id") or raw.get("session_id", str(uuid.uuid4())),
        "parent_session_id": raw.get("parent_session_id"),
        "source_app": source_app,
        "tags": tags or [],
        "payload": {k: v for k, v in raw.items() if k not in top_level},
        "timestamp": int(time.time() * 1000),
    }


def post_event(payload: dict) -> None:
    """POST event to observability server. Never raises — observer must not block agent."""
    try:
        import urllib.request
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            f"{SERVER_URL}/events",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=2)
    except Exception:
        pass  # observability failure must never block the agent


def get_source_app() -> str:
    """Read source app name from environment."""
    return os.environ.get("CLAUDE_SOURCE_APP", os.environ.get("SOURCE_APP", "unknown"))


def get_tags() -> list[str]:
    """Read comma-separated tags from environment."""
    raw = os.environ.get("CLAUDE_TAGS", "")
    return [t.strip() for t in raw.split(",") if t.strip()] if raw else []
