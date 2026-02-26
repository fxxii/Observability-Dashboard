import { describe, it, expect, beforeAll } from 'bun:test'
import { initDb } from '../src/db'
import app from '../src/index'

beforeAll(() => initDb(':memory:'))

describe('REQ-6.2: POST /events', () => {
  it('REQ-6.2: stores valid event and returns 201 with id', async () => {
    const event = {
      event_type: 'SessionStart',
      session_id: 'sess-123',
      trace_id: 'trace-abc',
      source_app: 'test-app',
      tags: ['test'],
      payload: { model: 'claude-sonnet-4-6' }
    }
    const res = await app.handle(new Request('http://localhost/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(typeof body.id).toBe('number')
    expect(typeof body.timestamp).toBe('number')
  })

  it('REQ-6.2: returns 400 for missing event_type', async () => {
    const res = await app.handle(new Request('http://localhost/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: 'x', trace_id: 'y' })
    }))
    expect(res.status).toBe(400)
  })

  it('REQ-6.2: returns 400 for missing session_id', async () => {
    const res = await app.handle(new Request('http://localhost/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'Stop', trace_id: 'y' })
    }))
    expect(res.status).toBe(400)
  })

  it('REQ-6.2: returns 400 for missing trace_id', async () => {
    const res = await app.handle(new Request('http://localhost/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'Stop', session_id: 'x' })
    }))
    expect(res.status).toBe(400)
  })

  it('REQ-6.2: auto-sets timestamp when not provided', async () => {
    const before = Date.now()
    const res = await app.handle(new Request('http://localhost/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'Stop', session_id: 'sess-456', trace_id: 'trace-def',
        source_app: 'test', tags: [], payload: {}
      })
    }))
    const body = await res.json()
    expect(body.timestamp).toBeGreaterThanOrEqual(before)
  })

  it('REQ-6.2: stores parent_session_id when provided', async () => {
    const res = await app.handle(new Request('http://localhost/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'SubagentStart', session_id: 'child-1', trace_id: 'trace-1',
        parent_session_id: 'parent-99', source_app: 'test', tags: [], payload: {}
      })
    }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(typeof body.id).toBe('number')
  })

  it('REQ-6.2: returns 400 for invalid tags (non-array)', async () => {
    const res = await app.handle(new Request('http://localhost/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'Stop', session_id: 's1', trace_id: 't1', tags: 'not-an-array' })
    }))
    expect(res.status).toBe(400)
  })

  it('REQ-6.2: returns 400 for invalid timestamp', async () => {
    const res = await app.handle(new Request('http://localhost/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'Stop', session_id: 's1', trace_id: 't1', timestamp: -1 })
    }))
    expect(res.status).toBe(400)
  })
})

describe('REQ-6.2: GET /events/recent', () => {
  it('REQ-6.2: returns events newest-first with total count', async () => {
    const res = await app.handle(new Request('http://localhost/events/recent'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.events)).toBe(true)
    expect(typeof body.total).toBe('number')
    expect(typeof body.limit).toBe('number')
    expect(typeof body.offset).toBe('number')
  })

  it('REQ-6.2: filters by source_app', async () => {
    // seed a unique app
    await app.handle(new Request('http://localhost/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'SessionStart', session_id: 'filter-sess', trace_id: 'filter-trace', source_app: 'unique-app-xyz', tags: [], payload: {} })
    }))
    const res = await app.handle(new Request('http://localhost/events/recent?source_app=unique-app-xyz'))
    const body = await res.json()
    expect(body.events.every((e: any) => e.source_app === 'unique-app-xyz')).toBe(true)
    expect(body.events.length).toBeGreaterThan(0)
  })

  it('REQ-6.2: filters by event_type', async () => {
    const res = await app.handle(new Request('http://localhost/events/recent?event_type=SessionStart'))
    const body = await res.json()
    expect(body.events.every((e: any) => e.event_type === 'SessionStart')).toBe(true)
  })

  it('REQ-6.2: filters by session_id', async () => {
    const res = await app.handle(new Request('http://localhost/events/recent?session_id=sess-123'))
    const body = await res.json()
    expect(body.events.every((e: any) => e.session_id === 'sess-123')).toBe(true)
  })

  it('REQ-6.2: respects limit parameter (max 500)', async () => {
    const res = await app.handle(new Request('http://localhost/events/recent?limit=2'))
    const body = await res.json()
    expect(body.events.length).toBeLessThanOrEqual(2)
    expect(body.limit).toBe(2)
  })

  it('REQ-6.2: clamps limit to 500 max', async () => {
    const res = await app.handle(new Request('http://localhost/events/recent?limit=9999'))
    const body = await res.json()
    expect(body.limit).toBe(500)
  })

  it('REQ-6.2: filters by tag', async () => {
    await app.handle(new Request('http://localhost/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'Notification', session_id: 'tag-sess', trace_id: 'tag-trace', source_app: 'tag-app', tags: ['my-tag'], payload: {} })
    }))
    const res = await app.handle(new Request('http://localhost/events/recent?tag=my-tag'))
    const body = await res.json()
    expect(body.events.length).toBeGreaterThan(0)
    const tags = body.events.map((e: any) => JSON.parse(e.tags)).flat()
    expect(tags).toContain('my-tag')
  })

  it('REQ-6.2: offset paginates results', async () => {
    const res1 = await app.handle(new Request('http://localhost/events/recent?limit=1&offset=0'))
    const res2 = await app.handle(new Request('http://localhost/events/recent?limit=1&offset=1'))
    const body1 = await res1.json()
    const body2 = await res2.json()
    expect(body1.events.length).toBe(1)
    expect(body2.events.length).toBe(1)
    expect(body1.events[0].id).not.toBe(body2.events[0].id)
  })
})

describe('REQ-6.2: GET /events/filter-options', () => {
  it('REQ-6.2: returns distinct apps, sessions, event_types, tags', async () => {
    const res = await app.handle(new Request('http://localhost/events/filter-options'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.apps)).toBe(true)
    expect(Array.isArray(body.sessions)).toBe(true)
    expect(Array.isArray(body.event_types)).toBe(true)
    expect(Array.isArray(body.tags)).toBe(true)
  })

  it('REQ-6.2: filter-options includes seeded app', async () => {
    const res = await app.handle(new Request('http://localhost/events/filter-options'))
    const body = await res.json()
    expect(body.apps).toContain('unique-app-xyz')
  })
})
