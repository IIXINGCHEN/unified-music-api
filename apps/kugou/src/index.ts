import { Hono } from 'hono'

// v2 rewrite: KuGou service (226 routes, ported from KuGouMusicApi).
export const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok', service: 'kugou' }))

export default app
