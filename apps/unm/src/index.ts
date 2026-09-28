import { Hono } from 'hono'

// v2 rewrite: UNM service (migrated from unm-music-api, already Hono/TS).
export const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok', service: 'unm' }))

export default app
