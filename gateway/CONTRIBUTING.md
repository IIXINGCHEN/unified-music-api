# 贡献指南

感谢您对 Music API Proxy 项目的关注！我们欢迎各种形式的贡献，包括但不限于代码、文档、测试、问题报告和功能建议。

## 贡献方式

### 🐛 报告问题

如果您发现了 bug 或有改进建议，请：

1. **搜索现有 Issues**：确保问题尚未被报告
2. **使用 Issue 模板**：选择合适的模板填写详细信息
3. **提供完整信息**：包括环境信息、复现步骤、期望行为等

#### Issue 模板

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

### 💡 功能建议

对于新功能建议：

1. **检查路线图**：查看是否已在计划中
2. **创建 Discussion**：在 GitHub Discussions 中讨论
3. **详细描述**：说明功能的用途和实现思路
4. **考虑影响**：评估对现有功能的影响

### 📝 改进文档

文档改进包括：

- 修复错别字和语法错误
- 添加缺失的文档
- 改进代码示例
- 翻译文档

### 🔧 贡献代码

## 开发环境搭建

### 前置要求

- Go 1.21 或更高版本
- Git 2.30 或更高版本
- Docker 20.10 或更高版本（可选）

### 环境配置

```bash
# 1. Fork 项目到您的 GitHub 账户

# 2. 克隆您的 Fork
git clone https://github.com/YOUR_USERNAME/music-api-proxy.git
cd unm-server

# 3. 添加上游仓库
git remote add upstream https://github.com/music-api-proxy/music-api-proxy.git

# 4. 安装依赖
go mod download

# 5. 复制配置文件
cp config/config.example.yaml config/config.yaml

# 6. 运行测试
go test ./...

# 7. 启动开发服务器
go run cmd/unm-server/main.go
```

## 开发工作流

### 1. 创建功能分支

```bash
# 确保主分支是最新的
git checkout main
git pull upstream main

# 创建功能分支
git checkout -b feature/your-feature-name
```

### 2. 开发和测试

```bash
# 进行开发...

# 运行测试
go test ./...

# 运行代码检查
go vet ./...
gofmt -s -w .

# 运行集成测试
go test -tags=integration ./test/integration/...
```

### 3. 提交代码

#### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**类型说明**：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例**：
```bash
git commit -m "feat(music): 添加酷狗音源支持

- 实现酷狗音乐API接口
- 添加音质转换逻辑
- 更新音源配置

Closes #123"
```

### 4. 推送和创建 PR

```bash
# 推送到您的 Fork
git push origin feature/your-feature-name

# 在 GitHub 上创建 Pull Request
```

## 代码规范

### Go 代码规范

#### 命名规范

```go
// 包名：小写，简短
package service

// 导出函数：首字母大写，驼峰命名
func NewMusicService() MusicService {}

// 私有函数：首字母小写，驼峰命名
func validateInput() error {}

// 常量：驼峰命名
const DefaultTimeout = 30 * time.Second

// 接口：以 -er 结尾或描述性名称
type MusicService interface {}
type Validator interface {}
```

#### 代码组织

```go
// 文件结构
package service

import (
    // 标准库
    "context"
    "fmt"
    
    // 第三方库
    "github.com/gin-gonic/gin"
    
    // 项目内部包
    "github.com/IIXINGCHEN/unm-server-go/internal/model"
)

// 常量
const (
    DefaultQuality = "320"
)

// 类型定义
type MusicService interface {}

// 结构体
type DefaultMusicService struct {}

// 构造函数
func NewMusicService() MusicService {}

// 方法
func (s *DefaultMusicService) GetMusic() {}
```

#### 错误处理

```go
// 定义错误
var (
    ErrMusicNotFound = errors.New("音乐不存在")
    ErrInvalidQuality = errors.New("无效的音质参数")
)

// 包装错误
func (s *MusicService) GetMusic(id string) error {
    music, err := s.repository.FindMusic(id)
    if err != nil {
        return fmt.Errorf("查找音乐失败: %w", err)
    }
    return nil
}

// 处理错误
music, err := musicService.GetMusic(id)
if err != nil {
    if errors.Is(err, ErrMusicNotFound) {
        return response.NotFound("音乐不存在")
    }
    logger.Error("获取音乐失败", "error", err)
    return response.InternalError("服务器内部错误")
}
```

#### 日志规范

