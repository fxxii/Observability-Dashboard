import { describe, it, expect, afterAll } from 'bun:test'
import app from '../src/index'

describe('GET /health', () => {
  afterAll(() => app.stop())
  it('returns status ok', async () => {
    const res = await app.handle(new Request('http://localhost/health'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.status).toBe('ok')
  })
})
