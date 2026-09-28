# 关于 unified-music-api

> 更新时间：2026-09-28

## 1. 项目定位

unified-music-api 是一套面向「音乐数据聚合与分发」场景的开源 API 系统，将 9 个分散的音乐 API 仓库整合为单一 TypeScript monorepo，适用于：

- 需要网易云音乐全接口能力的应用
- 需要酷狗音乐数据接入的场景
- 灰色歌曲解锁（UNM）与多源匹配
- TTML 逐字歌词获取
- 需要统一网关做鉴权、限流、反代的独立站业务

## 2. 核心能力

### 2.1 微服务架构

- `apps/gateway`：统一网关（Hono + TypeScript），鉴权、限流、平台反代
- `apps/netease`：网易云音乐 440 个接口
- `apps/kugou`：酷狗音乐 226 个接口
- `apps/unm`：解灰 / 多源匹配（GD Studio、QQ、酷狗、咪咕、JOOX）
- `apps/lyric`：TTML 逐字歌词服务
- `apps/meting`：Meting 聚合解析（spotify / ytmusic）
- `packages/`：六个共享包（ncm-crypto、http-kit 等）

### 2.2 网关能力

- 统一路由 `GET/POST /api/v1/platform/{name}/{path}` 反代五个平台
- API Key 鉴权、IP 限流、上游地址环境变量可覆盖
- 原生聚合接口：`/api/v1/search`、`/api/v1/lyric`、`/api/v1/match`

### 2.3 数据能力

- 网易云 440 接口：与上游 `api-enhanced` 全量静态比对，零缺失
- 酷狗 226 接口：完整承接原模块
- NCM 加密（WEAPI/EAPI）经 golden 测试验证，与原版行为一致

### 2.4 工程化

- pnpm + Turborepo monorepo，Biome 格式化/ lint
- 每服务独立 OpenAPI 3.1 spec，Scalar 实时文档
- CI 四门禁：构建/测试、覆盖率、契约（路由数）、gitleaks
- Docker Compose 一键部署

## 3. 为什么选择 unified-music-api

- **接口最全**：网易云 440 + 酷狗 226，逐模块比对无缺失。
- **技术栈现代**：TypeScript + Hono，全类型安全，无冗余无冲突。
- **网关统一**：一个入口聚合五个平台，鉴权限流开箱即用。
- **文档完整**：本手册 + 各服务 Scalar 实时文档 + OpenAPI spec。
- **可持续演进**：monorepo 结构，加新平台只需新增 app。

## 4. 适用场景

- 想快速接入网易云/酷狗音乐数据的个人/小团队
- 需要自建音乐 API 网关、保留自主可控能力的企业团队
- 需要在现有系统上做音乐能力定制开发的技术团队

## 5. 快速开始

```bash
# 克隆
git clone https://github.com/IIXINGCHEN/unified-music-api
cd unified-music-api

# 安装依赖
pnpm install

# 启动全部服务
pnpm dev
```

启动后访问：

- 网关：`http://localhost:8080`
- 网易云：`http://localhost:3001/docs`
- API 文档：`/api/`（本手册）

详见[快速开始](/guide/quickstart)。

## 6. 开源仓库与贡献

- 主仓库：[IIXINGCHEN/unified-music-api](https://github.com/IIXINGCHEN/unified-music-api)
- 在线文档：[https://iixingchen.github.io/unified-music-api/](https://iixingchen.github.io/unified-music-api/)

如果你希望补充接口、修复问题或改进文档，欢迎直接提交 PR。
