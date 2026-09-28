# Music API Proxy 开发指南

## 概述

本文档为 Music API Proxy 的开发者提供详细的开发指南，包括项目结构、开发环境搭建、编码规范、测试指南等。

## 开发环境搭建

### 系统要求

- **Go**: 1.21 或更高版本
- **Git**: 2.30 或更高版本
- **Docker**: 20.10 或更高版本（可选）
- **Redis**: 6.0 或更高版本（开发时可选）

### 环境安装

#### 1. 安装 Go

```bash
# macOS
brew install go

# Ubuntu/Debian
sudo apt update
sudo apt install golang-go

# 验证安装
go version
```

#### 2. 克隆项目

```bash
git clone https://github.com/music-api-proxy/music-api-proxy.git
cd unm-server
```

#### 3. 安装依赖

```bash
# 下载依赖
go mod download

# 验证依赖
go mod verify

# 整理依赖
go mod tidy
```

#### 4. 配置环境

```bash
# 复制配置文件
cp config/config.example.yaml config/config.yaml

# 编辑配置文件
vim config/config.yaml
```

#### 5. 启动开发服务器

```bash
# 直接运行
go run cmd/unm-server/main.go

# 或者构建后运行
go build -o unm-server cmd/unm-server/main.go
./unm-server
```

## 项目结构

```
unm-server/
├── cmd/                    # 应用程序入口
│   └── unm-server/
│       └── main.go
├── internal/               # 内部包（不对外暴露）
│   ├── config/            # 配置管理
│   ├── controller/        # 控制器层
│   ├── middleware/        # 中间件
│   ├── model/            # 数据模型
│   ├── repository/       # 数据访问层
│   ├── router/           # 路由配置
│   ├── service/          # 业务逻辑层
│   └── test/             # 测试辅助工具
├── pkg/                   # 公共包（可对外暴露）
│   ├── logger/           # 日志工具
│   ├── response/         # 响应工具
│   └── utils/            # 工具函数
├── config/               # 配置文件
├── docs/                 # 文档
├── scripts/              # 脚本文件
├── test/                 # 测试文件
│   ├── integration/      # 集成测试
│   └── benchmark/        # 性能测试
├── k8s/                  # Kubernetes 配置
├── go.mod                # Go 模块文件
├── go.sum                # 依赖校验文件
├── Dockerfile            # Docker 配置
├── docker-compose.yml    # Docker Compose 配置
└── README.md             # 项目说明
```

## 架构设计

### 分层架构

```
┌─────────────────┐
│   Controller    │  ← HTTP 请求处理
├─────────────────┤
│    Service      │  ← 业务逻辑处理
├─────────────────┤
│   Repository    │  ← 数据访问层
├─────────────────┤
│     Model       │  ← 数据模型
└─────────────────┘
```

### 依赖注入

项目使用依赖注入模式，通过 `ServiceManager` 管理所有服务：

```go
// 服务管理器
type ServiceManager struct {
    config     *config.Config
    logger     logger.Logger
    repository *repository.Repository
    
    musicService  MusicService
    systemService SystemService
    configService ConfigService
}

// 初始化服务
func (sm *ServiceManager) Initialize(ctx context.Context) error {
    // 初始化仓库层
    sm.repository = repository.NewRepository(...)
    
    // 初始化服务层
    sm.musicService = service.NewMusicService(sm.repository, sm.logger)
    sm.systemService = service.NewSystemService(sm.repository, sm.logger)
    
    return nil
}
```

## 编码规范

### 1. 命名规范

#### 包名
- 使用小写字母
- 简短且有意义
- 避免下划线和驼峰

```go
// 好的例子
package config
package service
package repository

// 不好的例子
package configManager
package music_service
```

#### 变量和函数名
- 使用驼峰命名法
- 导出的标识符首字母大写
- 私有标识符首字母小写

```go
// 导出的函数
func NewMusicService() MusicService {}

// 私有函数
func validateInput() error {}

// 导出的变量
var DefaultConfig = &Config{}

// 私有变量
var httpClient = &http.Client{}
```

#### 常量
- 使用驼峰命名法
- 常量组使用 iota

```go
const (
    StatusPending = iota
    StatusRunning
    StatusCompleted
    StatusFailed
)

const (
    DefaultTimeout = 30 * time.Second
    MaxRetryCount  = 3
)
```

### 2. 代码组织

