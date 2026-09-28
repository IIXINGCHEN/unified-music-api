# unified-music-api

统一音乐 API：9 个音乐 API 仓库审计、去重、整合，并以 **TypeScript + Hono** 全面重构为单体 monorepo。

- **网关**（`apps/gateway`，Hono）：统一入口、鉴权、限流、平台聚合反代、健康检查
- **平台服务**（Hono，行为与原版一致）：
  - `apps/netease` — 网易云音乐全接口（440）
  - `apps/kugou` — 酷狗音乐全接口（226）
  - `apps/unm` — 解灰 / 多源匹配
  - `apps/lyric` — TTML 逐字歌词转换链
  - `apps/meting` — Meting（**仅** `spotify` / `ytmusic` 两个独有 provider）
- **共享包**（`packages/`）：`ncm-crypto`、`ncm-core`、`kugou-crypto`、`kugou-core`、`http-kit`、`contracts`
- **已退役**（功能被超集覆盖，待归档删除）：`neteasecloudmusicapienhanced-api-enhanced`、
  `meting-api-1.5.11`、`meting-api-p`

技术栈：TypeScript 5.8（strict）· Hono 4 · Node.js 22 LTS · pnpm 10 + Turborepo ·
Zod + `@hono/zod-openapi` · Scalar · Vitest · Biome

## 快速开始

```bash
pnpm install
pnpm build
pnpm dev          # 或按服务单独启动
```

容器一键编排：

```bash
cd deploy
docker compose up -d --build
# 网关：http://localhost:8080
```

## 统一路由

```
GET/POST /api/v1/platform/{name}/{path}?query...
```

`{name}` 取值：`netease` `kugou` `unm` `lyric` `meting`。
路径与 query 原样透传给对应平台服务，平台原生接口 100% 兼容。

示例：

| 统一入口 | 等价直连 |
|---|---|
| `/api/v1/platform/netease/song_url?id=123` | `netease:3001/song_url?id=123` |
| `/api/v1/platform/kugou/search?keyword=周杰伦` | `kugou:3002/search?keyword=周杰伦` |
| `/api/v1/platform/unm/match?id=123` | `unm:3003/match?id=123` |
| `/api/v1/platform/lyric/api/search?id=123` | `lyric:3004/api/search?id=123` |
| `/api/v1/platform/meting/api?server=spotify&type=playlist&id=xxx` | `meting:3005/api?server=spotify…` |

网关原生聚合接口（`/api/v1/search`、`/api/v1/lyric`、`/api/v1/match`…）保持可用。
未知平台返回 404，上游不可用返回 502（均带 `platform` 字段）。

## 服务端口（compose 内）

| 服务 | 端口 | 环境变量覆盖 |
|---|---|---|
| gateway | 8080（宿主） | `PORT` |
| netease | 3001 | `PORT` |
| kugou | 3002 | `PORT` |
| unm | 3003 | `PORT` / `HOST` |
| lyric | 3004 | `PORT` / `EXTERNAL_NCM_API_URL`（已默认指向内部网易云） |
| meting | 3005 | `PORT` / `SPOTIFY_API` / `YT_API`（上游解析后端，按需配置） |

网关到各平台的上游地址也可用环境变量覆盖：
`PLATFORM_NETEASE_URL`、`PLATFORM_KUGOU_URL`、`PLATFORM_UNM_URL`、
`PLATFORM_LYRIC_URL`、`PLATFORM_METING_URL`。

## API 文档

- 各服务 `/docs`（Scalar，运行时生成）
- 文档枢纽：[`docs/api.html`](docs/api.html)
- 需求基线：[`docs/PRD.md`](docs/PRD.md) · 兼容性对照：[`docs/parity.md`](docs/parity.md)

## 开发

```bash
pnpm install          # 安装依赖（CI 用 --frozen-lockfile）
pnpm build            # 构建全部 12 个包
pnpm lint             # Biome 检查
pnpm test             # Vitest 全量测试
bash scripts/assert.sh  # 73 项仓库断言门禁（结构 / 功能完整性 / 去重 / 契约）
```

## 仓库结构

```
unified-music-api/
├── apps/
│   ├── gateway/    # Hono 网关（鉴权 / 限流 / 平台聚合反代 / 健康检查）
│   ├── netease/    # 网易云 440 接口
│   ├── kugou/      # 酷狗 226 路由
│   ├── unm/        # 解灰 / 多源匹配
│   ├── lyric/      # TTML 逐字歌词
│   └── meting/     # Meting（spotify / ytmusic）
├── packages/
│   ├── ncm-crypto/ ncm-core/          # 网易云加密与请求核心
│   ├── kugou-crypto/ kugou-core/      # 酷狗签名与请求核心
│   ├── http-kit/                      # 共享：缓存 / 限流 / 日志 / 错误信封
│   └── contracts/                     # OpenAPI 注册表与共享 schema
├── deploy/         # docker-compose.yml + 参数化 Dockerfile
├── docs/           # PRD / parity / 差分报告 / Scalar 文档枢纽
└── scripts/        # assert.sh 断言门禁
```

## 许可

MIT。
