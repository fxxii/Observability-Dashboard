import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { initDb, getDb } from "./db";
import { unlinkSync, existsSync } from "fs";

const TEST_DB = "./test-db.db";

describe("REQ-2: database", () => {
  beforeEach(() => initDb(TEST_DB));
  afterEach(() => {
    getDb().close();
    [TEST_DB, `${TEST_DB}-wal`, `${TEST_DB}-shm`].forEach(f => existsSync(f) && unlinkSync(f));
  });

  it("creates events table with all required columns", () => {
    const cols = getDb().prepare("PRAGMA table_info(events)").all() as any[];
    const names = cols.map(c => c.name);
    expect(names).toContain("id");
    expect(names).toContain("session_id");
    expect(names).toContain("event_type");
    expect(names).toContain("source_app");
    expect(names).toContain("payload");
    expect(names).toContain("tags");
    expect(names).toContain("parent_session_id");
    expect(names).toContain("trace_id");
    expect(names).toContain("created_at");
  });

  it("WAL mode is enabled", () => {
    const row = getDb().prepare("PRAGMA journal_mode").get() as any;
    expect(row.journal_mode).toBe("wal");
  });

  it("inserts and retrieves an event", () => {
    getDb().prepare(
      `INSERT INTO events (session_id, event_type, source_app, payload, tags) VALUES (?,?,?,?,?)`
    ).run("s1", "SessionStart", "proj", '{"model":"claude"}', '[]');
    const row = getDb().prepare("SELECT * FROM events WHERE session_id = ?").get("s1") as any;
    expect(row.event_type).toBe("SessionStart");
  });
});
