import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { initDb } from './db'
import { eventsRouter } from './routes/events'
import { streamRouter } from './routes/stream'
import { startTtlScheduler } from './ttl'

initDb()

if (process.env.NODE_ENV !== 'test') {
  const TTL_DAYS = Number(process.env.TTL_DAYS) || 7
  startTtlScheduler(TTL_DAYS)
}

const app = new Elysia()
  .use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }))
  .get('/health', () => ({ status: 'ok' }))
  .use(eventsRouter)
  .use(streamRouter)

if (process.env.NODE_ENV !== 'test') {
  app.listen(4000)
  console.log('Server running on http://localhost:4000')
}

export default app
