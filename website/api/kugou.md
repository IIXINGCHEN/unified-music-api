# 酷狗音乐 API

共 226 个接口。直连 `http://localhost:3002`，经网关 `/api/v1/platform/kugou/...`。

## `/ai/recommend`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/ai/recommend/song`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/album`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/album/detail`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/album/detail?id=xxx
```

## `/album/dycover`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/album/shop`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/album/songs`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/album/songs?id=xxx
```

## `/artist/albums`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/artist/albums?id=xxx
```

## `/artist/audios`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/artist/audios?id=xxx
```

## `/artist/audios/new`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/artist/audios/new?id=xxx
```

## `/artist/detail`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/artist/detail?id=xxx
```

## `/artist/follow`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/artist/follow?id=xxx
```

## `/artist/follow/newsongs`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `last_album_id` | 否 | `0` |
| `opt_sort` | 是 | `-` |
| `pagesize` | 否 | `30` |

**示例**：

```
GET http://localhost:3002/artist/follow/newsongs?last_album_id=0&opt_sort=xxx&pagesize=30
```

## `/artist/honour`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/artist/honour?id=xxx
```

## `/artist/lists`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `hotsize` | 否 | `30` |
| `musician` | 否 | `0` |
| `sextypes` | 否 | `0` |
| `type` | 否 | `0` |

**示例**：

```
GET http://localhost:3002/artist/lists?hotsize=30&musician=0&sextypes=0
```

## `/artist/unfollow`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/artist/unfollow?id=xxx
```

## `/artist/videos`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |

**示例**：

```
GET http://localhost:3002/artist/videos?id=xxx&page=1&pagesize=30
```

## `/audio`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/audio/accompany/matching`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `fileName` | 否 | `` |
| `hash` | 是 | `-` |
| `mixId` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/audio/accompany/matching?fileName=&hash=xxx&mixId=xxx
```

## `/audio/ktv/total`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `singerName` | 是 | `-` |
| `songHash` | 是 | `-` |
| `songId` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/audio/ktv/total?singerName=xxx&songHash=xxx&songId=xxx
```

## `/audio/match`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `data` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/audio/match?data=xxx
```

## `/audio/related`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album_audio_id` | 是 | `-` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |
| `show_detail` | 是 | `-` |
| `show_type` | 否 | `0` |
| `sort` | 是 | `-` |
| `type` | 否 | `0` |

**示例**：

```
GET http://localhost:3002/audio/related?album_audio_id=xxx&page=1&pagesize=30
```

## `/blacklist`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/blacklist/list`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/brush`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/captcha/sent`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/comment/album`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |
| `show_classify` | 否 | `1` |
| `show_hotword_list` | 否 | `1` |

**示例**：

```
GET http://localhost:3002/comment/album?id=xxx&page=1&pagesize=30
```

