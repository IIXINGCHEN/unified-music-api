import { Hono } from 'hono'

// v2 rewrite: Netease service (440 modules, ported from api-enhanced).
// Modules live in src/modules/, auto-registered like the original server.js.
export const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok', service: 'netease' }))

export default app
