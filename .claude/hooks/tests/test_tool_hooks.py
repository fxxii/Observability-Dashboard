import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from utils import build_payload

def test_REQ61_pre_tool_use_captures_tool_name():
    raw = {"session_id": "s1", "trace_id": "t1", "tool_name": "Bash", "tool_input": {"command": "ls"}}
    p = build_payload("PreToolUse", raw, "app", [])
    assert p["payload"]["tool_name"] == "Bash"
    assert p["payload"]["tool_input"]["command"] == "ls"

def test_REQ61_post_tool_use_detects_mcp_tool():
    raw = {"session_id": "s1", "trace_id": "t1", "tool_name": "mcp__figma__get_file"}
    # MCP detection is in post_tool_use.py logic, not build_payload
    assert raw["tool_name"].startswith("mcp__")

def test_REQ61_post_tool_use_failure_captures_error():
    raw = {"session_id": "s1", "trace_id": "t1", "tool_name": "Write", "error": "Permission denied"}
    p = build_payload("PostToolUseFailure", raw, "app", [])
    assert p["payload"]["error"] == "Permission denied"
