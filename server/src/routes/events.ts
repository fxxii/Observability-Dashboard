import { Elysia } from 'elysia'
import { getDb } from '../db'

export const eventsRouter = new Elysia()
  .post('/events', ({ body, set }) => {
    const event = body as Record<string, unknown>

    if (!event.event_type || !event.session_id || !event.trace_id) {
      set.status = 400
      return { error: 'Missing required fields: event_type, session_id, trace_id' }
    }

    const db = getDb()
    const timestamp = (event.timestamp as number) ?? Date.now()

    const stmt = db.prepare(`
      INSERT INTO events
        (event_type, session_id, trace_id, parent_session_id, source_app, tags, payload, timestamp)
      VALUES
        ($event_type, $session_id, $trace_id, $parent_session_id, $source_app, $tags, $payload, $timestamp)
    `)

    const result = stmt.run({
      $event_type:        String(event.event_type),
      $session_id:        String(event.session_id),
      $trace_id:          String(event.trace_id),
      $parent_session_id: event.parent_session_id ? String(event.parent_session_id) : null,
      $source_app:        String(event.source_app ?? 'unknown'),
      $tags:              JSON.stringify(event.tags ?? []),
      $payload:           JSON.stringify(event.payload ?? {}),
      $timestamp:         timestamp,
    })

    set.status = 201
    return { id: Number(result.lastInsertRowid), timestamp }
  })
