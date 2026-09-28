# P4 UNM 解灰服务移植 — parity 记录

原版：`~/workspace/music-api-audit/repos/unm-music-api/`（Hono 4 + TypeScript，已是现代栈）
移植：`apps/unm/`（包名 `@music-api/unm`，monorepo 对齐）
入口：`src/index.ts`（`@hono/node-server` serve，PORT/HOST 环境变量，默认 127.0.0.1:5678）
版本：4.5.0（`VERSION` 文件，随包迁入）

> 与 P3 的网易云/酷狗不同：UNM 原版已是 Hono + TypeScript，本次是**整体迁入**
> 而非重写。逻辑零改写，仅做 monorepo 对齐层面的最小调整（见下表）。

## 逐项对照

| 原版行为 | 移植 | 说明 |
|---|---|---|
| `src/` 28 个 TS 文件（app / config / middlewares / routes / services / types / utils） | 原样迁入 `apps/unm/src/`，目录结构不变 | import 均带 `.js` 后缀，与 `moduleResolution: NodeNext` 直接兼容 |
| `src/index.ts`：端口可用性探测（占用则 +1，最多 20 次）、serve、TOCTOU 兜底、SIGINT/SIGTERM 优雅停机 | 保留，仅 `(err: any)` → `NodeJS.ErrnoException` | 行为一致 |
| `configEnv.ts`：zod 环境变量校验；**`MONITOR_SECRET_KEY` 为空时进程拒绝启动**；`withPlatformCookies` 限时注入第三方 Cookie | 保留 | 环境变量与原仓库完全一致（HOST/PORT/ALLOWED_DOMAIN/GDSTUDIO_API_URL/REQUEST_TIMEOUT/PROXY_URL/CACHE_* /DEFAULT_*/UNM 开关/QQ\|JOOX\|MIGU\|KUWO_COOKIE/限流与代理信任配置） |
| `configVersion.ts`：VERSION 文件 → `__APP_VERSION__` 注入 → 兜底 `4.5.0` | 保留；`VERSION` 文件随包迁入 `apps/unm/VERSION` | 实机验证 `/info` 返回 `4.5.0` |
| CORS：`ALLOWED_DOMAIN=*` 时返回 `*`，否则严格 hostname 校验；OPTIONS 放行 | 保留 | 一字未动 |
| 域名访问控制中间件（Origin/Referer 白名单，403） | 保留 | 一字未动 |
| 滑动窗口限流（豁免 `/health` `/ping` `/assets/` `/dashboard` `/monitor` 等，`RateLimit-*` 头） | 保留 | 一字未动 |
| 鉴权：`/api/monitor/*` 与 `/health?verbose` 需 `x-api-key` / `Authorization: Bearer`，恒定时间比较 | 保留 | 一字未动 |
| 路由：`/` 首页（内联 CSS）、`/dashboard` `/monitor` 大盘、`serveStatic` 静态资源、404 兜底（HTML/JSON 双分支）、onError 500 | 保留 | 一字未动 |
| 业务路由：`/info` `/health` `/ping`、`/test` `/match` `/ncmget` `/otherget`、`/search` `/pic` `/picture` `/lyric` `/playlist/:id` `/relay`、`/api/monitor/data` `/api/monitor/clear` | 保留 | 一字未动 |
| `public/`（index.html / dashboard.html / 404.html / assets / vendor / favicon.png） | 整体迁入 `apps/unm/public/` | `resolvePublicFile` 按 cwd/模块目录多候选解析，实机验证首页与大盘均 200 |
| `@unblockneteasemusic/server@0.28.0` 接线（gdstudio/pyncmd/joox provider 注入、平台 Cookie 限时注入、15s 超时降级链） | 保留；无类型声明的引擎 surface 补最小结构类型（`UnmSongInfo` / `UnmProvider` / `UnmConsts` / `UnmMatchFn`） | 运行时行为一致；消除了全部 `any` |
| `sanitizeQuery` 等工具函数的 `any` | 收紧为泛型/结构类型 | 行为一致 |

## 已知偏差（DEVIATION）

1. **仅格式化层面差异**：`biome check --write` 统一了 import 排序与代码格式（原仓库未用 Biome），无逻辑变更。
2. **`catch (error: any)` → `catch (error: unknown)`**：错误消息提取改为 `instanceof Error` 守卫；非 Error 抛值时消息由 `error.message`（可能 undefined）变为 `String(error)`，属更安全的行为。
3. **`isNaN` → `Number.isNaN`**：`serviceMonitor` 状态码过滤；`parseInt` 结果恒为 number，行为一致。
4. **测试密钥为固定值**：`test/app.test.ts` 在导入 app 前设置 `MONITOR_SECRET_KEY=test-monitor-secret`（模块加载期强校验所必需），仅测试进程内有效。
5. **原仓库 `scripts/`（sync-version.mjs 等构建脚本）未迁入**：monorepo 由 turbo 统一构建，`__APP_VERSION__` 注入路径保留但当前未启用，版本走 `VERSION` 文件运行时读取。

## 门禁（2026-09-28）

- `pnpm --filter @music-api/unm build` ✅（tsc strict，0 error）
- `pnpm --filter @music-api/unm lint` ✅（biome check，0 error；27 warnings + 4 infos 均为风格类非阻断项）
- `pnpm --filter @music-api/unm test` ✅（13/13，`app.request()` 覆盖 `/` `/health` `/ping` `/info` `/dashboard` `/api/monitor/*` / 404 / CORS / 限流头；上游调用未触发，零真实网络）
- 实机冒烟（`node dist/index.js`，PORT=5678）：`/health` 200、`/` 200 HTML、`/info` version 4.5.0、`/dashboard` 200、`/api/monitor/data` 无密钥 401 ✅
- 敏感值/硬编码 `/tmp` 扫描：无命中 ✅
