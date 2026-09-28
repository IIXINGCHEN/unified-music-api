# unified-music-api

统一音乐 API：把名下 9 个音乐 API 仓库审计、去重、整合为**一个仓库**。

- **网关**（Go + Gin，沿用 `music-api-proxy`）：统一入口、鉴权、限流、监控、聚合
- **平台微服务**（原样迁入，零业务改写）：
  - `services/netease` — 网易云音乐全接口（440，`api-enhanced`）
  - `services/kugou` — 酷狗音乐全接口（228，`KuGouMusicApi`）
  - `services/unm` — 解灰 / 多源匹配（`unm-music-api`，Hono+TS）
  - `services/lyric` — TTML 逐字歌词（`Lyric-Atlas-API`，Hono，新增独立运行入口）
  - `services/meting` — Meting 精简版（**仅** `spotify` / `ytmusic` 两个独有 provider）
- **已退役**（功能被超集覆盖）：`neteasecloudmusicapienhanced-api-enhanced`、
  `meting-api-1.5.11`、`meting-api-p`

完整审计报告：`../music-api-audit/AUDIT.md`（审计期快照）

## 快速开始

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
路径与 query 原样透传给对应平台微服务，平台原生接口 100% 兼容。

示例：

| 统一入口 | 等价直连 |
|---|---|
| `/api/v1/platform/netease/song_url?id=123` | `netease:3001/song_url?id=123` |
| `/api/v1/platform/kugou/search?keyword=周杰伦` | `kugou:3002/search?keyword=周杰伦` |
| `/api/v1/platform/unm/match?id=123` | `unm:3003/match?id=123` |
| `/api/v1/platform/lyric/api/search?id=123` | `lyric:3004/api/search?id=123` |
| `/api/v1/platform/meting/api?server=spotify&type=playlist&id=xxx` | `meting:3005/api?server=spotify…` |

网关原有的聚合接口（`/api/v1/search`、`/api/v1/lyric`、`/api/v1/match`…）保持不变。

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

- OpenAPI 3.1：[`contracts/openapi.yaml`](contracts/openapi.yaml)
- Scalar 文档页：[`docs/api.html`](docs/api.html)

## 开发

```bash
# 网关构建门禁（需 Go 1.24+）
cd gateway && go build ./... && go vet ./...

# 仓库断言（29 项：结构 / 功能完整性 / 去重 / 契约）
bash scripts/assert.sh
```

## 仓库结构

```
unified-music-api/
├── gateway/            # Go 网关（music-api-proxy 迁入 + platform 聚合控制器）
├── services/
│   ├── netease/        # 网易云 440 接口（Node 22）
│   ├── kugou/          # 酷狗 228 接口（Node 22）
│   ├── unm/            # 解灰服务（Node 22，需构建）
│   ├── lyric/          # 歌词服务（Node 22，tsx 直跑）
│   └── meting/         # Meting 精简版（Node 22）
├── contracts/          # OpenAPI 3.1 统一契约
├── docs/               # Scalar API 文档
├── deploy/             # docker-compose.yml
└── scripts/            # assert.sh 断言门禁
```

## 许可

MIT。各 `services/` 子目录保留其原始 LICENSE 与版权声明。
