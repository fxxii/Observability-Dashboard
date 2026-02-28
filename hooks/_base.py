"""Shared base utilities for observability hook scripts."""
from __future__ import annotations

import json
import os
import sys
import urllib.request
import urllib.error
from typing import Any

OBS_SERVER = os.environ.get("OBS_SERVER", "http://localhost:4000")
SOURCE_APP = os.environ.get("CLAUDE_SOURCE_APP", "unknown")
STOP_HOOK_ACTIVE = os.environ.get("STOP_HOOK_ACTIVE", "").lower() in ("1", "true")


def read_hook_input() -> dict[str, Any]:
    """Read and parse JSON from stdin."""
    try:
        return json.loads(sys.stdin.read())
    except (json.JSONDecodeError, EOFError):
        return {}


def build_payload(
    *,
    event_type: str,
    session_id: str,
    source_app: str,
    payload: dict[str, Any] | None = None,
    parent_session_id: str | None = None,
    trace_id: str | None = None,
) -> dict[str, Any]:
    """Build the event dict for POST /events."""
    try:
        tags = json.loads(os.environ.get("HOOK_TAGS", "[]"))
    except json.JSONDecodeError:
        tags = []
    return {
        "event_type": event_type,
        "session_id": session_id,
        "source_app": source_app,
        "payload": payload or {},
        "tags": tags,
        "parent_session_id": parent_session_id,
        "trace_id": trace_id or session_id,
    }


def post_event(payload: dict[str, Any]) -> None:
    """POST event to server. Silent on failure — never blocks the agent."""
    if STOP_HOOK_ACTIVE:
        return
    server = os.environ.get("OBS_SERVER", OBS_SERVER)
    try:
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            f"{server}/events",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=1.0):
            pass
    except Exception:
        pass
