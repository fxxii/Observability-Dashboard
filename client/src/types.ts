export interface ObsEvent {
  id: number;
  session_id: string;
  event_type: string;
  source_app: string;
  payload: Record<string, unknown>;
  tags: string[];
  parent_session_id: string | null;
  trace_id: string | null;
  created_at: number; // epoch ms
}

export interface FilterState {
  source_app: string | null;
  session_id: string | null;
  event_type: string | null;
  tag: string | null;
}

export const EVENT_EMOJIS: Record<string, string> = {
  SessionStart: '🚀', SessionEnd: '🏁', Stop: '🛑',
  SubagentStart: '🟢', SubagentStop: '👥',
  PreToolUse: '🔧', PostToolUse: '✅', PostToolUseFailure: '❌',
  PermissionRequest: '🔐', Notification: '🔔',
  UserPromptSubmit: '💬', PreCompact: '📦',
};

export const TOOL_EMOJIS: Record<string, string> = {
  Bash: '💻', Read: '📖', Write: '✍️', Edit: '✏️',
  Task: '🤖', Glob: '🔍', Grep: '🔎', WebFetch: '🌐', WebSearch: '🔭',
};
