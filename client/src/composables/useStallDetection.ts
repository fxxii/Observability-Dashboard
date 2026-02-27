import { computed } from 'vue'
import { useEventsStore } from '../stores/events'

const STALL_THRESHOLD_MS = 60_000
const STOPPED_EVENT_TYPES = new Set(['Stop', 'SubagentStop', 'SessionEnd'])

interface StallInfo { elapsedMs: number; lastEvent: string }

export function useStallDetection() {
  const store = useEventsStore()

  const stoppedSessions = computed(() =>
    new Set(store.events.filter(e => STOPPED_EVENT_TYPES.has(e.event_type)).map(e => e.session_id))
  )

  const lastEventBySession = computed<Record<string, { timestamp: number; event_type: string }>>(() => {
    const result: Record<string, { timestamp: number; event_type: string }> = {}
    store.events.forEach(e => {
      if (!result[e.session_id] || e.timestamp > result[e.session_id].timestamp) {
        result[e.session_id] = { timestamp: e.timestamp, event_type: e.event_type }
      }
    })
    return result
  })

  // Use Date.now() directly in computed — reactive to store changes, updates on each evaluation
  const stalledSessions = computed<Record<string, StallInfo>>(() => {
    const now = Date.now()
    const result: Record<string, StallInfo> = {}
    Object.entries(lastEventBySession.value).forEach(([sid, last]) => {
      if (stoppedSessions.value.has(sid)) return
      const elapsed = now - last.timestamp
      if (elapsed > STALL_THRESHOLD_MS) {
        result[sid] = { elapsedMs: elapsed, lastEvent: last.event_type }
      }
    })
    return result
  })

  return { stalledSessions }
}
