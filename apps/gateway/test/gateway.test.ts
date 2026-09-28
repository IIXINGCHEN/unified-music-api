/**
 * Gateway tests via app.request() - no real network.
 *
 * Covers: route assembly, platform proxy (stub upstream over loopback),
 * auth rejection, whitelist, 404/405, metrics JSON envelope, music routes
 * (stub sources), config sanitize/backup.
 */
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { loadConfig } from '../src/config.js'
import type { GatewayConfig } from '../src/config.js'
import type { Source } from '../src/services.js'
import { SourceManager } from '../src/services.js'

function baseConfig(): GatewayConfig {
  const cfg = loadConfig()
  cfg.sources.unm_server.enabled = false
  cfg.sources.default_sources = ['gdstudio']
  cfg.sources.enabled_sources = ['gdstudio']
  return cfg
}

function stubSources(cfg: GatewayConfig): SourceManager {
  const sm = new SourceManager(cfg)
  const stub: Source = {
    name: () => 'gdstudio',
    enabled: () => true,
    searchMusic: async (keyword: string) => [
      { id: '1', name: keyword, artist: 'artist-a', album: 'album-b', duration: 180, source: 'gdstudio', score: 0 },
    ],
    getMusic: async (id: string, quality: string) => ({
      url: `https://cdn.example.com/${id}.mp3`,
      quality,
      source: 'gdstudio',
    }),
    getMusicInfo: async (id: string) => ({
      id,
      name: 'song',
      artist: 'artist-a',
      album: 'album-b',
      duration: 180,
      pic_url: '',
    }),
    getPicture: async (picID: string) => `https://cdn.example.com/pic/${picID}.jpg`,
    getLyric: async () => ({ lyric: '[00:01]la', tlyric: '[00:01]啦' }),
    healthCheck: async () => {},
  }
  sm.register(stub)
  return sm
}

function authConfig(): GatewayConfig {
  const cfg = baseConfig()
  cfg.security.enable_auth = true
  cfg.security.api_auth = {
    enabled: true,
    api_key: 'test-api-key-12345',
    admin_key: 'test-admin-key-67890',
    require_https: false,
    enable_rate_limit: false,
    rate_limit_per_min: 60,
    enable_audit_log: false,
    white_list: [],
    allowed_user_agent: [],
  }
  return cfg
}

/** Start a loopback stub upstream; returns its base URL. */
async function startStubUpstream(handler: (reqPath: string, query: string) => { status: number; body: unknown }) {
  let lastPath = ''
  let lastQuery = ''
  const server = createServer((req, res) => {
    const [p, q] = (req.url ?? '/').split('?')
    lastPath = p ?? '/'
    lastQuery = q ?? ''
    const { status, body } = handler(lastPath, lastQuery)
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(body))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as AddressInfo).port
  return { url: `http://127.0.0.1:${port}`, server, seen: () => ({ path: lastPath, query: lastQuery }) }
}

const PLATFORM_ENVS = [
  'PLATFORM_NETEASE_URL',
  'PLATFORM_KUGOU_URL',
  'PLATFORM_UNM_URL',
  'PLATFORM_LYRIC_URL',
  'PLATFORM_METING_URL',
]

afterEach(() => {
  for (const k of PLATFORM_ENVS) delete process.env[k]
})

describe('health & root', () => {
  it('GET /health returns healthy JSON envelope', async () => {
    const { app } = createApp(baseConfig(), { sourceManager: stubSources(baseConfig()) })
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { code: number; message: string; data: { status: string } }
    expect(body.code).toBe(200)
    expect(body.message).toBe('服务健康')
    expect(body.data.status).toBe('healthy')
    expect(typeof body.timestamp).toBe('number')
  })

  it('GET /ready and /healthz respond', async () => {
    const { app } = createApp(baseConfig())
    for (const p of ['/ready', '/healthz', '/readyz']) {
      const res = await app.request(p)
      expect(res.status).toBe(200)
    }
  })

  it('GET /metrics keeps the JSON envelope (not Prometheus text)', async () => {
    const { app } = createApp(baseConfig())
    await app.request('/health') // a prior request so the counter is non-zero
    const res = await app.request('/metrics')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')
    const body = (await res.json()) as { code: number; message: string; data: { request_stats: { total_requests: number } } }
    expect(body.code).toBe(200)
    expect(body.message).toBe('指标获取成功')
    expect(body.data.request_stats.total_requests).toBeGreaterThanOrEqual(1)
  })

  it('GET /api and /api/v1 describe the service', async () => {
    const { app } = createApp(baseConfig())
    const api = (await (await app.request('/api')).json()) as { name: string }
    expect(api.name).toBe('music-api-proxy')
    const v1 = (await (await app.request('/api/v1')).json()) as { version: string }
    expect(v1.version).toBe('v1')
  })

  it('unknown path -> 404 envelope 接口不存在', async () => {
    const { app } = createApp(baseConfig())
    const res = await app.request('/no-such-route')
    expect(res.status).toBe(404)
    const body = (await res.json()) as { code: number; message: string }
    expect(body.code).toBe(404)
    expect(body.message).toBe('接口不存在')
  })

  it('wrong method on a known route -> 405 envelope 方法不允许', async () => {
    const { app } = createApp(baseConfig())
    const res = await app.request('/api/v1/search', { method: 'POST' })
    expect(res.status).toBe(405)
    const body = (await res.json()) as { code: number; message: string }
    expect(body.code).toBe(405)
    expect(body.message).toBe('方法不允许')
  })
})

