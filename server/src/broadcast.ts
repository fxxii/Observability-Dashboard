import type { ServerWebSocket } from 'bun'

const clients = new Set<ServerWebSocket<unknown>>()

export function addClient(ws: ServerWebSocket<unknown>): void {
  clients.add(ws)
}

export function removeClient(ws: ServerWebSocket<unknown>): void {
  clients.delete(ws)
}

export function broadcast(data: unknown): void {
  const msg = JSON.stringify(data)
  for (const ws of clients) {
    try {
      ws.send(msg)
    } catch {
      clients.delete(ws)
    }
  }
}

export function clientCount(): number {
  return clients.size
}
