# Gateway Parity（Go/Gin → TypeScript/Hono）

> 范围：`gateway/`（Go/Gin，~18,847 行）→ `apps/gateway/`（TypeScript/Hono）。
> 基准日期：2026-09-28。分支：`v2/rewrite`。
> 本文档基于关键文件逐段核对 + 行为测试编写；**不是**逐行 diff 审计。
> 完整兼容的最终证明留给 P6（≥30 个真实接口新旧差分测试）。

## 1. 文件映射

| Go（gateway/） | TS（apps/gateway/src/） | 说明 |
|---|---|---|
| `cmd/music-api-proxy/main.go` | `main.ts`、`index.ts` | `@hono/node-server` 启动；SIGINT/SIGTERM 优雅关闭（30s 超时） |
| `internal/config/config.go`、`loader.go`、`manager.go`、`source_config.go`、`validator.go` | `config.ts` | YAML 读取 + Go 风格 duration 解析 + Zod schema/default + 环境变量覆盖 + 跨字段校验 |
| `internal/model/config_model.go`、`response_model.go`、`music_model.go`、`source_model.go` | `config.ts`、`response.ts`、`services.ts` | 类型并入各模块 |
| `internal/middleware/auth.go` | `middleware.ts` | API key/admin 鉴权、HTTPS 检查、UA/IP 白名单、滑动窗口限流、审计日志 |
| `internal/plugin/middleware/cors.go`、`logging.go`、`recovery.go` | `middleware.ts` | `corsMiddleware`、`requestLogger`、`recoveryMiddleware` |
| `internal/plugin/`（base/interfaces/manager/registry/service） | — | **不保留**（见 §6） |
| `internal/plugin/sources/gdstudio.go`、`unm_server.go`、`internal/repository/sources/gdstudio_source.go`、`unm_source.go` | `services.ts`（`GDStudioSource`、`UNMServerSource`） | `api.php` 协议客户端（`type`/`p`/`id`/`n`/`format` 参数、POST/GET） |
| `internal/repository/source_manager.go`、`base_source.go`、`interfaces.go` | `services.ts`（`SourceManager`） | 多源聚合、按 source 过滤、不可用源错误 |
| `internal/repository/cache_repository.go`、`music_info_cache.go`、`music_info_resolver.go` | `services.ts`（`MemoryCache`） | 内存 TTL 缓存 + 统计 |
| `internal/repository/rate_limiter.go` | `middleware.ts`（`RateLimiter`） | 滑动窗口内存限流 |
| `internal/repository/metrics_repository.go`、`internal/health/metrics.go`、`pkg/metrics/metrics.go` | `services.ts`（`MetricsCollector`） | 请求计数/延迟/错误分类；Node 字段替代 Go runtime 字段（见 §6） |
| `internal/health/checker.go` | `services.ts`（`HealthChecker`） | 存活/就绪/启动探针 |
| `internal/repository/app_config_repository.go`、`config_repository.go`、`http_client.go` | `services.ts`（`ConfigService`） | 配置读写/校验/备份/恢复/删除；**内存**实现（Go 为文件/DB，见 §6） |
| `internal/service/music_service.go`、`system_service.go`、`config_service.go`、`service_manager.go`、`interfaces.go` | `services.ts` | 业务逻辑直译 |
| `internal/controller/music_controller.go` | `routes/music.ts` | `/api/v1/match|ncmget|other|search|info|picture|lyric` |
| `internal/controller/platform_controller.go` | `routes/platform.ts` | `GET/POST /api/v1/platform/:name/*` 反代五平台 |
| `internal/controller/system_controller.go` | `routes/system.ts` | info/health/metrics/sources/cache/*、`/api/v1/version`、`/api/v1/ping` |
| `internal/controller/config_controller.go` | `routes/config.ts` | 完整配置/section/validate/reload/backup 全套 |
| `internal/controller/health_controller.go` | `routes/health.ts` | `/health`、`/ready`、`/metrics`、`/healthz`、`/readyz`、`/startupz` |
| `internal/controller/controller_manager.go` | `app.ts` | 路由装配 + 中间件挂载（**鉴权挂载方式有修复性偏差，见 §5**） |
| `internal/utils/sanitizer.go` | `services.ts`（`sanitizeForProduction`） | 递归脱敏（api_key/jwt_secret/password/token/secret/client_secret 键名；保留首尾各 2 字符） |
| `pkg/response/response.go`、`pkg/errors/*` | `response.ts` | 统一信封 `{code,message,data?,timestamp}`（秒级） |
| `pkg/logger/*` | `middleware.ts` | 请求日志（console；JSON/文本格式可配） |
| `pkg/httpclient/client.go` | `routes/platform.ts` | fetch 反代（30s 超时、hop-by-hop 头过滤、X-Forwarded-For 追加） |
| `pkg/encoding/encoding.go` | — | 网关层未使用，**未移植** |

## 2. 路由与行为对照

### 2.1 音乐 API（`routes/music.ts`）

| 方法+路径 | 成功文案 | 关键校验 |
|---|---|---|
| `GET /api/v1/match?id=` | `匹配成功` | id 必填（400 `音乐ID不能为空`）；br/n 参数透传；`server=` 指定音源 |
| `GET /api/v1/ncmget?id=&br=` | `获取成功` | br 必须为 128/192/320/740/999/32000（400 `不支持的音质: {br}`，Go 原文） |
| `GET /api/v1/other` | `获取成功` | name/server 透传 |
| `GET /api/v1/search?keyword=` | `搜索成功` | keyword 必填（400 `搜索关键词不能为空`） |
| `GET /api/v1/info?id=` | `获取成功` | id 必填 |
| `GET /api/v1/picture?id=&size=` | `获取成功` | id 必填；size ∈ {100,200,300,400,500,1000}（400 `不支持的图片尺寸`） |
| `GET /api/v1/lyric?id=` | `获取成功` | id 必填；返回 `{lyric,tlyric}` |

### 2.2 平台反代（`routes/platform.ts`）

| 方法+路径 | 行为 |
|---|---|
| `GET/POST /api/v1/platform/:name`、`/api/v1/platform/:name/*` | 未知平台 → **404** `未知平台: {name}，可用平台: netease, kugou, unm, lyric, meting`（Go 原文）；上游失败 → **502** `{code:502,message:"平台服务不可用: {name}",platform:name}`（Go 原始信封，非 data 包装） |
| 上游地址 | `netease→http://netease:3001`、`kugou→http://kugou:3002`、`unm→http://unm:3003`、`lyric→http://lyric:3004`、`meting→http://meting:3005`；`PLATFORM_<NAME>_URL` 环境变量逐个覆盖（每次请求读取，热生效） |

透传规则：path/query 完整透传；POST body 原样转发；过滤 hop-by-hop 响应头；追加 `X-Forwarded-For`/`X-Forwarded-Proto`；30s 上游超时。

### 2.3 System / Config / 健康（`routes/system.ts`、`routes/config.ts`、`routes/health.ts`）

| 方法+路径 | 说明 |
|---|---|
| `GET /api/v1/system/info` | 网关信息（鉴权） |
| `GET /api/v1/system/health` | 健康（鉴权） |
| `GET /api/v1/system/metrics` | **JSON 信封** `指标获取成功`（鉴权；不是 Prometheus 文本） |
| `GET /api/v1/system/sources`、`POST /api/v1/system/sources/refresh` | 音源列表/刷新（鉴权） |
| `GET /api/v1/system/cache/stats`、`POST /api/v1/system/cache/clear` | 缓存统计/清理（鉴权） |
| `GET /api/v1/version`、`GET /api/v1/ping` | 版本/pong（鉴权） |
| `GET/PUT /api/v1/config`、`GET/PUT /api/v1/config/:section` | 管理员密钥；读取脱敏；`PUT` 经 Zod section schema + 跨字段重校验 |
| `POST /api/v1/config/validate`、`/reload` | 校验/重载（管理员密钥） |
| `POST /api/v1/config/backup`、`GET /api/v1/config/backups`、`POST /api/v1/config/backup/:id/restore`、`DELETE /api/v1/config/backup/:id` | 备份全套（管理员密钥；**内存**存储，重启丢失） |
| `GET /health`、`GET /ready`、`GET /metrics`、`GET /healthz`、`GET /readyz`、`GET /startupz` | 无鉴权探针；`/metrics` 为 JSON 信封 |

### 2.4 根 / 静态 / 错误

- `GET /`、`GET /api`、`GET /api/v1`：服务描述（Go 原文案 `music-api-proxy`）。
- `GET /public/*`：静态文件（`PUBLIC_DIR`，默认 `./public`；防目录穿越）。
- 未知路径 → **404** `{code:404,message:"接口不存在"}`；已知路径错误方法 → **405** `{code:405,message:"方法不允许"}`。

## 3. 配置对照

- 搜索路径：`./config.yaml` → `./configs/config.yaml` → `/etc/music-api-proxy/config.yaml`（另支持 `CONFIG_PATH`）。
- 环境覆盖：`PORT`、`HOST`、`ALLOWED_DOMAIN`、`PROXY_URL`、`ENABLE_FLAC`、`JWT_SECRET`、`API_KEY`、`API_AUTH_*`、`RATE_LIMIT_*`、`CACHE_*`、`UNM_*`、`GDSTUDIO_*`、`PLATFORM_*_URL` 等（`config.ts` 顶部有完整表）。
- `server.enable_https` 保留为配置项，但 **TLS 由反向代理终止**（见 §6）；`cert_file`/`key_file` 仍可配置但网关自身不监听 TLS。

## 4. 鉴权行为

- API key 提取优先级（Go 原样）：`X-API-Key` → `Authorization: Bearer` → `Authorization: ApiKey` → `X-Auth-Token` → `?api_key=`；常量时间比较。
- `system/*` 走 API-key 鉴权；`config/*` 走 **admin-key** 鉴权（admin key ≠ api key）。
- **Admin 无条件要求 HTTPS**（Go `auth.go:183-186` 原样；HTTP → **426** `管理员操作要求使用HTTPS连接`；`X-Forwarded-Proto: https` 视为 HTTPS）。
- API-key 鉴权：`require_https=true` 时 HTTP → 426；UA 白名单（子串匹配，403 `无效的客户端`）；IP 白名单（精确/CIDR/IPv4 范围/`*`，命中则免 key）；滑动窗口限流（429 `请求过于频繁，请稍后再试`）；审计日志（可关）。
- `enable_auth=false`（默认）时全部放行。

## 5. 修复性偏差（相对 Go 的行为变更）

> **Go ControllerManager 的鉴权 group bug**：Go 创建了挂载 `APIKeyAuth`/`AdminAuth` 的受保护 group，
> 但各 controller 把路由注册在了**父 group** 上，鉴权实际未生效。
> TS 端按其**安全意图**真正保护了 `system/*` 与 `config/*`。
> 这是刻意的行为修复，不是回归；若需与 Go 旧行为完全一致（无鉴权），把 `enable_auth` 保持 `false` 即可。

## 6. 已知偏差 / 不保留项

1. **插件框架不保留**：`internal/plugin/*`（manager/registry/service 抽象）按任务要求删除；中间件与音源实现为直连模块。
2. **热加载不做**：`/reload` 为显式重载；无文件变更自动热加载。
3. **TLS 交给反向代理**：Go 可直接监听 TLS；TS 网关只监听 HTTP，生产 TLS 由前置反代终止（`X-Forwarded-Proto` 透传）。
4. **配置备份内存化**：Go 经 repository 持久化；TS `ConfigService` 备份存内存，进程重启丢失。
5. **指标字段**：`memory_stats` 取自 `process.memoryUsage()`（Go 为 runtime.MemStats）；`num_cpu` 取自 `hardwareConcurrency`；无 goroutine 数/ GC 次数对应字段。
6. **日志**：zap → `requestLogger`（console，JSON/文本可配）；无日志轮转。
7. **错误码包**：`pkg/errors` 业务码合并为 HTTP 状态 + 中文 message（对外信封不变）。
8. `pkg/encoding` 未移植（网关层未使用）。

## 7. 测试

`test/gateway.test.ts`（vitest，`app.request()`，**零真实网络**；上游用 loopback stub server，音源用 stub `Source`）：

- 健康：`/health` 信封、`/ready|/healthz|/readyz`、`/metrics` JSON 信封非 Prometheus、`/api`+`/api/v1` 描述
- 路由：404 `接口不存在`、405 `方法不允许`
- 反代：未知平台 404 原文案、GET path+query 透传（env 覆盖上游）、上游失联 502 原始信封、POST body 转发
- 鉴权：无 key 401 `缺少API密钥`、错 key 401 `无效的API密钥`、Bearer 通过、IP 白名单免 key、非白名单 XFF 仍需 key、UA 拒绝 403/放行、限流 429、**admin HTTP 426**、admin key 区分、config 读取脱敏、备份/恢复 round-trip
- 音乐：search 校验+结果、match 校验+URL、ncmget 非法音质 400、picture 尺寸校验

门禁：`pnpm --filter @music-api/gateway build` ✅ · `lint` ✅（biome，0 error）· `test` ✅（25/25）。

## 8. 待办（P6）

- ≥30 个真实接口新旧差分测试后，才能声称与 Go 网关完整兼容。
- 生产部署前需补：反向代理 TLS 终止配置、`/etc/music-api-proxy/config.yaml` 落盘、`API_KEY`/`ADMIN_KEY` 注入。
