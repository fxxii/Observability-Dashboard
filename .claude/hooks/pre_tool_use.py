#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import read_stdin, build_payload, post_event, get_source_app, get_tags, SERVER_URL

def check_hitl(raw: dict) -> None:
    """Poll HITL intercept API. If intercepted, wait for decision then deny if blocked."""
    try:
        import json as _json
        import time as _time
        import urllib.request as _urlreq
        import urllib.parse as _urlparse

        _tool_name = raw.get("tool_name", "")
        _tool_input = raw.get("tool_input", {}) or {}
        _command = _tool_input.get("command", "") if isinstance(_tool_input, dict) else ""

        _params = _urlparse.urlencode({
            "tool_name": _tool_name,
            "session_id": raw.get("session_id", ""),
            "command": str(_command)[:500],
        })

        _req = _urlreq.Request(f"{SERVER_URL}/hitl/check?{_params}")
        with _urlreq.urlopen(_req, timeout=1) as _resp:
            _check = _json.loads(_resp.read())

        if _check.get("action") != "intercept":
            return  # no rule matched, let tool proceed

        _intercept_id = _check["intercept_id"]
        _status = "pending"

        # Poll for up to 60 seconds for a human decision
        for _ in range(60):
            _time.sleep(1)
            try:
                _ireq = _urlreq.Request(f"{SERVER_URL}/hitl/intercepts/{_intercept_id}")
                with _urlreq.urlopen(_ireq, timeout=1) as _iresp:
                    _raw = _iresp.read()
                try:
                    _intercept_data = _json.loads(_raw)
                    _status = _intercept_data.get("status", "pending")
                    if _status != "pending":
                        break
                except (_json.JSONDecodeError, AttributeError):
                    # Malformed response — keep waiting, do not auto-approve
                    continue
            except Exception:
                # Network/timeout error — server unreachable, stop waiting and let tool proceed
                break

        # Deny only if explicitly blocked; timeout or approval lets tool proceed
        if _status == "blocked":
            print(_json.dumps({"type": "deny_tool", "message": _check.get("message", "Blocked by HITL")}))
            sys.exit(0)

    except Exception:
        pass  # HITL failure must never block the agent

def main():
    raw = read_stdin()
    check_hitl(raw)
    payload = build_payload("PreToolUse", raw, get_source_app(), get_tags())
    post_event(payload)

if __name__ == "__main__":
    main()
