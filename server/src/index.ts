import { initDb } from "./db";
import { handlePostEvent, setBroadcast } from "./routes/events";
import { handleGetRecent, handleGetFilterOptions } from "./routes/query";
import { WsManager } from "./ws";
import { startPruneSchedule } from "./pruner";

const rawPort = process.env.PORT ?? "4000";
const PORT = parseInt(rawPort, 10);
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`Invalid PORT: "${rawPort}". Must be 1-65535.`);
  process.exit(1);
}
const TTL_DAYS = parseInt(process.env.TTL_DAYS ?? "7", 10);

initDb();
startPruneSchedule(isNaN(TTL_DAYS) ? 7 : TTL_DAYS);

const wsManager = new WsManager();
setBroadcast(data => wsManager.broadcast(data));

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function withCors(res: Response): Response {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

let server: ReturnType<typeof Bun.serve>;
try {
  server = Bun.serve({
    port: PORT,
    fetch(req, srv) {
      const url = new URL(req.url);
      const { method } = req;
      const path = url.pathname;

      if (method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

      if (path === "/stream" && req.headers.get("upgrade") === "websocket") {
        if (srv.upgrade(req)) return undefined as unknown as Response;
        return new Response("WebSocket upgrade failed", { status: 400 });
      }

      if (path === "/events" && method === "POST") return handlePostEvent(req).then(withCors);
      if (path === "/events/recent" && method === "GET") return handleGetRecent(req).then(withCors);
      if (path === "/events/filter-options" && method === "GET") return handleGetFilterOptions(req).then(withCors);
      if (path === "/health") return Response.json({ ok: true, clients: wsManager.count() }, { headers: CORS_HEADERS });

      return new Response("Not Found", { status: 404 });
    },
    websocket: {
      open(ws) {
        wsManager.add(ws);
        ws.send(JSON.stringify({ type: "connected" }));
      },
      close(ws) { wsManager.remove(ws); },
      message() {},
    },
  });
} catch (err) {
  console.error(`Failed to start server on port ${PORT}:`, err);
  process.exit(1);
}

console.log(`Observability server on http://localhost:${PORT}`);
