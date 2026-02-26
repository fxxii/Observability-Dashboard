#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import read_stdin, build_payload, post_event, get_source_app, get_tags

def main():
    raw = read_stdin()
    payload = build_payload("PostToolUseFailure", raw, get_source_app(), get_tags())
    post_event(payload)

if __name__ == "__main__":
    main()
