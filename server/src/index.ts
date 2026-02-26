import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { initDb } from './db'
import { eventsRouter } from './routes/events'

initDb()

const app = new Elysia()
  .use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }))
  .get('/health', () => ({ status: 'ok' }))
  .use(eventsRouter)

if (process.env.NODE_ENV !== 'test') {
  app.listen(4000)
  console.log('Server running on http://localhost:4000')
}

export default app
