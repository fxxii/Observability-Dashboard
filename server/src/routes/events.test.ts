import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { initDb, getDb } from "../db";
import { handlePostEvent } from "./events";
import { unlinkSync, existsSync } from "fs";

const TEST_DB = "./test-post.db";

describe("REQ-3: POST /events", () => {
  beforeEach(() => initDb(TEST_DB));
  afterEach(() => {
    getDb().close();
    [TEST_DB, `${TEST_DB}-wal`, `${TEST_DB}-shm`].forEach(f => existsSync(f) && unlinkSync(f));
  });

  it("accepts valid event and returns 201 with id", async () => {
    const req = new Request("http://localhost:4000/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: "s1", event_type: "SessionStart", source_app: "proj", payload: { model: "claude" } }),
    });
    const res = await handlePostEvent(req);
    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.id).toBeDefined();
  });

  it("rejects missing session_id with 400", async () => {
    const req = new Request("http://localhost:4000/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: "SessionStart" }),
    });
    const res = await handlePostEvent(req);
    expect(res.status).toBe(400);
  });

  it("rejects missing event_type with 400", async () => {
    const req = new Request("http://localhost:4000/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: "s1" }),
    });
    const res = await handlePostEvent(req);
    expect(res.status).toBe(400);
  });

  it("stores event in database with correct fields", async () => {
    const req = new Request("http://localhost:4000/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: "s-store", event_type: "PreToolUse", source_app: "p",
        payload: { tool: "Bash" }, tags: ["v1"], parent_session_id: "parent-1"
      }),
    });
    await handlePostEvent(req);
    const row = getDb().prepare("SELECT * FROM events WHERE session_id = ?").get("s-store") as any;
    expect(row).toBeDefined();
    expect(JSON.parse(row.payload).tool).toBe("Bash");
    expect(JSON.parse(row.tags)).toContain("v1");
    expect(row.parent_session_id).toBe("parent-1");
  });
});
