# P3 网易云服务端移植 — parity 记录

原版：`~/workspace/music-api-audit/repos/api-enhanced/server.js`（Express，461 行）+ `app.js`
移植：`apps/netease/src/server.ts`（Hono 4）+ `src/main.ts` + `src/generateConfig.ts`
共享件：`@music-api/http-kit`（cookie / CORS / cache / IP / 模块扫描 / multipart）

## 逐项对照

| 原版行为 | 移植 | 说明 |
|---|---|---|
| `getModulesDefinitions`：readdir → reverse 反序 → `.js` 且非 `_` 开头 → `_`→`/` 路由 | `getModuleDefinitions()` + `scanModuleFiles` | 440/440；源码扫 `.ts`、dist 扫 `.js` |
| 特殊路由 `daily_signin` / `fm_trash` / `personal_fm` 硬编码在 `server.js` 的 `special` 对象 | 同名三路由显式注册 | 与原版一致 |
| 每个模块 `app.all(route, handler)`（全部 HTTP 方法） | `app.all(route, …)` | 一致 |
| 中间件顺序：static → CORS → cookieParser → json/urlencoded/fileUpload → apicache → 路由 | CORS → cookie → body → cache → 路由 | static 见偏差 1 |
| CORS：`CORS_ALLOW_ORIGIN` 逗号名单反射（带 `Vary: Origin`），未设置则反射请求 origin；Allow-Methods `PUT,POST,GET,DELETE,OPTIONS`；Allow-Headers `X-Requested-With,Content-Type`；Allow-Credentials `true`；API 路径强制 `Content-Type: application/json`；OPTIONS → 204 | `corsMiddleware({mode:"reflect-list",…})` | 逐字一致；Hono 下 handler 必须用 `c.newResponse()`（而非 `new Response`）才能合并中间件预置头——这是本次 P3 修复的两个测试失败的根因 |
| Cookie 解析：`/(;)\s+\|(?<!\s)\s+$/g` 分割，`=` 缺失/末尾丢弃，safe-decode + trim | `parseCookieHeader` | 正则逐字一致 |
| body：`express.json({limit:'500mb'})` / `urlencoded({extended:false, limit:'500mb'})` / `express-fileupload({limits:{fileSize: 500*1024*1024}})` | `MAX_UPLOAD_SIZE_BYTES = 500MB`；Content-Length 预检查 | 超限见偏差 2 |
| multipart 文件形状：express-fileupload 的 `{name, data: Buffer, mimetype, md5(), mv(), tempFilePath}` | `{name, mimetype, size, data: Buffer, tempFilePath（真实磁盘文件）, md5, mv}` | 文件同时落盘（部分原版模块只用 `file.tempFilePath`，部分只用 `file.data`），见 http-kit 文档 |
| urlencoded `extended: false`（flat，无嵌套） | `parseFlatForm`（URLSearchParams） | 一致 |
| 缓存：`apicache.middleware('2 minutes', 200)`，key = `hostname + originalUrl + JSON(req.cookies)`（**不含 method/body/Origin** 的怪异语义），`bypass` 头（`x-apicache-bypass`/`x-apicache-force-fetch`），ETag → 304 | `responseCache({ttlMs:120000})` | 语义一致；缓存命中会重放首次响应的全部头（含 CORS 头），与原版 apicache 一致，已有显式 parity 测试锁定 |
| 参数合并：`query = {...req.query, ...req.body, ...req.files}`；`query.cookie` 字符串 → `cookieToJson(safeDecode(...))`；注入 `query.ip`（`X-Forwarded-For` 首项 / `X-Real-IP` / socket，去 `::ffff:` 前缀）；无 cookie 时 `query.cookie = {}` | 逐字一致 | `getClientIp()` 在 http-kit |
| 客户端 IP 为空或 `::1` → `randomCNIP = generateRandomChineseIP()`，注入请求选项 | `getCnIp()`（ncm-core，懒生成） | 一致 |
| `/song/url/v1`：`ENABLE_GENERAL_UNBLOCK=true` 时响应走通用解灰 | 逐字一致 | `@neteasecloudmusicapienhanced/unblockmusic-utils` |
| `song.url` 含 `kuwo` 且有 `query.proxy` → `song.proxyUrl = proxy + song.url` | 逐字一致 | — |
| 成功响应：`Set-Cookie`（`cookie1=…; Path=/`，https 追加 `; SameSite=None; Secure`）；`noCookie` 时跳过；重定向（`body.code===302` 且 `body.data.url`）→ 302 + `Location`；Buffer body → `application/octet-stream` | `buildResponse` + redirect 分支 | 一致；`x-forwarded-proto: https` 也视为 https（原版 Express trust proxy 语义） |
| 失败：无 body → 404 `{code:404,data:null,msg:"Not Found"}`；`code == '301'` → `msg: "需要登录"`；否则透传 status+body | 逐字一致 | `==` 宽松比较保留（biome-ignore 注明） |
| 日志：`[INFO] Request Success` / `[ERR]` | `logger` | 一致 |
| `serveNcmApi({checkVersion})`：npm 版本检查（exec `npm info`）、ASCII banner、`PORT`（默认 3000）/`HOST` 监听 | 逐字一致 | `@hono/node-server` serve |
| `/health` | 保留 | — |
| 启动：`app.js` 确保 `tmpdir/anonymous_token` 存在 → `generateConfig()`（刷新匿名 token + xeapi 公钥）→ `serveNcmApi({checkVersion:true})` | `main.ts`：`dotenv/config` → `generateConfig()` → `serveNcmApi({checkVersion:true})` | `generateConfig.ts` 复刻原逻辑：setCnIp、写空 token 文件兜底、调 `register_anonimous` 模块取 `MUSIC_A` 写回、调 `register_xeapikey` 模块刷新公钥（含 `sk` 回退与缺失抛错）；每步 try/catch 与原版一致 |
| token 接线：`util/request.js` require 时同步读 `tmpdir/anonymous_token` 与 `xeapi_public_key`；checktoken 走 `register_checktoken_v2/v3` 模块 | `initNcmCore({getCheckToken})` 显式接 v2/v3 模块；token/xeapi key 用 ncm-core 默认懒加载（同文件、同语义，首次使用时读） | 见偏差 5 |

