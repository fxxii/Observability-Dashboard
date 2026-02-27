<template>
  <div class="h-full flex flex-col">
    <div class="px-3 py-1.5 border-b border-border flex items-center justify-between">
      <span class="text-xs text-gray-400 font-semibold">📊 Live Pulse</span>
      <div class="flex gap-1">
        <button
          v-for="r in TIME_RANGES"
          :key="r.label"
          @click="selectedRange = r.ms"
          :class="selectedRange === r.ms ? 'bg-cyan-800 text-cyan-200' : 'text-gray-600 hover:text-gray-400'"
          class="px-2 py-0.5 text-xs rounded transition-colors"
        >{{ r.label }}</button>
      </div>
    </div>
    <div class="flex-1 relative">
      <canvas ref="canvasEl" class="absolute inset-0 w-full h-full" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useEventsStore } from '../stores/events'

const TIME_RANGES = [
  { label: '1m', ms: 60_000 },
  { label: '3m', ms: 180_000 },
  { label: '5m', ms: 300_000 },
]

const store = useEventsStore()
const canvasEl = ref<HTMLCanvasElement | null>(null)
const selectedRange = ref(60_000)
let rafId = 0

function draw() {
  const canvas = canvasEl.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const W = rect.width
  const H = rect.height
  const now = Date.now()
  const windowMs = selectedRange.value
  const bucketCount = 30
  const bucketMs = windowMs / bucketCount

  const events = store.filteredEvents.filter(e => e.timestamp >= now - windowMs)
  const buckets: Map<string, number[]> = new Map()
  const sessionIds = [...new Set(events.map(e => e.session_id))]

  sessionIds.forEach(sid => buckets.set(sid, new Array(bucketCount).fill(0)))
  events.forEach(e => {
    const age = now - e.timestamp
    const idx = Math.floor((windowMs - age) / bucketMs)
    if (idx >= 0 && idx < bucketCount) {
      buckets.get(e.session_id)![idx]++
    }
  })

  let maxVal = 1
  buckets.forEach(b => b.forEach(v => { if (v > maxVal) maxVal = v }))

  ctx.clearRect(0, 0, W, H)

  const barW = W / bucketCount
  const colors = store.sessionColors

  for (let i = 0; i < bucketCount; i++) {
    let stackY = H
    sessionIds.forEach(sid => {
      const val = buckets.get(sid)![i]
      if (val === 0) return
      const barH = (val / maxVal) * (H - 16)
      const color = colors[sid] ?? '#475569'
      ctx.fillStyle = color + 'cc'
      ctx.fillRect(i * barW + 1, stackY - barH, barW - 2, barH)
      stackY -= barH
    })
  }

  ctx.fillStyle = '#4b5563'
  ctx.font = '10px monospace'
  ctx.fillText('now', W - 24, H - 2)
  ctx.fillText(`-${selectedRange.value / 60000}m`, 2, H - 2)

  if (typeof requestAnimationFrame !== 'undefined') {
    rafId = requestAnimationFrame(draw)
  }
}

onMounted(() => {
  if (typeof requestAnimationFrame !== 'undefined') {
    rafId = requestAnimationFrame(draw)
  }
})

onUnmounted(() => {
  if (typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(rafId)
  }
})
</script>
