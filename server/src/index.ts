const rawPort = process.env.PORT ?? "4000";
const PORT = parseInt(rawPort, 10);
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`Invalid PORT: "${rawPort}". Must be 1-65535.`);
  process.exit(1);
}

let server: ReturnType<typeof Bun.serve>;
try {
  server = Bun.serve({
    port: PORT,
    fetch(_req: Request) {
      return new Response("Observability Server v1.0");
    },
  });
} catch (err) {
  console.error(`Failed to start server on port ${PORT}:`, err);
  process.exit(1);
}

console.log(`Server listening on http://localhost:${PORT}`);
