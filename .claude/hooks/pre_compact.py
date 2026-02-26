#!/usr/bin/env python3
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import read_stdin, build_payload, post_event, get_source_app, get_tags

COMPACT_INSTRUCTIONS = """When compacting, preserve:
1. The current plan file path and active task number
2. Any failing tests and their error messages
3. Completed task IDs and any explicit user constraints"""

def main():
    raw = read_stdin()
    payload = build_payload("PreCompact", raw, get_source_app(), get_tags())
    post_event(payload)
    print(json.dumps({"custom_instructions": COMPACT_INSTRUCTIONS}))

if __name__ == "__main__":
    main()
