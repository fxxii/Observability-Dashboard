<template>
  <div data-modal class="fixed inset-0 z-50" @click="$emit('close')">
    <div class="p-4 text-xs text-gray-400">Transcript: {{ event.session_id }}</div>
  </div>
</template>
<script setup lang="ts">
import type { StoredEvent } from '../types/events'
defineProps<{ event: StoredEvent }>()
defineEmits<{ close: [] }>()
</script>
