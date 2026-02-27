import { ref, computed } from 'vue'

export interface HitlIntercept {
  id: string
  session_id: string
  tool_name: string
  command: string
  rule_id: string
  status: 'pending' | 'approved' | 'blocked'
  created_at: number
}

const intercepts = ref<HitlIntercept[]>([])

export function useHitl() {
  const pendingIntercepts = computed(() => intercepts.value.filter(i => i.status === 'pending'))

  function addIntercept(intercept: HitlIntercept) {
    intercepts.value.unshift(intercept)
  }

  function resolveIntercept(id: string, decision: 'approved' | 'blocked') {
    const i = intercepts.value.find(x => x.id === id)
    if (i) i.status = decision
  }

  async function sendDecision(interceptId: string, decision: 'approve' | 'block') {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/hitl/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intercept_id: interceptId, decision }),
      })
    } catch (err) {
      console.warn('[HITL] Failed to send decision:', err)
    }
    resolveIntercept(interceptId, decision === 'approve' ? 'approved' : 'blocked')
  }

  return { pendingIntercepts, intercepts, addIntercept, resolveIntercept, sendDecision }
}
