# Changelog

## [2.0.0] - 2026-09-28

v1 聚合版的 TypeScript + Hono 全面重构：单技术栈、零 Go 代码。

### 新增

- pnpm + Turborepo monorepo：`apps/`（6 服务）+ `packages/`（6 共享包）
- `packages/ncm-crypto` / `kugou-crypto`：网易云 weapi/eapi/linuxapi/xeapi、
  酷狗 7 种 signer，手写移植 + golden-vector 门禁（行覆盖 100%）
- `packages/ncm-core` / `kugou-core`：请求核心、模块框架、设备指纹
- `packages/http-kit`：共享 2 分钟缓存 / 滑动窗口限流 / 日志 / 错误信封
- `packages/contracts`：OpenAPI 3.1 注册表 + Scalar 文档（各服务 `/docs`，枢纽 `docs/api.html`）
- 网易云 440 模块、酷狗 226 路由全量 TS 迁移；契约测试 423/423、226/226
- 网关 Hono 重写：路由表 / API Key + Admin Key 鉴权 / 限流 / 平台聚合反代 /
  system-config API / 健康探针 / 404-405 兜底
- `deploy/`：docker-compose 一键编排 + 单一参数化 Dockerfile（node:22-slim 多阶段）
- CI：install → build → lint → test → assert.sh（73 项）→ 契约测试，全绿门禁

### 行为变更（与 v1 / 原版有意差异）

- 网关鉴权真正生效：原 Go 版 ControllerManager 误将 controller 注册在父 group，
  导致 system/config 鉴权实际未生效；Hono 版按安全意图保护（`enable_auth=false` 可回旧行为）
- Admin 限流真正生效：原 Go 版每次请求新建限流器，管理限流实际不生效；
  Hono 版使用共享限流器
- 内存缓存上限 1000 条（原版 apicache 无上限，淘汰最旧项，内存安全）
- 请求体超限返回 413 JSON（原版直接销毁连接）；无效 JSON 返回 400 JSON 信封（原版 400 HTML）
- 未知路由 404：`Content-Type: text/plain`（原版 Express 默认 `text/html`）；
  酷狗 404 不再设置 `KUGOU_API_*` Cookie（仅 API 路由注入）

### 去重

- 删除 `services/`（227MB v1 旧代码）：v1 基线保留于 git 历史（`a6f7b2e`）与审计快照，
  工作树不再保留双份
- 不复制 Go 网关插件框架（`FilterPlugin` / `CachePlugin` 零实现）与热加载 Watcher（从未启用）
- 不移植酷狗 `register` signer（死代码，零使用）
- Meting 延续 v1 精简：仅 `spotify` / `ytmusic` provider

### 修复

- P6-1：Undici 字符串 POST body 缺默认 Content-Type 致网易云上游空 body；
  `ncm-core` 无 Content-Type 时显式设 `application/x-www-form-urlencoded`
- CI：同步 `pnpm-lock.yaml`（gateway 新增依赖遗漏）；contracts job 补 `build` 步骤；
  gateway 12 处 TS2742 加显式返回类型注解（hono 4.13.10 类型变化触发）

## [1.0.0] - 2026-09-28

### 新增
- 新仓库 `unified-music-api`：9 个音乐 API 仓库整合为 1 个（审计报告见 `../music-api-audit/AUDIT.md`）
- 网关新增平台聚合控制器 `gateway/internal/controller/platform_controller.go`：
  统一路由 `GET/POST /api/v1/platform/{name}/{path}`，反向代理到 5 个平台微服务；
  未知平台 404、上游不可用 502；上游地址支持环境变量覆盖
- `services/lyric/server.ts`：Lyric-Atlas-API 独立运行入口（复用其 Hono app，原项目仅支持 Vercel Edge）
- `deploy/docker-compose.yml`：一键编排（网关 + 5 服务）；lyric 的 `EXTERNAL_NCM_API_URL`
  回退链默认指向内部网易云服务，不再依赖外部 API
- `contracts/openapi.yaml`：OpenAPI 3.1 统一契约；`docs/api.html`：Scalar 文档页
- `scripts/assert.sh`：29 项仓库断言门禁（结构 / 功能完整性 / 去重 / 契约）
- `.github/workflows/ci.yml`：Go 构建+vet、Node 语法检查、契约校验、断言门禁

### 去重
- Meting 服务精简：删除 `netease` / `tencent` provider（功能被网易云/酷狗原生库全覆盖），
  仅保留 `spotify` / `ytmusic`；默认源切换为 `spotify`；删除失效的 esbuild textReplace
- 退役（待归档后删除，需双重 DELETE 单独确认）：
  `neteasecloudmusicapienhanced-api-enhanced`（被 api-enhanced 440 接口超集替代）、
  `meting-api-1.5.11`、`meting-api-p`

### 修复
- `gateway/pkg/validator/validator.go`：修复上游自带的变量遮蔽 bug
 （`switch v := value.(type)` 遮住 receiver，导致 `go build` 失败）
- `gateway/Dockerfile`：构建镜像升级到 `golang:1.24-alpine`（对齐 go.mod toolchain）

### 技术栈
- 网关：Go 1.24 + Gin（沿用）
- 平台服务：Node 22 LTS（运行容器统一升级；业务代码零改写）
- 契约：OpenAPI 3.1 + Scalar
