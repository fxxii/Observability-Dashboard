import { describe, it, expect, beforeAll } from 'bun:test'
import { initDb } from '../src/db'
import app from '../src/index'

beforeAll(() => initDb(':memory:'))

describe('HITL API', () => {
  it('GET /hitl/check returns no_intercept for non-matching tool', async () => {
    const res = await app.handle(new Request(
      'http://localhost/hitl/check?tool_name=Read&session_id=s1&command='
    ))
    const body = await res.json()
    expect(body.action).toBe('no_intercept')
  })

  it('GET /hitl/check returns intercept for git push command', async () => {
    await app.handle(new Request('http://localhost/hitl/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'Bash', pattern: 'git push', message: 'Review before pushing' })
    }))
    const res = await app.handle(new Request(
      'http://localhost/hitl/check?tool_name=Bash&session_id=s1&command=git+push+origin+main'
    ))
    const body = await res.json()
    expect(body.action).toBe('intercept')
    expect(body.intercept_id).toBeDefined()
  })

  it('POST /hitl/decision approve resolves the intercept', async () => {
    const checkRes = await app.handle(new Request(
      'http://localhost/hitl/check?tool_name=Bash&session_id=s2&command=git+push'
    ))
    const { intercept_id } = await checkRes.json()

    const decisionRes = await app.handle(new Request('http://localhost/hitl/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intercept_id, decision: 'approve' })
    }))
    expect(decisionRes.status).toBe(200)
    const body = await decisionRes.json()
    expect(body.decision).toBe('approved')
  })

  it('GET /hitl/intercepts/:id returns the intercept with updated status', async () => {
    const checkRes = await app.handle(new Request(
      'http://localhost/hitl/check?tool_name=Bash&session_id=s3&command=git+push'
    ))
    const { intercept_id } = await checkRes.json()

    await app.handle(new Request('http://localhost/hitl/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intercept_id, decision: 'block' })
    }))

    const getRes = await app.handle(new Request(`http://localhost/hitl/intercepts/${intercept_id}`))
    const body = await getRes.json()
    expect(body.status).toBe('blocked')
  })
})
