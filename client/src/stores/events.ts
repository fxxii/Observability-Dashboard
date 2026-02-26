import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ObsEvent, FilterState } from '../types';

const MAX_EVENTS = 2000;

export const useEventsStore = defineStore('events', () => {
  const events = ref<ObsEvent[]>([]);
  const filters = ref<FilterState>({ source_app: null, session_id: null, event_type: null, tag: null });
  const connected = ref(false);

  const filteredEvents = computed(() => {
    const f = filters.value;
    return events.value.filter(e => {
      if (f.source_app && e.source_app !== f.source_app) return false;
      if (f.session_id && e.session_id !== f.session_id) return false;
      if (f.event_type && e.event_type !== f.event_type) return false;
      if (f.tag && !e.tags.includes(f.tag)) return false;
      return true;
    });
  });

  function addEvent(event: ObsEvent) {
    events.value.unshift(event);
    if (events.value.length > MAX_EVENTS) events.value.pop();
  }

  function setEvents(evts: ObsEvent[]) { events.value = evts; }
  function setFilter(key: keyof FilterState, value: string | null) { filters.value[key] = value; }

  const allSessions = computed(() => [...new Set(events.value.map(e => e.session_id))]);
  const allApps = computed(() => [...new Set(events.value.map(e => e.source_app))]);
  const allEventTypes = computed(() => [...new Set(events.value.map(e => e.event_type))]);
  const allTags = computed(() => [...new Set(events.value.flatMap(e => e.tags))]);

  return { events, filters, connected, filteredEvents, addEvent, setEvents, setFilter, allSessions, allApps, allEventTypes, allTags };
});
