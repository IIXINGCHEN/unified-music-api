# API 文档总览

六个微服务的完整接口清单，参数表由源码自动生成。

| 服务 | 端口 | 接口数 | 说明 |
|------|------|--------|------|
| [网易云音乐](/api/netease) | 3001 | 440 | 全接口，参数含必填/默认值 |
| [酷狗音乐](/api/kugou) | 3002 | 226 | 全接口，参数含必填/默认值 |
| [UNM 解灰](/api/unm) | 3003 | 19 | 匹配 / 直链 / 搜索 / 封面 / 歌词 |
| [Lyric 歌词](/api/lyric) | 3004 | 4 | TTML 逐字歌词 |
| [Meting](/api/meting) | 3005 | 4 | spotify / ytmusic |
| [网关](/api/gateway) | 8080 | 52 | 平台反代 + 原生聚合接口 |

## 统一路由（经网关）

```
GET/POST /api/v1/platform/{name}/{path}?query...
```

`{name}` 取值：`netease` `kugou` `unm` `lyric` `meting`。路径与 query 原样透传给对应平台服务。

网关原生聚合接口：`/api/v1/search`、`/api/v1/lyric`、`/api/v1/match`。

::: tip 文档生成
本目录 Markdown 由 `website/scripts/gen-vitepress-docs.py` 从源码自动生成，接口变更后重新生成即可。
:::
