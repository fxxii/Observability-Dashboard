import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { initDb, getDb, _resetDbForTesting } from '../src/db'
import { unlinkSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('REQ-6.2: database', () => {
  beforeEach(() => initDb(':memory:'))

  it('REQ-6.2: creates events table', () => {
    const db = getDb()
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all() as any[]
    expect(tables.map(t => t.name)).toContain('events')
  })

  it('REQ-6.2: enables WAL mode', () => {
    // WAL mode requires a file-based database; :memory: always reports 'memory'
    const tmpPath = join(tmpdir(), `test-wal-${Date.now()}.sqlite`)
    try {
      initDb(tmpPath)
      const db = getDb()
      const result = db.query('PRAGMA journal_mode').get() as any
      expect(result.journal_mode).toBe('wal')
    } finally {
      if (existsSync(tmpPath)) unlinkSync(tmpPath)
      if (existsSync(tmpPath + '-wal')) unlinkSync(tmpPath + '-wal')
      if (existsSync(tmpPath + '-shm')) unlinkSync(tmpPath + '-shm')
    }
  })

  it('REQ-6.2: events table has required columns', () => {
    const db = getDb()
    const cols = db.query('PRAGMA table_info(events)').all() as any[]
    const names = cols.map(c => c.name)
    expect(names).toContain('id')
    expect(names).toContain('event_type')
    expect(names).toContain('session_id')
    expect(names).toContain('trace_id')
    expect(names).toContain('parent_session_id')
    expect(names).toContain('source_app')
    expect(names).toContain('tags')
    expect(names).toContain('payload')
    expect(names).toContain('timestamp')
  })

  it('REQ-6.2: getDb throws if called before initDb', () => {
    _resetDbForTesting()
    expect(() => getDb()).toThrow('DB not initialized')
    // Re-initialize for subsequent tests
    initDb(':memory:')
  })
})
