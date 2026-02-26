import { onMounted, onUnmounted } from 'vue';
import { useEventsStore } from '../stores/events';
import type { ObsEvent } from '../types';

export function useWebSocket() {
  const store = useEventsStore();
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${proto}//${location.host}/stream`);

    ws.onopen = () => { store.connected = true; };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string) as { type: string; data?: ObsEvent };
        if (msg.type === 'event' && msg.data) store.addEvent(msg.data);
      } catch { /* ignore malformed */ }
    };
    ws.onclose = () => {
      store.connected = false;
      reconnectTimer = setTimeout(connect, 2000);
    };
    ws.onerror = () => ws?.close();
  }

  async function loadInitial() {
    try {
      const res = await fetch('/events/recent?limit=200');
      if (!res.ok) return;
      const { events } = await res.json() as { events: ObsEvent[] };
      store.setEvents(events);
    } catch { /* server may not be up yet */ }
  }

  onMounted(() => { connect(); loadInitial(); });
  onUnmounted(() => {
    ws?.close();
    if (reconnectTimer) clearTimeout(reconnectTimer);
  });
}
