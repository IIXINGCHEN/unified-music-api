# 统一路由

> 更新时间：2026-09-28

## 1. 平台反代

网关将五个平台服务统一到一个入口：

```
GET/POST /api/v1/platform/{name}/{path}?query...
```

`{name}` 取值：

| name | 服务 | 直连端口 |
|------|------|----------|
| `netease` | 网易云音乐 | 3001 |
| `kugou` | 酷狗音乐 | 3002 |
| `unm` | UNM 解灰 | 3003 |
| `lyric` | Lyric 歌词 | 3004 |
| `meting` | Meting | 3005 |

路径与 query 原样透传。未知平台返回 404，上游不可用返回 502。

示例：

```bash
# 经网关查网易云歌曲详情
curl "http://localhost:8080/api/v1/platform/netease/song/detail?ids=186016"

# 经网关查酷狗搜索
curl "http://localhost:8080/api/v1/platform/kugou/search?keywords=周杰伦"
```

## 2. 原生聚合接口

网关自身提供的聚合能力：

- `GET /api/v1/search` — 跨平台搜索
- `GET /api/v1/lyric` — 歌词聚合
- `GET /api/v1/match` — 多源匹配

## 3. 上游地址覆盖

各平台上游地址可通过环境变量覆盖（默认 Docker 服务名，本地开发时设为 localhost）：

```bash
PLATFORM_NETEASE_URL=http://localhost:3001
PLATFORM_KUGOU_URL=http://localhost:3002
PLATFORM_UNM_URL=http://localhost:3003
PLATFORM_LYRIC_URL=http://localhost:3004
PLATFORM_METING_URL=http://localhost:3005
```
