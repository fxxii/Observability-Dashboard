import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useEventsStore } from './events';

// PreCompact events within this window indicate context pressure
// created_at is epoch ms (DB stores as CAST(unixepoch('subsec') * 1000 AS INTEGER))
const COMPACT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export const useMetricsStore = defineStore('metrics', () => {
  const eventsStore = useEventsStore();

  const sessionMetrics = computed(() => {
    const sessions = new Map<string, {
      model: string;
      compactCount: number;   // total PreCompact events ever
      recentCompacts: number; // PreCompact events in last 10 min
      status: 'ok' | 'warning' | 'critical';
    }>();

    const now = Date.now();
    for (const event of eventsStore.events) {
      if (!sessions.has(event.session_id)) {
        sessions.set(event.session_id, { model: 'unknown', compactCount: 0, recentCompacts: 0, status: 'ok' });
      }
      const m = sessions.get(event.session_id)!;
      if (event.event_type === 'SessionStart') {
        m.model = (event.payload?.model as string) ?? m.model;
      }
      if (event.event_type === 'PreCompact') {
        m.compactCount++;
        if (now - event.created_at < COMPACT_WINDOW_MS) m.recentCompacts++;
      }
    }

    // Amber at 1+ recent compacts (warning), red at 3+ recent compacts in window (critical spiral)
    for (const m of sessions.values()) {
      if (m.recentCompacts >= 3) m.status = 'critical';
      else if (m.recentCompacts >= 1) m.status = 'warning';
    }
    return sessions;
  });

  return { sessionMetrics };
});
