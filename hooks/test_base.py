import json
import sys
import io
import os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from _base import build_payload, read_hook_input, OBS_SERVER

def test_obs_server_default_url():
    """REQ-HOOK: default server URL"""
    assert OBS_SERVER == "http://localhost:4000"

def test_build_payload_required_fields():
    """REQ-HOOK: all required fields present"""
    p = build_payload(event_type="SessionStart", session_id="s1", source_app="proj")
    assert p["event_type"] == "SessionStart"
    assert p["session_id"] == "s1"
    assert p["source_app"] == "proj"
    assert isinstance(p["tags"], list)
    assert p["payload"] == {}

def test_build_payload_optional_defaults():
    """REQ-HOOK: optional fields default to None"""
    p = build_payload(event_type="Stop", session_id="s", source_app="app")
    assert p["parent_session_id"] is None
    assert p["trace_id"] is None

def test_build_payload_tags_from_env(monkeypatch):
    """REQ-HOOK: tags read from HOOK_TAGS env var"""
    monkeypatch.setenv("HOOK_TAGS", '["feat-x","v2"]')
    p = build_payload(event_type="Stop", session_id="s", source_app="app")
    assert "feat-x" in p["tags"]
    assert "v2" in p["tags"]

def test_read_hook_input_parses_json(monkeypatch):
    """REQ-HOOK: reads JSON from stdin"""
    monkeypatch.setattr(sys, "stdin", io.StringIO('{"session_id":"abc","hook_event_name":"Stop"}'))
    data = read_hook_input()
    assert data["session_id"] == "abc"

def test_post_event_silent_on_failure():
    """REQ-HOOK: post_event never raises even if server is down"""
    from _base import post_event
    import os
    os.environ["OBS_SERVER"] = "http://localhost:1"  # nothing listening
    try:
        post_event(build_payload(event_type="Stop", session_id="s", source_app="app"))
    finally:
        del os.environ["OBS_SERVER"]
