import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

const app = new Elysia()
  .use(cors())
  .get('/health', () => ({ status: 'ok' }))

if (process.env.NODE_ENV !== 'test') {
  app.listen(4000)
  console.log('Server running on http://localhost:4000')
}

export default app
