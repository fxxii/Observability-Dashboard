import { Elysia } from 'elysia'
import { getDb } from '../db'

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
      return { id: Number(result.lastInsertRowid), timestamp }
    } catch (err) {
      set.status = 500
      return { error: `Database error: ${err instanceof Error ? err.message : String(err)}` }
    }
  })
