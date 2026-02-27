import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from utils import build_payload

def test_REQ61_session_start_payload_includes_model():
    raw = {"session_id": "s1", "trace_id": "t1", "model": "claude-sonnet-4-6", "agent_type": "lead"}
    p = build_payload("SessionStart", raw, "app", ["test"])
    assert p["event_type"] == "SessionStart"
    assert p["payload"]["model"] == "claude-sonnet-4-6"
    assert p["payload"]["agent_type"] == "lead"

def test_REQ61_session_end_payload_includes_end_reason():
    raw = {"session_id": "s2", "trace_id": "t2", "end_reason": "user_requested"}
    p = build_payload("SessionEnd", raw, "app", [])
    assert p["payload"]["end_reason"] == "user_requested"
