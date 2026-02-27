<template>
  <div class="h-full flex flex-col text-xs">
    <div class="px-3 py-1.5 border-b border-border font-semibold text-gray-400">🔌 MCP Registry</div>
    <div class="flex-1 overflow-auto p-2 space-y-2">
      <div v-if="servers.length === 0" class="text-gray-700 p-2">No MCP tools detected yet.</div>
      <div v-for="server in servers" :key="server.name" class="border border-border rounded p-2 bg-surface">
        <div class="flex items-center justify-between mb-1">
          <span class="font-semibold text-cyan-400">{{ server.name }}</span>
          <div class="flex gap-2 text-[10px]">
            <span class="text-green-600">{{ server.calls }} calls</span>
            <span v-if="server.failures > 0" class="text-red-400">{{ server.failures }} failures</span>
          </div>
        </div>
        <div class="text-gray-600">Last: {{ new Date(server.lastSeen).toLocaleTimeString() }}</div>
        <div class="flex flex-wrap gap-1 mt-1">
          <span v-for="tool in server.tools" :key="tool" class="bg-panel px-1 py-0.5 rounded text-[10px] text-gray-500">{{ tool.replace(`mcp__${server.name}__`, '') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useMcpRegistry } from '../composables/useMcpRegistry'
const { servers } = useMcpRegistry()
</script>
