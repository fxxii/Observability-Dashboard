<template>
  <div class="px-2 py-1 text-xs text-gray-400">
    {{ event.event_type }} — {{ event.source_app }}
  </div>
</template>
<script setup lang="ts">
import type { StoredEvent } from '../types/events'
defineProps<{ event: StoredEvent }>()
defineEmits<{ 'open-transcript': [event: StoredEvent] }>()
</script>
