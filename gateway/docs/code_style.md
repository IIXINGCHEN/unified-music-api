# Music API Proxy 代码规范

## 概述

本文档定义了 Music API Proxy 项目的代码规范和最佳实践。遵循这些规范有助于保持代码的一致性、可读性和可维护性。

## Go 语言规范

### 基础规范

遵循 [Effective Go](https://golang.org/doc/effective_go.html) 和 [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments) 的建议。

### 命名规范

#### 包名 (Package Names)

```go
// 好的例子
package config
package service
package repository

// 不好的例子
package configManager
package music_service
package musicRepository
```

**规则**：
- 使用小写字母
- 简短且有意义
- 避免下划线和驼峰
- 避免复数形式

#### 变量和函数名

```go
// 导出的函数 - 首字母大写
func NewMusicService() MusicService {}
func GetMusicByID(id string) (*Music, error) {}

// 私有函数 - 首字母小写
func validateInput(input string) error {}
func parseQuality(quality string) int {}

// 导出的变量
var DefaultConfig = &Config{}
var ErrMusicNotFound = errors.New("music not found")

// 私有变量
var httpClient = &http.Client{}
var defaultTimeout = 30 * time.Second
```

**规则**：
- 使用驼峰命名法 (camelCase/PascalCase)
- 导出的标识符首字母大写
- 私有标识符首字母小写
- 避免缩写，除非是通用缩写 (ID, URL, HTTP)

#### 常量

```go
// 单个常量
const DefaultQuality = "320"
const MaxRetryCount = 3

// 常量组
const (
    StatusPending = iota
    StatusRunning
    StatusCompleted
    StatusFailed
)

const (
    QualityLow    = "128"
    QualityMedium = "192"
    QualityHigh   = "320"
    QualityLossless = "999"
)
```

**规则**：
- 使用驼峰命名法
- 相关常量使用常量组
- 枚举类型使用 iota

#### 接口名

```go
// 单方法接口 - 使用 -er 后缀
type Reader interface {
    Read([]byte) (int, error)
}

type MusicProvider interface {
    GetMusic(id string) (*Music, error)
}

// 多方法接口 - 使用描述性名称
type MusicService interface {
    GetMusic(id string) (*Music, error)
    SearchMusic(keyword string) ([]*Music, error)
    GetMusicInfo(id string) (*MusicInfo, error)
}
```

### 代码组织

#### 文件结构

```go
// Package 声明和注释
// Package service 提供业务逻辑处理
package service

// 导入分组
import (
    // 标准库
    "context"
    "fmt"
    "time"
    
    // 第三方库
    "github.com/gin-gonic/gin"
    "github.com/redis/go-redis/v9"
    
    // 项目内部包
    "github.com/IIXINGCHEN/unm-server-go/internal/model"
    "github.com/IIXINGCHEN/unm-server-go/internal/repository"
    "github.com/IIXINGCHEN/unm-server-go/pkg/logger"
)

// 常量定义
const (
    DefaultQuality = "320"
    MaxRetryCount  = 3
)

// 变量定义
var (
    ErrMusicNotFound = errors.New("music not found")
)

// 类型定义
type MusicService interface {
    GetMusic(ctx context.Context, id string) (*model.Music, error)
}

// 结构体定义
type DefaultMusicService struct {
    repository repository.Repository
    logger     logger.Logger
    cache      *redis.Client
}

// 构造函数
func NewMusicService(repo repository.Repository, log logger.Logger) MusicService {
    return &DefaultMusicService{
        repository: repo,
        logger:     log,
    }
}

// 方法实现
func (s *DefaultMusicService) GetMusic(ctx context.Context, id string) (*model.Music, error) {
    // 实现逻辑
}
```

#### 导入顺序

1. 标准库
2. 第三方库
3. 项目内部包

每组之间用空行分隔。

### 函数和方法

#### 函数签名

```go
// 好的例子
func GetMusic(ctx context.Context, id string, quality string) (*Music, error) {}
func (s *MusicService) SearchMusic(ctx context.Context, keyword string, limit int) ([]*Music, error) {}

// 参数过多时使用结构体
type SearchOptions struct {
    Keyword string
    Sources []string
    Quality string
    Limit   int
}

func (s *MusicService) SearchMusicWithOptions(ctx context.Context, opts SearchOptions) ([]*Music, error) {}
```

**规则**：
- 第一个参数通常是 `context.Context`
- 返回值中错误总是最后一个
- 参数超过 3-4 个时考虑使用结构体

#### 函数长度

```go
// 好的例子 - 函数简短，职责单一
func (s *MusicService) GetMusic(ctx context.Context, id string) (*Music, error) {
    if err := s.validateID(id); err != nil {
        return nil, err
    }
    
    music, err := s.repository.FindMusic(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("查找音乐失败: %w", err)
    }
    
    return music, nil
}

func (s *MusicService) validateID(id string) error {
    if id == "" {
        return ErrInvalidID
    }
    if len(id) > 50 {
        return ErrIDTooLong
    }
    return nil
}
```

**规则**：
- 函数应该简短，通常不超过 50 行
- 一个函数只做一件事
- 复杂逻辑拆分为多个小函数

### 错误处理

#### 错误定义

```go
// 使用 errors 包定义错误
var (
    ErrMusicNotFound     = errors.New("音乐不存在")
    ErrInvalidQuality    = errors.New("无效的音质参数")
    ErrSourceUnavailable = errors.New("音源不可用")
)

// 自定义错误类型
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("字段 %s: %s", e.Field, e.Message)
}
```

#### 错误处理

```go
// 包装错误
func (s *MusicService) GetMusic(id string) (*Music, error) {
    music, err := s.repository.FindMusic(id)
    if err != nil {
        return nil, fmt.Errorf("查找音乐失败: %w", err)
    }
    return music, nil
}

// 错误检查
music, err := musicService.GetMusic(id)
if err != nil {
    if errors.Is(err, ErrMusicNotFound) {
        return response.NotFound("音乐不存在")
    }
    
    logger.Error("获取音乐失败", "error", err, "id", id)
    return response.InternalError("服务器内部错误")
}
```

**规则**：
- 使用 `fmt.Errorf` 和 `%w` 包装错误
- 使用 `errors.Is` 和 `errors.As` 检查错误
- 不要忽略错误，至少要记录日志

### 注释规范

#### 包注释

```go
// Package service 提供 Music API Proxy 的核心业务逻辑。
//
// 该包包含音乐服务、系统服务等核心功能的实现，
// 负责处理音乐搜索、获取、缓存等业务逻辑。
package service
```

#### 函数注释

```go
// NewMusicService 创建一个新的音乐服务实例。
//
// 参数:
//   - repo: 数据访问层接口
//   - logger: 日志记录器
//   - cache: Redis 缓存客户端
//
// 返回:
//   - MusicService: 音乐服务接口实例
func NewMusicService(repo repository.Repository, logger logger.Logger, cache *redis.Client) MusicService {
    // 实现
}

// GetMusic 根据音乐ID获取音乐信息。
//
// 该方法首先从缓存中查找，如果缓存中没有则从数据库查询，
// 并将结果缓存以提高后续查询性能。
//
// 参数:
//   - ctx: 上下文，用于控制请求生命周期
//   - id: 音乐唯一标识符
//
// 返回:
//   - *Music: 音乐信息，如果找不到则返回 nil
//   - error: 错误信息，成功时为 nil
func (s *DefaultMusicService) GetMusic(ctx context.Context, id string) (*Music, error) {
    // 实现
}
```

#### 类型注释

```go
// Music 表示音乐信息的数据模型。
type Music struct {
    // ID 音乐的唯一标识符
    ID string `json:"id"`
    
    // Name 音乐名称
    Name string `json:"name"`
    
    // Artist 艺术家名称
    Artist string `json:"artist"`
    
    // Album 专辑名称
    Album string `json:"album"`
    
    // Duration 音乐时长，单位为秒
    Duration int `json:"duration"`
    
    // Quality 音质信息
    Quality string `json:"quality"`
    
    // URL 播放链接
    URL string `json:"url"`
    
    // CreatedAt 创建时间
    CreatedAt time.Time `json:"created_at"`
}
```

**规则**：
- 导出的类型、函数、变量都必须有注释
- 注释以类型或函数名开头
- 复杂逻辑需要详细说明
- 参数和返回值要说明清楚

### 测试规范

#### 测试文件命名

```
music_service.go      → music_service_test.go
source_manager.go     → source_manager_test.go
```

#### 测试函数命名

```go
// 测试函数命名: Test + 被测试函数名
func TestMusicService_GetMusic(t *testing.T) {}

// 测试方法命名: Test + 结构体名 + 方法名
func TestDefaultMusicService_GetMusic(t *testing.T) {}

// 基准测试: Benchmark + 函数名
func BenchmarkMusicService_GetMusic(b *testing.B) {}
```

#### 测试结构

```go
func TestMusicService_GetMusic(t *testing.T) {
    // 准备测试数据
    tests := []struct {
        name    string
        input   string
        want    *Music
        wantErr bool
    }{
        {
            name:    "有效的音乐ID",
            input:   "1234567890",
            want:    &Music{ID: "1234567890", Name: "测试歌曲"},
            wantErr: false,
        },
        {
            name:    "无效的音乐ID",
            input:   "",
            want:    nil,
            wantErr: true,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Arrange - 准备
            service := createTestMusicService()
            
            // Act - 执行
            got, err := service.GetMusic(context.Background(), tt.input)
            
            // Assert - 验证
            if (err != nil) != tt.wantErr {
                t.Errorf("GetMusic() error = %v, wantErr %v", err, tt.wantErr)
                return
            }
            if !reflect.DeepEqual(got, tt.want) {
                t.Errorf("GetMusic() = %v, want %v", got, tt.want)
            }
        })
    }
}
```

### 日志规范

#### 结构化日志

```go
// 使用结构化日志
logger.Info("处理音乐请求",
    "id", musicID,
    "quality", quality,
    "source", source,
    "user_ip", clientIP,
    "duration", time.Since(startTime),
)

logger.Error("音源请求失败",
    "error", err,
    "source", sourceName,
    "url", requestURL,
    "retry_count", retryCount,
)
```

#### 日志级别

```go
// Debug: 调试信息，生产环境通常不输出
logger.Debug("缓存命中", "key", cacheKey, "value", value)

// Info: 一般信息，记录重要的业务事件
logger.Info("用户搜索音乐", "keyword", keyword, "results", len(results))

// Warn: 警告信息，可能的问题但不影响功能
logger.Warn("音源响应缓慢", "source", source, "duration", duration)

// Error: 错误信息，需要关注的问题
logger.Error("数据库连接失败", "error", err, "retry_count", retryCount)
```

## 项目特定规范

### 音源处理

```go
// 音源接口定义
type MusicSource interface {
    // Name 返回音源名称
    Name() string
    
    // Search 搜索音乐
    Search(ctx context.Context, keyword string) ([]*Music, error)
    
    // GetMusic 获取音乐链接
    GetMusic(ctx context.Context, id string, quality string) (*Music, error)
    
    // IsAvailable 检查音源是否可用
    IsAvailable(ctx context.Context) bool
}

// 音源实现
type KugouSource struct {
    client  *http.Client
    baseURL string
    timeout time.Duration
}

func (k *KugouSource) Name() string {
    return "kugou"
}
```

### 配置管理

```go
// 配置结构体使用标签
type Config struct {
    Server struct {
        Port int    `yaml:"port" env:"UNM_PORT" default:"5678"`
        Host string `yaml:"host" env:"UNM_HOST" default:"0.0.0.0"`
    } `yaml:"server"`
    
    Sources struct {
        NeteaseCookie string   `yaml:"netease_cookie" env:"NETEASE_COOKIE"`
        DefaultSources []string `yaml:"default_sources"`
        Timeout       time.Duration `yaml:"timeout" default:"30s"`
    } `yaml:"sources"`
}
```

### API 响应

```go
// 统一的响应格式
type Response struct {
    Code      int         `json:"code"`
    Message   string      `json:"message"`
    Data      interface{} `json:"data,omitempty"`
    Error     string      `json:"error,omitempty"`
    Timestamp time.Time   `json:"timestamp"`
    RequestID string      `json:"request_id"`
}

// 成功响应
func Success(data interface{}) *Response {
    return &Response{
        Code:      200,
        Message:   "操作成功",
        Data:      data,
        Timestamp: time.Now(),
        RequestID: generateRequestID(),
    }
}

// 错误响应
func Error(code int, message string, err error) *Response {
    resp := &Response{
        Code:      code,
        Message:   message,
        Timestamp: time.Now(),
        RequestID: generateRequestID(),
    }
    
    if err != nil {
        resp.Error = err.Error()
    }
    
    return resp
}
```

## 工具配置

### golangci-lint 配置

创建 `.golangci.yml` 文件：

```yaml
run:
  timeout: 5m
  modules-download-mode: readonly

linters-settings:
  gofmt:
    simplify: true
  goimports:
    local-prefixes: github.com/IIXINGCHEN/music-api-proxy
  golint:
    min-confidence: 0.8
  govet:
    check-shadowing: true
  misspell:
    locale: US

linters:
  enable:
    - gofmt
    - goimports
    - golint
    - govet
    - misspell
    - ineffassign
    - deadcode
    - varcheck
    - structcheck
    - errcheck
    - gosimple
    - staticcheck
    - unused
    - typecheck

issues:
  exclude-rules:
    - path: _test\.go
      linters:
        - golint
        - errcheck
```

### VS Code 配置

创建 `.vscode/settings.json`：

```json
{
    "go.formatTool": "goimports",
    "go.lintTool": "golangci-lint",
    "go.lintOnSave": "package",
    "go.testFlags": ["-v"],
    "go.testTimeout": "30s",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.organizeImports": true
    }
}
```

## 代码审查检查清单

### 通用检查

- [ ] 代码符合命名规范
- [ ] 函数长度合理（< 50 行）
- [ ] 错误处理完善
- [ ] 注释清晰完整
- [ ] 没有重复代码
- [ ] 导入顺序正确

### 性能检查

- [ ] 避免不必要的内存分配
- [ ] 合理使用缓存
- [ ] 数据库查询优化
- [ ] 并发安全

### 安全检查

- [ ] 输入验证
- [ ] SQL 注入防护
- [ ] XSS 防护
- [ ] 敏感信息处理

### 测试检查

- [ ] 单元测试覆盖率 > 80%
- [ ] 边界条件测试
- [ ] 错误场景测试
- [ ] 集成测试（如需要）

---

遵循这些规范将帮助我们维护高质量、一致的代码库。如有疑问，请参考 [开发指南](development.md) 或在团队中讨论。
