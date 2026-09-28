# Music API Proxy 部署指南

## 概述

Music API Proxy 支持多种部署方式，包括Docker、Docker Compose和Kubernetes。本文档提供详细的部署指南和最佳实践。

## 部署方式对比

| 部署方式 | 适用场景 | 优势 | 劣势 |
|---------|---------|------|------|
| Docker | 单机部署、开发测试 | 简单快速、资源占用少 | 无高可用、扩展性有限 |
| Docker Compose | 小规模生产、集成测试 | 多服务编排、配置简单 | 单机限制、监控有限 |
| Kubernetes | 大规模生产、企业级 | 高可用、自动扩缩容、完整监控 | 复杂度高、资源要求高 |

## 系统要求

### 最低要求
- **CPU**: 1核心
- **内存**: 512MB
- **磁盘**: 2GB可用空间
- **网络**: 稳定的互联网连接

### 推荐配置
- **CPU**: 2核心以上
- **内存**: 2GB以上
- **磁盘**: 10GB以上SSD
- **网络**: 100Mbps以上带宽

### 软件依赖
- Docker 20.10+
- Docker Compose 2.0+ (可选)
- Kubernetes 1.20+ (可选)
- kubectl (Kubernetes部署)

## Docker 部署

### 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/music-api-proxy/music-api-proxy.git
cd unm-server

# 2. 构建镜像
docker build -t unm-server:latest .

# 3. 运行容器
docker run -d \
  --name unm-server \
  --restart unless-stopped \
  -p 5678:5678 \
  -p 9090:9090 \
  -v $(pwd)/config:/app/config:ro \
  -v $(pwd)/logs:/app/logs \
  unm-server:latest
```

### 使用部署脚本

```bash
# 使用增强部署脚本
./scripts/deploy_enhanced.sh deploy docker -v latest -e production -p 5678

# 检查状态
./scripts/ops.sh status -t docker

# 查看日志
./scripts/ops.sh logs -t docker -l 100
```

### 环境变量配置

```bash
docker run -d \
  --name unm-server \
  -p 5678:5678 \
  -e UNM_ENV=production \
  -e UNM_LOG_LEVEL=info \
  -e UNM_CONFIG_FILE=/app/config/config.yaml \
  unm-server:latest
```

## Docker Compose 部署

### 完整服务栈

```bash
# 1. 启动所有服务
docker-compose up -d

# 2. 检查服务状态
docker-compose ps

# 3. 查看日志
docker-compose logs -f unm-server
```

### 服务组件

Docker Compose部署包含以下服务：

- **unm-server**: 主应用服务
- **redis**: 缓存服务
- **nginx**: 反向代理
- **prometheus**: 监控服务
- **grafana**: 可视化面板

### 访问地址

- Music API Proxy: http://localhost:5678
- Grafana面板: http://localhost:3000 (admin/admin)
- Prometheus: http://localhost:9091

### 配置自定义

```yaml
# docker-compose.override.yml
version: '3.8'
services:
  unm-server:
    environment:
      - UNM_LOG_LEVEL=debug
    ports:
      - "8080:5678"  # 自定义端口
```

## Kubernetes 部署

### 前置条件

```bash
# 检查集群连接
kubectl cluster-info

# 创建命名空间
kubectl apply -f k8s/namespace.yaml
```

### 部署步骤

```bash
# 1. 应用配置
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# 2. 应用存储
kubectl apply -f k8s/storage.yaml

# 3. 应用部署
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# 4. 检查部署状态
kubectl get pods -n unm-server
kubectl get services -n unm-server
```

### 使用部署脚本

```bash
# 完整部署
./scripts/deploy_enhanced.sh deploy k8s -v v1.0.4 -n unm-server

# 检查状态
./scripts/ops.sh status -t k8s -n unm-server

# 扩缩容
./scripts/ops.sh scale -t k8s -r 5 -n unm-server
```

### 高可用配置

```yaml
# 多副本部署
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
```

### 资源限制

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

## 配置管理

### 配置文件结构

```
config/
├── config.yaml          # 主配置文件
├── config.example.yaml  # 配置示例
├── prometheus.yml       # Prometheus配置
├── alert_rules.yml      # 告警规则
└── nginx.conf          # Nginx配置
```

### 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| UNM_ENV | 运行环境 | production |
| UNM_CONFIG_FILE | 配置文件路径 | /app/config/config.yaml |
| UNM_LOG_LEVEL | 日志级别 | info |
| UNM_REDIS_HOST | Redis主机 | localhost |
| UNM_REDIS_PORT | Redis端口 | 6379 |

### 密钥管理

```bash
# Kubernetes密钥
kubectl create secret generic unm-server-secrets \
  --from-literal=jwt-secret=your-jwt-secret \
  --from-literal=api-key=your-api-key \
  --from-literal=redis-password=your-redis-password \
  -n unm-server
