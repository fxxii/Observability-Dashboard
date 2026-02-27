<template>
  <div class="h-screen flex flex-col overflow-hidden bg-surface">
    <DashboardLayout>
      <template #auditor><AuditorPanel /></template>
      <template #critic><CriticPanel /></template>
      <template #lead><LeadPanel /></template>
      <template #timeline><TimelinePanel /></template>
      <template #pulse><PulsePanel /></template>
    </DashboardLayout>
    <TimeTravelDebugger />
    <HitlIntercept />
  </div>
</template>

<script setup lang="ts">
import DashboardLayout from './components/DashboardLayout.vue'
import AuditorPanel from './components/panels/AuditorPanel.vue'
import CriticPanel from './components/panels/CriticPanel.vue'
import LeadPanel from './components/panels/LeadPanel.vue'
import TimelinePanel from './components/panels/TimelinePanel.vue'
import PulsePanel from './components/panels/PulsePanel.vue'
import HitlIntercept from './components/HitlIntercept.vue'
import TimeTravelDebugger from './components/TimeTravelDebugger.vue'
</script>
