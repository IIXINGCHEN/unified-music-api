# Music API Proxy 用户指南

## 欢迎使用 Music API Proxy

Music API Proxy 是一个高性能的音乐代理服务器，专为音乐API聚合而设计。本指南将帮助您快速上手并充分利用 Music API Proxy 的功能。

## 快速开始

### 1. 安装和启动

#### 使用 Docker（推荐）

```bash
# 拉取镜像
docker pull unm-server:latest

# 启动服务
docker run -d \
  --name unm-server \
  -p 5678:5678 \
  unm-server:latest

# 验证服务
curl http://localhost:5678/health
```

#### 使用 Docker Compose

```bash
# 克隆项目
git clone https://github.com/music-api-proxy/music-api-proxy.git
cd unm-server

# 启动完整服务栈
docker-compose up -d

# 访问服务
open http://localhost:5678
```

### 2. 基本使用

#### 搜索音乐

```bash
# 搜索周杰伦的歌曲
curl "http://localhost:5678/api/v1/search?keyword=周杰伦"
```

#### 获取音乐链接

```bash
# 根据音乐ID获取播放链接
curl "http://localhost:5678/api/v1/match?id=1234567890&quality=320"
```

#### 检查音源状态

```bash
# 查看所有音源状态
curl "http://localhost:5678/api/v1/system/sources"
```

## 主要功能

### 1. 音乐搜索

Music API Proxy 支持从多个音源搜索音乐：

- **酷狗音乐** (kugou)
- **QQ音乐** (qq)
- **咪咕音乐** (migu)
- **网易云音乐** (netease)

**使用示例**：

```javascript
// 搜索指定艺术家的歌曲
fetch('/api/v1/search?keyword=周杰伦 青花瓷')
  .then(response => response.json())
  .then(data => {
    console.log('搜索结果:', data.data);
  });
```

### 2. 音乐获取

支持多种音质的音乐获取：

- **128kbps**: 标准音质
- **192kbps**: 高音质
- **320kbps**: 极高音质
- **740kbps**: 无损音质
- **999kbps**: 母带音质

**使用示例**：

```javascript
// 获取高音质音乐链接
fetch('/api/v1/match?id=1234567890&quality=320&server=kugou,qq')
  .then(response => response.json())
  .then(data => {
    if (data.code === 200) {
      const audioUrl = data.data.url;
      // 播放音乐
      const audio = new Audio(audioUrl);
      audio.play();
    }
  });
```

### 3. 音源管理

查看和管理音源状态：

```bash
# 查看所有音源状态
curl "http://localhost:5678/api/v1/system/sources"

# 获取系统信息
curl "http://localhost:5678/api/v1/system/info"
```

### 4. 系统监控

实时监控系统状态：

```bash
# 系统健康检查
curl "http://localhost:5678/health"

# 详细系统信息
curl "http://localhost:5678/api/v1/system/info"

# 系统指标
curl "http://localhost:5678/api/v1/system/metrics"
```

## 配置说明

### 1. 基础配置

编辑 `config/config.yaml` 文件：

```yaml
server:
  port: 5678
  host: "0.0.0.0"
  allowed_domain: "*"

security:
  jwt_secret: "your-secret-key"
  api_key: "your-api-key"
  cors_origins:
    - "*"

performance:
  max_connections: 1000
  timeout_seconds: 30
  cache_ttl: 300
  rate_limit: 100
```

### 2. 音源配置

配置音源相关设置：

```yaml
sources:
  netease_cookie: "your-netease-cookie"
  qq_cookie: "your-qq-cookie"
  migu_cookie: "your-migu-cookie"
  default_sources:
    - "kugou"
    - "qq"
    - "migu"
  timeout: 30s
  retry_count: 3
```

### 3. 缓存配置

配置内存缓存：

```yaml
cache:
  enabled: true
  type: "memory"
  ttl: "1h"
  max_size: "100MB"
  cleanup_interval: "10m"
```

## 使用场景

### 1. 个人音乐播放器

```html
<!DOCTYPE html>
<html>
<head>
    <title>我的音乐播放器</title>
</head>
<body>
    <div id="player">
        <input type="text" id="search" placeholder="搜索音乐...">
        <button onclick="searchMusic()">搜索</button>
        <div id="results"></div>
        <audio id="audio" controls></audio>
    </div>

    <script>
        const API_BASE = 'http://localhost:5678/api/v1';
        
        async function searchMusic() {
            const keyword = document.getElementById('search').value;
            const response = await fetch(`${API_BASE}/search?keyword=${encodeURIComponent(keyword)}`);
            const data = await response.json();
            
            if (data.code === 200) {
                displayResults(data.data);
            }
        }
        
        function displayResults(results) {
            const container = document.getElementById('results');
            container.innerHTML = '';
            
            results.forEach(song => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <h3>${song.name}</h3>
                    <p>艺术家: ${song.artist}</p>
                    <p>专辑: ${song.album}</p>
                    <button onclick="playMusic('${song.id}')">播放</button>
                `;
                container.appendChild(div);
            });
        }
        
        async function playMusic(id) {
            const response = await fetch(`${API_BASE}/match?id=${id}&quality=320`);
            const data = await response.json();
            
            if (data.code === 200) {
                const audio = document.getElementById('audio');
                audio.src = data.data.url;
                audio.play();
            }
        }
    </script>
</body>
</html>
```

### 2. 移动应用集成

```swift
// iOS Swift 示例
import Foundation

class UNMService {
    private let baseURL = "http://localhost:5678/api/v1"
    
