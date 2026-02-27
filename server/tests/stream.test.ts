import { describe, it, expect, afterAll } from 'bun:test'
import { initDb } from '../src/db'
import app from '../src/index'

// Note: Elysia WebSocket tests require the server to be listening.
// We test broadcast indirectly: POST an event and verify the server
// accepted it (broadcast is a side effect we verify via WS connection).

describe('REQ-6.2: WebSocket /stream', () => {
  afterAll(() => app.stop())

  it('REQ-6.2: server accepts WebSocket upgrade at /stream', async () => {
    // Start server on a test port
    const testApp = app.listen(0)  // port 0 = random available port
    const port = (testApp.server?.port) ?? 4001

    const received: unknown[] = []
    const ws = new WebSocket(`ws://localhost:${port}/stream`)

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve()
      ws.onerror = () => reject(new Error('WebSocket connection failed'))
      setTimeout(() => reject(new Error('WS connect timeout')), 3000)
    })

    expect(ws.readyState).toBe(WebSocket.OPEN)
    ws.close()
    testApp.stop()
  })

  it('REQ-6.2: POST /events broadcasts event to connected WebSocket clients', async () => {
    initDb(':memory:')
    const testApp = app.listen(0)
    const port = (testApp.server?.port) ?? 4002

    const received: unknown[] = []
    const ws = new WebSocket(`ws://localhost:${port}/stream`)

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve()
      ws.onerror = () => reject(new Error('WS connect failed'))
      setTimeout(() => reject(new Error('WS timeout')), 3000)
    })

    ws.onmessage = (e: MessageEvent) => { received.push(JSON.parse(e.data)) }

    await fetch(`http://localhost:${port}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'PostToolUse',
        session_id: 'ws-test-session',
        trace_id: 'ws-trace',
        source_app: 'ws-test',
        tags: [],
        payload: { tool_name: 'Bash' }
      })
    })

    // Wait for WS message to arrive
    await new Promise(r => setTimeout(r, 200))
    ws.close()
    testApp.stop()

    expect(received.length).toBeGreaterThan(0)
    expect((received[0] as any).event_type).toBe('PostToolUse')
    expect((received[0] as any).session_id).toBe('ws-test-session')
  })
})
