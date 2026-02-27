import { computed } from 'vue'
import { useEventsStore } from '../stores/events'

type PressureStatus = 'green' | 'amber' | 'red'
interface SessionPressure { status: PressureStatus; compactCount: number; fillPercent: number }

export function useContextPressure() {
  const store = useEventsStore()
  const pressureBySession = computed<Record<string, SessionPressure>>(() => {
    const now = Date.now()
    const windowMs = 10 * 60 * 1000
    const result: Record<string, SessionPressure> = {}
    const sessions = new Set(store.events.map(e => e.session_id))
    sessions.forEach(sid => {
      const count = store.events.filter(e => e.session_id === sid && e.event_type === 'PreCompact' && e.timestamp >= now - windowMs).length
      const status: PressureStatus = count >= 3 ? 'red' : count >= 1 ? 'amber' : 'green'
      result[sid] = { status, compactCount: count, fillPercent: Math.min(count * 33, 100) }
    })
    return result
  })
  return { pressureBySession }
}