## `/comment/album/send`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album_id` | 是 | `-` |
| `album_name` | 是 | `-` |
| `childrenid` | 是 | `-` |
| `childrenname` | 是 | `-` |
| `content` | 否 | `}`.trim(` |
| `id` | 是 | `-` |
| `name` | 是 | `-` |
| `special_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/comment/album/send?album_id=xxx&album_name=xxx&childrenid=xxx
```

## `/comment/count`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `hash` | 是 | `-` |
| `special_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/comment/count?hash=xxx&special_id=xxx
```

## `/comment/floor`

楼层评论。额外导出 resolveFloorCommentRequestConfig（原版挂在 module.exports 上）。

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `code` | 是 | `-` |
| `mixsongid` | 是 | `-` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |
| `resourceType` | 是 | `-` |
| `resource_type` | 否 | `params.resourceType || ""}`.toLowerCase(` |
| `show_classify` | 否 | `1` |
| `show_hotword_list` | 否 | `1` |
| `special_id` | 是 | `-` |
| `tid` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/comment/floor?code=xxx&mixsongid=xxx&page=1
```

## `/comment/floor/send`

发送楼层回复，支持歌曲、专辑和歌单评论池。额外导出 resolveCode（原版挂在 module.exports 上）。

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album_name` | 是 | `-` |
| `childrenid` | 是 | `-` |
| `childrenname` | 是 | `-` |
| `code` | 是 | `-` |
| `content` | 否 | `}`.trim(` |
| `id` | 是 | `-` |
| `name` | 是 | `-` |
| `playlist_name` | 是 | `-` |
| `resourceType` | 是 | `-` |
| `resource_type` | 是 | `-` |
| `song_name` | 是 | `-` |
| `special_id` | 是 | `-` |
| `tid` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/comment/floor/send?album_name=xxx&childrenid=xxx&childrenname=xxx
```

## `/comment/music`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `mixsongid` | 是 | `-` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |
| `show_classify` | 否 | `1` |
| `show_hotword_list` | 否 | `1` |

**示例**：

```
GET http://localhost:3002/comment/music?mixsongid=xxx&page=1&pagesize=30
```

## `/comment/music/classify`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `mixsongid` | 是 | `-` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |
| `sort` | 是 | `-` |
| `type_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/comment/music/classify?mixsongid=xxx&page=1&pagesize=30
```

## `/comment/music/hotword`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `hot_word` | 是 | `-` |
| `mixsongid` | 是 | `-` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |

**示例**：

```
GET http://localhost:3002/comment/music/hotword?hot_word=xxx&mixsongid=xxx&page=1
```

## `/comment/music/send`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album_audio_id` | 是 | `-` |
| `childrenid` | 是 | `-` |
| `childrenname` | 是 | `-` |
| `content` | 否 | `}`.trim(` |
| `id` | 是 | `-` |
| `mixsongid` | 是 | `-` |
| `name` | 是 | `-` |
| `song_name` | 是 | `-` |
| `special_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/comment/music/send?album_audio_id=xxx&childrenid=xxx&childrenname=xxx
```

## `/comment/playlist`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |
| `show_classify` | 否 | `1` |
| `show_hotword_list` | 否 | `1` |

**示例**：

```
GET http://localhost:3002/comment/playlist?id=xxx&page=1&pagesize=30
```

## `/comment/playlist/send`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `childrenid` | 是 | `-` |
| `childrenname` | 是 | `-` |
| `content` | 否 | `}`.trim(` |
| `id` | 是 | `-` |
| `name` | 是 | `-` |
| `playlist_id` | 是 | `-` |
| `playlist_name` | 是 | `-` |
| `special_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/comment/playlist/send?childrenid=xxx&childrenname=xxx&content=}`.trim(
```

## `/effects/artist`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |

**示例**：

```
GET http://localhost:3002/effects/artist?page=1&pagesize=30
```

## `/effects/brand`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |

**示例**：

```
GET http://localhost:3002/effects/brand?page=1&pagesize=30
```

## `/effects/brand/detail`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `brand_id` | 否 | `0` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |

**示例**：

```
GET http://localhost:3002/effects/brand/detail?brand_id=0&page=1&pagesize=30
```

## `/effects/car/brand`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/effects/car/brand/lists`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |
| `rel_id` | 否 | `0` |

**示例**：

```
GET http://localhost:3002/effects/car/brand/lists?page=1&pagesize=30&rel_id=0
```

## `/effects/match`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/everyday/friend`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/everyday/history`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `date` | 是 | `-` |
| `history_name` | 是 | `-` |
| `mode` | 否 | `list` |
| `platform` | 否 | `ios` |

**示例**：

```
GET http://localhost:3002/everyday/history?date=xxx&history_name=xxx&mode=list
```

## `/everyday/recommend`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `platform` | 否 | `ios" }` |

**示例**：

```
GET http://localhost:3002/everyday/recommend?platform=ios" }
```

## `/everyday/style/recommend`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `platform` | 否 | `ios` |
| `tagids` | 否 | ` }` |

**示例**：

```
GET http://localhost:3002/everyday/style/recommend?platform=ios&tagids= }
```

## `/favorite/count`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `mixsongids` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/favorite/count?mixsongids=xxx
```

## `/fm/class`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/fm/image`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/fm/recommend`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/fm/songs`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/get/mode/info`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `model_id` | 否 | `0` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |

**示例**：

```
GET http://localhost:3002/get/mode/info?model_id=0&page=1&pagesize=30
```

## `/get/model`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |
| `sort` | 否 | `2` |

**示例**：

```
GET http://localhost:3002/get/model?page=1&pagesize=30&sort=2
```

## `/get/verify/info`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/images`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/images/audio`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/import/playlist`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/ip`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `type` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/ip?type=xxx
```

## `/ip/dateil`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/ip/playlist`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/ip/zone`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/ip/zone/home`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/kmr/audio/mv`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `fields` | 否 | `` |

**示例**：

```
GET http://localhost:3002/kmr/audio/mv?fields=
```

## `/krm/audio`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `fields` | 否 | `base` |

**示例**：

```
GET http://localhost:3002/krm/audio?fields=base
```

## `/lastest/songs/listen`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `pagesize` | 否 | `30` |

**示例**：

```
GET http://localhost:3002/lastest/songs/listen?pagesize=30
```

## `/listen/together/chat`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/listen/together/discovery`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/listen/together/music`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/listen/together/room`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/listen/together/study`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/login`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/login/cellphone`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `mobile` | 是 | `-` |
| `userid` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/login/cellphone?mobile=xxx&userid=xxx
```

## `/login/device`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `token` | 否 | `params.cookie?.token` |
| `userid` | 否 | `params.cookie?.userid || 0` |

**示例**：

```
GET http://localhost:3002/login/device?token=params.cookie?.token&userid=params.cookie?.userid || 0
```

## `/login/device/kick`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `t` | 是 | `-` |
| `t_appid` | 是 | `-` |
| `t_clientver` | 是 | `-` |
| `t_mid` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/login/device/kick?t=xxx&t_appid=xxx&t_clientver=xxx
```

## `/login/openplat`

开放平台登录（微信 code 换 token 再登录酷狗）。原版用裸 axios 调微信接口；此处用 fetch 等价实现。

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/login/qq`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/login/qq/qr/check`

QQ 扫码登录 - 检测扫码状态。原版用 axios（带 resolveProxy 代理、手动跟随跳转）；此处用 fetch/fetchViaProxy 等价实现。

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/login/qq/qr/create`

QQ 扫码登录 - 生成二维码。原版用 axios（带 resolveProxy 代理）；此处用 fetch/fetchViaProxy 等价实现。

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/login/qr/authorize`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/login/qr/check`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/login/qr/create`

酷狗二维码生成（qrcode 依赖由父流程统一安装）。

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `key` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/login/qr/create?key=xxx
```

## `/login/qr/key`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/login/token`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/login/wx/check`

原版用裸 axios 直调微信扫码状态接口（不走代理）；此处用 fetch 等价实现。

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/login/wx/create`

原版用裸 axios 直调微信开放平台（不走代理）；此处用 fetch 等价实现。

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/longaudio/album/audios`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album_id` | 是 | `-` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |

**示例**：

```
GET http://localhost:3002/longaudio/album/audios?album_id=xxx&page=1&pagesize=30
```

## `/longaudio/album/detail`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album_id` | 否 | `` |

**示例**：

```
GET http://localhost:3002/longaudio/album/detail?album_id=
```

## `/longaudio/album/list`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/longaudio/daily/recommend`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |

**示例**：

```
GET http://localhost:3002/longaudio/daily/recommend?page=1&pagesize=30
```

## `/longaudio/rank/recommend`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/longaudio/search`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `keyword` | 是 | `-` |
| `keywords` | 否 | `params.keyword` |
| `userid` | 否 | `params.cookie?.userid ?? "0` |

**示例**：

```
GET http://localhost:3002/longaudio/search?keyword=xxx&keywords=params.keyword&userid=params.cookie?.userid ?? "0
```

## `/longaudio/tag/list`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/longaudio/vip/recommend`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/longaudio/week/recommend`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/lyric`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `fmt` | 否 | `krc` |

**示例**：

```
GET http://localhost:3002/lyric?fmt=krc
```

## `/mv/collect`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/mv/collect?id=xxx
```

## `/mv/collect/del`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/mv/collect/del?id=xxx
```

## `/pc/diantai`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/personal/fm`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cur_mark` | 是 | `-` |
| `hash` | 是 | `-` |
| `playtime` | 是 | `-` |
| `songid` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/personal/fm?cur_mark=xxx&hash=xxx&playtime=xxx
```

## `/playhistory/upload`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `mxid` | 是 | `-` |
| `pc` | 否 | `1` |
| `time` | 否 | `Math.floor(Date.now(` |

**示例**：

```
GET http://localhost:3002/playhistory/upload?mxid=xxx&pc=1&time=Math.floor(Date.now(
```

## `/playlist/add`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `is_pri` | 否 | `0` |
| `list_create_gid` | 否 | `` |
| `list_create_listid` | 是 | `-` |
| `list_create_userid` | 是 | `-` |
| `name` | 是 | `-` |
| `source` | 否 | `1` |
| `type` | 否 | `0` |

**示例**：

```
GET http://localhost:3002/playlist/add?is_pri=0&list_create_gid=&list_create_listid=xxx
```

## `/playlist/del`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `listid` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/playlist/del?listid=xxx
```

## `/playlist/detail`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/playlist/effect`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/playlist/pic`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `data` | 否 | `` |
| `total_ver` | 否 | `0` |

**示例**：

```
GET http://localhost:3002/playlist/pic?data=&total_ver=0
```

## `/playlist/pic/upload`

上传图片（用于修改「我的歌单」自定义封面），直连图片上传服务。

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `data` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/playlist/pic/upload?data=xxx
```

## `/playlist/similar`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/playlist/sort`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `data` | 否 | `` |
| `total_ver` | 否 | `0` |

**示例**：

```
GET http://localhost:3002/playlist/sort?data=&total_ver=0
```

## `/playlist/tags`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/playlist/track/all`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `page` | 否 | `1` |

**示例**：

```
GET http://localhost:3002/playlist/track/all?page=1
```

## `/playlist/track/all/new`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `listid` | 是 | `-` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `300` |
| `type` | 否 | `0` |

**示例**：

```
GET http://localhost:3002/playlist/track/all/new?listid=xxx&page=1&pagesize=300
```

## `/playlist/tracks/add`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `data` | 否 | `` |
| `listid` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/playlist/tracks/add?data=&listid=xxx
```

## `/playlist/tracks/del`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `fileids` | 否 | `` |
| `listid` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/playlist/tracks/del?fileids=&listid=xxx
```

## `/playlist/tracks/sort`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `data` | 否 | `` |
| `list_ver` | 否 | `0` |
| `listid` | 是 | `-` |
| `type` | 否 | `0` |

**示例**：

```
GET http://localhost:3002/playlist/tracks/sort?data=&list_ver=0&listid=xxx
```

## `/playlist/update`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `intro` | 否 | `` |
| `listid` | 是 | `-` |
| `name` | 是 | `-` |
| `pic` | 是 | `-` |
| `sort` | 否 | `0` |
| `tags` | 否 | `` |
| `total_ver` | 否 | `0` |
| `type` | 否 | `0` |

**示例**：

```
GET http://localhost:3002/playlist/update?intro=&listid=xxx&name=xxx
```

## `/privilege/lite`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/rank/audio`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |
| `rank_cid` | 否 | `0` |
| `rankid` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/rank/audio?page=1&pagesize=30&rank_cid=0
```

## `/rank/info`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album_img` | 否 | `1` |
| `rank_cid` | 否 | `0` |
| `rankid` | 是 | `-` |
| `zone` | 否 | `` |

**示例**：

```
GET http://localhost:3002/rank/info?album_img=1&rank_cid=0&rankid=xxx
```

## `/rank/list`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `withsong` | 否 | `1` |

**示例**：

```
GET http://localhost:3002/rank/list?withsong=1
```

## `/rank/top`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/rank/vol`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `rank_cid` | 否 | `0` |
| `rankid` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/rank/vol?rank_cid=0&rankid=xxx
```

## `/recommend/songs`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/register/dev`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/scene/audio/list`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `module_id` | 是 | `-` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |
| `tag` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/scene/audio/list?id=xxx&module_id=xxx&page=1
```

## `/scene/collection/list`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |
| `tag_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/scene/collection/list?page=1&pagesize=30&tag_id=xxx
```

## `/scene/lists`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/scene/lists/v2`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |
| `sort` | 否 | `rec"] || 1` |

**示例**：

```
GET http://localhost:3002/scene/lists/v2?id=xxx&page=1&pagesize=30
```

## `/scene/module`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/scene/module?id=xxx
```

## `/scene/module/info`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `module_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/scene/module/info?id=xxx&module_id=xxx
```

## `/scene/music`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |

**示例**：

```
GET http://localhost:3002/scene/music?id=xxx&page=1&pagesize=30
```

## `/scene/video/list`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |
| `tag_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/scene/video/list?page=1&pagesize=30&tag_id=xxx
```

## `/search`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `tag` | 是 | `-` |
| `type` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/search?tag=xxx&type=xxx
```

## `/search/complex`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `keywords` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/search/complex?keywords=xxx
```

## `/search/default`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/search/hot`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/search/lyric`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `duration` | 否 | `0` |
| `man` | 否 | `no` |

**示例**：

```
GET http://localhost:3002/search/lyric?duration=0&man=no
```

## `/search/mixed`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `keyword` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/search/mixed?keyword=xxx
```

## `/search/suggest`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `albumTipCount` | 否 | `10` |
| `correctTipCount` | 否 | `10` |
| `keywords` | 是 | `-` |
| `musicTipCount` | 否 | `10` |
| `mvTipCount` | 否 | `10` |

**示例**：

```
GET http://localhost:3002/search/suggest?albumTipCount=10&correctTipCount=10&keywords=xxx
```

## `/server/now`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/sheet/collection`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `position` | 否 | `2` |

**示例**：

```
GET http://localhost:3002/sheet/collection?position=2
```

## `/sheet/detail`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/sheet/detail?id=xxx
```

## `/sheet/explore`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `level` | 否 | `0` |

**示例**：

```
GET http://localhost:3002/sheet/explore?level=0
```

## `/sheet/rank`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/sheet/song`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album_audio_id` | 是 | `-` |
| `instruments` | 否 | `1` |

**示例**：

```
GET http://localhost:3002/sheet/song?album_audio_id=xxx&instruments=1
```

## `/sheet/tags`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/sidedt`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/singer/list`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/song/auth`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album_audio_id` | 否 | `0` |
| `auth` | 否 | `params.cookie.auth || ` |

**示例**：

```
GET http://localhost:3002/song/auth?album_audio_id=0&auth=params.cookie.auth || 
```

## `/song/barrage`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `childrenid` | 是 | `-` |
| `extdata` | 是 | `-` |
| `hash` | 是 | `-` |
| `id` | 是 | `-` |
| `schash` | 是 | `-` |
| `special_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/song/barrage?childrenid=xxx&extdata=xxx&hash=xxx
```

## `/song/barrage/send`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `childrenid` | 是 | `-` |
| `childrenname` | 是 | `-` |
| `content` | 否 | `}`.trim(` |
| `extdata` | 是 | `-` |
| `hash` | 是 | `-` |
| `id` | 是 | `-` |
| `name` | 是 | `-` |
| `schash` | 是 | `-` |
| `song_name` | 是 | `-` |
| `special_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/song/barrage/send?childrenid=xxx&childrenname=xxx&content=}`.trim(
```

## `/song/climax`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/song/ranking`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album_audio_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/song/ranking?album_audio_id=xxx
```

## `/song/ranking/filter`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album_audio_id` | 是 | `-` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |

**示例**：

```
GET http://localhost:3002/song/ranking/filter?album_audio_id=xxx&page=1&pagesize=30
```

## `/song/url`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album_audio_id` | 否 | `0` |
| `album_id` | 否 | `0` |
| `ppage_id` | 否 | `356753938` |
| `quality` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/song/url?album_audio_id=0&album_id=0&ppage_id=356753938
```

## `/song/url/auth`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album_audio_id` | 否 | `0` |
| `album_id` | 否 | `0` |
| `ppage_id` | 否 | `356753938` |
| `quality` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/song/url/auth?album_audio_id=0&album_id=0&ppage_id=356753938
```

## `/song/url/auth/merge`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album_audio_id` | 否 | `0` |
| `auth` | 否 | `params.cookie.auth || ` |

**示例**：

```
GET http://localhost:3002/song/url/auth/merge?album_audio_id=0&auth=params.cookie.auth || 
```

## `/song/url/new`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album_audio_id` | 是 | `-` |
| `hash` | 是 | `-` |
| `quality` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/song/url/new?album_audio_id=xxx&hash=xxx&quality=xxx
```

## `/team/history`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/team/join`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `team_code` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/team/join?team_code=xxx
```

## `/team/my`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `period_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/team/my?period_id=xxx
```

## `/team/my/info`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `period_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/team/my/info?period_id=xxx
```

## `/team/my/status`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `period_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/team/my/status?period_id=xxx
```

## `/team/period/info`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/theme/music`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/theme/music/detail`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/theme/playlist`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/theme/playlist/track`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/top/album`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/top/card`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/top/card/youth`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `pagesize` | 否 | `30` |
| `tagid` | 否 | `` |

**示例**：

```
GET http://localhost:3002/top/card/youth?pagesize=30&tagid=
```

## `/top/ip`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/top/playlist`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/top/song`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/top/tag/card/youth`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/batch/union/vipinfo`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `busi_type` | 是 | `-` |
| `clientappid` | 是 | `-` |
| `clienttoken` | 是 | `-` |
| `get_type` | 是 | `-` |
| `kugouid` | 是 | `-` |
| `token` | 是 | `-` |
| `userid` | 是 | `-` |
| `userid_list` | 是 | `-` |
| `useridlist` | 是 | `-` |
| `userids` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/user/batch/union/vipinfo?busi_type=xxx&clientappid=xxx&clienttoken=xxx
```

## `/user/cloud`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |

**示例**：

```
GET http://localhost:3002/user/cloud?page=1&pagesize=30
```

## `/user/cloud/del`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/cloud/match`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `data` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/user/cloud/match?data=xxx
```

## `/user/cloud/upload`

上传音乐文件到用户云盘

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/cloud/url`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album_audio_id` | 否 | `0` |
| `audio_id` | 否 | `0` |
| `hash` | 是 | `-` |
| `name` | 否 | `` |

**示例**：

```
GET http://localhost:3002/user/cloud/url?album_audio_id=0&audio_id=0&hash=xxx
```

## `/user/detail`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/follow`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/follow/message`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `pagesize` | 否 | `30` |

**示例**：

```
GET http://localhost:3002/user/follow/message?id=xxx&pagesize=30
```

## `/user/grade/info`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `d_sec` | 是 | `-` |
| `diff_sec` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/user/grade/info?d_sec=xxx&diff_sec=xxx
```

## `/user/history`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `bp` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/user/history?bp=xxx
```

## `/user/info`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/listen`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `type` | 否 | `0` |

**示例**：

```
GET http://localhost:3002/user/listen?type=0
```

## `/user/listen/report`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cookie` | 否 | `{}` |
| `d_sec` | 是 | `-` |
| `dev` | 是 | `-` |
| `device_model` | 否 | `params.dev ??` |
| `diff_sec` | 是 | `-` |
| `duration` | 是 | `-` |
| `event` | 是 | `-` |
| `local_ip` | 否 | `0.0.0.0` |
| `mid` | 否 | `cookie.mid || cookie.KUGOU_API_MID || ` |
| `mixsongid` | 否 | `` |
| `screen_height` | 否 | `1080` |
| `screen_width` | 否 | `1920` |
| `state` | 否 | `完整播放` |
| `system_version` | 否 | `9` |
| `token` | 否 | `cookie.token` |
| `userid` | 否 | `cookie.userid || ` |
| `uuid` | 否 | `cookie.uuid || cookie.KUGOU_API_GUID` |

**示例**：

```
GET http://localhost:3002/user/listen/report?cookie={}&d_sec=xxx&dev=xxx
```

## `/user/playlist`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/preference`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/preference/update`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/purchased/albums`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/purchased/songs`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/update`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/update/avatar`

修改头像，分两步：1. multipart 上传图片到图床 imgphp.kugou.com 拿 FileName；

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/verify`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/video/collect`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/video/love`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/vip/detail`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/verify/user/info`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/video/barrage`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `childrenid` | 是 | `-` |
| `extdata` | 是 | `-` |
| `hash` | 是 | `-` |
| `id` | 是 | `-` |
| `mvhash` | 是 | `-` |
| `video_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/video/barrage?childrenid=xxx&extdata=xxx&hash=xxx
```

## `/video/barrage/send`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `childrenid` | 是 | `-` |
| `childrenname` | 是 | `-` |
| `content` | 否 | `}`.trim(` |
| `extdata` | 是 | `-` |
| `hash` | 是 | `-` |
| `id` | 是 | `-` |
| `mvhash` | 是 | `-` |
| `name` | 是 | `-` |
| `video_id` | 是 | `-` |
| `video_name` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/video/barrage/send?childrenid=xxx&childrenname=xxx&content=}`.trim(
```

## `/video/detail`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 否 | `` |

**示例**：

```
GET http://localhost:3002/video/detail?id=
```

## `/video/privilege`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/video/url`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `hash` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/video/url?hash=xxx
```

## `/youth/channel/all`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |

**示例**：

```
GET http://localhost:3002/youth/channel/all?page=1&pagesize=30
```

## `/youth/channel/amway`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `global_collection_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/youth/channel/amway?global_collection_id=xxx
```

## `/youth/channel/detail`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `global_collection_id` | 否 | `` |

**示例**：

```
GET http://localhost:3002/youth/channel/detail?global_collection_id=
```

## `/youth/channel/similar`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `channel_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/youth/channel/similar?channel_id=xxx
```

## `/youth/channel/song`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `global_collection_id` | 是 | `-` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |

**示例**：

```
GET http://localhost:3002/youth/channel/song?global_collection_id=xxx&page=1&pagesize=30
```

## `/youth/channel/song/detail`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `fileid` | 是 | `-` |
| `global_collection_id` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/youth/channel/song/detail?fileid=xxx&global_collection_id=xxx
```

## `/youth/channel/song/list`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `global_collection_id` | 是 | `-` |
| `page` | 否 | `1` |
| `pagesize` | 否 | `20` |

**示例**：

```
GET http://localhost:3002/youth/channel/song/list?global_collection_id=xxx&page=1&pagesize=20
```

## `/youth/channel/sub`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `global_collection_id` | 是 | `-` |
| `t` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/youth/channel/sub?global_collection_id=xxx&t=xxx
```

## `/youth/day/vip`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `receive_day` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/youth/day/vip?receive_day=xxx
```

## `/youth/day/vip/upgrade`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/youth/dynamic`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/youth/dynamic/recent`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/youth/listen/song`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/youth/month/vip/record`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/youth/union/vip`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/youth/user/song`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `page` | 否 | `1` |
| `pagesize` | 否 | `30` |
| `userid` | 是 | `-` |

**示例**：

```
GET http://localhost:3002/youth/user/song?page=1&pagesize=30&userid=xxx
```

## `/youth/vip`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/yueku`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/yueku/banner`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/yueku/fm`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。
