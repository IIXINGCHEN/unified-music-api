import { Hono } from 'hono'

// v2 rewrite: Lyric service (migrated from Lyric-Atlas-API, already Hono/TS).
export const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok', service: 'lyric' }))

export default app
