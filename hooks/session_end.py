#!/usr/bin/env python3
import _base

def main(data: dict) -> None:
    _base.post_event(_base.build_payload(
        event_type="SessionEnd",
        session_id=data.get("session_id", "unknown"),
        source_app=data.get("source_app", _base.SOURCE_APP),
        payload={"end_reason": data.get("end_reason", "")},
    ))

if __name__ == "__main__":
    main(_base.read_hook_input())
