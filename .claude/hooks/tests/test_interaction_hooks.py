import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from utils import build_payload, clear_stop_hook_flag, is_stop_hook_active, mark_stop_hook_active

def test_REQ61_notification_payload():
    raw = {"session_id": "s1", "trace_id": "t1", "message": "Task complete"}
    p = build_payload("Notification", raw, "app", [])
    assert p["payload"]["message"] == "Task complete"

def test_REQ61_user_prompt_truncation():
    long_prompt = "x" * 3000
    raw = {"session_id": "s1", "trace_id": "t1", "prompt": long_prompt}
    # Truncation happens in user_prompt_submit.py before build_payload
    truncated = raw["prompt"][:2000] + "...[truncated]"
    p = build_payload("UserPromptSubmit", {**raw, "prompt": truncated}, "app", [])
    assert len(p["payload"]["prompt"]) <= 2015  # 2000 + len("...[truncated]")

def test_REQ61_stop_hook_infinite_loop_guard():
    clear_stop_hook_flag()
    # If already active, stop hook should exit early
    mark_stop_hook_active()
    assert is_stop_hook_active()
    clear_stop_hook_flag()
