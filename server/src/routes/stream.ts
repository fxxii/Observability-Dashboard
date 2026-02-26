import { Elysia } from 'elysia'
import { addClient, removeClient } from '../broadcast'

export const streamRouter = new Elysia()
  .ws('/stream', {
    open(ws) {
      addClient(ws.raw)
    },
    close(ws) {
      removeClient(ws.raw)
    },
    message() {
      // clients are read-only; ignore incoming messages
    }
  })
