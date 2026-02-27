import { getDb } from './db'

/**
 * Delete events older than ttlDays. Returns the number of rows deleted.
 */
export function runTtlCleanup(ttlDays = 7): number {
  const db = getDb()
  const cutoffMs = Date.now() - ttlDays * 24 * 60 * 60 * 1000
  const result = db.run('DELETE FROM events WHERE timestamp < ?', [cutoffMs])
  if (result.changes > 0) {
    console.log(`[TTL] Pruned ${result.changes} events older than ${ttlDays} days`)
  }
  return result.changes
}

/**
 * Start an interval that runs TTL cleanup on a schedule.
 * Returns the interval handle so the caller can clear it.
 */
export function startTtlScheduler(
  ttlDays = 7,
  intervalMs = 60 * 60 * 1000  // 1 hour default
): ReturnType<typeof setInterval> {
  runTtlCleanup(ttlDays)  // run immediately on start
  return setInterval(() => runTtlCleanup(ttlDays), intervalMs)
}