describe('platform proxy', () => {
  it('unknown platform -> 404 未知平台', async () => {
    const { app } = createApp(baseConfig())
    const res = await app.request('/api/v1/platform/nope/search')
    expect(res.status).toBe(404)
    const body = (await res.json()) as { message: string }
    expect(body.message).toContain('未知平台: nope')
  })

  it('proxies path + query to the upstream (env override)', async () => {
    const stub = await startStubUpstream(() => ({ status: 200, body: { ok: true, from: 'stub' } }))
    process.env.PLATFORM_NETEASE_URL = stub.url
    try {
      const { app } = createApp(baseConfig())
      const res = await app.request('/api/v1/platform/netease/search?keywords=hello&type=1', {
        headers: { 'x-test-header': 'abc' },
      })
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ ok: true, from: 'stub' })
      const seen = stub.seen()
      expect(seen.path).toBe('/search')
      expect(seen.query).toBe('keywords=hello&type=1')
    } finally {
      stub.server.close()
    }
  })

  it('upstream connection failure -> 502 envelope 平台服务不可用', async () => {
    process.env.PLATFORM_KUGOU_URL = 'http://127.0.0.1:1'
    const { app } = createApp(baseConfig())
    const res = await app.request('/api/v1/platform/kugou/search')
    expect(res.status).toBe(502)
    const body = (await res.json()) as { code: number; message: string; platform: string }
    expect(body.code).toBe(502)
    expect(body.message).toBe('平台服务不可用: kugou')
    expect(body.platform).toBe('kugou')
  })

  it('POST body is forwarded to the upstream', async () => {
    const stub = await startStubUpstream(() => ({ status: 201, body: { created: true } }))
    process.env.PLATFORM_LYRIC_URL = stub.url
    try {
      const { app } = createApp(baseConfig())
      const res = await app.request('/api/v1/platform/lyric/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ a: 1 }),
      })
      expect(res.status).toBe(201)
      expect(await res.json()).toEqual({ created: true })
      expect(stub.seen().path).toBe('/submit')
    } finally {
      stub.server.close()
    }
  })
})

