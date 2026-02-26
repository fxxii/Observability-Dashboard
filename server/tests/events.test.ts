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
})
