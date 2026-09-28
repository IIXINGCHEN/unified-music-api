# P4 Lyric 服务迁移对照（parity-p3-lyric）

源：`~/workspace/music-api-audit/repos/Lyric-Atlas-API/api/`（10 个 TS 文件，1738 行）
目标：`apps/lyric`（包名 `@music-api/lyric`）
迁移日期：2026-09-28

## 文件对照

| 源文件 | 目标文件 | 说明 |
|---|---|---|
| `api/index.ts` | `src/index.ts`（重写） | Hono app，见下"Edge→Node 改动" |
| `api/cache.ts` | `src/cache.ts` | 原样迁移（仅 import 加 `.js` 后缀、biome 格式化） |
| `api/httpClient.ts` | `src/httpClient.ts` | 同上 |
| `api/lyricService.ts` | `src/lyricService.ts` | 同上 + 1 处类型修复（见下） |
| `api/utils.ts` | `src/utils.ts` | 同上 |
| `api/workers.ts` | `src/workers.ts` | 同上（已是 Promise.all 实现，无 worker_threads） |
| `api/fetchers/externalApiFetcher.ts` | `src/fetchers/externalApiFetcher.ts` | 同上 |
| `api/fetchers/repositoryFetcher.ts` | `src/fetchers/repositoryFetcher.ts` | 同上 |
| `api/interfaces/fetcher.ts` | `src/interfaces/fetcher.ts` | 同上 |
| `api/interfaces/lyricTypes.ts` | `src/interfaces/lyricTypes.ts` | 同上 |
| `api/worker-scripts/format-checker-worker.js` | （未迁移） | 死代码：没有任何 TS 文件引用它（`workers.ts` 用 Promise.all 代替），故丢弃 |
| — | `src/main.ts`（新增） | `@hono/node-server` 启动入口 |
| — | `src/node-env.d.ts`（新增） | `process.env` 最小 ambient 声明（见下） |
| — | `test/app.test.ts`（新增） | 12 项测试，见下 |

## Edge → Node 改动点（已知偏差）

1. **移除 Vercel Edge 绑定**：删除 `hono/vercel` 的 `handle(app)` 导出、
   `export const runtime = 'edge'`、`preferredRegion`、`config`。
   改为 `src/main.ts` 用 `@hono/node-server` 的 `serve()` 启动，
   `PORT`（默认 3000）/`HOST`（默认空=监听全部接口）环境变量。
2. **保留 `basePath('/api')`**：对外路径不变——`GET /api`、`/api/search`、
   `/api/lyrics/meta`。实测确认 `api.get("/")` 在 basePath 下注册为 `/api`
   （与原版 Edge 代码行为一致）。
3. **新增 `GET /health`**（P3 约定）：`{status:"ok",service:"lyric"}`，
   注册在 basePath 之外，不影响 `/api/*`。
4. **app 工厂化**：`createApp()` 导出供测试复用；模块级仍导出单例 `app`
  （`main.ts` 使用）。
5. **缓存清理 timer `unref()`**：`setupCacheCleanup()` 的 15 分钟 interval
   在 Node 下会阻止进程退出（vitest 挂起）。生产行为不变（server 本身
   保持 event loop），仅对 timer 做 `unref`，测试进程可干净退出。
6. **`process.env` 类型**：本包不依赖 `@types/node`（parent 已锁依赖），
   新增 `src/node-env.d.ts` 做最小 ambient 声明；运行时即 Node 原生 `process`。
7. **`c.status(statusCode as any)` → `as StatusCode`**：原版为绕过 Hono 字面量
   类型用的 `as any`；改为 `hono/utils/http-status` 的 `StatusCode` 断言，
   行为一致、类型更严。
8. **`lyricService.ts` 一处类型收紧**：`let externalData;`（noImplicitAnyLet
   报错）改为显式 JSON 结构类型；原先是隐式 `any`，运行时行为不变。

## 行为保留确认

- CORS：`origin: "*"`，`allowMethods: ["GET", "OPTIONS"]`（`api.use("*")`）。
- `prettyJSON()` 中间件保留。
- `setupCacheCleanup()` 默认 15 分钟清理；`metadataCache`（30min TTL/2000 条）、
  `lyricsCache`（60min TTL/1000 条）参数不变。
- `LyricProvider.search` 全部逻辑不变：缓存键格式、TTML 优先、6 秒总超时、
  fixedVersion（yrc/lrc 并行仓库+外部）、fallback 指定顺序。
- `getLyricMetadata` 并行检查 + 提前返回逻辑不变。
- `EXTERNAL_NCM_API_URL` 缺失时 `/api/search` 返回 500
  `{found:false, error:"Server configuration error."}`（与原版顺序一致：
  先查配置再查 `id`）。
- `p-limit` 并发 15 的 `httpClient` 保持不变。

## 门禁（2026-09-28，`pnpm --filter @music-api/lyric`）

- `build`（tsc strict）：✅ 0 error
- `lint`（biome check src）：✅ 0 error，20 warnings（全部
  `lint/suspicious/noExplicitAny`，源自原版代码中的 `any`，与 P2/P3 遗留同类）
- `test`（vitest run）：✅ 12/12
- 真实启动冒烟（`node dist/main.js`，PORT=18731）：`/health` 200、
  `/api` 200、未配 `EXTERNAL_NCM_API_URL` 时 `/api/search` 返回原版 500 信封

## 测试覆盖（test/app.test.ts，fetch 全部 stub，不依赖真实网络）

1. `GET /health` → ok
2. `GET /api` → running message
3. `OPTIONS /api/search` → 204 + `access-control-allow-origin: *`
4. `/api/search` 缺 `id` → 400
5. `/api/search` 未配 `EXTERNAL_NCM_API_URL` → 500
6. 仓库 TTML 命中（外部也有歌词，TTML 优先）→ 200 repository/ttml
7. 相同搜索第二次请求 → 缓存命中，fetch 调用数不变
8. `fixedVersion=yrc` → 外部 API 命中，带 translation/romaji
9. 两处都无歌词 → 404
10. `/api/lyrics/meta` 缺 `id` → 400
11. `/api/lyrics/meta` → 仓库 HEAD 检查报告 ttml/lrc
12. `/api/lyrics/meta` → 外部翻译/罗马音可用性
