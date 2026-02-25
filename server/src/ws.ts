type WsLike = { send: (msg: string) => void; readyState: number };

export class WsManager {
  private clients = new Set<WsLike>();

  add(ws: WsLike) { this.clients.add(ws); }
  remove(ws: WsLike) { this.clients.delete(ws); }
  count() { return this.clients.size; }

  broadcast(data: string) {
    for (const client of this.clients) {
      if (client.readyState === 1) {
        try { client.send(data); } catch { this.clients.delete(client); }
      }
    }
  }
}
