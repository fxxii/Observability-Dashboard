import { getDb } from "../db";

export async function handleGetRecent(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "200", 10), 1000);
  const source_app = url.searchParams.get("source_app");
  const session_id = url.searchParams.get("session_id");
  const event_type = url.searchParams.get("event_type");
  const tag = url.searchParams.get("tag");
  const since = url.searchParams.get("since");

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  if (source_app) { conditions.push("source_app = ?"); params.push(source_app); }
  if (session_id) { conditions.push("session_id = ?"); params.push(session_id); }
  if (event_type) { conditions.push("event_type = ?"); params.push(event_type); }
  if (tag) { conditions.push("tags LIKE ?"); params.push(`%"${tag}"%`); }
  if (since) { conditions.push("created_at > ?"); params.push(parseInt(since, 10)); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  params.push(limit);

  const rows = getDb()
    .prepare(`SELECT * FROM events ${where} ORDER BY created_at DESC LIMIT ?`)
    .all(...params) as Record<string, unknown>[];

  const events = rows.map(r => ({
    ...r,
    payload: JSON.parse(r.payload as string),
    tags: JSON.parse(r.tags as string),
  }));

  return Response.json({ events, total: events.length });
}

export async function handleGetFilterOptions(_req: Request): Promise<Response> {
  const db = getDb();
  const source_apps = (db.prepare("SELECT DISTINCT source_app FROM events ORDER BY source_app").all() as any[]).map(r => r.source_app as string);
  const event_types = (db.prepare("SELECT DISTINCT event_type FROM events ORDER BY event_type").all() as any[]).map(r => r.event_type as string);
  const sessions = (db.prepare("SELECT DISTINCT session_id FROM events ORDER BY session_id").all() as any[]).map(r => r.session_id as string);
  const tags_raw = (db.prepare("SELECT DISTINCT tags FROM events WHERE tags != '[]'").all() as any[]).flatMap(r => JSON.parse(r.tags as string) as string[]);
  const tags = [...new Set(tags_raw)];
  return Response.json({ source_apps, event_types, sessions, tags });
}
