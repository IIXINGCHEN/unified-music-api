# Music API Proxy 故障排除指南

## 概述

本文档提供了 Music API Proxy 常见问题的诊断和解决方案，帮助用户快速定位和解决问题。

## 快速诊断

### 健康检查

首先执行基本的健康检查：

```bash
# 检查服务状态
curl http://localhost:5678/health

# 检查系统信息
curl http://localhost:5678/api/v1/system/info

# 检查音源状态
curl http://localhost:5678/api/v1/system/sources

# 使用运维工具检查
./scripts/ops.sh status -t auto
```

### 日志查看

查看服务日志获取详细信息：

```bash
# Docker 部署
docker logs unm-server

# Docker Compose 部署
docker-compose logs unm-server

# Kubernetes 部署
kubectl logs -f deployment/unm-server -n unm-server

# 使用运维工具
./scripts/ops.sh logs -t auto -l 100
```

## 常见问题

### 1. 服务启动问题

#### 问题：服务无法启动

**症状**：
- 容器启动后立即退出
- 端口无法访问
- 健康检查失败

**诊断步骤**：

```bash
# 1. 检查端口占用
netstat -tulpn | grep 5678
lsof -i :5678

# 2. 检查配置文件
cat config/config.yaml

# 3. 查看启动日志
docker logs unm-server --tail 50

# 4. 检查资源使用
docker stats unm-server
```

**解决方案**：

1. **端口冲突**：
```bash
# 使用不同端口启动
docker run -d --name unm-server -p 8080:5678 unm-server:latest

# 或者停止占用端口的进程
sudo kill -9 $(lsof -t -i:5678)
```

2. **配置文件错误**：
```bash
# 验证 YAML 格式
python -c "import yaml; yaml.safe_load(open('config/config.yaml'))"

# 使用示例配置
cp config/config.example.yaml config/config.yaml
```

3. **权限问题**：
```bash
# 检查文件权限
ls -la config/
chmod 644 config/config.yaml

# 检查目录权限
chmod 755 logs/ data/ cache/
```

#### 问题：内存不足

**症状**：
- 容器被 OOMKilled
- 服务响应缓慢
- 内存使用率过高

**诊断步骤**：

```bash
# 检查内存使用
free -h
docker stats unm-server

# 检查系统日志
dmesg | grep -i "killed process"
journalctl -u docker.service | grep -i oom
```

**解决方案**：

```bash
# 增加内存限制
docker run -d --name unm-server --memory=1g unm-server:latest

# Kubernetes 调整资源限制
kubectl patch deployment unm-server -n unm-server -p '{"spec":{"template":{"spec":{"containers":[{"name":"unm-server","resources":{"limits":{"memory":"1Gi"}}}]}}}}'

# 优化配置
# 在 config.yaml 中调整
performance:
  worker_pool_size: 5  # 减少工作池大小
  cache_ttl: 180       # 减少缓存时间
```

### 2. 网络连接问题

#### 问题：无法访问外部音源

**症状**：
- 音源测试失败
- 获取音乐链接超时
- 搜索结果为空

**诊断步骤**：

```bash
# 1. 测试网络连接
curl -I https://www.kugou.com
curl -I https://y.qq.com

# 2. 检查 DNS 解析
nslookup www.kugou.com
dig www.kugou.com

# 3. 测试音源可用性
curl "http://localhost:5678/api/v1/test?sources=kugou,qq"

# 4. 检查防火墙
iptables -L
ufw status
```

**解决方案**：

1. **网络代理配置**：
```yaml
# config.yaml
server:
  proxy_url: "http://proxy.example.com:8080"

# 或使用环境变量
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
```

2. **DNS 配置**：
```bash
# 修改 DNS 服务器
echo "nameserver 8.8.8.8" >> /etc/resolv.conf

# Docker 容器 DNS 配置
docker run -d --name unm-server --dns=8.8.8.8 unm-server:latest
```

3. **防火墙配置**：
```bash
# 允许出站连接
iptables -A OUTPUT -p tcp --dport 80 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT

# UFW 配置
ufw allow out 80
ufw allow out 443
```

#### 问题：CORS 跨域错误

**症状**：
- 浏览器控制台显示 CORS 错误
- 前端无法访问 API
- OPTIONS 请求失败

**诊断步骤**：

```bash
# 检查 CORS 配置
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:5678/api/v1/search
```

**解决方案**：

```yaml
# config.yaml
security:
  cors_origins:
    - "http://localhost:3000"
    - "https://your-domain.com"
    - "*"  # 开发环境可以使用，生产环境不推荐
```

### 3. 音源相关问题

#### 问题：音源不可用

