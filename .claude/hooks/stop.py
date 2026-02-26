#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import (read_stdin, build_payload, post_event, get_source_app,
                   get_tags, is_stop_hook_active, mark_stop_hook_active, clear_stop_hook_flag)

def main():
    if is_stop_hook_active():
        sys.exit(0)  # infinite-loop guard
    mark_stop_hook_active()
    try:
        raw = read_stdin()
        payload = build_payload("Stop", raw, get_source_app(), get_tags())
        post_event(payload)
    finally:
        clear_stop_hook_flag()

if __name__ == "__main__":
    main()
