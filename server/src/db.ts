import { Database } from "bun:sqlite";

let _db: Database | null = null;

export function initDb(path = "./events.db"): void {
  _db = new Database(path);
  _db.run("PRAGMA journal_mode = WAL");
  _db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id        TEXT    NOT NULL,
      event_type        TEXT    NOT NULL,
      source_app        TEXT    NOT NULL DEFAULT 'unknown',
      payload           TEXT    NOT NULL DEFAULT '{}',
      tags              TEXT    NOT NULL DEFAULT '[]',
      parent_session_id TEXT,
      trace_id          TEXT,
      created_at        INTEGER NOT NULL DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER))
    )
  `);
  _db.run("CREATE INDEX IF NOT EXISTS idx_session    ON events(session_id)");
  _db.run("CREATE INDEX IF NOT EXISTS idx_event_type ON events(event_type)");
  _db.run("CREATE INDEX IF NOT EXISTS idx_created_at ON events(created_at)");
  _db.run("CREATE INDEX IF NOT EXISTS idx_source_app ON events(source_app)");
}

export function getDb(): Database {
  if (!_db) throw new Error("DB not initialized — call initDb() first");
  return _db;
}
