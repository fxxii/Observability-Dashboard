import { getDb } from "./db";

export function pruneOldEvents(ttlDays = 7): number {
  const cutoff = Date.now() - ttlDays * 24 * 60 * 60 * 1000;
  const result = getDb().prepare("DELETE FROM events WHERE created_at < ?").run(cutoff);
  return Number(result.changes);
}

export function startPruneSchedule(ttlDays = 7, intervalMs = 60 * 60 * 1000) {
  return setInterval(() => {
    const deleted = pruneOldEvents(ttlDays);
    if (deleted > 0) console.log(`[pruner] Deleted ${deleted} events older than ${ttlDays}d`);
  }, intervalMs);
}
