# P4 Meting 服务 TS 移植 — parity 记录

原版：`~/workspace/music-api-audit/repos/Meting-API/`（JS + Hono，`meting-backend-js@1.1.2`）
移植：`apps/meting/src/`（TypeScript strict）+ `src/main.ts`（`@hono/node-server`）
包名：`@music-api/meting`

## 源 → 目标文件对照

| 原版文件 | 移植目标 | 说明 |
|---|---|---|
| `src/providers/spotify/index.js` + `src/providers/spotify/config.js` | `src/providers/spotify.ts` | `handle(type,id)`：support_type 校验→-1，否则 `fetch(SPOTIFY_API + "?server=spotify&type=…&id=…").json()` |
| `src/providers/ytmusic/index.js` + `src/providers/ytmusic/config.js` | `src/providers/ytmusic.ts` | 同上，`server=ytmusic`，基址 `YT_API` |
| `src/providers/index.js` | `src/providers/index.ts` | 只注册 spotify/ytmusic；`register/get/get_provider_list` 同名保留 |
| `src/providers/netease/**`、`src/providers/tencent/**` | （删除） | P4 精简决议：被原生网易云/酷狗服务覆盖，不移植 |
| `src/util.js` | `src/util.ts` | `format`（歌词+翻译合并）、`trimLyric`、`getPathFromURL`、`get_runtime`、`get_url` 逐字移植并加类型 |
| `src/config.js` | `src/config.ts` | `PORT`/`OVERSEAS`；`SPOTIFY_API`（`SPOTIFY_API → YT_API` 回退链保留）、`YT_API`；改为懒读取（生产行为一致、测试可覆盖） |
| `src/example.js` | `src/example.ts` | 原版 spotify/ytmusic 条目是注释掉的，移植版启用；tencent/netease 条目随 provider 删除 |
| `src/service/api.js` | `src/service/api.ts` | 见下「api 行为对照」 |
| `src/template.js` | `src/template.ts` | `/test` 演示页；只渲染已移植 provider 的示例 |
| `app.js` | `src/app.ts` | `createApp()`：cors + logger + `GET /api` + `GET /test` + `GET /` 状态页；新增 `GET /health`（compose/CI 用） |
| `node.js` | `src/main.ts` | `serve({fetch, port, hostname})`，PORT/HOST 环境变量（默认 3000） |
| `deno.js`、`api/index.js`（vercel/edge 适配）、`esbuild.config.js` | （删除） | 目标只跑 Node.js |
| `test/providers.test.js` | `test/meting.test.ts` | 见下「测试」 |

## api 行为对照

| 原版行为 | 移植 | 说明 |
|---|---|---|
| `server` 默认为 `'tencent'` | 默认为 `'spotify'` | **有意偏差**（见下） |
| `type` 默认为 `'playlist'`，`id` 默认为 `'7326220405'` | 逐字保留 | 默认 id 仍是原版字面量 |
| server 不在 provider 列表或 type 不在 `support_type` → 400 `{status:400, message:"server 参数不合法", param}` | 逐字保留 | 状态码用 `c.status(400)` + `c.json`，信封不变 |
| `type=url`：上游返回空 → 403 `{error:"no url"}` | 逐字保留 | |
| `type=url`：`@` 开头 → text 原样返回 | 逐字保留 | |
| `type=url`：否则 `ctx.redirect(url)`（302） | `c.redirect(url)`（302） | 一致 |
| `type=pic` → redirect | 逐字保留 | |
| `type=lrc` → `format(lyric, tlyric)` text | 逐字保留 | |
| json 列表：`url/pic/lrc` 为裸 id 时补全为 `${get_url(c)}?server=…&type=…&id=…`；`@` 开头/`http` 开头/空字符串不补全 | 逐字保留 | 字段名白名单 `["url","pic","lrc"]` 保留 |
| `get_url`：`X-Forwarded-Host/Url` 前缀、`http://` 补全、vercel→https | 逐字保留 | |

## 已知偏差（DEVIATION）

1. **删除 tencent/netease provider**：P4 精简决议。`GET /api?server=tencent|netease` 现在返回 400（原版可调用）。两者能力已被原生 `apps/netease` / `apps/kugou` 服务覆盖。
2. **默认 server `tencent` → `spotify`**：随 provider 删除而变更；`/api` 不带 `server` 参数时现在走 spotify。
3. **`url/pic/lrc` 对 spotify/ytmusic 返回 400**：不是移植引入的——原版 `support_type` 校验在前，spotify/ytmusic 的 `support_type` 只有 `song/playlist`，原版同样 400。这些分支代码逐字保留（原版通过 tencent/netease 可达）。测试用注入的 fake provider 覆盖了分支逻辑。
4. **`/test` 页不再含 tencent/netease 示例**；`/test` 与 `/` 状态页保留。
5. **`/health` 新增**：原版无此路由，为 compose/CI 健康检查新增，不影响原有路由。
6. **`src/main.ts` 只支持 Node**：原版另有 `deno.js` / vercel `api/index.js` 入口，目标栈统一 Node 22，不再提供。
7. **状态页版本号**：`app.js` 状态页写死 `1.1.2`（原包版本），移植版写本包版本 `2.0.0`。
8. **config 懒读取 env**：原版模块加载时一次性读取；移植版每次调用读取，生产可观测行为一致，测试可覆盖。

## 测试

`test/meting.test.ts`：18 项，全部通过，fetch 上游全部 stub（零真实网络）：

- provider 注册表：仅 `spotify`/`ytmusic`；各自 `support_type` 含 song/playlist；不支持的 type → -1
- 参数校验：非法 server → 400 + `server 参数不合法`；非法 type → 400；缺省 server 走 spotify（断言上游 URL 含 `server=spotify`）
- 四个 type 分支（注入 fake provider）：url 空 → 403；url `@` → text；url http → 302；pic → 302；lrc → 格式化文本；另断言 spotify 下 url/pic/lrc → 400（与原版一致）
- json 列表补全：裸 id 补全为完整 api URL，`@`/`http` 前缀原样保留
- 页面：`/test` 200 含 meting-js；`/` 200 状态页；`/health` 200
- `format` 工具：翻译合并 / 无翻译原样返回

## 门禁

- `tsc -p tsconfig.json`（strict）✅
- `biome check src test` ✅
- `vitest run` 18/18 ✅
- 实机冒烟（tsx 启动，PORT=3457）：`/health` 200、`/api?server=nope` 400、`/` `/test` 200 ✅

（注：沙箱重启后 pnpm 二进制丢失且任务禁止联网重装，门禁直接用各包 `node_modules/.bin` 下的 tsc/biome/vitest 执行，依赖未变动。）
