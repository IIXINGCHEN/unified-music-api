import { Hono } from 'hono'

// v2 rewrite: Meting service (JS->TS; spotify/ytmusic providers only).
export const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok', service: 'meting' }))

export default app
