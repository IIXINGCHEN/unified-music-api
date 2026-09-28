# Music API Proxy

[![Go Version](https://img.shields.io/badge/Go-1.21+-blue.svg)](https://golang.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](https://github.com/IIXINGCHEN/music-api-proxy)

<img src="./public/favicon.png" alt="logo" width="140" height="140" align="right">

Music API Proxy 是一个高性能、企业级的音乐API代理服务器，使用Go语言开发，通过统一接口聚合多个第三方音乐API服务，提供稳定可靠的音源匹配服务。

## ✨ 特性

- 🚀 **高性能**: 基于Go语言和Gin框架，提供卓越的并发处理能力
- 🔒 **企业级安全**: 完整的安全中间件、域名访问控制、请求限流
- 📊 **完善监控**: 健康检查、指标收集、结构化日志
- 🎵 **第三方API聚合**: 统一接口聚合多个第三方音乐API服务
- 🔌 **插件化架构**: 支持多种第三方音乐API服务
- 🐳 **容器化部署**: 支持Docker和Kubernetes部署
- 🔧 **灵活配置**: 支持环境变量、配置文件、热重载
- 📈 **生产就绪**: 完整的错误处理、优雅关闭、资源管理

## 🏗️ 架构设计

```
music-api-proxy/
├── cmd/music-api-proxy/     # 应用入口
├── internal/                # 私有应用代码
│   ├── config/             # 配置管理
│   ├── controller/         # 控制器层
│   ├── service/            # 业务逻辑层
│   ├── repository/         # 数据访问层
│   ├── middleware/         # 中间件
│   └── health/             # 健康检查
├── pkg/                     # 可复用公共库
│   ├── response/           # 统一响应格式
│   ├── errors/             # 错误处理
│   └── logger/             # 日志系统
└── scripts/                # 构建和部署脚本
```

## 🚀 快速开始

### 环境要求

- Go 1.21+
- Git

### 安装

```bash
# 克隆项目
git clone https://github.com/IIXINGCHEN/music-api-proxy.git
cd music-api-proxy

# 下载依赖
go mod download

# 构建项目
make build

# 或使用构建脚本
./scripts/build.sh
```

### 运行

```bash
# 开发模式运行
make dev

# 生产模式运行
./bin/music-api-proxy
```

## ⚙️ 配置

### 环境变量

```bash
# 服务配置
PORT=5678                    # 服务端口
ALLOWED_DOMAIN=*             # 允许的域名
PROXY_URL=                   # 代理URL

# 功能配置
ENABLE_FLAC=true            # 启用无损音质

# 安全配置
JWT_SECRET=your-secret-key   # JWT密钥
API_KEY=                     # API密钥

# 监控配置
LOG_LEVEL=info              # 日志级别
METRICS_ENABLED=true        # 启用指标收集

# 音源配置
NETEASE_COOKIE=             # 网易云Cookie
QQ_COOKIE=                  # QQ音乐Cookie
MIGU_COOKIE=                # 咪咕Cookie
JOOX_COOKIE=                # JOOX Cookie
YOUTUBE_KEY=                # YouTube API密钥
```

### 配置文件

创建 `configs/config.yaml`:

```yaml
server:
  port: 5678
  host: "0.0.0.0"
  allowed_domain: "*"
  enable_flac: true

security:
  jwt_secret: "your-jwt-secret-key"
  cors_origins: ["*"]

performance:
  max_connections: 1000
  timeout_seconds: 30
  cache_ttl: "5m"
  worker_pool_size: 10
  rate_limit: 100

monitoring:
  log_level: "info"
  metrics_enabled: true
  health_check_interval: "30s"

sources:
  default_sources: ["pyncmd", "kuwo", "bilibili", "migu", "kugou", "qq", "youtube", "youtube-dl", "yt-dlp"]
  timeout: "30s"
  retry_count: 3
```

## 📚 API文档

### 系统接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/ready` | GET | 就绪检查 |
| `/metrics` | GET | 系统指标 |
| `/info` | GET | 系统信息 |

### 音乐接口

| 接口 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/match` | GET | 音乐匹配 | `id` (必需), `server` (可选) |
| `/ncmget` | GET | 网易云获取 | `id` (必需), `br` (可选) |
| `/otherget` | GET | 其他音源获取 | `name` (必需) |
| `/search` | GET | 音乐搜索 | `keyword` (必需), `source` (可选) |

### 第三方API服务

| 名称 | 代号 | 默认启用 | 注意事项 |
|------|------|----------|----------|
| UNM Server | `unm_server` | ✅ | 需要配置 `UNM_SERVER_BASE_URL` |
| GDStudio API | `gdstudio` | ✅ | 需要配置 `GDSTUDIO_BASE_URL` |

### 响应格式

```json
{
  "code": 200,
  "message": "成功",
  "data": {...},
  "timestamp": 1640995200
}
```

## 🔧 开发

### 构建命令

```bash
# 构建
make build

# 代码验证
make verify

# 代码检查
make lint

# 格式化代码
make fmt

# 清理
make clean

# 运行
make run
```

### 代码验证

```bash
# 验证构建
make verify

# 代码质量检查
make quality

# 代码格式化
make fmt
```

## 🐳 部署

### Docker部署

```bash
# 构建镜像
docker build -t music-api-proxy .

# 运行容器
docker run -p 5678:5678 -e ENABLE_FLAC=true music-api-proxy
```

### 系统服务部署

```bash
# 部署到服务器
./scripts/deploy.sh

# 查看状态
./scripts/deploy.sh status

# 回滚
./scripts/deploy.sh rollback
```

### Kubernetes部署

```bash
# 应用配置
kubectl apply -f deployments/kubernetes/
```

## 📊 监控

### 健康检查

- **存活性探针**: `/healthz`
- **就绪性探针**: `/readyz`
- **启动探针**: `/startupz`

### 指标收集

访问 `/metrics` 获取Prometheus格式的指标数据。

### 日志

结构化JSON日志，支持多种输出格式和级别。

## 🤝 贡献

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [UnblockNeteaseMusic](https://github.com/UnblockNeteaseMusic/server) - 第三方音乐API服务
- [Gin](https://github.com/gin-gonic/gin) - Go Web框架
- [Zap](https://github.com/uber-go/zap) - 高性能日志库
- [Viper](https://github.com/spf13/viper) - 配置管理库

## 📞 支持

如果您遇到问题或有建议，请：

1. 查看 [文档](docs/)
2. 搜索 [Issues](https://github.com/IIXINGCHEN/music-api-proxy/issues)
3. 创建新的 [Issue](https://github.com/IIXINGCHEN/music-api-proxy/issues/new)

---

**注意**: 本项目仅供学习和研究使用，请遵守相关法律法规和平台服务条款。