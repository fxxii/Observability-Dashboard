import { describe, it, expect, beforeEach } from 'bun:test'
import { initDb, getDb } from '../src/db'
import { runTtlCleanup } from '../src/ttl'

function seedEvent(db: ReturnType<typeof getDb>, timestampMs: number, sessionId = 'test-sess') {
  db.run(
    'INSERT INTO events (event_type, session_id, trace_id, source_app, tags, payload, timestamp) VALUES (?,?,?,?,?,?,?)',
    ['SessionStart', sessionId, 'trace-1', 'test', '[]', '{}', timestampMs]
  )
}

describe('REQ-6.2: TTL cleanup', () => {
  beforeEach(() => initDb(':memory:'))

  it('REQ-6.2: deletes events older than TTL window', () => {
    const db = getDb()
    const oldTs = Date.now() - 8 * 24 * 60 * 60 * 1000  // 8 days ago
    seedEvent(db, oldTs, 'old-sess')

    const before = (db.query('SELECT COUNT(*) as c FROM events').get() as any).c
    expect(before).toBe(1)

    runTtlCleanup(7)

    const after = (db.query('SELECT COUNT(*) as c FROM events').get() as any).c
    expect(after).toBe(0)
  })

  it('REQ-6.2: keeps events within TTL window', () => {
    const db = getDb()
    const recentTs = Date.now() - 3 * 24 * 60 * 60 * 1000  // 3 days ago
    seedEvent(db, recentTs, 'recent-sess')

    runTtlCleanup(7)

    const rows = db.query("SELECT * FROM events WHERE session_id = 'recent-sess'").all()
    expect(rows.length).toBe(1)
  })

  it('REQ-6.2: deletes only old events when mixed', () => {
    const db = getDb()
    seedEvent(db, Date.now() - 10 * 24 * 60 * 60 * 1000, 'old')   // 10 days old
    seedEvent(db, Date.now() - 2  * 24 * 60 * 60 * 1000, 'new')   // 2 days old

    runTtlCleanup(7)

    const remaining = db.query('SELECT session_id FROM events').all() as any[]
    expect(remaining.map(r => r.session_id)).toContain('new')
    expect(remaining.map(r => r.session_id)).not.toContain('old')
  })

  it('REQ-6.2: returns count of deleted events', () => {
    const db = getDb()
    seedEvent(db, Date.now() - 9 * 24 * 60 * 60 * 1000, 'del-1')
    seedEvent(db, Date.now() - 9 * 24 * 60 * 60 * 1000, 'del-2')

    const deleted = runTtlCleanup(7)
    expect(deleted).toBe(2)
  })

  it('REQ-6.2: returns 0 when nothing to delete', () => {
    const db = getDb()
    seedEvent(db, Date.now() - 1 * 24 * 60 * 60 * 1000, 'fresh')

    const deleted = runTtlCleanup(7)
    expect(deleted).toBe(0)
  })
})
