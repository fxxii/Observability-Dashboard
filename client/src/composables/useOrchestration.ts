import { computed } from 'vue'
import { useEventsStore } from '../stores/events'
import { parseEvent } from '../types/events'

const PHASES = ['brainstorm', 'write-plan', 'execute-plan', 'finish'] as const
type Phase = typeof PHASES[number] | 'idle'

export function useOrchestration() {
  const store = useEventsStore()
  const allEvents = computed(() => store.events.map(parseEvent))

  const currentPhase = computed<Phase>(() => {
    const recent = allEvents.value.slice(0, 200)
    for (const phase of [...PHASES].reverse()) {
      if (recent.some(e => JSON.stringify(e.payload).toLowerCase().includes(phase))) return phase
    }
    return 'idle'
  })

  const activeSubagents = computed(() => {
    const started = new Set<string>()
    const stopped = new Set<string>()
    allEvents.value.forEach(e => {
      if (e.event_type === 'SubagentStart') started.add(e.session_id)
      if (e.event_type === 'SubagentStop') stopped.add(e.session_id)
    })
    return [...started].filter(id => !stopped.has(id)).map(id => {
      const start = allEvents.value.find(e => e.event_type === 'SubagentStart' && e.session_id === id)
      return { session_id: id, agent_type: start?.payload.agent_type ?? 'unknown', parent_session_id: start?.parent_session_id }
    })
  })

  const reviewGates = computed(() => {
    const gates: Record<string, { implementer?: string; spec?: string; quality?: string }> = {}
    allEvents.value.forEach(e => {
      if (e.event_type === 'SessionStart') {
        const type = String(e.payload.agent_type ?? '')
        if (type === 'implementer') gates[e.session_id] = { implementer: 'in-progress' }
        if (type === 'spec-reviewer') { const t = String(e.payload.target_session ?? e.session_id); if (!gates[t]) gates[t] = {}; gates[t].spec = 'in-progress' }
        if (type === 'quality-reviewer') { const t = String(e.payload.target_session ?? e.session_id); if (!gates[t]) gates[t] = {}; gates[t].quality = 'in-progress' }
      }
      if (e.event_type === 'SubagentStop') { const o = String(e.payload.outcome ?? 'complete'); if (gates[e.session_id]) gates[e.session_id].implementer = o }
    })
    return gates
  })

  return { currentPhase, activeSubagents, reviewGates }
}
