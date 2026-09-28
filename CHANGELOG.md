# Changelog

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
