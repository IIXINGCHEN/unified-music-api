# 兼容性（parity）总览

v2 TypeScript/Hono 重写与原版实现的逐项对照记录。

## P2 — 接口模块迁移

- 网易云 440 模块 → `apps/netease/src/modules/*.ts`：契约 423/423（100%），17 跳过全部文档化。见 `docs/p2-netease-report.md`。
- 酷狗 228 单元（226 公开路由 + 2 内部 helper）→ `apps/kugou/src/modules/*.ts`：契约 226/226（100%）。

## P3 — 服务端（Hono）移植

- 网易云：`apps/netease/src/server.ts`（`constructServer` / `serveNcmApi`）+ `main.ts` + `generateConfig.ts`。详见 `docs/parity-p3-netease.md`。
- 酷狗：`apps/kugou/src/server.ts`（`constructServer` / `startService`）+ `main.ts`。详见 `docs/parity-p3-kugou.md`。
- 共享：`packages/http-kit`（cookie 解析 / CORS / 2 分钟响应缓存 / 模块扫描 / multipart / 客户端 IP）。

### 已知有意偏差（两 app 通用）

1. **内存缓存上限 1000 条**：原版 apicache 内存缓存无上限；新版淘汰最旧项（内存安全）。
2. **超限返回 413**：原版 `abortOnLimit` 直接销毁连接；新版返回 413 JSON。
3. **无效 JSON → 400**：原版 express.json 默认抛错走 400 HTML；新版返回 400 JSON 信封。
4. **无 `public/` 静态目录**：原版 `express.static(public/)` 优先；本仓库两 app 均无该目录，分支保留但未启用。
5. **函数名拼写修正**：酷狗原版 `consturctServer` → `constructServer`。

### Hono 移植要点（踩坑记录）

- handler 直接 `return new Response()` 会丢掉上游中间件经 `c.header()` 预置的头（CORS 等）；必须用 `c.newResponse()` 合并。头以普通 record 传递（数组值自动 append，满足多 Set-Cookie；`Headers` 实例会被 Hono 的 `Object.entries()` 静默忽略）。
- query 解析器必须按原版 Express 版本选择：网易云原版 Express 5 → simple 语义；酷狗原版 Express 4 → extended（qs）语义。

## P4 — UNM / lyric / meting / gateway

| 服务 | 源 | 目标 | 详情 |
|---|---|---|---|
| unm | `unm-music-api/src`（28 文件，Hono+TS） | `apps/unm` | `docs/parity-p3-unm.md`。零逻辑改写；`public/` 静态资源迁入并实机 served；`VERSION` 4.5.0；`MONITOR_SECRET_KEY` 强校验（无密钥拒绝启动，原版行为）；测试 13/13 |
| lyric | `Lyric-Atlas-API/api`（10 文件，1738 行） | `apps/lyric` | `docs/parity-p3-lyric.md`。Vercel Edge → Node（`hono/vercel` 换 `@hono/node-server`）；保留 `basePath('/api')`；`EXTERNAL_NCM_API_URL` 环境变量；20 处 `any` 为原版继承（biome warning 级）；测试 12/12 |
| meting | `Meting-API`（JS+Hono） | `apps/meting` | `docs/parity-p3-meting.md`。JS→TS；仅保留 spotify/ytmusic provider（tencent/netease 删除，按 P4 决议）；默认 server `tencent`→`spotify`；`deno.js`/vercel 入口删除；测试 18/18 |
| gateway | `gateway/`（Go+Gin） | `apps/gateway` | `docs/parity-p3-gateway.md`。Go→Hono 重写；保留 `/api/v1/platform/{name}/{path}`（404/502 信封）、鉴权、HTTPS、UA/IP 白名单、限流、缓存、system/config API、健康检查、静态文件、404/405；`/metrics` 保持 JSON 信封（非 Prometheus）；插件框架/热加载不保留；**修复性偏差**：Go 版 ControllerManager 误把 controller 注册在父 group 导致鉴权实际未生效，TS 按安全意图真正保护 system/config（`enable_auth=false` 可回旧行为）；测试 25/25 |

四服务均已实机冒烟（health / CORS / 路由 / 鉴权分支）。
