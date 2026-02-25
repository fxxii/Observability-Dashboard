import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { initDb, getDb } from "./db";
import { pruneOldEvents } from "./pruner";
import { unlinkSync, existsSync } from "fs";

const TEST_DB = "./test-prune.db";

describe("REQ-5: TTL pruner", () => {
  beforeEach(() => initDb(TEST_DB));
  afterEach(() => {
    getDb().close();
    [TEST_DB, `${TEST_DB}-wal`, `${TEST_DB}-shm`].forEach(f => existsSync(f) && unlinkSync(f));
  });

  it("deletes events older than TTL", () => {
    const old_ts = Date.now() - 8 * 24 * 60 * 60 * 1000;
    getDb().prepare("INSERT INTO events (session_id, event_type, source_app, payload, tags, created_at) VALUES (?,?,?,?,?,?)")
      .run("old", "Stop", "app", "{}", "[]", old_ts);
    getDb().prepare("INSERT INTO events (session_id, event_type, source_app, payload, tags) VALUES (?,?,?,?,?)")
      .run("new", "SessionStart", "app", "{}", "[]");
    pruneOldEvents(7);
    const rows = getDb().prepare("SELECT * FROM events").all() as any[];
    expect(rows.length).toBe(1);
    expect(rows[0].session_id).toBe("new");
  });

  it("keeps all events within TTL", () => {
    getDb().prepare("INSERT INTO events (session_id, event_type, source_app, payload, tags) VALUES (?,?,?,?,?)")
      .run("s1", "Stop", "app", "{}", "[]");
    pruneOldEvents(7);
    const count = (getDb().prepare("SELECT COUNT(*) as c FROM events").get() as any).c;
    expect(count).toBe(1);
  });
});
