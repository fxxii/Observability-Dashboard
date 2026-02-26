import json, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from utils import (
    build_payload, is_stop_hook_active, mark_stop_hook_active,
    clear_stop_hook_flag, get_source_app, get_tags
)

def test_REQ61_build_payload_includes_required_fields():
    raw = {"session_id": "s1", "trace_id": "t1", "tool_name": "Bash"}
    result = build_payload("PreToolUse", raw, source_app="my-app", tags=["feat-x"])
    assert result["event_type"] == "PreToolUse"
    assert result["session_id"] == "s1"
    assert result["trace_id"] == "t1"
    assert result["source_app"] == "my-app"
    assert "feat-x" in result["tags"]
    assert isinstance(result["timestamp"], int)
    assert result["timestamp"] > 0

def test_REQ61_build_payload_puts_extra_fields_in_payload():
    raw = {"session_id": "s1", "trace_id": "t1", "tool_name": "Bash", "command": "ls"}
    result = build_payload("PreToolUse", raw, source_app="app", tags=[])
    assert result["payload"]["tool_name"] == "Bash"
    assert result["payload"]["command"] == "ls"
    # session_id and trace_id should NOT be in payload
    assert "session_id" not in result["payload"]
    assert "trace_id" not in result["payload"]

def test_REQ61_build_payload_preserves_parent_session_id():
    raw = {"session_id": "child", "trace_id": "t1", "parent_session_id": "parent-99"}
    result = build_payload("SubagentStart", raw, source_app="app", tags=[])
    assert result["parent_session_id"] == "parent-99"

def test_REQ61_stop_hook_guard_lifecycle():
    clear_stop_hook_flag()
    assert not is_stop_hook_active()
    mark_stop_hook_active()
    assert is_stop_hook_active()
    clear_stop_hook_flag()
    assert not is_stop_hook_active()

def test_REQ61_get_source_app_reads_env(monkeypatch):
    monkeypatch.setenv("CLAUDE_SOURCE_APP", "test-project")
    assert get_source_app() == "test-project"

def test_REQ61_get_tags_parses_comma_list(monkeypatch):
    monkeypatch.setenv("CLAUDE_TAGS", "tag-a, tag-b, tag-c")
    tags = get_tags()
    assert "tag-a" in tags
    assert "tag-b" in tags
    assert "tag-c" in tags

def test_REQ61_get_tags_returns_empty_when_unset(monkeypatch):
    monkeypatch.delenv("CLAUDE_TAGS", raising=False)
    assert get_tags() == []
