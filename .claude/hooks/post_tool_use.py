#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import read_stdin, build_payload, post_event, get_source_app, get_tags

MCP_PREFIXES = ("mcp__", "mcp_")

def main():
    raw = read_stdin()
    payload = build_payload("PostToolUse", raw, get_source_app(), get_tags())
    tool_name = raw.get("tool_name", "")
    is_mcp = any(tool_name.startswith(p) for p in MCP_PREFIXES)
    payload["payload"]["is_mcp_tool"] = is_mcp
    if is_mcp:
        parts = tool_name.split("__")
        payload["payload"]["mcp_server"] = parts[1] if len(parts) > 1 else "unknown"
    post_event(payload)

if __name__ == "__main__":
    main()
