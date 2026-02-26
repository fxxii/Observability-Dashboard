import json, sys, io
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).parent))


def test_pre_tool_use():
    """REQ-HOOK: pre_tool_use emits PreToolUse with tool name"""
    import pre_tool_use
    data = {"session_id": "s1", "tool_name": "Bash", "tool_input": {"command": "ls"}}
    with patch("_base.post_event") as mock:
        pre_tool_use.main(data)
    p = mock.call_args[0][0]
    assert p["event_type"] == "PreToolUse"
    assert p["payload"]["tool"] == "Bash"


def test_post_tool_use_detects_mcp():
    """REQ-HOOK: post_tool_use marks MCP tools"""
    import post_tool_use
    data = {"session_id": "s1", "tool_name": "mcp__context7__query-docs", "tool_input": {}}
    with patch("_base.post_event") as mock:
        post_tool_use.main(data)
    p = mock.call_args[0][0]
    assert p["event_type"] == "PostToolUse"
    assert p["payload"]["is_mcp"] is True


def test_post_tool_use_failure():
    """REQ-HOOK: failure hook captures error"""
    import post_tool_use_failure
    data = {"session_id": "s1", "tool_name": "Bash", "error": "permission denied"}
    with patch("_base.post_event") as mock:
        post_tool_use_failure.main(data)
    p = mock.call_args[0][0]
    assert p["event_type"] == "PostToolUseFailure"
    assert "permission denied" in p["payload"]["error"]


def test_pre_compact_captures_tokens():
    """REQ-HOOK: pre_compact emits context_window_tokens"""
    import pre_compact
    data = {"session_id": "s1", "context_window_tokens": 180000}
    with patch("_base.post_event") as mock:
        pre_compact.main(data)
    p = mock.call_args[0][0]
    assert p["event_type"] == "PreCompact"
    assert p["payload"]["context_window_tokens"] == 180000


def test_notification_hook():
    """REQ-HOOK: notification emits Notification"""
    import notification
    data = {"session_id": "s1", "message": "Task done", "title": "Done"}
    with patch("_base.post_event") as mock:
        notification.main(data)
    assert mock.call_args[0][0]["event_type"] == "Notification"


def test_user_prompt_submit():
    """REQ-HOOK: user_prompt_submit truncates long prompts"""
    import user_prompt_submit
    data = {"session_id": "s1", "prompt": "x" * 2000}
    with patch("_base.post_event") as mock:
        user_prompt_submit.main(data)
    p = mock.call_args[0][0]
    assert len(p["payload"]["prompt"]) <= 1000
