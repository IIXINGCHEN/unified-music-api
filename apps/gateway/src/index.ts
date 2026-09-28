import { Hono } from 'hono'

// v2 rewrite: Hono gateway (replaces Go/Gin).
// Port scope: routes, auth, rate-limit, platform proxy, health, config API.
export const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok', service: 'gateway' }))

export default app
