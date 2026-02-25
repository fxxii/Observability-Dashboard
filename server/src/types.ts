export interface HookEvent {
  event_type: string
  session_id: string
  trace_id: string
  parent_session_id?: string | null
  source_app: string
  tags: string[]
  payload: Record<string, unknown>
  timestamp?: number
}

export interface StoredEvent {
  id: number
  event_type: string
  session_id: string
  trace_id: string
  parent_session_id?: string | null
  source_app: string
  tags: string      // JSON array string
  payload: string   // JSON object string
  timestamp: number
}