**症状**：
- 特定音源返回错误
- 音源状态显示不可用
- 获取音乐失败

**诊断步骤**：

```bash
# 1. 检查音源状态
curl "http://localhost:5678/api/v1/system/sources"

# 2. 测试特定音源
curl "http://localhost:5678/api/v1/test?sources=kugou"

# 3. 检查音源配置
grep -A 10 "sources:" config/config.yaml

# 4. 查看音源相关日志
docker logs unm-server 2>&1 | grep -i "source\|kugou\|qq"
```

**解决方案**：

1. **更新音源配置**：
```yaml
# config.yaml
sources:
  netease_cookie: "your-updated-cookie"
  qq_cookie: "your-updated-cookie"
  timeout: 45s  # 增加超时时间
  retry_count: 5  # 增加重试次数
```

2. **Cookie 更新**：
```bash
# 获取新的 Cookie（需要手动从浏览器获取）
# 1. 打开浏览器开发者工具
# 2. 访问对应音乐网站
# 3. 复制 Cookie 值
# 4. 更新配置文件
```

3. **音源优先级调整**：
```yaml
sources:
  default_sources:
    - "migu"    # 将可用的音源放在前面
    - "kugou"
    - "qq"
```

#### 问题：音质获取失败

**症状**：
- 只能获取低音质
- 高音质返回 404
- 音质参数无效

**诊断步骤**：

```bash
# 测试不同音质
curl "http://localhost:5678/api/v1/match?id=1234567890&quality=128"
curl "http://localhost:5678/api/v1/match?id=1234567890&quality=320"
curl "http://localhost:5678/api/v1/match?id=1234567890&quality=999"

# 检查支持的音质
curl "http://localhost:5678/api/v1/system/info" | jq '.data.supported_qualities'
```

**解决方案**：

```bash
# 使用有效的音质参数
# 支持的音质：128, 192, 320, 740, 999

# 如果高音质不可用，尝试降级
curl "http://localhost:5678/api/v1/match?id=1234567890&quality=320,192,128"
```

### 4. 性能问题

#### 问题：响应时间过长

**症状**：
- API 响应超过 5 秒
- 搜索结果返回缓慢
- 系统负载过高

**诊断步骤**：

```bash
# 1. 检查响应时间
time curl "http://localhost:5678/api/v1/search?keyword=test"

# 2. 监控系统资源
./scripts/ops.sh monitor -t auto

# 3. 检查缓存状态
curl "http://localhost:5678/api/v1/system/cache/stats"

# 4. 查看慢查询日志
docker logs unm-server 2>&1 | grep -i "slow\|timeout"
```

**解决方案**：

1. **启用缓存**：
```yaml
# config.yaml
redis:
  host: "redis"
  port: 6379
  db: 0

performance:
  cache_ttl: 300  # 5分钟缓存
```

2. **调整并发参数**：
```yaml
performance:
  max_connections: 500
  worker_pool_size: 20
  timeout_seconds: 15
```

3. **优化数据库连接**：
```yaml
database:
  max_open_conns: 50
  max_idle_conns: 10
  max_lifetime: 300s
```

#### 问题：内存泄漏

**症状**：
- 内存使用持续增长
- 服务运行一段时间后变慢
- 最终导致 OOM

**诊断步骤**：

```bash
# 1. 监控内存使用趋势
watch -n 5 'docker stats unm-server --no-stream'

# 2. 生成内存分析
curl http://localhost:6060/debug/pprof/heap > heap.prof
go tool pprof heap.prof

# 3. 检查 goroutine 泄漏
curl http://localhost:6060/debug/pprof/goroutine?debug=1
```

**解决方案**：

```bash
# 1. 重启服务释放内存
./scripts/ops.sh restart -t auto

# 2. 调整垃圾回收
export GOGC=50  # 更频繁的垃圾回收

# 3. 限制缓存大小
# 在 config.yaml 中
redis:
  maxmemory: 256mb
  maxmemory-policy: allkeys-lru
```

### 5. 缓存问题

#### 问题：内存缓存性能问题

**症状**：
- 缓存命中率低
- 内存使用过高
- 响应时间变慢

**诊断步骤**：

```bash
# 1. 检查缓存统计
curl http://localhost:5678/api/v1/system/cache/stats

# 2. 检查内存使用
curl http://localhost:5678/api/v1/system/info
```

**解决方案**：

1. **调整缓存配置**：
```yaml
# config.yaml
cache:
  enabled: true
  type: "memory"
  ttl: "1h"
  max_size: "100MB"
  cleanup_interval: "10m"
```

2. **禁用缓存（临时方案）**：
```yaml
# config.yaml
cache:
  enabled: false
```

### 6. 容器化问题

