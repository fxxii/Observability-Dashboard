import { describe, it, expect } from 'bun:test'
import { writeFileSync } from 'fs'
import app from '../src/index'

describe('GET /transcript', () => {
  it('returns 400 for missing path', async () => {
    const res = await app.handle(new Request('http://localhost/transcript'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for relative path', async () => {
    const res = await app.handle(new Request('http://localhost/transcript?path=relative/path'))
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent file', async () => {
    const res = await app.handle(new Request('http://localhost/transcript?path=/tmp/nonexistent-t18-abc.json'))
    expect(res.status).toBe(404)
  })

  it('returns file contents for valid path', async () => {
    const tmpPath = '/tmp/test-transcript-t18.txt'
    writeFileSync(tmpPath, 'hello transcript')
    const res = await app.handle(new Request(`http://localhost/transcript?path=${encodeURIComponent(tmpPath)}`))
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('hello transcript')
  })
})