#### 文件结构
```go
// 文件头部注释
// Package service 业务逻辑层
package service

// 导入分组
import (
    // 标准库
    "context"
    "fmt"
    "time"
    
    // 第三方库
    "github.com/gin-gonic/gin"
    
    // 项目内部包
    "github.com/IIXINGCHEN/unm-server-go/internal/model"
    "github.com/IIXINGCHEN/unm-server-go/pkg/logger"
)

// 常量定义
const (
    DefaultQuality = "320"
)

// 类型定义
type MusicService interface {
    GetMusic(ctx context.Context, id string) (*model.Music, error)
}

// 结构体定义
type DefaultMusicService struct {
    repository repository.Repository
    logger     logger.Logger
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

### 3. 错误处理

#### 错误定义
```go
// 使用 errors 包定义错误
var (
    ErrMusicNotFound = errors.New("音乐不存在")
    ErrInvalidQuality = errors.New("无效的音质参数")
    ErrSourceUnavailable = errors.New("音源不可用")
)

// 使用 fmt.Errorf 包装错误
func (s *MusicService) GetMusic(id string) error {
    if id == "" {
        return fmt.Errorf("音乐ID不能为空")
    }
    
    music, err := s.repository.FindMusic(id)
    if err != nil {
        return fmt.Errorf("查找音乐失败: %w", err)
    }
    
    return nil
}
```

#### 错误处理
```go
// 在调用处处理错误
music, err := musicService.GetMusic(id)
if err != nil {
    if errors.Is(err, ErrMusicNotFound) {
        return response.NotFound("音乐不存在")
    }
    
    logger.Error("获取音乐失败", "error", err, "id", id)
    return response.InternalError("服务器内部错误")
}
```

### 4. 日志规范

```go
// 使用结构化日志
logger.Info("处理音乐请求",
    "id", musicID,
    "quality", quality,
    "source", source,
    "user_ip", clientIP,
)

logger.Error("音源请求失败",
    "error", err,
    "source", sourceName,
    "url", requestURL,
    "duration", time.Since(startTime),
)

// 使用不同级别
logger.Debug("调试信息", "data", debugData)
logger.Info("一般信息", "event", "user_login")
logger.Warn("警告信息", "issue", "high_memory_usage")
logger.Error("错误信息", "error", err)
```

## 开发工作流

### 1. 功能开发

#### 创建功能分支
```bash
# 从 develop 分支创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/new-music-source

# 开发完成后提交
git add .
git commit -m "feat: 添加新音源支持"
git push origin feature/new-music-source
```

#### 提交信息规范
使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

类型说明：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

示例：
```
feat(music): 添加酷狗音源支持

- 实现酷狗音乐API接口
- 添加音质转换逻辑
- 更新音源配置

Closes #123
```

### 2. 代码审查

#### Pull Request 检查清单

- [ ] 代码符合项目编码规范
- [ ] 添加了必要的测试
- [ ] 测试全部通过
- [ ] 更新了相关文档
- [ ] 没有引入安全漏洞
- [ ] 性能没有明显下降

#### 审查要点

1. **代码质量**
   - 逻辑清晰，易于理解
   - 没有重复代码
   - 错误处理完善

2. **测试覆盖**
   - 单元测试覆盖率 > 80%
   - 关键路径有集成测试
   - 边界条件有测试

3. **性能考虑**
   - 没有明显的性能瓶颈
   - 合理使用缓存
   - 避免不必要的内存分配

## 测试指南

### 1. 单元测试

#### 测试文件命名
```
music_service.go      → music_service_test.go
source_manager.go     → source_manager_test.go
```

#### 测试结构
```go
func TestMusicService_GetMusic(t *testing.T) {
    // 准备测试数据
    tests := []struct {
        name    string
        input   string
        want    *model.Music
        wantErr bool
    }{
        {
            name:    "有效的音乐ID",
            input:   "1234567890",
            want:    &model.Music{ID: "1234567890", Name: "测试歌曲"},
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
            // 创建测试服务
            service := createTestMusicService()
            
            // 执行测试
            got, err := service.GetMusic(context.Background(), tt.input)
            
            // 验证结果
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

#### 使用测试套件
```go
type MusicServiceTestSuite struct {
    suite.Suite
    service MusicService
    mockRepo *MockRepository
}

func (s *MusicServiceTestSuite) SetupTest() {
    s.mockRepo = &MockRepository{}
    s.service = NewMusicService(s.mockRepo, logger.NewTestLogger())
}

func (s *MusicServiceTestSuite) TestGetMusic() {
    // 设置模拟返回
    s.mockRepo.On("FindMusic", "123").Return(&model.Music{ID: "123"}, nil)
    
    // 执行测试
    music, err := s.service.GetMusic(context.Background(), "123")
    
    // 验证结果
    s.NoError(err)
    s.Equal("123", music.ID)
    s.mockRepo.AssertExpectations(s.T())
}

func TestMusicServiceTestSuite(t *testing.T) {
    suite.Run(t, new(MusicServiceTestSuite))
}
```

### 2. 集成测试

```go
//go:build integration
// +build integration

func TestMusicAPI_Integration(t *testing.T) {
    // 启动测试服务器
    server := setupTestServer(t)
    defer server.Close()
    
    // 测试搜索接口
    resp, err := http.Get(server.URL + "/api/v1/search?keyword=test")
    assert.NoError(t, err)
    assert.Equal(t, http.StatusOK, resp.StatusCode)
    
    // 解析响应
    var result map[string]interface{}
    err = json.NewDecoder(resp.Body).Decode(&result)
    assert.NoError(t, err)
    assert.Equal(t, 200, int(result["code"].(float64)))
}
```

### 3. 性能测试

```go
func BenchmarkMusicService_GetMusic(b *testing.B) {
    service := createTestMusicService()
    ctx := context.Background()
    
    b.ResetTimer()
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            _, err := service.GetMusic(ctx, "1234567890")
            if err != nil {
                b.Error(err)
            }
        }
    })
}
```

## 调试技巧

### 1. 使用调试器

#### VS Code 配置
创建 `.vscode/launch.json`：

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch Server",
            "type": "go",
            "request": "launch",
            "mode": "auto",
            "program": "${workspaceFolder}/cmd/unm-server/main.go",
            "env": {
                "UNM_ENV": "development",
                "UNM_CONFIG_FILE": "${workspaceFolder}/config/config.yaml"
            },
            "args": []
        }
    ]
}
```

#### Delve 调试器
```bash
# 安装 delve
go install github.com/go-delve/delve/cmd/dlv@latest

