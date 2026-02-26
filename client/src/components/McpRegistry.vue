<script setup lang="ts">
import { computed } from 'vue';
import { useEventsStore } from '../stores/events';

const store = useEventsStore();

interface McpServer {
  name: string;
  tools: Set<string>;
  lastSeen: number;
  callCount: number;
  failureCount: number;
}

const mcpServers = computed<McpServer[]>(() => {
  const servers = new Map<string, McpServer>();
  for (const event of store.events) {
    if (!['PostToolUse', 'PostToolUseFailure'].includes(event.event_type)) continue;
    const tool = (event.payload?.tool as string) ?? '';
    if (!tool.startsWith('mcp__') && !tool.startsWith('mcp_')) continue;

    // Parse "mcp__serverName__toolName" format
    const parts = tool.split('__');
    const serverName = parts.length >= 2 ? parts[1] : tool.replace(/^mcp_/, '').split('_')[0];
    const toolName = parts.length >= 3 ? parts.slice(2).join('__') : tool;

    if (!servers.has(serverName)) {
      servers.set(serverName, { name: serverName, tools: new Set(), lastSeen: 0, callCount: 0, failureCount: 0 });
    }
    const s = servers.get(serverName)!;
    s.tools.add(toolName);
    s.lastSeen = Math.max(s.lastSeen, event.created_at);
    if (event.event_type === 'PostToolUse') s.callCount++;
    else s.failureCount++;
  }
  return [...servers.values()].sort((a, b) => b.lastSeen - a.lastSeen);
});

function formatAge(ts: number): string {
  if (!ts) return 'never';
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s ago`;
  return `${Math.floor(sec / 60)}m ago`;
}
</script>

<template>
  <div class="p-4">
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">🔌 MCP Registry</h2>
    <div v-if="mcpServers.length === 0" class="text-gray-600 text-sm">
      No MCP servers detected. MCP tool calls appear as
      <code class="text-gray-400 bg-gray-800 px-1 rounded">mcp__server__tool</code> in PostToolUse events.
    </div>
    <div v-else class="space-y-3">
      <div
        v-for="server in mcpServers"
        :key="server.name"
        class="bg-gray-900 rounded-lg border border-gray-800 p-3"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="font-mono text-green-400 text-sm">{{ server.name }}</span>
          <div class="flex items-center gap-3 text-xs text-gray-500">
            <span>{{ server.callCount }} calls</span>
            <span v-if="server.failureCount > 0" class="text-red-400">{{ server.failureCount }} failures</span>
            <span>{{ formatAge(server.lastSeen) }}</span>
          </div>
        </div>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="tool in server.tools"
            :key="tool"
            class="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700"
          >{{ tool }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
