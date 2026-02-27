import { computed } from 'vue'
import { useEventsStore } from '../stores/events'
import { parseEvent } from '../types/events'

interface McpServer { name: string; tools: string[]; lastSeen: number; calls: number; failures: number }

export function useMcpRegistry() {
  const store = useEventsStore()
  const servers = computed<McpServer[]>(() => {
    const registry = new Map<string, McpServer>()
    store.events.forEach(e => {
      const p = parseEvent(e).payload
      if (!p.is_mcp_tool) return
      const serverName = String(p.mcp_server ?? 'unknown')
      const toolName = String(p.tool_name ?? '')
      if (!registry.has(serverName)) registry.set(serverName, { name: serverName, tools: [], lastSeen: e.timestamp, calls: 0, failures: 0 })
      const server = registry.get(serverName)
      if (!server) return
      if (e.timestamp > server.lastSeen) server.lastSeen = e.timestamp
      if (!server.tools.includes(toolName)) server.tools.push(toolName)
      if (e.event_type === 'PostToolUse') server.calls++
      if (e.event_type === 'PostToolUseFailure') server.failures++
    })
    return [...registry.values()].sort((a, b) => b.lastSeen - a.lastSeen)
  })
  return { servers }
}
