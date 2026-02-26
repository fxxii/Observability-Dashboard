<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useEventsStore } from '../stores/events';

const store = useEventsStore();
const canvasEl = ref<HTMLCanvasElement | null>(null);
const timeRange = ref<1 | 3 | 5>(1);

const hues = new Map<string, number>();
let hueCounter = 0;
function hue(id: string): number {
  if (!hues.has(id)) hues.set(id, (hueCounter++ * 137.5) % 360);
  return hues.get(id)!;
}

function draw() {
  const canvas = canvasEl.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width = canvas.offsetWidth;
  const h = canvas.height = canvas.offsetHeight;
  ctx.clearRect(0, 0, w, h);

  const now = Date.now();
  const windowMs = timeRange.value * 60 * 1000;
  const BUCKETS = 60;
  const bucketMs = windowMs / BUCKETS;

  const data: { count: number; sessions: Set<string> }[] = Array.from(
    { length: BUCKETS }, () => ({ count: 0, sessions: new Set<string>() })
  );

  for (const e of store.filteredEvents) {
    const age = now - e.created_at;
    if (age > windowMs || age < 0) continue;
    const idx = Math.floor((windowMs - age) / bucketMs);
    if (idx >= 0 && idx < BUCKETS) {
      data[idx].count++;
      data[idx].sessions.add(e.session_id);
    }
  }

  const maxCount = Math.max(...data.map(b => b.count), 1);
  const barW = (w / BUCKETS) - 1;

  for (let i = 0; i < BUCKETS; i++) {
    const b = data[i];
    if (b.count === 0) continue;
    const barH = Math.max(4, (b.count / maxCount) * (h - 16));
    const x = i * (barW + 1);
    const y = h - barH;
    const sessionHue = b.sessions.size > 0 ? hue([...b.sessions][0]) : 200;
    ctx.fillStyle = `hsla(${sessionHue}, 70%, 55%, 0.85)`;
    ctx.shadowColor = `hsl(${sessionHue}, 70%, 55%)`;
    ctx.shadowBlur = 4;
    ctx.fillRect(x, y, barW, barH);
    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = '#374151';
  ctx.font = '9px monospace';
  ctx.fillText('now', w - 24, h - 2);
  ctx.fillText(`-${timeRange.value}m`, 2, h - 2);
}

let rafId = 0;
function loop() { draw(); rafId = requestAnimationFrame(loop); }
onMounted(() => loop());
onUnmounted(() => cancelAnimationFrame(rafId));
watch(() => store.filteredEvents.length, draw);
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between mb-2 shrink-0">
      <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">📊 Live Pulse</h2>
      <div class="flex gap-1">
        <button
          v-for="t in [1, 3, 5]" :key="t"
          class="text-xs px-2 py-0.5 rounded"
          :class="timeRange === t ? 'bg-blue-800 text-blue-200' : 'bg-gray-800 text-gray-500'"
          @click="timeRange = t as 1 | 3 | 5"
        >{{ t }}m</button>
      </div>
    </div>
    <canvas ref="canvasEl" class="flex-1 w-full rounded" />
  </div>
</template>