# 启动调试
dlv debug cmd/unm-server/main.go

# 设置断点
(dlv) break main.main
(dlv) break internal/service/music_service.go:45

# 运行程序
(dlv) continue
```

### 2. 日志调试

```go
// 添加调试日志
func (s *MusicService) GetMusic(ctx context.Context, id string) (*model.Music, error) {
    s.logger.Debug("开始获取音乐", "id", id)
    
    music, err := s.repository.FindMusic(id)
    if err != nil {
        s.logger.Error("查找音乐失败", "error", err, "id", id)
        return nil, err
    }
    
    s.logger.Debug("成功获取音乐", "id", id, "name", music.Name)
    return music, nil
}
```

### 3. 性能分析

#### CPU 分析
```go
import _ "net/http/pprof"

func main() {
    go func() {
        log.Println(http.ListenAndServe("localhost:6060", nil))
    }()
    
    // 启动主程序
    startServer()
}
```

访问 `http://localhost:6060/debug/pprof/` 查看性能数据。

#### 内存分析
```bash
# 生成内存分析文件
go tool pprof http://localhost:6060/debug/pprof/heap

# 查看内存使用
(pprof) top
(pprof) list functionName
```

## 部署和发布

### 1. 构建

```bash
# 本地构建
go build -o unm-server cmd/unm-server/main.go

# 交叉编译
GOOS=linux GOARCH=amd64 go build -o unm-server-linux cmd/unm-server/main.go

# 优化构建
go build -ldflags="-w -s" -o unm-server cmd/unm-server/main.go
```

### 2. Docker 构建

```bash
# 构建镜像
docker build -t unm-server:latest .

# 多平台构建
docker buildx build --platform linux/amd64,linux/arm64 -t unm-server:latest .
```

### 3. 版本发布

```bash
# 创建版本标签
git tag -a v1.0.4 -m "Release version 1.0.4"
git push origin v1.0.4

# GitHub Actions 会自动构建和发布
```

## 贡献指南

### 1. 提交 Issue

- 使用清晰的标题
- 提供详细的描述
- 包含复现步骤
- 附上相关日志

### 2. 提交 Pull Request

- Fork 项目到个人仓库
- 创建功能分支
- 编写测试
- 更新文档
- 提交 PR

### 3. 代码审查

- 响应审查意见
- 及时更新代码
- 保持讨论友好

## 常见问题

### 1. 依赖管理

```bash
# 添加新依赖
go get github.com/new/package

# 更新依赖
go get -u github.com/existing/package

# 清理未使用的依赖
go mod tidy
```

### 2. 测试问题

```bash
# 运行特定测试
go test -run TestMusicService_GetMusic

# 查看测试覆盖率
go test -cover ./...

# 生成覆盖率报告
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### 3. 性能问题

```bash
# 运行基准测试
go test -bench=. -benchmem

# CPU 分析
go test -cpuprofile=cpu.prof -bench=.
go tool pprof cpu.prof

# 内存分析
go test -memprofile=mem.prof -bench=.
go tool pprof mem.prof
```

## 资源链接

- [Go 官方文档](https://golang.org/doc/)
- [Effective Go](https://golang.org/doc/effective_go.html)
- [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- [项目 Wiki](https://github.com/music-api-proxy/music-api-proxy/wiki)
