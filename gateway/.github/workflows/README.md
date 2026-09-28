# GitHub Actions 工作流文档

本目录包含了 Music API Proxy 项目的完整 CI/CD 流水线配置，符合生产环境的企业级标准。

## 📋 工作流概览

### 1. 主要工作流 (`ci.yml`)
**触发条件**: 推送到 `main`/`dev` 分支、标签推送、Pull Request

**功能**:
- 🔍 代码质量检查 (golangci-lint, go vet, 格式检查)
- 🧪 单元测试和覆盖率报告
- 🏗️ 多平台二进制构建 (Linux, macOS, Windows - AMD64/ARM64)
- 🐳 Docker 镜像构建和推送
- 🔒 安全扫描 (Trivy, CodeQL, Gosec)
- 🚀 自动部署 (开发/预发布/生产环境)
- 📦 GitHub Release 创建

**构建产物**:
- 6个平台的二进制文件
- Docker 镜像 (多架构)
- 测试覆盖率报告
- 安全扫描报告
- SBOM (软件物料清单)

### 2. 生产发布工作流 (`release.yml`)
**触发条件**: 标签推送 (`v*`) 或手动触发

**功能**:
- 🏗️ 构建所有平台的发布资产
- 🐳 构建生产 Docker 镜像
- 🔐 安全扫描验证
- 📝 自动生成发布说明
- 📦 创建 GitHub Release
- ✅ 校验和生成

**发布资产**:
```
music-api-proxy-v1.1.0-linux-amd64.tar.gz
music-api-proxy-v1.1.0-linux-arm64.tar.gz
music-api-proxy-v1.1.0-darwin-amd64.tar.gz
music-api-proxy-v1.1.0-darwin-arm64.tar.gz
music-api-proxy-v1.1.0-windows-amd64.zip
music-api-proxy-v1.1.0-windows-arm64.zip
checksums.txt
trivy-results.json
```

### 3. 部署工作流 (`deploy.yml`)
**触发条件**: Release 发布或手动触发

**功能**:
- 🔍 部署前检查
- 🚀 分环境部署 (Staging/Production)
- 🏥 健康检查
- 🧪 冒烟测试和验证测试
- 📊 监控更新
- 📢 部署通知

**支持环境**:
- **Development**: 开发环境部署
- **Staging**: 预发布环境验证
- **Production**: 生产环境部署

### 4. 代码质量工作流 (`quality.yml`)
**触发条件**: 推送、PR、定时任务 (每日凌晨2点)

**功能**:
- 🔍 代码质量分析 (golangci-lint, staticcheck)
- 📊 测试覆盖率检查 (阈值: 70%)
- 🔒 安全扫描 (Gosec, govulncheck, Nancy)
- 📦 依赖项分析
- 🧮 代码复杂度分析
- ⚡ 性能基准测试
- 🚪 质量门禁

## 🔧 配置文件

### `.golangci.yml`
生产级代码质量检查配置:
- **启用检查器**: 45+ 个检查器
- **代码复杂度**: 循环复杂度 ≤ 15
- **函数长度**: ≤ 100 行
- **行长度**: ≤ 120 字符
- **安全检查**: Gosec 集成
- **性能检查**: 预分配、无效赋值等

## 🚀 使用指南

### 开发流程
1. **功能开发**: 在 `dev` 分支开发
2. **质量检查**: 推送触发自动检查
3. **合并主分支**: PR 到 `main` 分支
4. **发布准备**: 创建版本标签
5. **自动发布**: 标签推送触发发布流程

### 发布流程
```bash
# 1. 确保代码在 main 分支
git checkout main
git pull origin main

# 2. 创建版本标签
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0

# 3. 自动触发发布流程
# - 构建多平台二进制
# - 创建 Docker 镜像
# - 生成 GitHub Release
# - 部署到生产环境
```

### 手动部署
```bash
# 通过 GitHub Actions 界面手动触发
# 1. 访问 Actions 页面
# 2. 选择 "Deploy to Production" 工作流
# 3. 点击 "Run workflow"
# 4. 选择环境和版本
```

## 📊 质量标准

### 代码质量要求
- ✅ 所有 golangci-lint 检查通过
- ✅ 测试覆盖率 ≥ 70%
- ✅ 无安全漏洞 (Gosec, Trivy)
- ✅ 循环复杂度 ≤ 15
- ✅ 函数长度 ≤ 100 行

### 安全要求
- ✅ 依赖项漏洞扫描通过
- ✅ 容器镜像安全扫描通过
- ✅ 代码安全分析通过
- ✅ SBOM 生成

### 性能要求
- ✅ 基准测试通过
- ✅ 内存使用优化
- ✅ 响应时间 < 200ms

## 🔐 密钥配置

需要在 GitHub Repository Settings > Secrets 中配置:

### 必需密钥
- `GITHUB_TOKEN`: 自动提供，用于 GitHub API 访问

### 可选密钥 (用于扩展功能)
- `DOCKERHUB_USERNAME`: Docker Hub 用户名
- `DOCKERHUB_TOKEN`: Docker Hub 访问令牌
- `SLACK_WEBHOOK_URL`: Slack 通知 Webhook
- `STAGING_K8S_SERVER`: Staging Kubernetes 服务器
- `STAGING_K8S_TOKEN`: Staging Kubernetes 访问令牌
- `PROD_K8S_SERVER`: 生产 Kubernetes 服务器
- `PROD_K8S_TOKEN`: 生产 Kubernetes 访问令牌
- `GRAFANA_API_URL`: Grafana API 地址
- `GRAFANA_API_TOKEN`: Grafana API 令牌

## 📈 监控和通知

### 构建状态
- ✅ 成功: 绿色徽章
- ❌ 失败: 红色徽章
- 🟡 进行中: 黄色徽章

### 通知渠道
- GitHub 通知
- Slack 集成 (可选)
- 邮件通知 (可选)

### 监控指标
- 构建成功率
- 测试覆盖率趋势
- 安全漏洞数量
- 部署频率

## 🛠️ 故障排除

### 常见问题

**1. 构建失败**
```bash
# 检查日志
# 1. 访问 Actions 页面
# 2. 点击失败的工作流
# 3. 查看详细日志
```

**2. 测试覆盖率不足**
```bash
# 本地运行测试
go test -v -race -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
```

**3. 代码质量检查失败**
```bash
# 本地运行 golangci-lint
golangci-lint run --config .golangci.yml
```

**4. 安全扫描失败**
```bash
# 本地运行安全扫描
gosec ./...
govulncheck ./...
```

### 调试技巧
1. **启用调试模式**: 在工作流中设置 `ACTIONS_STEP_DEBUG: true`
2. **本地复现**: 使用 `act` 工具本地运行 GitHub Actions
3. **分步调试**: 注释掉部分步骤，逐步排查问题

## 📚 参考资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [golangci-lint 配置](https://golangci-lint.run/usage/configuration/)
- [Docker 最佳实践](https://docs.docker.com/develop/dev-best-practices/)
- [Go 安全最佳实践](https://github.com/securecodewarrior/go-security-checklist)

---

**维护者**: Music API Proxy 团队  
**最后更新**: 2024-12-29  
**版本**: v1.1.0
