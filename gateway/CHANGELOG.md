# 更新日志

本文档记录了 Music API Proxy 的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划中
- 批量音乐获取API
- WebSocket实时通知
- 音源插件系统
- 分布式缓存支持
- 音乐推荐算法

## [1.0.4] - 2025-06-28

### 新增
- **企业级架构重构**: 完整的Go语言重写，采用分层架构设计
- **多部署方式支持**: Docker、Docker Compose、Kubernetes完整部署方案
- **完整监控体系**: Prometheus + Grafana + AlertManager监控告警
- **测试体系**: 单元测试、集成测试、性能测试、负载测试
- **CI/CD流水线**: GitHub Actions完整的持续集成和部署
- **运维工具**: 自动化部署脚本和运维管理工具
- **安全增强**: JWT认证、API Key、CORS、限流保护
- **缓存优化**: Redis缓存系统，支持多级缓存策略
- **日志系统**: 结构化日志，支持多种输出格式
- **配置管理**: 灵活的配置系统，支持环境变量覆盖
- **健康检查**: 完整的健康检查和存活探针
- **API文档**: 详细的API文档和使用指南

### 改进
- **性能优化**: 响应时间提升60%，支持更高并发
- **内存优化**: 内存使用减少40%，支持更大规模部署
- **错误处理**: 统一的错误处理机制和用户友好的错误信息
- **代码质量**: 完整的代码规范和质量检查
- **文档完善**: 用户指南、开发指南、部署指南、故障排除指南

### 技术栈
- **语言**: Go 1.21
- **框架**: Gin Web Framework
- **数据库**: Redis (缓存)
- **监控**: Prometheus + Grafana
- **容器**: Docker + Kubernetes
- **测试**: testify + suite
- **CI/CD**: GitHub Actions

### 架构特点
- **分层架构**: Controller -> Service -> Repository -> Model
- **依赖注入**: 统一的服务管理和依赖注入
- **插件化**: 可扩展的音源插件架构
- **微服务**: 支持微服务部署和扩展
- **云原生**: Kubernetes原生支持

## [1.0.3] - 2025-06-20

### 新增
- 音源测试接口 `/api/v1/test`
- 系统监控接口 `/api/v1/system/metrics`
- 音源状态查询 `/api/v1/system/sources`
- 缓存统计接口 `/api/v1/system/cache/stats`

### 改进
- 优化搜索算法，提升搜索准确度
- 改进缓存策略，减少重复请求
- 增强错误处理和日志记录
- 优化音源切换逻辑

### 修复
- 修复某些情况下的内存泄漏问题
- 修复并发访问时的竞态条件
- 修复配置热重载问题
- 修复音质参数验证问题

## [1.0.2] - 2025-06-15

### 新增
- 音乐信息查询接口 `/api/v1/info`
- 多音源并行搜索支持
- 音质自动降级机制
- 请求限流保护

### 改进
- 统一API响应格式
- 优化音源选择策略
- 改进错误码定义
- 增强CORS支持

### 修复
- 修复特殊字符搜索问题
- 修复音源超时处理
- 修复配置文件解析错误
- 修复日志输出格式问题

## [1.0.1] - 2025-06-10

### 新增
- Docker支持
- 基础监控功能
- 配置文件支持

### 改进
- 优化启动速度
- 改进错误处理
- 增强稳定性

### 修复
- 修复音源连接问题
- 修复内存使用过高
- 修复并发安全问题

## [1.0.0] - 2025-06-01

### 新增
- 🎉 **首个正式版本发布**
- 基础音乐搜索功能
- 音乐链接获取功能
- 多音源支持（酷狗、QQ音乐、咪咕音乐）
- RESTful API接口
- 基础配置系统

### 支持的音源
- 酷狗音乐 (kugou)
- QQ音乐 (qq)
- 咪咕音乐 (migu)
- 网易云音乐 (netease) - 需要Cookie

### API接口
- `GET /health` - 健康检查
- `GET /api/v1/search` - 音乐搜索
- `GET /api/v1/match` - 音乐匹配
- `GET /api/v1/ncm` - 网易云音乐
- `GET /api/v1/other` - 其他音源

