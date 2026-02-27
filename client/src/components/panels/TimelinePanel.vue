<template>
  <div class="h-full flex flex-col">
    <FilterPanel />
    <EventTimeline class="flex-1 min-h-0" />
  </div>
</template>

<script setup lang="ts">
import FilterPanel from '../FilterPanel.vue'
import EventTimeline from '../EventTimeline.vue'
</script>