## 已知偏差（DEVIATION）

1. **无 `public/` 静态目录**：原版 `express.static(public/)` 挂载在本仓库不存在的目录，移植版跳过（无静态资源可服务）。
2. **multipart 超限 → 413**：原版 express-fileupload 超限直接销毁 socket；移植版返回 413 JSON（http-kit 已有文档）。
3. **缓存上限 1000 条**：原版 apicache/memory-cache 无界；移植版按插入顺序淘汰最旧（防内存泄漏）。
4. **Hono 头合并机制**：handler/缓存命中必须走 `c.newResponse()`（显式头用普通 record 传递，数组值自动 append），直接 `new Response()` 会丢掉 CORS 等中间件头。这是 Hono 与 Express 的实现差异，对外行为与原版一致。
5. **token 读取时机**：原版 require 时同步读（文件缺失即崩）；移植版为懒加载（首次请求时读），且 `generateConfig()` 在启动时保证文件存在并刷新。行为等价，可靠性更高。
6. **main.js 的逐模块函数导出**：原版 `main.js` 把每个 module 导出为同名函数供库引用；v2 只做 HTTP 服务，该导出不在范围（index.ts 只导出 server 相关）。

## 测试

`test/server.test.ts` 23 项（stub 模块，零真实网络），覆盖：注入路由/全部 HTTP 方法/health、440 模块扫描、特殊路由、`_`→`/`、CORS 反射+名单+Vary+OPTIONS、cookie 头解析、query cookie 字符串转换、缓存命中/key 含 cookie/bypass/缓存重放 CORS 头（原版怪异语义锁定）、多 Set-Cookie、`noCookie`、重定向、404 信封、301 登录提示、错误透传、JSON/urlencoded/multipart（含真实临时文件与 `data`/`md5`/`mv` 形状）。

门禁（2026-09-28）：`build` ✅、`lint`（Biome，448 文件）✅、`test` 43/43 ✅、`contract` 423/423（migration-fail 0，harness-error 0）✅。