```

## 监控和日志

### Prometheus监控

```yaml
# 监控指标
- http_requests_total
- http_request_duration_seconds
- process_resident_memory_bytes
- go_memstats_alloc_bytes
```

### Grafana面板

预配置的Grafana面板包括：
- 应用性能监控
- 系统资源监控
- 错误率和响应时间
- 音源状态监控

### 日志管理

```bash
# 查看实时日志
./scripts/ops.sh logs -t auto -l 100

# 清理旧日志
./scripts/ops.sh cleanup -d 7
```

## 安全配置

### HTTPS配置

```yaml
# Ingress TLS配置
spec:
  tls:
  - hosts:
    - unm-server.yourdomain.com
    secretName: unm-server-tls
```

### 网络安全

```yaml
# 网络策略
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: unm-server-netpol
spec:
  podSelector:
    matchLabels:
      app: unm-server
  policyTypes:
  - Ingress
  - Egress
```

### 安全上下文

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  runAsGroup: 1001
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
```

## 备份和恢复

### 数据备份

```bash
# 自动备份
./scripts/ops.sh backup

# 手动备份
kubectl exec -n unm-server deployment/redis -- redis-cli BGSAVE
```

### 配置备份

```bash
# 备份Kubernetes配置
kubectl get all -n unm-server -o yaml > backup/k8s-backup.yaml
```

## 故障排除

### 常见问题

1. **服务无法启动**
   ```bash
   # 检查日志
   ./scripts/ops.sh logs -t auto
   
   # 检查配置
   kubectl describe pod -n unm-server
   ```

2. **健康检查失败**
   ```bash
   # 手动健康检查
   ./scripts/ops.sh health -e http://localhost:5678
   ```

3. **性能问题**
   ```bash
   # 监控资源使用
   ./scripts/ops.sh monitor -t auto
   
   # 性能测试
   ./scripts/ops.sh perf --requests 100 --concurrency 10
   ```

### 调试工具

```bash
# 进入容器调试
docker exec -it unm-server /bin/sh

# Kubernetes调试
kubectl exec -it -n unm-server deployment/unm-server -- /bin/sh
```

## 性能优化

### 资源调优

```yaml
# JVM参数优化（如果使用Java）
env:
- name: JAVA_OPTS
  value: "-Xmx512m -Xms256m -XX:+UseG1GC"
```

### 缓存优化

```yaml
# Redis配置优化
redis:
  maxmemory: 256mb
  maxmemory-policy: allkeys-lru
```

### 网络优化

```yaml
# Nginx配置优化
worker_connections: 1024
keepalive_timeout: 65
gzip: on
```

## 升级指南

### 滚动升级

```bash
# Kubernetes滚动升级
kubectl set image deployment/unm-server unm-server=unm-server:v1.0.5 -n unm-server
kubectl rollout status deployment/unm-server -n unm-server
```

### 回滚操作

```bash
# 回滚到上一版本
kubectl rollout undo deployment/unm-server -n unm-server

# 回滚到指定版本
kubectl rollout undo deployment/unm-server --to-revision=2 -n unm-server
```

## 最佳实践

### 生产环境建议

1. **使用固定版本标签**，避免使用latest
2. **设置资源限制**，防止资源耗尽
3. **配置健康检查**，确保服务可用性
4. **启用监控告警**，及时发现问题
5. **定期备份数据**，确保数据安全
6. **使用HTTPS**，保护数据传输
7. **定期更新镜像**，修复安全漏洞

### 开发环境建议

1. **使用Docker Compose**，简化开发环境
2. **启用调试日志**，便于问题排查
3. **使用热重载**，提高开发效率
4. **配置代码挂载**，实时查看更改

## 总结

Music API Proxy提供了灵活的部署选项，从简单的Docker容器到完整的Kubernetes集群。选择合适的部署方式取决于你的具体需求、团队技能和基础设施。

对于快速原型和小规模部署，推荐使用Docker或Docker Compose。对于生产环境和大规模部署，推荐使用Kubernetes以获得更好的可扩展性和可靠性。
