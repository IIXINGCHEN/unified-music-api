# Music API Proxy API 文档

## 概述

Music API Proxy 提供了完整的RESTful API，支持音乐搜索、获取、信息查询等功能。本文档提供了详细的API规范、使用示例和最佳实践。

## 新增功能

### 企业级特性
- **统一响应格式**: 标准化的JSON响应结构
- **错误处理**: 详细的错误码和错误信息
- **限流保护**: 防止API滥用的限流机制
- **监控指标**: 完整的系统监控和健康检查
- **缓存优化**: 智能缓存提升响应速度

### API版本管理
- **版本控制**: 支持API版本管理 (`/api/v1`)
- **向后兼容**: 保持API向后兼容性
- **弃用通知**: 提前通知API变更和弃用

## 认证和安全

### API Key认证
```http
Authorization: Bearer your-api-key
X-API-Key: your-api-key
```

### CORS支持
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key
```

### 安全头
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

## 高级功能

### 1. 批量操作

#### POST /api/v1/batch/match

批量获取音乐链接。

**请求体**:
```json
{
  "items": [
    {
      "id": "1234567890",
      "quality": "320",
      "sources": ["kugou", "qq"]
    },
    {
      "id": "0987654321",
      "quality": "192",
      "sources": ["migu"]
    }
  ]
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "批量处理完成",
  "data": {
    "success_count": 2,
    "failed_count": 0,
    "results": [
      {
        "id": "1234567890",
        "status": "success",
        "url": "http://music.kugou.com/song1.mp3",
        "source": "kugou"
      },
      {
        "id": "0987654321",
        "status": "success",
        "url": "http://music.migu.cn/song2.mp3",
        "source": "migu"
      }
    ]
  }
}
```

### 2. 异步任务

#### POST /api/v1/tasks/search

创建异步搜索任务。

**请求体**:
```json
{
  "keyword": "周杰伦",
  "sources": ["kugou", "qq", "migu"],
  "limit": 100,
  "callback_url": "https://your-app.com/callback"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "任务创建成功",
  "data": {
    "task_id": "task_123456789",
    "status": "pending",
    "created_at": "2025-06-28T10:30:00Z",
    "estimated_duration": "30s"
  }
}
```

#### GET /api/v1/tasks/{task_id}

查询任务状态。

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "task_id": "task_123456789",
    "status": "completed",
    "progress": 100,
    "result_count": 50,
    "created_at": "2025-06-28T10:30:00Z",
    "completed_at": "2025-06-28T10:30:25Z",
    "results": [
      // 搜索结果
    ]
  }
}
```

### 3. 音源管理

#### GET /api/v1/sources

获取所有音源配置。

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "name": "kugou",
      "display_name": "酷狗音乐",
      "enabled": true,
      "priority": 100,
      "timeout": "30s",
      "retry_count": 3,
      "rate_limit": 100,
      "status": {
        "available": true,
        "last_check": "2025-06-28T10:25:00Z",
        "error_count": 0,
        "avg_response_time": "1.2s"
      }
    }
  ]
}
```

#### PUT /api/v1/sources/{source_name}

更新音源配置。

**请求体**:
```json
{
  "enabled": true,
  "priority": 90,
  "timeout": "25s",
  "retry_count": 2,
  "rate_limit": 80
}
```

### 4. 缓存管理

#### GET /api/v1/cache/stats

获取缓存统计。

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "enabled": true,
    "hit_rate": 85.5,
    "total_keys": 1000,
    "memory_usage": "50MB",
    "expired_keys": 100,
    "stats": {
      "hits": 8550,
      "misses": 1450,
      "sets": 1000,
      "deletes": 100
    }
  }
}
```

#### DELETE /api/v1/cache

清空缓存。

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pattern | string | 否 | 缓存键模式，支持通配符 |

### 5. 实时通知

#### WebSocket /api/v1/ws

建立WebSocket连接接收实时通知。

**连接示例**:
```javascript
const ws = new WebSocket('ws://localhost:5678/api/v1/ws');

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('收到通知:', data);
};
```

**通知格式**:
```json
{
  "type": "source_status",
  "data": {
    "source": "kugou",
    "status": "unavailable",
    "timestamp": "2025-06-28T10:30:00Z"
  }
}
```

## 性能优化

### 1. 请求优化

#### 并发控制
```http
X-Concurrent-Requests: 5
```

#### 压缩支持
```http
Accept-Encoding: gzip, deflate
```

#### 条件请求
```http
If-None-Match: "etag-value"
If-Modified-Since: Wed, 21 Oct 2015 07:28:00 GMT
```

### 2. 响应优化

#### 分页支持
```http
GET /api/v1/search?keyword=周杰伦&page=1&size=20
```

**响应示例**:
```json
{
  "code": 200,
  "message": "搜索成功",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 100,
      "pages": 5,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

#### 字段过滤
```http
GET /api/v1/search?keyword=周杰伦&fields=id,name,artist
```

## 监控和调试

### 1. 请求追踪

每个请求都会返回唯一的追踪ID：

```http
X-Request-ID: req_123456789
X-Response-Time: 120ms
```

### 2. 调试模式

开启调试模式获取详细信息：

```http
X-Debug: true
```

**调试响应**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {...},
  "debug": {
    "request_id": "req_123456789",
    "processing_time": "120ms",
    "cache_hit": true,
    "source_used": "kugou",
    "sql_queries": 2,
    "memory_usage": "15MB"
  }
}
```

### 3. 健康检查端点

#### GET /health/live

存活检查（Kubernetes liveness probe）。

#### GET /health/ready

就绪检查（Kubernetes readiness probe）。

#### GET /health/startup

启动检查（Kubernetes startup probe）。

## SDK和客户端

### JavaScript SDK

```javascript
import UNMClient from 'unm-server-client';

const client = new UNMClient({
  baseURL: 'http://localhost:5678',
  apiKey: 'your-api-key',
  timeout: 30000
});

// 搜索音乐
const results = await client.search('周杰伦');

// 获取音乐链接
const music = await client.getMusic('1234567890', '320');
```

### Python SDK

```python
from unm_server_client import UNMClient

client = UNMClient(
    base_url='http://localhost:5678',
    api_key='your-api-key',
    timeout=30
)

# 搜索音乐
results = client.search('周杰伦')

# 获取音乐链接
music = client.get_music('1234567890', quality='320')
```

## 最佳实践

### 1. 错误处理

```javascript
try {
  const response = await fetch('/api/v1/search?keyword=test');
  const data = await response.json();
  
  if (data.code !== 200) {
    throw new Error(data.message);
  }
  
  return data.data;
} catch (error) {
  console.error('API请求失败:', error);
  // 处理错误
}
```

### 2. 重试机制

```javascript
async function apiRequest(url, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 3. 缓存策略

```javascript
class APICache {
  constructor(ttl = 300000) { // 5分钟
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl
    });
  }
}
```

## 变更日志

### v1.1.0 (计划中)
- 新增批量操作API
- 支持异步任务处理
- 增加WebSocket实时通知
- 优化缓存机制

### v1.0.4 (当前版本)
- 完善系统监控API
- 增加音源管理功能
- 优化错误处理
- 添加限流保护

## 支持和反馈

- **文档**: https://github.com/IIXINGCHEN/unm-server-go/blob/master/README.md
- **GitHub**: https://github.com/music-api-proxy/music-api-proxy
- **Issues**: https://github.com/music-api-proxy/music-api-proxy/issues
- **讨论**: https://github.com/music-api-proxy/music-api-proxy/discussions
