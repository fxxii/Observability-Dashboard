#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import read_stdin, build_payload, post_event, get_source_app, get_tags

MAX_PROMPT_LEN = 2000

def main():
    raw = read_stdin()
    if isinstance(raw.get("prompt"), str) and len(raw["prompt"]) > MAX_PROMPT_LEN:
        raw = {**raw, "prompt": raw["prompt"][:MAX_PROMPT_LEN] + "...[truncated]"}
    payload = build_payload("UserPromptSubmit", raw, get_source_app(), get_tags())
    post_event(payload)

if __name__ == "__main__":
    main()
