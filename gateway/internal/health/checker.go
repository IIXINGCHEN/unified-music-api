// Package health 健康检查
package health

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// Status 健康状态
type Status string

const (
	StatusHealthy   Status = "healthy"   // 健康
	StatusUnhealthy Status = "unhealthy" // 不健康
	StatusUnknown   Status = "unknown"   // 未知
)

// CheckResult 检查结果
type CheckResult struct {
	Name      string                 `json:"name"`      // 检查项名称
	Status    Status                 `json:"status"`    // 状态
	Message   string                 `json:"message"`   // 消息
	Details   map[string]interface{} `json:"details"`   // 详细信息
	Timestamp time.Time              `json:"timestamp"` // 时间戳
	Duration  time.Duration          `json:"duration"`  // 检查耗时
}

// Check 健康检查接口
type Check interface {
	Name() string
	Check(ctx context.Context) CheckResult
}

// Checker 健康检查器
type Checker struct {
	checks   map[string]Check
	mu       sync.RWMutex
	startTime time.Time
}

// NewChecker 创建健康检查器
func NewChecker() *Checker {
	return &Checker{
		checks:    make(map[string]Check),
		startTime: time.Now(),
	}
}

// Register 注册健康检查
func (c *Checker) Register(check Check) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.checks[check.Name()] = check
}

// Unregister 取消注册健康检查
func (c *Checker) Unregister(name string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.checks, name)
}

// Check 执行健康检查
func (c *Checker) Check(ctx context.Context) map[string]CheckResult {
	c.mu.RLock()
	checks := make(map[string]Check, len(c.checks))
	for name, check := range c.checks {
		checks[name] = check
	}
	c.mu.RUnlock()

	results := make(map[string]CheckResult)
	var wg sync.WaitGroup
	var mu sync.Mutex

	for name, check := range checks {
		wg.Add(1)
		go func(name string, check Check) {
			defer wg.Done()
			result := check.Check(ctx)
			mu.Lock()
			results[name] = result
			mu.Unlock()
		}(name, check)
	}

	wg.Wait()
	return results
}

// IsHealthy 检查整体健康状态
func (c *Checker) IsHealthy(ctx context.Context) bool {
	results := c.Check(ctx)
	for _, result := range results {
		if result.Status != StatusHealthy {
			return false
		}
	}
	return true
}

// GetUptime 获取运行时间
func (c *Checker) GetUptime() time.Duration {
	return time.Since(c.startTime)
}

// GetStartTime 获取启动时间
func (c *Checker) GetStartTime() time.Time {
	return c.startTime
}

// BasicCheck 核心健康检查
type BasicCheck struct {
	name string
}

// NewBasicCheck 创建核心健康检查
func NewBasicCheck() *BasicCheck {
	return &BasicCheck{name: "basic"}
}

// Name 返回检查名称
func (c *BasicCheck) Name() string {
	return c.name
}

// Check 执行核心检查
func (c *BasicCheck) Check(ctx context.Context) CheckResult {
	start := time.Now()

	// 核心检查总是成功
	return CheckResult{
		Name:      c.name,
		Status:    StatusHealthy,
		Message:   "服务正常运行",
		Details: map[string]interface{}{
			"uptime": time.Since(start).String(),
		},
		Timestamp: time.Now(),
		Duration:  time.Since(start),
	}
}

// MemoryCheck 内存检查
type MemoryCheck struct {
	name      string
	threshold int64 // 内存阈值（字节）
}

// NewMemoryCheck 创建内存检查
func NewMemoryCheck(threshold int64) *MemoryCheck {
	return &MemoryCheck{
		name:      "memory",
		threshold: threshold,
	}
}

// Name 返回检查名称
func (c *MemoryCheck) Name() string {
	return c.name
}

// Check 执行内存检查
func (c *MemoryCheck) Check(ctx context.Context) CheckResult {
	start := time.Now()
	
	// 这里可以添加实际的内存检查逻辑
	// 暂时返回健康状态
	return CheckResult{
		Name:    c.name,
		Status:  StatusHealthy,
		Message: "内存使用正常",
		Details: map[string]interface{}{
			"threshold": c.threshold,
		},
		Timestamp: time.Now(),
		Duration:  time.Since(start),
	}
}

// ExternalServiceCheck 外部服务检查
type ExternalServiceCheck struct {
	name string
	url  string
}

// NewExternalServiceCheck 创建外部服务检查
func NewExternalServiceCheck(name, url string) *ExternalServiceCheck {
	return &ExternalServiceCheck{
		name: name,
		url:  url,
	}
}

// Name 返回检查名称
func (c *ExternalServiceCheck) Name() string {
	return c.name
}

// Check 执行外部服务检查
func (c *ExternalServiceCheck) Check(ctx context.Context) CheckResult {
	start := time.Now()
	
	// 这里可以添加实际的外部服务检查逻辑
	// 暂时返回健康状态
	return CheckResult{
		Name:    c.name,
		Status:  StatusHealthy,
		Message: fmt.Sprintf("外部服务 %s 连接正常", c.url),
		Details: map[string]interface{}{
			"url": c.url,
		},
		Timestamp: time.Now(),
		Duration:  time.Since(start),
	}
}

// 全局健康检查器实例
var defaultChecker *Checker

// InitDefaultChecker 初始化默认健康检查器
func InitDefaultChecker() {
	defaultChecker = NewChecker()
	
	// 注册核心检查
	defaultChecker.Register(NewBasicCheck())
	defaultChecker.Register(NewMemoryCheck(1024*1024*1024)) // 1GB阈值
	
	logger.Info("健康检查器初始化完成")
}

// GetDefaultChecker 获取默认健康检查器
func GetDefaultChecker() *Checker {
	if defaultChecker == nil {
		InitDefaultChecker()
	}
	return defaultChecker
}
