import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from utils import build_payload

def test_REQ61_subagent_start_captures_parent_session_id():
    raw = {"session_id": "child-1", "trace_id": "t1", "parent_session_id": "parent-99"}
    p = build_payload("SubagentStart", raw, "app", [])
    assert p["parent_session_id"] == "parent-99"

def test_REQ61_subagent_stop_captures_transcript_path():
    raw = {"session_id": "child-1", "trace_id": "t1", "transcript_path": "/tmp/t.json"}
    p = build_payload("SubagentStop", raw, "app", [])
    assert p["payload"]["transcript_path"] == "/tmp/t.json"

def test_REQ61_pre_compact_event_type():
    raw = {"session_id": "s1", "trace_id": "t1"}
    p = build_payload("PreCompact", raw, "app", [])
    assert p["event_type"] == "PreCompact"
