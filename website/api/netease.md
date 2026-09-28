# 网易云音乐 API

共 440 个接口。直连 `http://localhost:3001`，经网关 `/api/v1/platform/netease/...`。

## `/activate/init/profile`

初始化名字

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `nickname` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/activate/init/profile?nickname=xxx
```

## `/ad/get`

获取广告

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `type_ids` | 否 | `["400002_0"]` |

**示例**：

```
GET http://localhost:3001/ad/get?type_ids=["400002_0"]
```

## `/ad/listening/rights`

获取免费听时长状态

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/ad/listening/rights/gain`

看广告免费听歌 - 领取免费听权益

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `appInfo` | 是 | `-` |
| `clickTime` | 是 | `-` |
| `contextInfo` | 是 | `-` |
| `creativeType` | 是 | `-` |
| `exposureTime` | 是 | `-` |
| `extraRightsGainDuration` | 是 | `-` |
| `extraRightsGainMethod` | 是 | `-` |
| `extraRightsType` | 是 | `-` |
| `gainMethodStep` | 是 | `-` |
| `generalRightsInfo` | 是 | `-` |
| `installed` | 是 | `-` |
| `nextRightsGainDuration` | 是 | `-` |
| `playContinuously` | 是 | `-` |
| `reqUid` | 否 | `` |
| `rightsExtJson` | 否 | `hint.rightsExtJson || undefined` |
| `rightsGainDuration` | 是 | `-` |
| `rightsGainMethod` | 是 | `-` |
| `rightsGainType` | 是 | `-` |
| `sniffTime` | 是 | `-` |
| `source` | 是 | `-` |
| `type_ids` | 否 | `["400002_0"]' }` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/ad/listening/rights/gain?appInfo=xxx&clickTime=xxx&contextInfo=xxx
```

## `/aidj/content/rcmd`

私人 DJ

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `latitude` | 是 | `-` |
| `longitude` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/aidj/content/rcmd?latitude=xxx&longitude=xxx
```

## `/album`

专辑内容

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/album?id=xxx
```

## `/album/detail`

数字专辑详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/album/detail?id=xxx
```

## `/album/detail/dynamic`

专辑动态信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/album/detail/dynamic?id=xxx
```

## `/album/list`

数字专辑-新碟上架

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `area` | 否 | `ALL` |
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |
| `type` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/album/list?area=ALL&limit=30&offset=0
```

## `/album/list/style`

数字专辑-语种风格馆

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `area` | 否 | `Z_H` |
| `limit` | 否 | `10` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/album/list/style?area=Z_H&limit=10&offset=0
```

## `/album/new`

全部新碟

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `area` | 否 | `ALL` |
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/album/new?area=ALL&limit=30&offset=0
```

## `/album/newest`

最新专辑

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/album/privilege`

获取专辑歌曲的音质

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/album/privilege?id=xxx
```

## `/album/songsaleboard`

数字专辑&数字单曲-榜单

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `albumType` | 否 | `0` |
| `type` | 否 | `daily` |
| `year` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/album/songsaleboard?albumType=0&type=daily&year=xxx
```

## `/album/sub`

收藏/取消收藏专辑

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `t` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/album/sub?id=xxx&t=xxx
```

## `/album/sublist`

已收藏专辑列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `25` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/album/sublist?limit=25&offset=0
```

## `/api`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `crypto` | 否 | `` |
| `data` | 否 | `{}` |
| `uri` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/api?crypto=&data={}&uri=xxx
```

## `/artist/album`

歌手专辑列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/artist/album?id=xxx&limit=30&offset=0
```

## `/artist/desc`

歌手介绍

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/artist/desc?id=xxx
```

## `/artist/detail`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/artist/detail?id=xxx
```

## `/artist/detail/dynamic`

歌手动态信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/artist/detail/dynamic?id=xxx
```

## `/artist/fans`

歌手粉丝

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `limit` | 否 | `20` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/artist/fans?id=xxx&limit=20&offset=0
```

## `/artist/follow/count`

歌手粉丝数量

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/artist/follow/count?id=xxx
```

## `/artist/list`

歌手分类

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `area` | 是 | `-` |
| `initial` | 否 | `` |
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |
| `type` | 否 | `1` |

**示例**：

```
GET http://localhost:3001/artist/list?area=xxx&initial=&limit=30
```

## `/artist/mv`