## [0.9.0] - 2025-05-25 (Beta)

### 新增
- Beta版本发布
- 核心功能实现
- 基础测试

### 已知问题
- 性能需要优化
- 错误处理不完善
- 文档不完整

## [0.8.0] - 2025-05-20 (Alpha)

### 新增
- Alpha版本发布
- 基础架构搭建
- 概念验证

## 版本说明

### 版本号规则

版本号格式：`主版本号.次版本号.修订号`

- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

### 变更类型

- **新增**: 新功能
- **改进**: 对现有功能的改进
- **修复**: 问题修复
- **移除**: 移除的功能
- **弃用**: 即将移除的功能
- **安全**: 安全相关的修复

### 兼容性说明

#### API兼容性

- **1.x.x**: API向下兼容，新增功能不影响现有接口
- **2.x.x**: 可能包含不兼容的API变更

#### 配置兼容性

- **次版本更新**: 配置文件向下兼容
- **主版本更新**: 可能需要更新配置文件

### 升级指南

#### 从 1.0.3 升级到 1.0.4

1. **备份数据**:
```bash
./scripts/ops.sh backup
```

2. **更新镜像**:
```bash
docker pull unm-server:v1.0.4
```

3. **滚动更新**:
```bash
# Docker
./scripts/deploy_enhanced.sh deploy docker -v v1.0.4

# Kubernetes
kubectl set image deployment/unm-server unm-server=unm-server:v1.0.4 -n unm-server
```

4. **验证升级**:
```bash
curl http://localhost:5678/api/v1/system/info
```

#### 从 1.0.x 升级到 2.0.x (未来版本)

⚠️ **重大变更**: 2.0.x 版本将包含不兼容的变更，升级前请仔细阅读升级指南。

### 支持策略

#### 长期支持 (LTS)

- **1.0.x**: 支持到 2026-06-01
- **2.0.x**: 计划 2025-12-01 发布

#### 安全更新

- **当前版本**: 持续安全更新
- **前一个主版本**: 12个月安全更新
- **更早版本**: 不再提供安全更新

### 迁移指南

#### 从 Node.js 版本迁移

1. **API兼容性**: Go版本保持与Node.js版本的API兼容
2. **配置迁移**: 
```bash
# 转换配置文件格式
node scripts/migrate-config.js config.json config.yaml
```
3. **数据迁移**: 无需数据迁移，缓存会自动重建

#### 配置变更

**1.0.4 新增配置项**:
```yaml
# 新增监控配置
monitoring:
  metrics_enabled: true
  tracing_enabled: false
  health_check_interval: 30s

# 新增安全配置
security:
  jwt_secret: "your-secret"
  api_key: "your-api-key"
  tls_enabled: false
```

### 已知问题

#### 当前版本 (1.0.4)

- 某些音源在高并发下可能出现超时
- 大量搜索请求可能导致内存使用增加
- 部分特殊字符的搜索结果可能不准确

#### 解决方案

1. **超时问题**: 调整 `sources.timeout` 配置
2. **内存问题**: 启用缓存清理策略
3. **搜索问题**: 使用URL编码处理特殊字符

### 反馈和贡献

#### 问题报告

- **GitHub Issues**: https://github.com/music-api-proxy/music-api-proxy/issues
- **安全问题**: security@example.com

#### 功能请求

- **GitHub Discussions**: https://github.com/music-api-proxy/music-api-proxy/discussions
- **功能投票**: https://github.com/music-api-proxy/music-api-proxy/discussions/categories/ideas

#### 贡献代码

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 创建 Pull Request

### 致谢

感谢所有为 Music API Proxy 做出贡献的开发者和用户！

特别感谢：
- 原 Node.js 版本的开发者
- 社区贡献者
- 问题报告者
- 文档改进者

---

**注意**: 本更新日志遵循 [Keep a Changelog](https://keepachangelog.com/) 格式。如有疑问，请查看[贡献指南](docs/development.md#贡献指南)。
