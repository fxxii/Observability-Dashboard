import json, sys, io, importlib
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).parent))


def test_session_start_posts_correct_event():
    """REQ-HOOK: session_start emits SessionStart"""
    import session_start
    data = {"session_id": "s1", "model": "claude-sonnet-4-6"}
    with patch("_base.post_event") as mock:
        session_start.main(data)
    p = mock.call_args[0][0]
    assert p["event_type"] == "SessionStart"
    assert p["session_id"] == "s1"
    assert p["payload"]["model"] == "claude-sonnet-4-6"


def test_stop_hook_posts_stop_event():
    """REQ-HOOK: stop emits Stop"""
    import stop
    data = {"session_id": "s2", "stop_reason": "end_turn"}
    with patch("_base.post_event") as mock:
        stop.main(data)
    assert mock.call_args[0][0]["event_type"] == "Stop"


def test_subagent_start_captures_parent_session():
    """REQ-HOOK: subagent_start captures parent_session_id for trace hierarchy"""
    import subagent_start
    data = {"session_id": "child-1", "parent_session_id": "parent-abc"}
    with patch("_base.post_event") as mock:
        subagent_start.main(data)
    p = mock.call_args[0][0]
    assert p["event_type"] == "SubagentStart"
    assert p["parent_session_id"] == "parent-abc"


def test_subagent_stop_posts_event():
    """REQ-HOOK: subagent_stop emits SubagentStop"""
    import subagent_stop
    data = {"session_id": "c1", "transcript_path": "/tmp/t.json"}
    with patch("_base.post_event") as mock:
        subagent_stop.main(data)
    assert mock.call_args[0][0]["event_type"] == "SubagentStop"
