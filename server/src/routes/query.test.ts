import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { initDb, getDb } from "../db";
import { handleGetRecent, handleGetFilterOptions } from "./query";
import { unlinkSync, existsSync } from "fs";

const TEST_DB = "./test-query.db";

function seed(session_id: string, event_type: string, source_app: string, tags: string[] = []) {
  getDb().prepare(`INSERT INTO events (session_id, event_type, source_app, payload, tags) VALUES (?,?,?,?,?)`)
    .run(session_id, event_type, source_app, "{}", JSON.stringify(tags));
}

describe("REQ-4: GET /events", () => {
  beforeEach(() => {
    initDb(TEST_DB);
    seed("s1", "SessionStart", "proj-a");
    seed("s1", "PreToolUse", "proj-a", ["v1"]);
    seed("s2", "Stop", "proj-b");
  });
  afterEach(() => {
    getDb().close();
    [TEST_DB, `${TEST_DB}-wal`, `${TEST_DB}-shm`].forEach(f => existsSync(f) && unlinkSync(f));
  });

  it("GET /events/recent returns all events by default", async () => {
    const res = await handleGetRecent(new Request("http://localhost/events/recent"));
    expect(res.status).toBe(200);
    const { events } = await res.json() as any;
    expect(events.length).toBe(3);
  });

  it("filters by source_app", async () => {
    const res = await handleGetRecent(new Request("http://localhost/events/recent?source_app=proj-a"));
    const { events } = await res.json() as any;
    expect(events.length).toBe(2);
    expect(events.every((e: any) => e.source_app === "proj-a")).toBe(true);
  });

  it("filters by event_type", async () => {
    const res = await handleGetRecent(new Request("http://localhost/events/recent?event_type=Stop"));
    const { events } = await res.json() as any;
    expect(events.length).toBe(1);
    expect(events[0].event_type).toBe("Stop");
  });

  it("respects limit param", async () => {
    const res = await handleGetRecent(new Request("http://localhost/events/recent?limit=2"));
    const { events } = await res.json() as any;
    expect(events.length).toBe(2);
  });

  it("GET /events/filter-options returns distinct values", async () => {
    const res = await handleGetFilterOptions(new Request("http://localhost/events/filter-options"));
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.source_apps).toContain("proj-a");
    expect(data.source_apps).toContain("proj-b");
    expect(data.event_types).toContain("SessionStart");
    expect(data.tags).toContain("v1");
  });
});
