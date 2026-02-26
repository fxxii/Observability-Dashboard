import { ref, onMounted, onUnmounted } from 'vue'
import { useEventsStore } from '../stores/events'
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
      const data = await res.json()
      store.setEvents((data.events as StoredEvent[]).reverse())
    } catch (err) {
      console.warn('[WS] Failed to load initial events:', err)
    }
  }

  function connect() {
    ws = new WebSocket(WS_URL)
    ws.onopen = () => { connected.value = true; console.log('[WS] Connected') }
    ws.onmessage = (e) => {
      try { store.addEvent(JSON.parse(e.data) as StoredEvent) } catch {}
    }
    ws.onclose = () => {
      connected.value = false
      retryTimer = setTimeout(connect, 3000)  // auto-reconnect
    }
    ws.onerror = () => ws?.close()
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
