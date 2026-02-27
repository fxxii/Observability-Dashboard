import { Elysia } from 'elysia'
import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { getDb } from '../db'
import { broadcast } from '../broadcast'

const REQUIRED_STRING_FIELDS = ['event_type', 'session_id', 'trace_id'] as const

export const eventsRouter = new Elysia()
  .post('/events', ({ body, set }) => {
    const event = body as Record<string, unknown>

    // C1 fix: validate each required field is a non-empty string
    for (const field of REQUIRED_STRING_FIELDS) {
      if (typeof event[field] !== 'string' || !(event[field] as string).trim()) {
        set.status = 400
        return { error: `Missing or invalid required field: ${field}` }
      }
    }

    // I1 fix: validate timestamp
    let timestamp: number
    if (event.timestamp !== undefined) {
      const ts = Number(event.timestamp)
      if (!Number.isFinite(ts) || ts <= 0) {
        set.status = 400
        return { error: 'Invalid timestamp: must be a positive finite number' }
      }
      timestamp = Math.round(ts)
    } else {
      timestamp = Date.now()
    }

    // I2 fix: validate tags is array of strings
    const rawTags = event.tags
    if (rawTags !== undefined && !Array.isArray(rawTags)) {
      set.status = 400
      return { error: 'Invalid tags: must be an array' }
    }
    const tags = Array.isArray(rawTags)
      ? rawTags.filter((t): t is string => typeof t === 'string')
      : []

    // I4 fix: treat string "null" as SQL null
    const parentSessionId =
      typeof event.parent_session_id === 'string' && event.parent_session_id !== 'null'
        ? event.parent_session_id
        : null

    const payloadObj = typeof event.payload === 'object' && event.payload !== null && !Array.isArray(event.payload)
      ? event.payload as Record<string, unknown>
      : {}

    // C2 fix: wrap DB operations in try/catch
    try {
      const db = getDb()
      const stmt = db.prepare(`
        INSERT INTO events
          (event_type, session_id, trace_id, parent_session_id, source_app, tags, payload, timestamp)
        VALUES
          ($event_type, $session_id, $trace_id, $parent_session_id, $source_app, $tags, $payload, $timestamp)
      `)
      const result = stmt.run({
        $event_type:        event.event_type as string,
        $session_id:        event.session_id as string,
        $trace_id:          event.trace_id as string,
        $parent_session_id: parentSessionId,
        $source_app:        typeof event.source_app === 'string' ? event.source_app : 'unknown',
        $tags:              JSON.stringify(tags),
        $payload:           JSON.stringify(payloadObj),
        $timestamp:         timestamp,
      })
      set.status = 201
      broadcast({ id: Number(result.lastInsertRowid), event_type: event.event_type, session_id: event.session_id, trace_id: event.trace_id, parent_session_id: parentSessionId, source_app: typeof event.source_app === 'string' ? event.source_app : 'unknown', tags: JSON.stringify(tags), payload: JSON.stringify(payloadObj), timestamp })
      return { id: Number(result.lastInsertRowid), timestamp }
    } catch (err) {
      set.status = 500
      return { error: `Database error: ${err instanceof Error ? err.message : String(err)}` }
    }
  })
  .get('/events/recent', ({ query, set }) => {
    try {
      const db = getDb()
      const limit  = Math.min(Math.max(0, Math.floor(Number(query.limit)  || 100)), 500)  // also fixes I1
      const offset = Math.max(0, Math.floor(Number(query.offset) || 0))                    // also fixes I1

      const conditions: string[] = []
      const params: Record<string, unknown> = {}

      if (query.source_app) { conditions.push('source_app = $source_app'); params.$source_app = query.source_app }
      if (query.session_id)  { conditions.push('session_id = $session_id');  params.$session_id  = query.session_id }
      if (query.event_type)  { conditions.push('event_type = $event_type');  params.$event_type  = query.event_type }
      if (query.tag) {
        // I2 fix: escape LIKE metacharacters in tag value
        const escapedTag = String(query.tag).replace(/%/g, '\\%').replace(/_/g, '\\_')
        conditions.push("tags LIKE $tag ESCAPE '\\'")
        params.$tag = `%"${escapedTag}"%`
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      const events   = db.query(`SELECT * FROM events ${where} ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`).all(params)
      const totalRow = db.query(`SELECT COUNT(*) as count FROM events ${where}`).get(params) as { count: number }

      return { events, total: totalRow.count, limit, offset }
    } catch (err) {
      set.status = 500
      return { error: `Database error: ${err instanceof Error ? err.message : String(err)}` }
    }
  })
  .get('/events/filter-options', ({ set }) => {
    try {
      const db = getDb()
      const apps     = (db.query('SELECT DISTINCT source_app FROM events ORDER BY source_app').all() as any[]).map(r => r.source_app as string)
      const sessions = (db.query('SELECT DISTINCT session_id FROM events ORDER BY id DESC LIMIT 100').all() as any[]).map(r => r.session_id as string)
      const types    = (db.query('SELECT DISTINCT event_type FROM events ORDER BY event_type').all() as any[]).map(r => r.event_type as string)
      const tagRows  = db.query("SELECT tags FROM events WHERE tags != '[]'").all() as any[]
      const tagSet   = new Set<string>()
      tagRows.forEach(r => {
        try {
          const parsed = JSON.parse(r.tags)
          if (Array.isArray(parsed)) {
            parsed.forEach(t => { if (typeof t === 'string') tagSet.add(t) })
          }
        } catch (e) {
          console.error('[filter-options] Failed to parse tags:', r.tags, e)
        }
      })
      return { apps, sessions, event_types: types, tags: [...tagSet].sort() }
    } catch (err) {
      set.status = 500
      return { error: `Database error: ${err instanceof Error ? err.message : String(err)}` }
    }
  })
  .get('/transcript', async ({ query, set }) => {
    const rawPath = typeof query.path === 'string' ? query.path : ''
    if (!rawPath || !rawPath.startsWith('/')) {
      set.status = 400
      return { error: 'Invalid path' }
    }
    // Canonicalize to prevent path traversal (e.g. /tmp/../../etc/passwd → /etc/passwd)
    const filePath = resolve(rawPath)
    try {
      return await readFile(filePath, 'utf-8')
    } catch (e: unknown) {
      const code = (e as NodeJS.ErrnoException).code
      if (code === 'ENOENT') {
        set.status = 404
        return 'Transcript not found'
      }
      if (code === 'EACCES') {
        set.status = 403
        return 'Access denied'
      }
      set.status = 500
      return 'Failed to read transcript'
    }
  })
