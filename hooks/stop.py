#!/usr/bin/env python3
import _base

def main(data: dict) -> None:
    if _base.STOP_HOOK_ACTIVE:
        return  # infinite-loop guard
    _base.post_event(_base.build_payload(
        event_type="Stop",
        session_id=data.get("session_id", "unknown"),
        source_app=data.get("source_app", _base.SOURCE_APP),
        payload={"stop_reason": data.get("stop_reason", ""), "transcript_path": data.get("transcript_path", "")},
    ))

if __name__ == "__main__":
    main(_base.read_hook_input())
