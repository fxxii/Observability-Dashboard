import { Database } from 'bun:sqlite'

let db: Database

export function initDb(path = 'data.sqlite') {
  db = new Database(path, { create: true })
  db.exec('PRAGMA journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type        TEXT    NOT NULL,
      session_id        TEXT    NOT NULL,
      trace_id          TEXT    NOT NULL,
      parent_session_id TEXT,
      source_app        TEXT    NOT NULL DEFAULT 'unknown',
      tags              TEXT    NOT NULL DEFAULT '[]',
      payload           TEXT    NOT NULL DEFAULT '{}',
      timestamp         INTEGER NOT NULL
    )
  `)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_session   ON events(session_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_type      ON events(event_type)`)
}

export function getDb(): Database {
  if (!db) throw new Error('DB not initialized — call initDb() first')
  return db
}

/** For testing only — resets the db instance so getDb() throws again */
export function _resetDbForTesting() {
  db = undefined as unknown as Database
}
