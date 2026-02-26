#!/usr/bin/env python3
import _base

MCP_PREFIXES = ("mcp__", "mcp_")

def main(data: dict) -> None:
    tool = data.get("tool_name", "")
    _base.post_event(_base.build_payload(
        event_type="PostToolUse",
        session_id=data.get("session_id", "unknown"),
        source_app=data.get("source_app", _base.SOURCE_APP),
        payload={
            "tool": tool,
            "is_mcp": any(tool.startswith(p) for p in MCP_PREFIXES),
            "input": data.get("tool_input", {}),
            "response_summary": str(data.get("tool_response", ""))[:500],
        },
    ))

if __name__ == "__main__":
    main(_base.read_hook_input())