describe('auth', () => {
  let cfg: GatewayConfig
  beforeEach(() => {
    cfg = authConfig()
  })

  it('system API without key -> 401 缺少API密钥', async () => {
    const { app } = createApp(cfg)
    const res = await app.request('/api/v1/system/info')
    expect(res.status).toBe(401)
    expect(((await res.json()) as { message: string }).message).toBe('缺少API密钥')
  })

  it('system API with wrong key -> 401 无效的API密钥', async () => {
    const { app } = createApp(cfg)
    const res = await app.request('/api/v1/system/info', { headers: { 'x-api-key': 'wrong' } })
    expect(res.status).toBe(401)
    expect(((await res.json()) as { message: string }).message).toBe('无效的API密钥')
  })

  it('system API with correct key (Bearer) -> 200', async () => {
    const { app } = createApp(cfg)
    const res = await app.request('/api/v1/system/info', {
      headers: { authorization: 'Bearer test-api-key-12345' },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { code: number; message: string }
    expect(body.code).toBe(200)
    expect(body.message).toBe('获取成功')
  })

  it('whitelisted IP bypasses the key check', async () => {
    cfg.security.api_auth!.white_list = ['127.0.0.1']
    const { app } = createApp(cfg)
    const res = await app.request('/api/v1/system/info')
    expect(res.status).toBe(200)
  })

  it('non-whitelisted X-Forwarded-For IP still needs a key', async () => {
    cfg.security.api_auth!.white_list = ['10.9.9.9']
    const { app } = createApp(cfg)
    const res = await app.request('/api/v1/system/info', {
      headers: { 'x-forwarded-for': '192.168.1.100' },
    })
    expect(res.status).toBe(401)
  })

  it('disallowed User-Agent -> 403 无效的客户端', async () => {
    cfg.security.api_auth!.allowed_user_agent = ['AllowedAgent']
    const { app } = createApp(cfg)
    const denied = await app.request('/api/v1/system/info', {
      headers: { 'x-api-key': 'test-api-key-12345', 'user-agent': 'BadBot/1.0' },
    })
    expect(denied.status).toBe(403)
    const allowed = await app.request('/api/v1/system/info', {
      headers: { 'x-api-key': 'test-api-key-12345', 'user-agent': 'AllowedAgent/2.0' },
    })
    expect(allowed.status).toBe(200)
  })

  it('rate limit -> 429 after exceeding per-minute quota', async () => {
    cfg.security.api_auth!.enable_rate_limit = true
    cfg.security.api_auth!.rate_limit_per_min = 2
    const { app } = createApp(cfg)
    const headers = { 'x-api-key': 'test-api-key-12345' }
    expect((await app.request('/api/v1/system/info', { headers })).status).toBe(200)
    expect((await app.request('/api/v1/system/info', { headers })).status).toBe(200)
    const limited = await app.request('/api/v1/system/info', { headers })
    expect(limited.status).toBe(429)
    expect(((await limited.json()) as { message: string }).message).toBe('请求过于频繁，请稍后再试')
  })

  it('admin routes always require HTTPS (Go-faithful): plain HTTP -> 426', async () => {
    const { app } = createApp(cfg)
    const res = await app.request('/api/v1/config', { headers: { 'x-api-key': 'test-admin-key-67890' } })
    expect(res.status).toBe(426)
    expect(((await res.json()) as { message: string }).message).toBe('管理员操作要求使用HTTPS连接')
  })

  it('config API requires the admin key (not the api key)', async () => {
    const { app } = createApp(cfg)
    const https = { 'x-forwarded-proto': 'https' }
    const noKey = await app.request('/api/v1/config', { headers: https })
    expect(noKey.status).toBe(401)
    expect(((await noKey.json()) as { message: string }).message).toBe('缺少管理员密钥')
    const apiKeyOnly = await app.request('/api/v1/config', {
      headers: { ...https, 'x-api-key': 'test-api-key-12345' },
    })
    expect(apiKeyOnly.status).toBe(401)
    const admin = await app.request('/api/v1/config', {
      headers: { ...https, 'x-api-key': 'test-admin-key-67890' },
    })
    expect(admin.status).toBe(200)
  })

  it('config read is sanitized (api_key masked)', async () => {
    const { app } = createApp(cfg)
    const res = await app.request('/api/v1/config', {
      headers: { 'x-forwarded-proto': 'https', 'x-api-key': 'test-admin-key-67890' },
    })
    const body = (await res.json()) as { data: { security: { api_key: string; api_auth: { api_key: string } } } }
    expect(body.data.security.api_key).not.toBe('test-api-key-12345')
    expect(body.data.security.api_auth.api_key).not.toBe('test-api-key-12345')
  })

  it('config backup/restore round-trip', async () => {
    const { app } = createApp(cfg)
    const headers = {
      'x-forwarded-proto': 'https',
      'x-api-key': 'test-admin-key-67890',
      'content-type': 'application/json',
    }
    const created = (await (
      await app.request('/api/v1/config/backup', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'b1', description: 'd1' }),
      })
    ).json()) as { data: { id: string } }
    expect(created.data.id).toBeTruthy()
    const list = (await (await app.request('/api/v1/config/backups', { headers })).json()) as {
      data: Array<{ id: string }>
    }
    expect(Array.isArray(list.data)).toBe(true)
    expect(list.data.some((b) => b.id === created.data.id)).toBe(true)
    const restored = await app.request(`/api/v1/config/backup/${created.data.id}/restore`, {
      method: 'POST',
      headers,
    })
    expect(restored.status).toBe(200)
  })
})

describe('music routes (stub sources)', () => {
  it('GET /api/v1/search returns stub results; missing keyword -> 400', async () => {
    const cfg = baseConfig()
    const { app } = createApp(cfg, { sourceManager: stubSources(cfg) })
    const res = await app.request('/api/v1/search?keyword=hello')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { message: string; data: Array<{ name: string }> }
    expect(body.message).toBe('搜索成功')
    expect(body.data[0]!.name).toBe('hello')
    const missing = await app.request('/api/v1/search')
    expect(missing.status).toBe(400)
    expect(((await missing.json()) as { message: string }).message).toBe('搜索关键词不能为空')
  })

  it('GET /api/v1/match validates id and returns a URL', async () => {
    const cfg = baseConfig()
    const { app } = createApp(cfg, { sourceManager: stubSources(cfg) })
    const missing = await app.request('/api/v1/match')
    expect(missing.status).toBe(400)
    const res = await app.request('/api/v1/match?id=123')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { message: string; data: { url: string; source: string } }
    expect(body.message).toBe('匹配成功')
    expect(body.data.url).toContain('123')
    expect(body.data.source).toBe('gdstudio')
  })

  it('GET /api/v1/ncmget rejects invalid quality', async () => {
    const cfg = baseConfig()
    const { app } = createApp(cfg, { sourceManager: stubSources(cfg) })
    const res = await app.request('/api/v1/ncmget?id=1&br=666')
    expect(res.status).toBe(400)
    expect(((await res.json()) as { message: string }).message).toContain('不支持的音质')
  })

  it('GET /api/v1/picture validates size and returns url', async () => {
    const cfg = baseConfig()
    const { app } = createApp(cfg, { sourceManager: stubSources(cfg) })
    const badSize = await app.request('/api/v1/picture?id=9&size=100')
    expect(badSize.status).toBe(400)
    const res = await app.request('/api/v1/picture?id=9&size=500')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { url: string } }
    expect(body.data.url).toContain('9.jpg')
  })
})
