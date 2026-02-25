import { getDb } from "../db";

interface EventRow {
  id: number;
  session_id: string;
  event_type: string;
  source_app: string;
  payload: string;
  tags: string;
  parent_session_id: string | null;
  trace_id: string | null;
  created_at: number;
}

// WebSocket broadcast function — injected by index.ts
export let broadcast: (data: string) => void = () => {};
export function setBroadcast(fn: (data: string) => void) { broadcast = fn; }

export async function handlePostEvent(req: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.session_id) return Response.json({ error: "Missing session_id" }, { status: 400 });
  if (!body.event_type) return Response.json({ error: "Missing event_type" }, { status: 400 });

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO events (session_id, event_type, source_app, payload, tags, parent_session_id, trace_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    String(body.session_id),
    String(body.event_type),
    body.source_app ? String(body.source_app) : "unknown",
    JSON.stringify(body.payload ?? {}),
    JSON.stringify(body.tags ?? []),
    body.parent_session_id ? String(body.parent_session_id) : null,
    body.trace_id ? String(body.trace_id) : null,
  );

  const id = result.lastInsertRowid;
  const row = db.prepare("SELECT * FROM events WHERE id = ?").get(id) as EventRow;
  const event = { ...row, payload: JSON.parse(row.payload), tags: JSON.parse(row.tags) };
  broadcast(JSON.stringify({ type: "event", data: event }));

  return Response.json({ id, ok: true }, { status: 201 });
}
