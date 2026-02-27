import { Elysia } from 'elysia'
import { randomUUID } from 'crypto'
import { broadcast } from '../broadcast'

interface HitlRule { id: string; tool: string; pattern: string; message: string }
interface HitlIntercept { id: string; session_id: string; tool_name: string; command: string; rule_id: string; status: 'pending' | 'approved' | 'blocked'; created_at: number }

// In-memory store (intentionally module-level for cross-request state)
const rules: HitlRule[] = []
const intercepts = new Map<string, HitlIntercept>()

export const hitlRouter = new Elysia()
  .post('/hitl/rules', ({ body, set }) => {
    const b = body as Record<string, unknown>
    const rule: HitlRule = {
      id: randomUUID(),
      tool: String(b.tool ?? '*'),
      pattern: String(b.pattern ?? ''),
      message: String(b.message ?? 'Approval required'),
    }
    rules.push(rule)
    set.status = 201
    return rule
  })
  .get('/hitl/rules', () => rules)
  .delete('/hitl/rules/:id', ({ params, set }) => {
    const idx = rules.findIndex(r => r.id === params.id)
    if (idx === -1) { set.status = 404; return { error: 'Rule not found' } }
    rules.splice(idx, 1)
    return { deleted: params.id }
  })

  // Check endpoint — called by pre_tool_use.py hook before allowing tool execution
  .get('/hitl/check', ({ query }) => {
    const toolName = String(query.tool_name ?? '')
    const sessionId = String(query.session_id ?? '')
    const command = String(query.command ?? '')

    const matchedRule = rules.find(r => {
      if (r.tool !== toolName && r.tool !== '*') return false
      try { return new RegExp(r.pattern, 'i').test(command) } catch { return false }
    })

    if (!matchedRule) return { action: 'no_intercept' }

    const intercept: HitlIntercept = {
      id: randomUUID(),
      session_id: sessionId,
      tool_name: toolName,
      command,
      rule_id: matchedRule.id,
      status: 'pending',
      created_at: Date.now(),
    }
    intercepts.set(intercept.id, intercept)
    broadcast({ type: 'hitl_intercept', intercept, rule: matchedRule })
    return { action: 'intercept', intercept_id: intercept.id, message: matchedRule.message }
  })

  // Decision endpoint — called by dashboard UI
  .post('/hitl/decision', ({ body, set }) => {
    const b = body as Record<string, unknown>
    const intercept = intercepts.get(String(b.intercept_id ?? ''))
    if (!intercept) { set.status = 404; return { error: 'Intercept not found' } }
    intercept.status = b.decision === 'approve' ? 'approved' : 'blocked'
    broadcast({ type: 'hitl_decision', intercept_id: intercept.id, decision: intercept.status })
    return { intercept_id: intercept.id, decision: intercept.status }
  })

  // Get specific intercept by ID — used by hook to poll decision status
  .get('/hitl/intercepts/:id', ({ params, set }) => {
    const intercept = intercepts.get(params.id)
    if (!intercept) { set.status = 404; return { error: 'Not found' } }
    return intercept
  })

  // List pending intercepts
  .get('/hitl/pending', () => [...intercepts.values()].filter(i => i.status === 'pending'))
