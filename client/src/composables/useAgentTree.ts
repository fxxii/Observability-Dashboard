import { computed } from 'vue'
import { useEventsStore } from '../stores/events'

export interface AgentNode { session_id: string; trace_id: string; parent_session_id: string | null; children: AgentNode[]; startTime: number; stopped: boolean; agent_type: string }

export function useAgentTree() {
  const store = useEventsStore()
  const roots = computed<AgentNode[]>(() => {
    const nodeMap = new Map<string, AgentNode>()
    const stoppedSessions = new Set<string>()
    store.events.forEach(e => {
      if (e.event_type === 'SessionStart' || e.event_type === 'SubagentStart') {
        if (!nodeMap.has(e.session_id)) {
          let agentType = 'unknown'
          try { agentType = JSON.parse(e.payload).agent_type ?? 'unknown' } catch (err) { console.warn('[useAgentTree] Failed to parse payload', err) }
          nodeMap.set(e.session_id, { session_id: e.session_id, trace_id: e.trace_id, parent_session_id: e.parent_session_id ?? null, children: [], startTime: e.timestamp, stopped: false, agent_type: agentType })
        }
      }
      if (['Stop', 'SubagentStop', 'SessionEnd'].includes(e.event_type)) stoppedSessions.add(e.session_id)
    })
    stoppedSessions.forEach(sid => { const n = nodeMap.get(sid); if (n) n.stopped = true })
    const rootNodes: AgentNode[] = []
    nodeMap.forEach(node => {
      if (!node.parent_session_id || !nodeMap.has(node.parent_session_id)) rootNodes.push(node)
      else {
        const parent = nodeMap.get(node.parent_session_id)
        if (parent) parent.children.push(node)
      }
    })
    return rootNodes
  })
  return { roots }
}
