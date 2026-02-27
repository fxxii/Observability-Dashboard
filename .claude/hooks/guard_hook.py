#!/usr/bin/env python3
"""
Security guard hook — runs BEFORE observability hooks via PreToolUse.
Blocks dangerous operations. Posts a GuardBlock event for audit.
Never import from utils using uv inline script metadata —
this script must run with system python3 for speed.
"""
import json
import re
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import read_stdin, build_payload, post_event, get_source_app, get_tags

BLOCKED_COMMAND_PATTERNS = [
    r"rm\s+-rf\s+/",
    r"rm\s+-rf\s+~",
    r">\s*/dev/sd",
    r"mkfs\.",
    r"dd\s+if=",
]

BLOCKED_FILE_PATTERNS = [
    r"\.env$",
    r"\.pem$",
    r"\.key$",
    r"id_rsa",
    r"id_ed25519",
    r"credentials\.json$",
]


def main() -> None:
    raw = read_stdin()
    tool_name = raw.get("tool_name", "")
    tool_input = raw.get("tool_input", {}) or {}
    command = tool_input.get("command", "") if isinstance(tool_input, dict) else ""
    file_path = tool_input.get("path", "") if isinstance(tool_input, dict) else ""

    block_reason: str | None = None
    for pattern in BLOCKED_COMMAND_PATTERNS:
        if re.search(pattern, command):
            block_reason = f"Blocked dangerous command pattern: {pattern!r}"
            break

    if not block_reason:
        for pattern in BLOCKED_FILE_PATTERNS:
            if re.search(pattern, file_path):
                block_reason = f"Blocked access to sensitive file: {file_path!r}"
                break

    if block_reason:
        payload = build_payload("GuardBlock", raw, get_source_app(), get_tags())
        payload["payload"]["block_reason"] = block_reason
        post_event(payload)
        print(json.dumps({"type": "deny_tool", "message": block_reason}))
        sys.exit(0)


if __name__ == "__main__":
    main()