歌手相关MV

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `limit` | 是 | `-` |
| `offset` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/artist/mv?id=xxx&limit=xxx&offset=xxx
```

## `/artist/new/mv`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `before` | 否 | `Date.now(` |
| `limit` | 否 | `20` |

**示例**：

```
GET http://localhost:3001/artist/new/mv?before=Date.now(&limit=20
```

## `/artist/new/song`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `before` | 否 | `Date.now(` |
| `limit` | 否 | `20` |

**示例**：

```
GET http://localhost:3001/artist/new/song?before=Date.now(&limit=20
```

## `/artist/new/song/mv/list/v2`

获取关注歌手的新歌曲和 MV

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `before` | 是 | `-` |
| `firstRequest` | 否 | `true` |
| `limit` | 否 | `10` |
| `sourceType` | 否 | `1` |
| `startTimestamp` | 否 | `query.before || Date.now(` |

**示例**：

```
GET http://localhost:3001/artist/new/song/mv/list/v2?before=xxx&firstRequest=true&limit=10
```

## `/artist/new/song/playall`

获取所有关注歌手最近的 50 首新歌

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/artist/songs`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `limit` | 否 | `100` |
| `offset` | 否 | `0` |
| `order` | 否 | `hot` |

**示例**：

```
GET http://localhost:3001/artist/songs?id=xxx&limit=100&offset=0
```

## `/artist/sub`

收藏与取消收藏歌手

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `t` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/artist/sub?id=xxx&t=xxx
```

## `/artist/sublist`

关注歌手列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `25` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/artist/sublist?limit=25&offset=0
```

## `/artist/top/song`

歌手热门 50 首歌曲

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/artist/top/song?id=xxx
```

## `/artist/video`

歌手相关视频

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cursor` | 否 | `0` |
| `id` | 是 | `-` |
| `order` | 否 | `0` |
| `size` | 否 | `10` |

**示例**：

```
GET http://localhost:3001/artist/video?cursor=0&id=xxx&order=0
```

## `/artists`

歌手单曲

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/artists?id=xxx
```

## `/audio/match`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `audioFP` | 是 | `-` |
| `duration` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/audio/match?audioFP=xxx&duration=xxx
```

## `/avatar/upload`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/banner`

首页轮播图

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `type` | 否 | `0] || "pc` |

**示例**：

```
GET http://localhost:3001/banner?type=0] || "pc
```

## `/batch`

批量请求接口

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/broadcast/category/region/get`

广播电台 - 分类/地区信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/broadcast/channel/collect/list`

广播电台 - 我的收藏

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `99999` |

**示例**：

```
GET http://localhost:3001/broadcast/channel/collect/list?limit=99999
```

## `/broadcast/channel/currentinfo`

广播电台 - 电台信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/broadcast/channel/currentinfo?id=xxx
```

## `/broadcast/channel/list`

广播电台 - 全部电台

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `categoryId` | 否 | `0` |
| `lastId` | 否 | `0` |
| `limit` | 否 | `20` |
| `regionId` | 否 | `0` |
| `score` | 否 | `-1` |

**示例**：

```
GET http://localhost:3001/broadcast/channel/list?categoryId=0&lastId=0&limit=20
```

## `/broadcast/sub`

广播电台 - 收藏/取消收藏电台

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `t` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/broadcast/sub?id=xxx&t=xxx
```

## `/calendar`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `endTime` | 否 | `Date.now(` |
| `startTime` | 否 | `Date.now(` |

**示例**：

```
GET http://localhost:3001/calendar?endTime=Date.now(&startTime=Date.now(
```

## `/captcha/safe/sent`

发送安全验证码

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `ctcode` | 否 | `86` |

**示例**：

```
GET http://localhost:3001/captcha/safe/sent?ctcode=86
```

## `/captcha/sent`

发送验证码

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `ctcode` | 否 | `86` |
| `phone` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/captcha/sent?ctcode=86&phone=xxx
```

## `/captcha/sent/v1`

发送验证码

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `ctcode` | 否 | `86` |
| `phone` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/captcha/sent/v1?ctcode=86&phone=xxx
```

## `/captcha/verify`

校验验证码

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `captcha` | 是 | `-` |
| `ctcode` | 否 | `86` |
| `phone` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/captcha/verify?captcha=xxx&ctcode=86&phone=xxx
```

## `/cellphone/existence/check`

检测手机号码是否已注册

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `countrycode` | 是 | `-` |
| `phone` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/cellphone/existence/check?countrycode=xxx&phone=xxx
```

## `/chart/detail`

获取指定维度音乐排行榜详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `chartCode` | 是 | `-` |
| `targetId` | 是 | `-` |
| `targetType` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/chart/detail?chartCode=xxx&targetId=xxx&targetType=xxx
```

## `/chart/song/detail`

获取指定维度音乐排行榜列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `chartCode` | 是 | `-` |
| `targetId` | 是 | `-` |
| `targetType` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/chart/song/detail?chartCode=xxx&targetId=xxx&targetType=xxx
```

## `/check/music`

歌曲可用性

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `br` | 否 | `999000` |
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/check/music?br=999000&id=xxx
```

## `/cloud`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `songFile` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/cloud?songFile=xxx
```

## `/cloud/import`

云盘导入歌曲

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album` | 否 | `未知` |
| `artist` | 否 | `未知` |
| `bitrate` | 是 | `-` |
| `fileSize` | 是 | `-` |
| `fileType` | 是 | `-` |
| `id` | 否 | `-2` |
| `md5` | 是 | `-` |
| `song` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/cloud/import?album=未知&artist=未知&bitrate=xxx
```

## `/cloud/lyric/get`

获取云盘歌词

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `sid` | 是 | `-` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/cloud/lyric/get?sid=xxx&uid=xxx
```

## `/cloud/match`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `asid` | 是 | `-` |
| `sid` | 是 | `-` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/cloud/match?asid=xxx&sid=xxx&uid=xxx
```

## `/cloud/upload/complete`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/cloud/upload/token`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/cloudsearch`

搜索

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `keywords` | 是 | `-` |
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |
| `type` | 否 | `1` |

**示例**：

```
GET http://localhost:3001/cloudsearch?keywords=xxx&limit=30&offset=0
```

## `/comment`

发送与删除评论

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `commentId` | 是 | `-` |
| `content` | 是 | `-` |
| `id` | 是 | `-` |
| `t` | 是 | `-` |
| `threadId` | 是 | `-` |
| `type` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/comment?commentId=xxx&content=xxx&id=xxx
```

## `/comment/add`

发送评论

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `content` | 是 | `-` |
| `id` | 是 | `-` |
| `type` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/comment/add?content=xxx&id=xxx&type=xxx
```

## `/comment/album`

专辑评论

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `before` | 否 | `0` |
| `id` | 是 | `-` |
| `limit` | 否 | `20` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/comment/album?before=0&id=xxx&limit=20
```

## `/comment/delete`

删除评论

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cid` | 是 | `-` |
| `id` | 是 | `-` |
| `type` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/comment/delete?cid=xxx&id=xxx&type=xxx
```

## `/comment/dj`

电台评论

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `before` | 否 | `0` |
| `id` | 是 | `-` |
| `limit` | 否 | `20` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/comment/dj?before=0&id=xxx&limit=20
```

## `/comment/event`

获取动态评论

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `before` | 否 | `0` |
| `limit` | 否 | `20` |
| `offset` | 否 | `0` |
| `threadId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/comment/event?before=0&limit=20&offset=0
```

## `/comment/floor`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `limit` | 否 | `20` |
| `parentCommentId` | 是 | `-` |
| `time` | 否 | `-1` |
| `type` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/comment/floor?id=xxx&limit=20&parentCommentId=xxx
```

## `/comment/hot`

热门评论

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `before` | 否 | `0` |
| `id` | 是 | `-` |
| `limit` | 否 | `20` |
| `offset` | 否 | `0` |
| `type` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/comment/hot?before=0&id=xxx&limit=20
```

## `/comment/hug/list`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cid` | 是 | `-` |
| `cursor` | 否 | `-1` |
| `idCursor` | 否 | `-1` |
| `page` | 否 | `1` |
| `pageSize` | 否 | `100` |
| `sid` | 是 | `-` |
| `type` | 否 | `0]` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/comment/hug/list?cid=xxx&cursor=-1&idCursor=-1
```

## `/comment/info/list`

评论统计数据

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `ids` | 否 | `query.id || ` |
| `type` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/comment/info/list?id=xxx&ids=query.id || &type=0
```

## `/comment/like`

点赞与取消点赞评论

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cid` | 是 | `-` |
| `id` | 是 | `-` |
| `t` | 是 | `-` |
| `threadId` | 是 | `-` |
| `type` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/comment/like?cid=xxx&id=xxx&t=xxx
```

## `/comment/music`

歌曲评论

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `before` | 否 | `0` |
| `id` | 是 | `-` |
| `limit` | 否 | `20` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/comment/music?before=0&id=xxx&limit=20
```

## `/comment/mv`

MV评论

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `before` | 否 | `0` |
| `id` | 是 | `-` |
| `limit` | 否 | `20` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/comment/mv?before=0&id=xxx&limit=20
```

## `/comment/new`

评论

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cursor` | 否 | `0` |
| `id` | 是 | `-` |
| `pageNo` | 否 | `1` |
| `pageSize` | 否 | `20` |
| `showInner` | 否 | `true` |
| `sortType` | 是 | `-` |
| `type` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/comment/new?cursor=0&id=xxx&pageNo=1
```

## `/comment/playlist`

歌单评论

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `before` | 否 | `0` |
| `id` | 是 | `-` |
| `limit` | 否 | `20` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/comment/playlist?before=0&id=xxx&limit=20
```

## `/comment/reply`

发送评论

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cid` | 是 | `-` |
| `content` | 是 | `-` |
| `id` | 是 | `-` |
| `type` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/comment/reply?cid=xxx&content=xxx&id=xxx
```

## `/comment/report`

举报评论

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cid` | 是 | `-` |
| `id` | 是 | `-` |
| `reason` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/comment/report?cid=xxx&id=xxx&reason=xxx
```

## `/comment/video`

视频评论

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `before` | 否 | `0` |
| `id` | 是 | `-` |
| `limit` | 否 | `20` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/comment/video?before=0&id=xxx&limit=20
```

## `/countries/code/list`

国家编码列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/creator/authinfo/get`

获取达人用户信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/daily_signin`

签到

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `type` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/daily_signin?type=0
```

## `/decrypt`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `crypto` | 否 | `eapi` |
| `data` | 否 | `query.hexString || ` |
| `hexString` | 是 | `-` |
| `isReq` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/decrypt?crypto=eapi&data=query.hexString || &hexString=xxx
```

## `/device/kickoff`

强制下线设备

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `captcha` | 否 | `` |
| `deviceKey` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/device/kickoff?captcha=&deviceKey=xxx
```

## `/device/list`

登录设备列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/deviceinfo/center/upload`

上报设备中心设备名称

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `deviceName` | 否 | `query.name || ` |
| `name` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/deviceinfo/center/upload?deviceName=query.name || &name=xxx
```

## `/digitalAlbum/detail`

数字专辑详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/digitalAlbum/detail?id=xxx
```

## `/digitalAlbum/ordering`

购买数字专辑

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `payment` | 是 | `-` |
| `quantity` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/digitalAlbum/ordering?id=xxx&payment=xxx&quantity=xxx
```

## `/digitalAlbum/purchased`

我的数字专辑

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/digitalAlbum/purchased?limit=30&offset=0
```

## `/digitalAlbum/sales`

数字专辑销量

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `ids` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/digitalAlbum/sales?ids=xxx
```

## `/djRadio/top`

电台排行榜获取

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `dataGapDays` | 否 | `7` |
| `dataType` | 否 | `3` |
| `djRadioId` | 否 | `null` |
| `sortIndex` | 否 | `1` |

**示例**：

```
GET http://localhost:3001/djRadio/top?dataGapDays=7&dataType=3&djRadioId=null
```

## `/dj/banner`

电台banner

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/dj/category/excludehot`

电台非热门类型

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/dj/category/recommend`

电台推荐类型

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/dj/catelist`

电台分类列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/dj/detail`

电台详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `rid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/dj/detail?rid=xxx
```

## `/dj/difm/all/style/channel`

DIFM电台 - 分类

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `sources` | 否 | `[0]` |

**示例**：

```
GET http://localhost:3001/dj/difm/all/style/channel?sources=[0]
```

## `/dj/difm/channel/subscribe`

DIFM电台 - 收藏频道

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/dj/difm/channel/subscribe?id=xxx
```

## `/dj/difm/channel/unsubscribe`

DIFM电台 - 取消收藏频道

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/dj/difm/channel/unsubscribe?id=xxx
```

## `/dj/difm/playing/tracks/list`

DIFM电台 - 播放列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `channelId` | 是 | `-` |
| `limit` | 否 | `5` |
| `source` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/dj/difm/playing/tracks/list?channelId=xxx&limit=5&source=0
```

## `/dj/difm/subscribe/channels/get`

DIFM电台 - 收藏列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `sources` | 否 | `[0]` |

**示例**：

```
GET http://localhost:3001/dj/difm/subscribe/channels/get?sources=[0]
```

## `/dj/hot`

热门电台

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/dj/hot?limit=30&offset=0
```

## `/dj/paygift`

付费电台

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/dj/paygift?limit=30&offset=0
```

## `/dj/personalize/recommend`

电台个性推荐

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `6` |

**示例**：

```
GET http://localhost:3001/dj/personalize/recommend?limit=6
```

## `/dj/program`

电台节目列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `asc` | 是 | `-` |
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |
| `rid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/dj/program?asc=xxx&limit=30&offset=0
```

## `/dj/program/detail`

电台节目详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/dj/program/detail?id=xxx
```

## `/dj/program/toplist`

电台节目榜

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `100` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/dj/program/toplist?limit=100&offset=0
```

## `/dj/program/toplist/hours`

电台24小时节目榜

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `100` |

**示例**：

```
GET http://localhost:3001/dj/program/toplist/hours?limit=100
```

## `/dj/radio/hot`

类别热门电台

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cateId` | 是 | `-` |
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/dj/radio/hot?cateId=xxx&limit=30&offset=0
```

## `/dj/recommend`

精选电台

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/dj/recommend/type`

精选电台分类

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `type` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/dj/recommend/type?type=xxx
```

## `/dj/sub`

订阅与取消电台

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `rid` | 是 | `-` |
| `t` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/dj/sub?rid=xxx&t=xxx
```

## `/dj/sublist`

订阅电台列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/dj/sublist?limit=30&offset=0
```

## `/dj/subscriber`

电台详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `limit` | 否 | `20` |
| `time` | 否 | `-1` |

**示例**：

```
GET http://localhost:3001/dj/subscriber?id=xxx&limit=20&time=-1
```

## `/dj/today/perfered`

电台今日优选

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `page` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/dj/today/perfered?page=0
```

## `/dj/toplist`

新晋电台榜/热门电台榜

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `100` |
| `offset` | 否 | `0` |
| `type` | 否 | `new"] || "0` |

**示例**：

```
GET http://localhost:3001/dj/toplist?limit=100&offset=0&type=new"] || "0
```

## `/dj/toplist/hours`

电台24小时主播榜

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `100` |

**示例**：

```
GET http://localhost:3001/dj/toplist/hours?limit=100
```

## `/dj/toplist/newcomer`

电台新人榜

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `100` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/dj/toplist/newcomer?limit=100&offset=0
```

## `/dj/toplist/pay`

付费精品

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `100` |

**示例**：

```
GET http://localhost:3001/dj/toplist/pay?limit=100
```

## `/dj/toplist/popular`

电台最热主播榜

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `100` |

**示例**：

```
GET http://localhost:3001/dj/toplist/popular?limit=100
```

## `/eapi/decrypt`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `hexString` | 是 | `-` |
| `isReq` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/eapi/decrypt?hexString=xxx&isReq=xxx
```

## `/event`

获取动态列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `lasttime` | 否 | `-1` |
| `pagesize` | 否 | `20` |

**示例**：

```
GET http://localhost:3001/event?lasttime=-1&pagesize=20
```

## `/event/del`

删除动态

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `evId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/event/del?evId=xxx
```

## `/event/forward`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `evId` | 是 | `-` |
| `forwards` | 是 | `-` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/event/forward?evId=xxx&forwards=xxx&uid=xxx
```

## `/event/privacy`

修改本人动态的可见权限

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `evId` | 否 | `` |
| `privacy` | 否 | `` |

**示例**：

```
GET http://localhost:3001/event/privacy?evId=&privacy=
```

## `/fanscenter/basicinfo/age/get`

粉丝年龄比例

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/fanscenter/basicinfo/gender/get`

粉丝性别比例

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/fanscenter/basicinfo/province/get`

粉丝省份比例

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/fanscenter/overview/get`

粉丝数量

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/fanscenter/trend/list`

粉丝来源

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `endTime` | 否 | `Date.now(` |
| `startTime` | 否 | `Date.now(` |
| `type` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/fanscenter/trend/list?endTime=Date.now(&startTime=Date.now(&type=0
```

## `/fm_trash`

垃圾桶

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `time` | 否 | `25` |

**示例**：

```
GET http://localhost:3001/fm_trash?id=xxx&time=25
```

## `/follow`

关注与取消关注用户

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `t` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/follow?id=xxx&t=xxx
```

## `/get/userids`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `nicknames` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/get/userids?nicknames=xxx
```

## `/history/recommend/songs`

历史每日推荐歌曲

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/history/recommend/songs/detail`

历史每日推荐歌曲详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `date` | 否 | `` |

**示例**：

```
GET http://localhost:3001/history/recommend/songs/detail?date=
```

## `/homepage/block/page`

首页-发现 block page

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cursor` | 是 | `-` |
| `refresh` | 否 | `false` |

**示例**：

```
GET http://localhost:3001/homepage/block/page?cursor=xxx&refresh=false
```

## `/homepage/dragon/ball`

首页-发现 dragon ball

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/hot/topic`

热门话题

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `20` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/hot/topic?limit=20&offset=0
```

## `/hug/comment`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cid` | 是 | `-` |
| `sid` | 是 | `-` |
| `type` | 否 | `0]` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/hug/comment?cid=xxx&sid=xxx&type=0]
```

## `/inner/version`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/lbs/city/code`

多级行政区划数据获取接口

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `bizCode` | 否 | `` |

**示例**：

```
GET http://localhost:3001/lbs/city/code?bizCode=
```

## `/like`

红心与取消红心歌曲

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `like` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/like?id=xxx&like=xxx
```

## `/like/v1`

红心与取消红心歌曲- v1

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `like` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/like/v1?id=xxx&like=xxx
```

## `/likelist`

喜欢的歌曲(无序)

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/likelist?uid=xxx
```

## `/listen/data/realtime/report`

听歌足迹 - 本周/本月收听时长

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `type` | 否 | `week` |

**示例**：

```
GET http://localhost:3001/listen/data/realtime/report?type=week
```

## `/listen/data/report`

听歌足迹 - 周/月/年收听报告

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `endTime` | 是 | `-` |
| `type` | 否 | `week` |

**示例**：

```
GET http://localhost:3001/listen/data/report?endTime=xxx&type=week
```

## `/listen/data/song/play/rank`

听歌足迹 - 歌曲播放排行 (Top20)

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `endTime` | 是 | `-` |
| `type` | 否 | `month` |

**示例**：

```
GET http://localhost:3001/listen/data/song/play/rank?endTime=xxx&type=month
```

## `/listen/data/today/song`

听歌足迹 - 今日收听

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/listen/data/total`

听歌足迹 - 总收听时长

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/listen/data/year/report`

听歌足迹 - 年度听歌足迹

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/listentogether/accept`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `inviterId` | 是 | `-` |
| `roomId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/listentogether/accept?inviterId=xxx&roomId=xxx
```

## `/listentogether/end`

一起听 结束房间

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `roomId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/listentogether/end?roomId=xxx
```

## `/listentogether/heatbeat`

一起听 发送心跳

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `playStatus` | 是 | `-` |
| `progress` | 是 | `-` |
| `roomId` | 是 | `-` |
| `songId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/listentogether/heatbeat?playStatus=xxx&progress=xxx&roomId=xxx
```

## `/listentogether/play/command`

一起听 发送播放状态

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `clientSeq` | 是 | `-` |
| `commandType` | 是 | `-` |
| `formerSongId` | 是 | `-` |
| `playStatus` | 是 | `-` |
| `progress` | 否 | `0` |
| `roomId` | 是 | `-` |
| `targetSongId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/listentogether/play/command?clientSeq=xxx&commandType=xxx&formerSongId=xxx
```

## `/listentogether/room/check`

一起听 房间情况

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `roomId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/listentogether/room/check?roomId=xxx
```

## `/listentogether/room/create`

一起听创建房间

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/listentogether/status`

一起听状态

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/listentogether/sync/list/command`

一起听 更新播放列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `commandType` | 是 | `-` |
| `displayList` | 是 | `-` |
| `randomList` | 是 | `-` |
| `roomId` | 是 | `-` |
| `userId` | 是 | `-` |
| `version` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/listentogether/sync/list/command?commandType=xxx&displayList=xxx&randomList=xxx
```

## `/listentogether/sync/playlist/get`

一起听 当前列表获取

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `roomId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/listentogether/sync/playlist/get?roomId=xxx
```

## `/login`

邮箱登录

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `email` | 是 | `-` |
| `md5_password` | 否 | `md5(query.password` |
| `password` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/login?email=xxx&md5_password=md5(query.password&password=xxx
```

## `/login/cellphone`

手机登录

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `captcha` | 是 | `-` |
| `countrycode` | 否 | `86` |
| `md5_password` | 否 | `md5(query.password` |
| `password` | 是 | `-` |
| `phone` | 是 | `-` |
| `sca` | 否 | `` |

**示例**：

```
GET http://localhost:3001/login/cellphone?captcha=xxx&countrycode=86&md5_password=md5(query.password
```

## `/login/qr/check`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `key` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/login/qr/check?key=xxx
```

## `/login/qr/create`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cookie` | 否 | `` |
| `key` | 是 | `-` |
| `platform` | 否 | `pc` |
| `qrimg` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/login/qr/create?cookie=&key=xxx&platform=pc
```

## `/login/qr/key`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/login/refresh`

登录刷新

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/login/status`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/logout`

退出登录

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/lyric`

歌词

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/lyric?id=xxx
```

## `/lyric/new`

新版歌词 - 包含逐字歌词

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/lyric/new?id=xxx
```

## `/middle/play/do/lottery`

云小编每日抽奖

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `activityId` | 否 | `6501202` |
| `drawCount` | 否 | `1` |

**示例**：

```
GET http://localhost:3001/middle/play/do/lottery?activityId=6501202&drawCount=1
```

## `/middle/play/lottery/remain/chance`

云小编抽奖剩余次数查询

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `activityId` | 否 | `6501202` |

**示例**：

```
GET http://localhost:3001/middle/play/lottery/remain/chance?activityId=6501202
```

## `/mlog/music/rcmd`

歌曲相关视频

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `10` |
| `mvid` | 否 | `0` |
| `songid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/mlog/music/rcmd?limit=10&mvid=0&songid=xxx
```

## `/mlog/to/video`

将mlog id转为video id

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/mlog/to/video?id=xxx
```

## `/mlog/url`

mlog链接

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `res` | 否 | `1080` |

**示例**：

```
GET http://localhost:3001/mlog/url?id=xxx&res=1080
```

## `/msg/comments`

评论

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `before` | 否 | `-1` |
| `limit` | 否 | `30` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/msg/comments?before=-1&limit=30&uid=xxx
```

## `/msg/forwards`

@我

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/msg/forwards?limit=30&offset=0
```

## `/msg/notices`

通知

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `lasttime` | 否 | `-1` |
| `limit` | 否 | `30` |

**示例**：

```
GET http://localhost:3001/msg/notices?lasttime=-1&limit=30
```

## `/msg/private`

私信

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/msg/private?limit=30&offset=0
```

## `/msg/private/history`

私信内容

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `before` | 否 | `0` |
| `limit` | 否 | `30` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/msg/private/history?before=0&limit=30&uid=xxx
```

## `/msg/recentcontact`

最近联系

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/music/first/listen/info`

回忆坐标

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/music/first/listen/info?id=xxx
```

## `/musician/cloudbean`

账号云豆数

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/musician/cloudbean/obtain`

领取云豆

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `period` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/musician/cloudbean/obtain?id=xxx&period=xxx
```

## `/musician/data/overview`

音乐人数据概况

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/musician/play/trend`

音乐人歌曲播放趋势

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `endTime` | 是 | `-` |
| `startTime` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/musician/play/trend?endTime=xxx&startTime=xxx
```

## `/musician/sign`

音乐人签到

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/musician/tasks`

获取音乐人任务

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/musician/tasks/new`

获取音乐人任务

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/musician/vip/tasks`

获取音乐人任务

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/mv/all`

全部MV

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `area` | 否 | `全部` |
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |
| `order` | 否 | `上升最快` |
| `type` | 否 | `全部` |

**示例**：

```
GET http://localhost:3001/mv/all?area=全部&limit=30&offset=0
```

## `/mv/detail`

MV详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `mvid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/mv/detail?mvid=xxx
```

## `/mv/detail/info`

MV 点赞转发评论数数据

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `mvid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/mv/detail/info?mvid=xxx
```

## `/mv/exclusive/rcmd`

网易出品

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/mv/exclusive/rcmd?limit=30&offset=0
```

## `/mv/first`

最新MV

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `area` | 否 | `` |
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/mv/first?area=&limit=30&offset=0
```

## `/mv/sub`

收藏与取消收藏MV

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `mvid` | 是 | `-` |
| `t` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/mv/sub?mvid=xxx&t=xxx
```

## `/mv/sublist`

已收藏MV列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `25` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/mv/sublist?limit=25&offset=0
```

## `/mv/url`

MV链接

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `r` | 否 | `1080` |

**示例**：

```
GET http://localhost:3001/mv/url?id=xxx&r=1080
```

## `/nickname/check`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `nickname` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/nickname/check?nickname=xxx
```

## `/personal_fm`

私人FM

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/personal/fm/mode`

私人FM - 模式选择

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `3` |
| `mode` | 是 | `-` |
| `submode` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/personal/fm/mode?limit=3&mode=xxx&submode=xxx
```

## `/personalized`

推荐歌单

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/personalized?limit=30&offset=0
```

## `/personalized/djprogram`

推荐电台

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/personalized/mv`

推荐MV

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/personalized/newsong`

推荐新歌

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `areaId` | 否 | `0` |
| `limit` | 否 | `10` |

**示例**：

```
GET http://localhost:3001/personalized/newsong?areaId=0&limit=10
```

## `/personalized/privatecontent`

独家放送

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/personalized/privatecontent/list`

独家放送列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `60` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/personalized/privatecontent/list?limit=60&offset=0
```

## `/pl/count`

私信和通知接口

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/playlist/category/list`

歌单分类列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cat` | 否 | `全部` |
| `limit` | 否 | `24` |

**示例**：

```
GET http://localhost:3001/playlist/category/list?cat=全部&limit=24
```

## `/playlist/catlist`

全部歌单分类

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/playlist/cover/update`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `imgFile` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/playlist/cover/update?id=xxx&imgFile=xxx
```

## `/playlist/create`

创建歌单

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `name` | 是 | `-` |
| `privacy` | 否 | `0` |
| `type` | 否 | `NORMAL` |

**示例**：

```
GET http://localhost:3001/playlist/create?name=xxx&privacy=0&type=NORMAL
```

## `/playlist/delete`

删除歌单

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/playlist/delete?id=xxx
```

## `/playlist/desc/update`

更新歌单描述

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `desc` | 是 | `-` |
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/playlist/desc/update?desc=xxx&id=xxx
```

## `/playlist/detail`

歌单详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `s` | 否 | `8` |

**示例**：

```
GET http://localhost:3001/playlist/detail?id=xxx&s=8
```

## `/playlist/detail/dynamic`

歌单动态信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `s` | 否 | `8` |

**示例**：

```
GET http://localhost:3001/playlist/detail/dynamic?id=xxx&s=8
```

## `/playlist/detail/rcmd/get`

相关歌单推荐

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/playlist/detail/rcmd/get?id=xxx
```

## `/playlist/highquality/tags`

精品歌单 tags

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/playlist/hot`

热门歌单分类

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/playlist/import/name/task/create`

歌单导入 - 元数据/文字/链接导入

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `importStarPlaylist` | 否 | `false` |
| `link` | 是 | `-` |
| `local` | 是 | `-` |
| `playlistName` | 否 | `导入音乐 ".concat(new Date(` |
| `text` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/playlist/import/name/task/create?importStarPlaylist=false&link=xxx&local=xxx
```

## `/playlist/import/task/status`

歌单导入 - 任务状态

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/playlist/import/task/status?id=xxx
```

## `/playlist/mylike`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `12` |
| `time` | 否 | `-1` |

**示例**：

```
GET http://localhost:3001/playlist/mylike?limit=12&time=-1
```

## `/playlist/name/update`

更新歌单名

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `name` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/playlist/name/update?id=xxx&name=xxx
```

## `/playlist/order/update`

编辑歌单顺序

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `ids` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/playlist/order/update?ids=xxx
```

## `/playlist/privacy`

公开隐私歌单

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/playlist/privacy?id=xxx
```

## `/playlist/subscribe`

收藏与取消收藏歌单

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `checkToken` | 否 | `APP_CONF.checkToken }` |
| `id` | 是 | `-` |
| `t` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/playlist/subscribe?checkToken=APP_CONF.checkToken }&id=xxx&t=xxx
```

## `/playlist/subscribers`

歌单收藏者

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `limit` | 否 | `20` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/playlist/subscribers?id=xxx&limit=20&offset=0
```

## `/playlist/tags/update`

更新歌单标签

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `tags` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/playlist/tags/update?id=xxx&tags=xxx
```

## `/playlist/track/add`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `ids` | 否 | `` |
| `pid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/playlist/track/add?ids=&pid=xxx
```

## `/playlist/track/all`

通过传过来的歌单id拿到所有歌曲数据

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `limit` | 是 | `-` |
| `offset` | 是 | `-` |
| `s` | 否 | `8` |

**示例**：

```
GET http://localhost:3001/playlist/track/all?id=xxx&limit=xxx&offset=xxx
```

## `/playlist/track/delete`

收藏单曲到歌单 从歌单删除歌曲

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `ids` | 否 | `` |

**示例**：

```
GET http://localhost:3001/playlist/track/delete?id=xxx&ids=
```

## `/playlist/tracks`

收藏单曲到歌单 从歌单删除歌曲

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `op` | 是 | `-` |
| `pid` | 是 | `-` |
| `tracks` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/playlist/tracks?op=xxx&pid=xxx&tracks=xxx
```

## `/playlist/update`

编辑歌单

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `desc` | 否 | `` |
| `id` | 是 | `-` |
| `name` | 是 | `-` |
| `tags` | 否 | `` |

**示例**：

```
GET http://localhost:3001/playlist/update?desc=&id=xxx&name=xxx
```

## `/playlist/update/playcount`

歌单打卡

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/playlist/update/playcount?id=xxx
```

## `/playlist/video/recent`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/playmode/intelligence/list`

智能播放

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `count` | 否 | `1` |
| `id` | 是 | `-` |
| `pid` | 是 | `-` |
| `sid` | 否 | `query.id` |

**示例**：

```
GET http://localhost:3001/playmode/intelligence/list?count=1&id=xxx&pid=xxx
```

## `/playmode/song/vector`

云随机播放

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `ids` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/playmode/song/vector?ids=xxx
```

## `/program/recommend`

推荐节目

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `10` |
| `offset` | 否 | `0` |
| `type` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/program/recommend?limit=10&offset=0&type=xxx
```

## `/radio/sport/get`

跑步漫游

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `bpm` | 否 | `50` |

**示例**：

```
GET http://localhost:3001/radio/sport/get?bpm=50
```

## `/rebind`

更换手机

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `captcha` | 是 | `-` |
| `ctcode` | 否 | `86` |
| `oldcaptcha` | 是 | `-` |
| `phone` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/rebind?captcha=xxx&ctcode=86&oldcaptcha=xxx
```

## `/recent/listen/list`

最近听歌列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/recommend/resource`

每日推荐歌单

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/recommend/songs`

每日推荐歌曲

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `afresh` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/recommend/songs?afresh=xxx
```

## `/recommend/songs/dislike`

每日推荐歌曲-不感兴趣

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/recommend/songs/dislike?id=xxx
```

## `/record/recent/album`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `100` |

**示例**：

```
GET http://localhost:3001/record/recent/album?limit=100
```

## `/record/recent/dj`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `100` |

**示例**：

```
GET http://localhost:3001/record/recent/dj?limit=100
```

## `/record/recent/playlist`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `100` |

**示例**：

```
GET http://localhost:3001/record/recent/playlist?limit=100
```

## `/record/recent/song`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `100` |

**示例**：

```
GET http://localhost:3001/record/recent/song?limit=100
```

## `/record/recent/video`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `100` |

**示例**：

```
GET http://localhost:3001/record/recent/video?limit=100
```

## `/record/recent/voice`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `100` |

**示例**：

```
GET http://localhost:3001/record/recent/voice?limit=100
```

## `/register/anonimous`

获取游客cookie

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/register/cellphone`

注册账号

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `captcha` | 是 | `-` |
| `countrycode` | 否 | `86` |
| `nickname` | 是 | `-` |
| `password` | 是 | `-` |
| `phone` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/register/cellphone?captcha=xxx&countrycode=86&nickname=xxx
```

## `/register/checktoken/v2`

易盾反作弊 Token 注册端点

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/register/checktoken/v3`

易盾反作弊 Token 注册端点

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/register/xeapikey`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `currentKeyVersion` | 否 | `` |
| `deviceId` | 否 | `getDeviceId(` |

**示例**：

```
GET http://localhost:3001/register/xeapikey?currentKeyVersion=&deviceId=getDeviceId(
```

## `/related/allvideo`

相关视频

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/related/allvideo?id=xxx
```

## `/related/playlist`

相关歌单

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/related/playlist?id=xxx
```

## `/relay/play/state/submit`

提交歌曲播放状态

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/rep/ugc/activity/collect`

云小编领取任务积分

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `activityId` | 否 | `5001` |

**示例**：

```
GET http://localhost:3001/rep/ugc/activity/collect?activityId=5001
```

## `/rep/ugc/activity/get`

云小编活动信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/rep/ugc/exam/info/get`

云小编考试状态

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `examType` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/rep/ugc/exam/info/get?examType=xxx
```

## `/rep/ugc/exam/question/single/get`

云小编考试取题

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `examType` | 否 | `!query.taskId` |
| `taskId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/rep/ugc/exam/question/single/get?examType=!query.taskId&taskId=xxx
```

## `/rep/ugc/exam/result/get`

云小编考试结果

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `examType` | 否 | `!query.taskId` |
| `taskId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/rep/ugc/exam/result/get?examType=!query.taskId&taskId=xxx
```

## `/rep/ugc/exam/start`

云小编考试开始

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `examType` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/rep/ugc/exam/start?examType=xxx
```

## `/rep/ugc/exam/submit`

云小编考试提交

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `answer` | 是 | `-` |
| `examType` | 否 | `!query.taskId || !query.questionId || !query.answer` |
| `questionId` | 是 | `-` |
| `taskId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/rep/ugc/exam/submit?answer=xxx&examType=!query.taskId || !query.questionId || !query.answer&questionId=xxx
```

## `/rep/ugc/user/collect-vip`

云小编领取一日会员

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `activityId` | 否 | `5001` |

**示例**：

```
GET http://localhost:3001/rep/ugc/user/collect-vip?activityId=5001
```

## `/rep/ugc/user/get`

云小编获取用户详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/rep/ugc/user/sign`

云小编每日签到

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/rep/ugc/user/vip`

云小编查询会员任务状态

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/resource/like`

点赞与取消点赞资源

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `t` | 是 | `-` |
| `threadId` | 是 | `-` |
| `type` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/resource/like?id=xxx&t=xxx&threadId=xxx
```

## `/sati/resource/list`

助眠解压 - 获取标签下资源列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `tag` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/sati/resource/list?tag=xxx
```

## `/sati/resource/list/more`

助眠解压 - 查看同类推荐

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/sati/resource/list/more?id=xxx
```

## `/sati/resource/sub`

助眠解压 - 收藏

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cancel` | 否 | `false` |
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/sati/resource/sub?cancel=false&id=xxx
```

## `/sati/resource/sub/list`

助眠解压 - 收藏列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/sati/tag/list`

助眠解压 - 标签列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/sati/timescene/resources/get`

助眠解压 - 特定时间场景下的推荐资源

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/scrobble`

听歌打卡

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cookie` | 否 | `` |
| `id` | 是 | `-` |
| `sourceid` | 是 | `-` |
| `time` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/scrobble?cookie=&id=xxx&sourceid=xxx
```

## `/scrobble/v1`

听歌打卡 - NCBL 加密版 (仿桌面客户端 PLV/PLD 上报)

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `artist` | 否 | `` |
| `bitrate` | 是 | `-` |
| `cookie` | 否 | `` |
| `id` | 是 | `-` |
| `level` | 否 | `exhigh` |
| `name` | 否 | `` |
| `source` | 否 | `list` |
| `sourceId` | 是 | `-` |
| `sourceid` | 否 | `query.sourceId || ` |
| `time` | 是 | `-` |
| `total` | 是 | `-` |
| `vip` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/scrobble/v1?artist=&bitrate=xxx&cookie=
```

## `/search`

搜索

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `keywords` | 是 | `-` |
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |
| `type` | 否 | `1` |

**示例**：

```
GET http://localhost:3001/search?keywords=xxx&limit=30&offset=0
```

## `/search/default`

默认搜索关键词

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/search/hot`

热门搜索

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/search/hot/detail`

热搜列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/search/match`

本地歌曲匹配音乐信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album` | 否 | `` |
| `artist` | 否 | `` |
| `duration` | 否 | `0` |
| `md5` | 是 | `-` |
| `title` | 否 | `` |

**示例**：

```
GET http://localhost:3001/search/match?album=&artist=&duration=0
```

## `/search/multimatch`

多类型搜索

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `keywords` | 否 | `` |
| `type` | 否 | `1` |

**示例**：

```
GET http://localhost:3001/search/multimatch?keywords=&type=1
```

## `/search/suggest`

搜索建议

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `keywords` | 否 | `` |
| `type` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/search/suggest?keywords=&type=xxx
```

## `/search/suggest/pc`

搜索建议pc端

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `keyword` | 否 | `` |

**示例**：

```
GET http://localhost:3001/search/suggest/pc?keyword=
```

## `/send/album`

私信专辑

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `msg` | 否 | `` |
| `user_ids` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/send/album?id=xxx&msg=&user_ids=xxx
```

## `/send/playlist`

私信歌单

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `msg` | 是 | `-` |
| `playlist` | 是 | `-` |
| `user_ids` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/send/playlist?msg=xxx&playlist=xxx&user_ids=xxx
```

## `/send/song`

私信歌曲

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `msg` | 否 | `` |
| `user_ids` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/send/song?id=xxx&msg=&user_ids=xxx
```

## `/send/text`

私信

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `msg` | 是 | `-` |
| `user_ids` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/send/text?msg=xxx&user_ids=xxx
```

## `/setting`

设置

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/share/resource`

分享歌曲到动态

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 否 | `` |
| `msg` | 否 | `` |
| `type` | 否 | `song` |

**示例**：

```
GET http://localhost:3001/share/resource?id=&msg=&type=song
```

## `/sheet/list`

乐谱列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `ab` | 否 | `b` |
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/sheet/list?ab=b&id=xxx
```

## `/sheet/preview`

乐谱预览

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/sheet/preview?id=xxx
```

## `/sign/happy/info`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/signin/progress`

签到进度

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `moduleId` | 否 | `1207signin-1207signin` |

**示例**：

```
GET http://localhost:3001/signin/progress?moduleId=1207signin-1207signin
```

## `/simi/artist`

相似歌手

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/simi/artist?id=xxx
```

## `/simi/mv`

相似MV

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `mvid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/simi/mv?mvid=xxx
```

## `/simi/playlist`

相似歌单

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `limit` | 否 | `50` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/simi/playlist?id=xxx&limit=50&offset=0
```

## `/simi/song`

相似歌曲

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `limit` | 否 | `50` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/simi/song?id=xxx&limit=50&offset=0
```

## `/simi/user`

相似用户

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `limit` | 否 | `50` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/simi/user?id=xxx&limit=50&offset=0
```

## `/song/chorus`

副歌时间

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/chorus?id=xxx
```

## `/song/cloud/download`

从云盘获取歌曲下载链接

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/cloud/download?id=xxx
```

## `/song/copyright/rcmd`

灰色歌曲的其他版本推荐

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `songid` | 否 | `query.id` |

**示例**：

```
GET http://localhost:3001/song/copyright/rcmd?id=xxx&songid=query.id
```

## `/song/creators`

歌曲创作者信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/creators?id=xxx
```

## `/song/detail`

歌曲详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `ids` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/detail?ids=xxx
```

## `/song/downlist`

会员下载歌曲记录

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `20` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/song/downlist?limit=20&offset=0
```

## `/song/download/url`

获取客户端歌曲下载链接

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `br` | 否 | `999000` |
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/download/url?br=999000&id=xxx
```

## `/song/download/url/v1`

获取客户端歌曲下载链接 - v1

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `level` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/download/url/v1?id=xxx&level=xxx
```

## `/song/dynamic/cover`

歌曲动态封面

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/dynamic/cover?id=xxx
```

## `/song/like`

喜欢歌曲

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `like` | 是 | `-` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/like?id=xxx&like=xxx&uid=xxx
```

## `/song/like/check`

歌曲是否喜爱

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `ids` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/like/check?ids=xxx
```

## `/song/lyrics/mark`

歌词摘录 - 歌词摘录信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/lyrics/mark?id=xxx
```

## `/song/lyrics/mark/add`

歌词摘录 - 添加/修改摘录歌词

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `data` | 否 | `[]` |
| `id` | 是 | `-` |
| `markId` | 否 | `` |

**示例**：

```
GET http://localhost:3001/song/lyrics/mark/add?data=[]&id=xxx&markId=
```

## `/song/lyrics/mark/del`

歌词摘录 - 删除摘录歌词

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/lyrics/mark/del?id=xxx
```

## `/song/lyrics/mark/user/page`

歌词摘录 - 我的歌词本

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `10` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/song/lyrics/mark/user/page?limit=10&offset=0
```

## `/song/monthdownlist`

会员本月下载歌曲记录

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `20` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/song/monthdownlist?limit=20&offset=0
```

## `/song/music/detail`

歌曲音质详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/music/detail?id=xxx
```

## `/song/order/update`

更新歌曲顺序

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `ids` | 是 | `-` |
| `pid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/order/update?ids=xxx&pid=xxx
```

## `/song/purchased`

已购单曲

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `20` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/song/purchased?limit=20&offset=0
```

## `/song/red/count`

歌曲红心数量

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/red/count?id=xxx
```

## `/song/simi/get`

插播相似歌曲

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/simi/get?id=xxx
```

## `/song/singledownlist`

已购买单曲

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `20` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/song/singledownlist?limit=20&offset=0
```

## `/song/url`

歌曲链接

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `br` | 否 | `999000` |
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/url?br=999000&id=xxx
```

## `/song/url/match`

网易云歌曲解灰(适配SPlayer的UNM-Server)

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `source` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/url/match?id=xxx&source=xxx
```

## `/song/url/ncmget`

夹带私货的东西就不要放在这里了

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/song/url/v1`

歌曲链接 - v1

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `immerseType` | 否 | `c51` |
| `level` | 是 | `-` |
| `source` | 是 | `-` |
| `unblock` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/url/v1?id=xxx&immerseType=c51&level=xxx
```

## `/song/url/v1/302`

获取客户端歌曲下载链接 - v1

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `level` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/url/v1/302?id=xxx&level=xxx
```

## `/song/wiki/info`

歌曲百科

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/wiki/info?id=xxx
```

## `/song/wiki/summary`

音乐百科基础信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/song/wiki/summary?id=xxx
```

## `/starpick/comments/summary`

云村星评馆 - 简要评论列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/style/album`

曲风-专辑

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cursor` | 否 | `0` |
| `size` | 否 | `20` |
| `sort` | 否 | `0` |
| `tagId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/style/album?cursor=0&size=20&sort=0
```

## `/style/artist`

曲风-歌手

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cursor` | 否 | `0` |
| `size` | 否 | `20` |
| `tagId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/style/artist?cursor=0&size=20&tagId=xxx
```

## `/style/detail`

曲风详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `tagId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/style/detail?tagId=xxx
```

## `/style/list`

曲风列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/style/playlist`

曲风-歌单

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cursor` | 否 | `0` |
| `size` | 否 | `20` |
| `tagId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/style/playlist?cursor=0&size=20&tagId=xxx
```

## `/style/preference`

曲风偏好

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/style/song`

曲风-歌曲

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cursor` | 否 | `0` |
| `size` | 否 | `20` |
| `sort` | 否 | `0` |
| `tagId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/style/song?cursor=0&size=20&sort=0
```

## `/summary/annual`

年度听歌报告2017-2023

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `year` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/summary/annual?year=xxx
```

## `/thinktank/audit/resource/detail`

云小编获取任务

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `type` | 否 | `4` |

**示例**：

```
GET http://localhost:3001/thinktank/audit/resource/detail?type=4
```

## `/thinktank/audit/resource/update`

云小编提交任务

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `judgement` | 是 | `-` |
| `taskId` | 否 | `!query.judgement` |
| `type` | 否 | `4` |

**示例**：

```
GET http://localhost:3001/thinktank/audit/resource/update?judgement=xxx&taskId=!query.judgement&type=4
```

## `/threshold/detail/get`

获取达人达标信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/top/album`

新碟上架

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `area` | 否 | `ALL` |
| `limit` | 否 | `50` |
| `month` | 否 | `date.getMonth(` |
| `offset` | 否 | `0` |
| `type` | 否 | `new` |
| `year` | 否 | `date.getFullYear(` |

**示例**：

```
GET http://localhost:3001/top/album?area=ALL&limit=50&month=date.getMonth(
```

## `/top/artists`

热门歌手

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `50` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/top/artists?limit=50&offset=0
```

## `/top/list`

排行榜

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `idx` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/top/list?id=xxx&idx=xxx
```

## `/top/mv`

MV排行榜

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `area` | 否 | `` |
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/top/mv?area=&limit=30&offset=0
```

## `/top/playlist`

分类歌单

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cat` | 否 | `全部` |
| `limit` | 否 | `50` |
| `offset` | 否 | `0` |
| `order` | 否 | `hot` |

**示例**：

```
GET http://localhost:3001/top/playlist?cat=全部&limit=50&offset=0
```

## `/top/playlist/highquality`

精品歌单

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `before` | 否 | `0` |
| `cat` | 否 | `全部` |
| `limit` | 否 | `50` |

**示例**：

```
GET http://localhost:3001/top/playlist/highquality?before=0&cat=全部&limit=50
```

## `/top/song`

新歌速递

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `100` |
| `offset` | 否 | `0` |
| `type` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/top/song?limit=100&offset=0&type=0
```

## `/topic/detail`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `actid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/topic/detail?actid=xxx
```

## `/topic/detail/event/hot`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `actid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/topic/detail/event/hot?actid=xxx
```

## `/topic/sublist`

收藏的专栏

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `50` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/topic/sublist?limit=50&offset=0
```

## `/toplist`

所有榜单介绍

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/toplist/artist`

歌手榜

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `type` | 否 | `1` |

**示例**：

```
GET http://localhost:3001/toplist/artist?type=1
```

## `/toplist/detail`

所有榜单内容摘要

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/toplist/detail/v2`

所有榜单内容摘要v2

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/ugc/album/get`

专辑简要百科信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/ugc/album/get?id=xxx
```

## `/ugc/artist/get`

歌手简要百科信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/ugc/artist/get?id=xxx
```

## `/ugc/artist/search`

搜索歌手

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `keyword` | 是 | `-` |
| `limit` | 否 | `40` |

**示例**：

```
GET http://localhost:3001/ugc/artist/search?keyword=xxx&limit=40
```

## `/ugc/detail`

用户贡献内容

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `auditStatus` | 否 | `` |
| `limit` | 否 | `10` |
| `offset` | 否 | `0` |
| `order` | 否 | `desc` |
| `sortBy` | 否 | `createTime` |
| `type` | 否 | `1` |

**示例**：

```
GET http://localhost:3001/ugc/detail?auditStatus=&limit=10&offset=0
```

## `/ugc/mv/get`

mv简要百科信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/ugc/mv/get?id=xxx
```

## `/ugc/song/get`

歌曲简要百科信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/ugc/song/get?id=xxx
```

## `/ugc/user/devote`

用户贡献条目、积分、云贝数量

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/account`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/audio`

用户创建的电台

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/audio?uid=xxx
```

## `/user/binding`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/binding?uid=xxx
```

## `/user/bindingcellphone`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `captcha` | 是 | `-` |
| `countrycode` | 否 | `86` |
| `password` | 是 | `-` |
| `phone` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/bindingcellphone?captcha=xxx&countrycode=86&password=xxx
```

## `/user/cloud`

云盘数据

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/user/cloud?limit=30&offset=0
```

## `/user/cloud/del`

云盘歌曲删除

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/cloud/del?id=xxx
```

## `/user/cloud/detail`

云盘数据详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/cloud/detail?id=xxx
```

## `/user/comment/history`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `10` |
| `time` | 否 | `0` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/comment/history?limit=10&time=0&uid=xxx
```

## `/user/detail`

用户详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/detail?uid=xxx
```

## `/user/detail/new`

用户详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/detail/new?uid=xxx
```

## `/user/dj`

用户电台节目

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/dj?limit=30&offset=0&uid=xxx
```

## `/user/event`

用户动态

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `lasttime` | 否 | `-1` |
| `limit` | 否 | `30` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/event?lasttime=-1&limit=30&uid=xxx
```

## `/user/event/all`

获取当前登录用户可被上游枚举的全部动态

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/follow/mixed`

当前账号关注的用户/歌手

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cursor` | 否 | `0` |
| `scene` | 否 | `0` |
| `size` | 否 | `30` |

**示例**：

```
GET http://localhost:3001/user/follow/mixed?cursor=0&scene=0&size=30
```

## `/user/followeds`

关注TA的人(粉丝)

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `20` |
| `offset` | 否 | `0` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/followeds?limit=20&offset=0&uid=xxx
```

## `/user/follows`

TA关注的人(关注)

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/follows?limit=30&offset=0&uid=xxx
```

## `/user/level`

类别热门电台

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/medal`

用户徽章

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/medal?uid=xxx
```

## `/user/mutualfollow/get`

用户是否互相关注

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/mutualfollow/get?uid=xxx
```

## `/user/playlist`

用户歌单

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `30` |
| `offset` | 否 | `0` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/playlist?limit=30&offset=0&uid=xxx
```

## `/user/playlist/collect`

获取用户的收藏歌单列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `100` |
| `offset` | 否 | `0` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/playlist/collect?limit=100&offset=0&uid=xxx
```

## `/user/playlist/create`

获取用户的创建歌单列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `100` |
| `offset` | 否 | `0` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/playlist/create?limit=100&offset=0&uid=xxx
```

## `/user/record`

听歌排行

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `type` | 否 | `0` |
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/record?type=0&uid=xxx
```

## `/user/replacephone`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `captcha` | 是 | `-` |
| `countrycode` | 否 | `86` |
| `oldcaptcha` | 是 | `-` |
| `phone` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/replacephone?captcha=xxx&countrycode=86&oldcaptcha=xxx
```

## `/user/social/status`

用户状态

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `uid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/social/status?uid=xxx
```

## `/user/social/status/edit`

用户状态 - 编辑

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `actionUrl` | 是 | `-` |
| `content` | 是 | `-` |
| `iconUrl` | 是 | `-` |
| `type` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/social/status/edit?actionUrl=xxx&content=xxx&iconUrl=xxx
```

## `/user/social/status/rcmd`

用户状态 - 相同状态的用户

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/social/status/support`

用户状态 - 支持设置的状态

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/subcount`

收藏计数

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/user/update`

编辑用户信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `birthday` | 是 | `-` |
| `city` | 是 | `-` |
| `gender` | 是 | `-` |
| `nickname` | 是 | `-` |
| `province` | 是 | `-` |
| `signature` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/user/update?birthday=xxx&city=xxx&gender=xxx
```

## `/verify/getQr`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `evid` | 是 | `-` |
| `sign` | 是 | `-` |
| `token` | 是 | `-` |
| `type` | 是 | `-` |
| `vid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/verify/getQr?evid=xxx&sign=xxx&token=xxx
```

## `/verify/qrcodestatus`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `qr` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/verify/qrcodestatus?qr=xxx
```

## `/video/category/list`

视频分类列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `99` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/video/category/list?limit=99&offset=0
```

## `/video/detail`

视频详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/video/detail?id=xxx
```

## `/video/detail/info`

视频点赞转发评论数数据

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `vid` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/video/detail/info?vid=xxx
```

## `/video/group`

视频标签/分类下的视频

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/video/group?id=xxx&offset=0
```

## `/video/group/list`

视频标签列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/video/sub`

收藏与取消收藏视频

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `t` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/video/sub?id=xxx&t=xxx
```

## `/video/timeline/all`

全部视频列表

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/video/timeline/all?offset=0
```

## `/video/timeline/recommend`

推荐视频

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/video/timeline/recommend?offset=0
```

## `/video/url`

视频链接

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `res` | 否 | `1080` |

**示例**：

```
GET http://localhost:3001/video/url?id=xxx&res=1080
```

## `/vip/growthpoint`

会员成长值

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/vip/growthpoint/details`

会员成长值领取记录

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `20` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/vip/growthpoint/details?limit=20&offset=0
```

## `/vip/growthpoint/get`

领取会员成长值

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `ids` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/vip/growthpoint/get?ids=xxx
```

## `/vip/growthpoint/getall`

一键领取所有会员成长值

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/vip/info`

获取 VIP 信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `uid` | 否 | `` |

**示例**：

```
GET http://localhost:3001/vip/info?uid=
```

## `/vip/info/v2`

获取 VIP 信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `uid` | 否 | `` |

**示例**：

```
GET http://localhost:3001/vip/info/v2?uid=
```

## `/vip/sign`

黑胶乐签打卡

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/vip/sign/detail`

黑胶乐签打卡详情

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `timestamp` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/vip/sign/detail?timestamp=xxx
```

## `/vip/sign/history`

黑胶乐签打卡历史 / 状态查询

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `type` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/vip/sign/history?type=0
```

## `/vip/sign/info`

黑胶乐签未来签到信息

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/vip/tasks`

会员任务

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/vip/tasks/v1`

会员任务 - 新版

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/vip/tasks/v1?id=xxx
```

## `/vip/timemachine`

黑胶时光机

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `endTime` | 是 | `-` |
| `limit` | 否 | `60` |
| `startTime` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/vip/timemachine?endTime=xxx&limit=60&startTime=xxx
```

## `/voice/delete`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `ids` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/voice/delete?ids=xxx
```

## `/voice/detail`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/voice/detail?id=xxx
```

## `/voice/lyric`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/voice/lyric?id=xxx
```

## `/voice/upload`

声音上传（播客/声音动态）

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `autoPublish` | 是 | `-` |
| `autoPublishText` | 否 | `` |
| `categoryId` | 是 | `-` |
| `composedSongs` | 是 | `-` |
| `coverImgId` | 是 | `-` |
| `description` | 是 | `-` |
| `imgFile` | 是 | `-` |
| `orderNo` | 否 | `1` |
| `privacy` | 是 | `-` |
| `publishTime` | 否 | `0` |
| `secondCategoryId` | 是 | `-` |
| `songFile` | 是 | `-` |
| `songName` | 否 | `query.songFile.name` |
| `voiceListId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/voice/upload?autoPublish=xxx&autoPublishText=&categoryId=xxx
```

## `/voicelist/detail`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/voicelist/detail?id=xxx
```

## `/voicelist/list`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `200` |
| `offset` | 否 | `0` |
| `voiceListId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/voicelist/list?limit=200&offset=0&voiceListId=xxx
```

## `/voicelist/list/search`

声音搜索

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `displayStatus` | 否 | `null` |
| `limit` | 否 | `200` |
| `name` | 否 | `null` |
| `offset` | 否 | `0` |
| `type` | 否 | `null` |
| `voiceFeeType` | 否 | `null` |
| `voiceListId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/voicelist/list/search?displayStatus=null&limit=200&name=null
```

## `/voicelist/my/created`

我创建的播客声音

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `20` |

**示例**：

```
GET http://localhost:3001/voicelist/my/created?limit=20
```

## `/voicelist/search`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `keyword` | 否 | `` |
| `limit` | 否 | `10` |
| `offset` | 否 | `30` |

**示例**：

```
GET http://localhost:3001/voicelist/search?keyword=&limit=10&offset=30
```

## `/voicelist/trans`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `200` |
| `offset` | 否 | `0` |
| `position` | 否 | `1` |
| `programId` | 否 | `0` |
| `radioId` | 否 | `null` |

**示例**：

```
GET http://localhost:3001/voicelist/trans?limit=200&offset=0&position=1
```

## `/weblog`

操作记录

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `data` | 否 | `{}` |

**示例**：

```
GET http://localhost:3001/weblog?data={}
```

## `/yunbei`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/yunbei/expense`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `10` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/yunbei/expense?limit=10&offset=0
```

## `/yunbei/info`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/yunbei/rcmd/song`

云贝推歌

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 是 | `-` |
| `reason` | 否 | `好歌献给你` |
| `yunbeiNum` | 否 | `10` |

**示例**：

```
GET http://localhost:3001/yunbei/rcmd/song?id=xxx&reason=好歌献给你&yunbeiNum=10
```

## `/yunbei/rcmd/song/history`

云贝推歌历史记录

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `cursor` | 否 | `` |
| `size` | 否 | `20` |

**示例**：

```
GET http://localhost:3001/yunbei/rcmd/song/history?cursor=&size=20
```

## `/yunbei/receipt`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `10` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/yunbei/receipt?limit=10&offset=0
```

## `/yunbei/sign`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/yunbei/task/finish`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `depositCode` | 否 | `0` |
| `userTaskId` | 是 | `-` |

**示例**：

```
GET http://localhost:3001/yunbei/task/finish?depositCode=0&userTaskId=xxx
```

## `/yunbei/task/finish/v1`

云贝广告任务 - 完成任务领取云贝

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `yunbeiAmount` | 否 | `150` |

**示例**：

```
GET http://localhost:3001/yunbei/task/finish/v1?yunbeiAmount=150
```

## `/yunbei/task/list/v1`

云贝广告任务 - 查询今日任务状态

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/yunbei/task/recommend/song`

云贝广告任务 - 获取推荐歌曲

**方法**：`GET/POST`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `limit` | 否 | `10` |
| `offset` | 否 | `0` |

**示例**：

```
GET http://localhost:3001/yunbei/task/recommend/song?limit=10&offset=0
```

## `/yunbei/tasks`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/yunbei/tasks/todo`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。

## `/yunbei/today`

**方法**：`GET/POST`（参数可经 query 或 body 传递）

无参数。
