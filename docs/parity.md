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

## P4+ — 待补充

UNM / lyric / meting / gateway 移植完成后在此追加对照记录。
