# UNM 解灰 API

直连 `http://localhost:3003`，经网关 `/api/v1/platform/unm/...`。

## `/`

**方法**：`GET`（参数可经 query 或 body 传递）

无参数。

## `/api/monitor/clear`

**方法**：`POST`（参数可经 query 或 body 传递）

无参数。

## `/api/monitor/data`

**方法**：`GET`（参数可经 query 或 body 传递）

无参数。

## `/dashboard`

**方法**：`GET`（参数可经 query 或 body 传递）

无参数。

## `/docs`

**方法**：`GET`（参数可经 query 或 body 传递）

无参数。

## `/health`

**方法**：`GET`（参数可经 query 或 body 传递）

无参数。

## `/info`

**方法**：`GET`（参数可经 query 或 body 传递）

无参数。

## `/lyric`

**方法**：`GET`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `album` | 否 | `-` |
| `artist` | 否 | `-` |
| `duration` | 否 | `-` |
| `id` | 否 | `-` |
| `name` | 否 | `-` |
| `source` | 否 | `-` |

**示例**：

```
GET http://localhost:3003/lyric?album=xxx&artist=xxx&duration=xxx
```

## `/match`

**方法**：`GET`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `br` | 否 | `-` |
| `id` | 否 | `-` |
| `server` | 否 | `-` |

**示例**：

```
GET http://localhost:3003/match?br=xxx&id=xxx&server=xxx
```

## `/monitor`

**方法**：`GET`（参数可经 query 或 body 传递）

无参数。

## `/ncmget`

**方法**：`GET`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `br` | 否 | `-` |
| `id` | 否 | `-` |

**示例**：

```
GET http://localhost:3003/ncmget?br=xxx&id=xxx
```

## `/otherget`

**方法**：`GET`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `name` | 否 | `-` |

**示例**：

```
GET http://localhost:3003/otherget?name=xxx
```

## `/pic`

**方法**：`GET`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 否 | `-` |
| `size` | 否 | `-` |
| `source` | 否 | `-` |

**示例**：

```
GET http://localhost:3003/pic?id=xxx&size=xxx&source=xxx
```

## `/picture`

**方法**：`GET`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `id` | 否 | `-` |
| `size` | 否 | `-` |
| `source` | 否 | `-` |

**示例**：

```
GET http://localhost:3003/picture?id=xxx&size=xxx&source=xxx
```

## `/ping`

**方法**：`GET`（参数可经 query 或 body 传递）

无参数。

## `/playlist/:id`

**方法**：`GET`（参数可经 query 或 body 传递）

无参数。

## `/relay`

**方法**：`GET`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `url` | 否 | `-` |

**示例**：

```
GET http://localhost:3003/relay?url=xxx
```

## `/search`

**方法**：`GET`（参数可经 query 或 body 传递）

| 参数 | 必填 | 默认值 |
|------|------|--------|
| `count` | 否 | `-` |
| `name` | 否 | `-` |
| `source` | 否 | `-` |

**示例**：

```
GET http://localhost:3003/search?count=xxx&name=xxx&source=xxx
```

## `/test`

**方法**：`GET`（参数可经 query 或 body 传递）

无参数。
