import { ref, onMounted, onUnmounted } from 'vue'
import { useEventsStore } from '../stores/events'
import { useHitl } from './useHitl'
import type { StoredEvent } from '../types/events'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/stream'
const REST_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export function useWebSocket() {
  const connected = ref(false)
  const store = useEventsStore()
  let ws: WebSocket | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  async function loadInitialEvents() {
    try {
      const res = await fetch(`${REST_URL}/events/recent?limit=100`)
      if (!res.ok) {
        console.warn('[WS] Failed to load initial events: HTTP', res.status)
        return
      }
      const data = await res.json()
      store.setEvents((data.events as StoredEvent[]).reverse())
    } catch (err) {
      console.warn('[WS] Failed to load initial events:', err)
    }
  }

  function connect() {
    ws = new WebSocket(WS_URL)
    ws.onopen = () => { connected.value = true; console.log('[WS] Connected') }
    ws.onmessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data as string) as Record<string, unknown>
        if (data.type === 'hitl_intercept') {
          useHitl().addIntercept(data.intercept as Parameters<ReturnType<typeof useHitl>['addIntercept']>[0])
        } else if (data.type === 'hitl_decision') {
          useHitl().resolveIntercept(String(data.intercept_id), data.decision as 'approved' | 'blocked')
        } else {
          store.addEvent(data as unknown as StoredEvent)
        }
      } catch (err) {
        console.warn('[WS] Failed to parse message:', err)
      }
    }
    ws.onclose = () => {
      connected.value = false
      retryTimer = setTimeout(connect, 3000)  // auto-reconnect
    }
    ws.onerror = (err) => {
      console.warn('[WS] WebSocket error:', err)
      // onclose will fire automatically after onerror, triggering reconnect
    }
  }

  onMounted(async () => {
    await loadInitialEvents()
    connect()
  })

  onUnmounted(() => {
    ws?.close()
    if (retryTimer) clearTimeout(retryTimer)
  })

  return { connected }
}
