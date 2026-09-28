# P3 酷狗服务端移植 — parity 记录

原版：`~/workspace/music-api-audit/repos/KuGouMusicApi/server.js`（Express，493 行）
移植：`apps/kugou/src/server.ts`（Hono 4）+ `src/main.ts`
共享件：`@music-api/http-kit`（cookie / CORS / cache / IP / 模块扫描）

## 逐项对照

| 原版行为 | 移植 | 说明 |
|---|---|---|
| `getModulesDefinitions`：readdir → reverse → 过滤 `.js` 且非 `_` 开头 → `_`→`/` 路由 | `scanModuleFiles(dir, {skipUnderscore:true, ext})` | 226/226 对齐；`_comment`、`_listen_together_common` 不注册 |
| `app.use(route, handler)` 前缀匹配 | `app.use(route)` + `app.use(route+"/*")` | Hono 的 `app.use(path)` 无通配符时只精确匹配，需双注册还原 Express 语义 |
| CORS simple 模式：`CORS_ALLOW_ORIGIN \|\| origin \|\| '*'`，Allow-Headers `Authorization,X-Requested-With,Content-Type,Cache-Control`，非 `/` 非含点路径强制 `Content-Type: application/json`，OPTIONS → 204 | `corsMiddleware({mode:"simple",…})` | 逐字一致 |
| Cookie 解析：`/(;)\s+\|(?<!\s)\s+$/g` 分割，`=` 缺失/末尾丢弃，safe-decode + trim | `parseCookieHeader` | 正则逐字一致 |
| 平台注入：GUID=md5(getGuid())（启动一次）、serverDev=randomString(10)大写、env KUGOU_API_GUID 是 UUIDv4 则 md5、MID=calculateMid、6 个 KUGOU_API_* ensureCookie、缺失时 Set-Cookie 写回（https `; PATH=/; SameSite=None; Secure`，http `; PATH=/`） | `platformMiddleware()` | 逐字一致；写回经 `pendingSetCookies` 由 route handler 统一 append（顺序：平台先、模块后，与原版一致） |
| Body：json 16mb / urlencoded extended:false 5mb / octet-stream 100mb → Buffer | `bodyParser()` | 语义一致；urlencoded 重复键→数组（querystring 行为） |
| static：`public/`、`docs/` → `/docs` | `serveStatic` + `existsSync` 守卫 | 本仓库无这两个目录，分支未启用 |
| 缓存：`cache('2 minutes', 200)`，key=`hostname+originalUrl+JSON(cookies)`，bypass 头，304/ETag | `responseCache({ttlMs:120000})` | 行为一致；中间件顺序保持 cookie→平台注入→body→cache（key 含注入后 cookie，与原版一致） |
| handler：query/body cookie 字符串→`cookieToJson(decode())`；`{cookie,…params}=query`；octet-stream→`{data:Buffer}`；`query={cookie:{…reqCookies,…cookie},…params,…body}`；Authorization 头→cookie 合并；工厂注入 `config.ip`（`::ffff:` 去前缀）；`[OK]/[ERR]` 日志 | `createRouteHandler` | query 解析用 `qs`（Express 4 默认 extended 解析器） |
| 成功：`!noCookie` 时模块 cookie 写回（https 加 `; PATH=/; SameSite=None; Secure`，http 加 `; PATH=/`）；透传 `moduleResponse.headers`；按 status+body 返回 | `buildResponse` | 逐字一致 |
| 失败：无 body → 404 `{code:404,data:null,msg:"Not Found"}`；否则透传 headers+status+body；**错误路径不写 Set-Cookie** | 同上 | 与原版一致（注意与网易云不同） |
| `startService()`：PORT（默认 3000）/HOST（默认 ""），`app.service=server`，日志 `server running @ http://…` | `startService()` | 一致；HOST 为空时不传 hostname（Node 监听全接口） |
| `constructServer` | `constructServer` | **修正原版 `consturctServer` 拼写错误** |

## 已知偏差（DEVIATION）

1. **超限 body → 413**：原版对 json/urlencoded/raw 未设 limits（实际无限）；移植版按原版注释意图设 16mb/5mb/100mb 并返回 413 JSON。原版超大 body 会直接 OOM 或 hang。
2. **无效 JSON → 400 JSON**：原版 `express.json` 抛错走 Express 默认错误处理器（HTML 错误页）；移植版返回 `{code:400,msg:"Invalid JSON"}`。
3. **缓存存储上限 1000 条**：原版 `memory-cache` 无界；移植版按插入顺序淘汰最旧（防内存泄漏）。
4. **`KUGOU_API_WEBGL` 每次请求随机**：原版即如此（Node 分支 `generateWebGLHash()` 返回随机 uint64）——无 cookie 冷请求的缓存 key 永不命中，与原版 quirk 一致，非偏差。
5. **函数名拼写**：`consturctServer` → `constructServer`（对外 API 更正）。
6. **静态目录**：`public/`、`docs/` 在本仓库不存在，分支保留但未启用。

## 测试

`test/server.test.ts` 22 项（stub 模块，零真实网络），覆盖：226 路由注册/`_` 排除、平台注入 6 cookie 及不覆盖客户端值、query/body/octet-stream/Authorization 合并、前缀匹配、CORS simple+OPTIONS 204、http/https Set-Cookie 后缀、`noCookie`、上游 header 透传、404 信封、错误透传、缓存命中/key 含 cookie/bypass/非 200 不缓存、`/health`、`getClientIp`。
另有冒烟：`PORT=18099` 真实起服，`/search` 全链路返回 502 信封（沙箱无上游网络，符合预期），CORS 反射 + 6 Set-Cookie 正常。