    func searchMusic(keyword: String, completion: @escaping (Result<[Song], Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/search?keyword=\(keyword.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")") else {
            return
        }
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else { return }
            
            do {
                let result = try JSONDecoder().decode(SearchResponse.self, from: data)
                completion(.success(result.data))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    func getMusic(id: String, quality: String = "320", completion: @escaping (Result<MusicURL, Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/match?id=\(id)&quality=\(quality)") else {
            return
        }
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else { return }
            
            do {
                let result = try JSONDecoder().decode(MusicResponse.self, from: data)
                completion(.success(result.data))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}
```

### 3. 服务器端集成

```python
# Python Flask 示例
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)
UNM_API_BASE = 'http://localhost:5678/api/v1'

@app.route('/music/search')
def search_music():
    keyword = request.args.get('keyword')
    if not keyword:
        return jsonify({'error': '缺少搜索关键词'}), 400
    
    response = requests.get(f'{UNM_API_BASE}/search', params={'keyword': keyword})
    return response.json()

@app.route('/music/play/<music_id>')
def get_music_url(music_id):
    quality = request.args.get('quality', '320')
    
    response = requests.get(f'{UNM_API_BASE}/match', params={
        'id': music_id,
        'quality': quality
    })
    
    data = response.json()
    if data['code'] == 200:
        return jsonify({
            'url': data['data']['url'],
            'info': data['data']['info']
        })
    else:
        return jsonify({'error': data['message']}), 400

if __name__ == '__main__':
    app.run(debug=True)
```

## 常见问题

### 1. 服务无法启动

**问题**: Docker 容器启动失败

**解决方案**:
```bash
# 检查端口是否被占用
netstat -tulpn | grep 5678

# 查看容器日志
docker logs unm-server

# 使用不同端口启动
docker run -d --name unm-server -p 8080:5678 unm-server:latest
```

### 2. 音乐无法播放

**问题**: 获取到的音乐链接无法播放

**解决方案**:
```bash
# 检查音源状态
curl "http://localhost:5678/api/v1/system/sources"

# 检查健康状态
curl "http://localhost:5678/health"

# 尝试不同音源
curl "http://localhost:5678/api/v1/match?id=1234567890&server=qq,migu"
```

### 3. 搜索结果为空

**问题**: 搜索不到任何结果

**解决方案**:
```bash
# 检查搜索关键词编码
curl "http://localhost:5678/api/v1/search?keyword=%E5%91%A8%E6%9D%B0%E4%BC%A6"

# 尝试不同的搜索关键词
curl "http://localhost:5678/api/v1/search?keyword=jay+chou"

# 检查音源配置
curl "http://localhost:5678/api/v1/system/sources"
```

### 4. 请求频率限制

**问题**: 收到 429 错误（请求过于频繁）

**解决方案**:
```javascript
// 添加请求间隔
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchWithDelay(keyword) {
    await delay(1000); // 等待1秒
    const response = await fetch(`/api/v1/search?keyword=${keyword}`);
    return response.json();
}
```

## 性能优化

### 1. 缓存策略

```javascript
// 客户端缓存
class MusicCache {
    constructor() {
        this.cache = new Map();
        this.maxSize = 100;
    }
    
    get(key) {
        return this.cache.get(key);
    }
    
    set(key, value) {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
}

const musicCache = new MusicCache();

async function getCachedMusic(id, quality) {
    const cacheKey = `${id}_${quality}`;
    let result = musicCache.get(cacheKey);
    
    if (!result) {
        const response = await fetch(`/api/v1/match?id=${id}&quality=${quality}`);
        result = await response.json();
        musicCache.set(cacheKey, result);
    }
    
    return result;
}
```

### 2. 批量请求

```javascript
// 批量获取音乐信息
async function batchGetMusic(musicIds, quality = '320') {
    const requests = musicIds.map(id => 
        fetch(`/api/v1/match?id=${id}&quality=${quality}`)
    );
    
    const responses = await Promise.all(requests);
    const results = await Promise.all(
        responses.map(response => response.json())
    );
    
    return results;
}
```

### 3. 错误重试

```javascript
// 自动重试机制
async function retryRequest(url, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return await response.json();
            }
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
}
```

## 最佳实践

### 1. 错误处理

始终检查 API 响应的状态码：

```javascript
async function safeApiCall(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code !== 200) {
            throw new Error(data.message || '请求失败');
        }
        
        return data.data;
    } catch (error) {
        console.error('API 调用失败:', error);
        // 显示用户友好的错误信息
        showErrorMessage('获取音乐失败，请稍后重试');
        return null;
    }
}
```

### 2. 用户体验优化

```javascript
// 显示加载状态
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// 搜索防抖
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedSearch = debounce(searchMusic, 300);
```

### 3. 安全考虑

```javascript
// 输入验证
function validateInput(input) {
    // 移除特殊字符
    return input.replace(/[<>\"']/g, '');
}

// 使用 HTTPS
const API_BASE = location.protocol === 'https:' 
    ? 'https://your-domain.com/api/v1'
    : 'http://localhost:5678/api/v1';
```

## 社区和支持

### 获取帮助

- **文档**: https://github.com/IIXINGCHEN/unm-server-go/blob/master/README.md
- **GitHub Issues**: https://github.com/music-api-proxy/music-api-proxy/issues
- **讨论区**: https://github.com/music-api-proxy/music-api-proxy/discussions
- **QQ群**: 123456789

### 贡献代码

欢迎提交 Pull Request 和 Issue！

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

### 许可证

本项目采用 MIT 许可证，详见 [LICENSE](../LICENSE) 文件。