#### 问题：Docker 镜像构建失败

**症状**：
- 构建过程中断
- 依赖下载失败
- 镜像体积过大

**诊断步骤**：

```bash
# 1. 检查 Dockerfile 语法
docker build --no-cache -t unm-server:debug .

# 2. 分步构建调试
docker build --target builder -t unm-server:builder .

# 3. 检查网络连接
docker run --rm alpine ping -c 3 google.com
```

**解决方案**：

1. **网络问题**：
```dockerfile
# 在 Dockerfile 中添加代理
ENV HTTP_PROXY=http://proxy.example.com:8080
ENV HTTPS_PROXY=http://proxy.example.com:8080

# 或使用国内镜像
RUN go env -w GOPROXY=https://goproxy.cn,direct
```

2. **依赖问题**：
```bash
# 清理 Go 模块缓存
go clean -modcache

# 重新下载依赖
go mod download
go mod verify
```

#### 问题：Kubernetes 部署失败

**症状**：
- Pod 无法启动
- 镜像拉取失败
- 配置错误

**诊断步骤**：

```bash
# 1. 检查 Pod 状态
kubectl get pods -n unm-server
kubectl describe pod <pod-name> -n unm-server

# 2. 查看事件
kubectl get events -n unm-server --sort-by='.lastTimestamp'

# 3. 检查日志
kubectl logs <pod-name> -n unm-server
```

**解决方案**：

1. **镜像拉取问题**：
```bash
# 检查镜像是否存在
docker pull unm-server:latest

# 使用本地镜像
kubectl patch deployment unm-server -n unm-server -p '{"spec":{"template":{"spec":{"containers":[{"name":"unm-server","imagePullPolicy":"Never"}]}}}}'
```

2. **资源不足**：
```bash
# 检查节点资源
kubectl top nodes
kubectl describe nodes

# 调整资源请求
kubectl patch deployment unm-server -n unm-server -p '{"spec":{"template":{"spec":{"containers":[{"name":"unm-server","resources":{"requests":{"memory":"64Mi","cpu":"50m"}}}]}}}}'
```

## 监控和告警

### 设置监控

```bash
# 启动监控栈
docker-compose up -d prometheus grafana

# 访问 Grafana
open http://localhost:3000

# 导入预配置的仪表板
# 在 Grafana 中导入 config/grafana/dashboards/ 下的 JSON 文件
```

### 关键指标

监控以下关键指标：

1. **系统指标**：
   - CPU 使用率 < 80%
   - 内存使用率 < 90%
   - 磁盘使用率 < 85%

2. **应用指标**：
   - 响应时间 < 2s
   - 错误率 < 5%
   - 可用性 > 99%

3. **音源指标**：
   - 音源可用性 > 80%
   - 音源响应时间 < 5s

### 告警配置

```yaml
# config/alert_rules.yml
groups:
  - name: unm-server.rules
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "高错误率告警"
          description: "错误率超过 10%"
```

## 日志分析

### 常见错误模式

1. **连接超时**：
```
ERROR: dial tcp: i/o timeout
```
解决：检查网络连接和防火墙设置

2. **内存不足**：
```
ERROR: runtime: out of memory
```
解决：增加内存限制或优化内存使用

3. **配置错误**：
```
ERROR: yaml: unmarshal errors
```
解决：检查配置文件格式

### 日志级别调整

```yaml
# config.yaml
monitoring:
  log_level: "debug"  # 临时启用调试日志
```

## 性能调优

### 系统级优化

```bash
# 调整文件描述符限制
ulimit -n 65536

# 调整网络参数
echo 'net.core.somaxconn = 1024' >> /etc/sysctl.conf
sysctl -p
```

### 应用级优化

```yaml
# config.yaml
performance:
  max_connections: 1000
  worker_pool_size: 20
  timeout_seconds: 30
  cache_ttl: 300
  enable_gzip: true
```

## 获取帮助

如果问题仍未解决，请：

1. **查看文档**：https://docs.unm-server.example.com
2. **搜索 Issues**：https://github.com/music-api-proxy/music-api-proxy/issues
3. **提交新 Issue**：包含详细的错误信息和环境描述
4. **加入讨论**：https://github.com/music-api-proxy/music-api-proxy/discussions

### Issue 模板

```markdown
## 问题描述
简要描述遇到的问题

## 环境信息
- 操作系统：
- 部署方式：Docker/Kubernetes/源码
- 版本：v1.0.4
- Go 版本：

## 复现步骤
1. 
2. 
3. 

## 期望行为
描述期望的正确行为

## 实际行为
描述实际发生的情况

## 日志信息
```
相关的错误日志
```

## 额外信息
其他可能有用的信息
```