```go
// 使用结构化日志
logger.Info("处理音乐请求",
    "id", musicID,
    "quality", quality,
    "source", source,
)

logger.Error("音源请求失败",
    "error", err,
    "source", sourceName,
    "duration", time.Since(startTime),
)
```

### 测试规范

#### 单元测试

```go
func TestMusicService_GetMusic(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    *model.Music
        wantErr bool
    }{
        {
            name:    "有效的音乐ID",
            input:   "1234567890",
            want:    &model.Music{ID: "1234567890"},
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
            service := createTestMusicService()
            got, err := service.GetMusic(context.Background(), tt.input)
            
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

#### 测试覆盖率

- 单元测试覆盖率应 ≥ 80%
- 核心业务逻辑覆盖率应 ≥ 90%
- 关键路径应有集成测试

## Pull Request 指南

### PR 检查清单

提交 PR 前请确保：

- [ ] 代码符合项目编码规范
- [ ] 添加了必要的测试
- [ ] 所有测试都通过
- [ ] 更新了相关文档
- [ ] 提交信息符合规范
- [ ] 没有引入安全漏洞
- [ ] 性能没有明显下降

### PR 模板

```markdown
## 变更描述
简要描述此 PR 的变更内容

## 变更类型
- [ ] 新功能 (feature)
- [ ] 问题修复 (bugfix)
- [ ] 文档更新 (docs)
- [ ] 代码重构 (refactor)
- [ ] 性能优化 (perf)
- [ ] 测试相关 (test)

## 测试
- [ ] 添加了单元测试
- [ ] 添加了集成测试
- [ ] 手动测试通过
- [ ] 所有现有测试通过

## 文档
- [ ] 更新了 API 文档
- [ ] 更新了用户指南
- [ ] 更新了开发文档
- [ ] 更新了 CHANGELOG

## 相关 Issue
Closes #123
Fixes #456
Related to #789

## 截图/演示
如果适用，请添加截图或演示

## 检查清单
- [ ] 我已阅读并同意贡献指南
- [ ] 我的代码遵循项目的代码规范
- [ ] 我已进行自我代码审查
- [ ] 我已添加必要的注释
- [ ] 我的变更不会产生新的警告
- [ ] 我已添加相应的测试
- [ ] 新增和现有的单元测试都通过
```

### 代码审查

#### 审查要点

1. **代码质量**
   - 逻辑清晰，易于理解
   - 没有重复代码
   - 错误处理完善
   - 性能考虑合理

2. **测试覆盖**
   - 单元测试充分
   - 边界条件测试
   - 错误场景测试

3. **文档完整**
   - 代码注释清晰
   - API 文档更新
   - 用户文档更新

#### 审查流程

1. **自动检查**：CI/CD 流水线自动运行
2. **代码审查**：至少一位维护者审查
3. **测试验证**：确保所有测试通过
4. **文档检查**：确保文档更新完整

## 社区准则

### 行为准则

我们致力于为每个人提供友好、安全和欢迎的环境。请遵循以下准则：

#### 应该做的

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

#### 不应该做的

- 使用性别化语言或图像
- 发表侮辱性/贬损性评论
- 公开或私下骚扰
- 未经明确许可发布他人私人信息
- 其他在专业环境中不当的行为

### 沟通渠道

- **GitHub Issues**: 问题报告和功能请求
- **GitHub Discussions**: 一般讨论和问答
- **Pull Requests**: 代码审查和讨论

## 发布流程

### 版本管理

项目使用语义化版本：

- **主版本号**: 不兼容的 API 修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

### 发布步骤

1. **更新版本号**
2. **更新 CHANGELOG**
3. **创建 Release Tag**
4. **自动构建和发布**

## 获得帮助

如果您在贡献过程中遇到问题：

1. **查看文档**: 首先查看项目文档
2. **搜索 Issues**: 查看是否有类似问题
3. **创建 Discussion**: 在 GitHub Discussions 中提问
4. **联系维护者**: 通过 Issue 或 Email 联系

## 致谢

感谢所有为 Music API Proxy 做出贡献的开发者！您的贡献让这个项目变得更好。

### 贡献者

- [@contributor1](https://github.com/contributor1) - 核心开发
- [@contributor2](https://github.com/contributor2) - 文档改进
- [@contributor3](https://github.com/contributor3) - 测试完善

*如果您为本项目做出了贡献，请通过 PR 添加您的信息。*

---

再次感谢您的贡献！🎉
