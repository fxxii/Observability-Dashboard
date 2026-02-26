export interface StoredEvent {
  id: number
  event_type: string
  session_id: string
  trace_id: string
  parent_session_id?: string | null
  source_app: string
  tags: string        // JSON array string from server
  payload: string     // JSON object string from server
  timestamp: number
}

export interface ParsedEvent extends Omit<StoredEvent, 'tags' | 'payload'> {
  tags: string[]
  payload: Record<string, unknown>
}

export function parseEvent(e: StoredEvent): ParsedEvent {
  return {
    ...e,
    tags: JSON.parse(e.tags || '[]'),
    payload: JSON.parse(e.payload || '{}'),
  }
}

export const EVENT_EMOJIS: Record<string, string> = {
  PreToolUse:          '🔧',
  PostToolUse:         '✅',
  PostToolUseFailure:  '❌',
  PermissionRequest:   '🔐',
  Notification:        '🔔',
  UserPromptSubmit:    '💬',
  Stop:                '🛑',
  SubagentStop:        '👥',
  SubagentStart:       '🟢',
  PreCompact:          '📦',
  SessionStart:        '🚀',
  SessionEnd:          '🏁',
  GuardBlock:          '🚫',
}

export const TOOL_EMOJIS: Record<string, string> = {
  Bash:       '💻',
  Read:       '📖',
  Write:      '✍️',
  Edit:       '✏️',
  Task:       '🤖',
  Glob:       '🔍',
  Grep:       '🔍',
  WebFetch:   '🌐',
  WebSearch:  '🌐',
}
