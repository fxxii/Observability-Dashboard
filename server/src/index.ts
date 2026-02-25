const PORT = parseInt(process.env.PORT ?? "4000");
const server = Bun.serve({
  port: PORT,
  fetch(_req) {
    return new Response("Observability Server v1.0");
  },
});
console.log(`Server listening on :${PORT}`);
