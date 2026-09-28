// Package repository 核心音源实现
package repository

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/model"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// BaseSource 核心音源实现
type BaseSource struct {
	name       string
	config     *model.SourceConfig
	httpClient HTTPClient
	logger     logger.Logger
	enabled    bool
	mutex      sync.RWMutex

	// 统计信息
	stats struct {
		totalRequests   int64
		successRequests int64
		errorRequests   int64
		lastRequestTime time.Time
		lastError       error
		lastErrorTime   time.Time
	}
}

// NewBaseSource 创建核心音源
func NewBaseSource(name string, config *model.SourceConfig, httpClient HTTPClient, log logger.Logger) *BaseSource {
	return &BaseSource{
		name:       name,
		config:     config,
		httpClient: httpClient,
		logger:     log,
		enabled:    config.Enabled,
	}
}

// GetName 获取音源名称
func (b *BaseSource) GetName() string {
	return b.name
}

// IsEnabled 检查音源是否启用
func (b *BaseSource) IsEnabled() bool {
	b.mutex.RLock()
	defer b.mutex.RUnlock()
	return b.enabled
}

// SetEnabled 设置音源启用状态
func (b *BaseSource) SetEnabled(enabled bool) {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	b.enabled = enabled
	b.config.Enabled = enabled

	b.logger.Info("音源状态变更",
		logger.String("source", b.name),
		logger.Bool("enabled", enabled),
	)
}

// GetConfig 获取音源配置
func (b *BaseSource) GetConfig() *model.SourceConfig {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	// 返回配置副本
	configCopy := *b.config
	return &configCopy
}

// UpdateConfig 更新音源配置
func (b *BaseSource) UpdateConfig(config *model.SourceConfig) error {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	if config == nil {
		return fmt.Errorf("配置不能为空")
	}

	// 验证配置
	if err := b.validateConfig(config); err != nil {
		b.logger.Error("配置验证失败",
			logger.String("source", b.name),
			logger.ErrorField("error", err),
		)
		return fmt.Errorf("配置验证失败: %w", err)
	}

	// 更新配置
	oldConfig := b.config
	b.config = config
	b.enabled = config.Enabled

	// 应用新配置
	if err := b.applyConfig(config); err != nil {
		// 回滚配置
		b.config = oldConfig
		b.enabled = oldConfig.Enabled

		b.logger.Error("应用配置失败",
			logger.String("source", b.name),
			logger.ErrorField("error", err),
		)
		return fmt.Errorf("应用配置失败: %w", err)
	}

	b.logger.Info("音源配置已更新",
		logger.String("source", b.name),
		logger.Bool("enabled", config.Enabled),
		logger.Int("priority", config.Priority),
	)

	return nil
}

// validateConfig 验证配置
func (b *BaseSource) validateConfig(config *model.SourceConfig) error {
	if config.Name == "" {
		return fmt.Errorf("音源名称不能为空")
	}

	if config.Priority < 0 {
		return fmt.Errorf("优先级不能为负数")
	}

	if config.Timeout <= 0 {
		return fmt.Errorf("超时时间必须大于0")
	}

	if config.RetryCount < 0 {
		return fmt.Errorf("重试次数不能为负数")
	}

	if config.RateLimit < 0 {
		return fmt.Errorf("速率限制不能为负数")
	}

	return nil
}

// applyConfig 应用配置
func (b *BaseSource) applyConfig(config *model.SourceConfig) error {
	// 设置HTTP客户端配置
	if b.httpClient != nil {
		// 设置超时
		if config.Timeout > 0 {
			if timeoutSetter, ok := b.httpClient.(interface{ SetTimeout(time.Duration) }); ok {
				timeoutSetter.SetTimeout(config.Timeout)
			}
		}

		// 设置用户代理
		if config.UserAgent != "" {
			if uaSetter, ok := b.httpClient.(interface{ SetUserAgent(string) }); ok {
				uaSetter.SetUserAgent(config.UserAgent)
			}
		}

		// 设置代理
		if config.Proxy != "" {
			if proxySetter, ok := b.httpClient.(interface{ SetProxy(string) error }); ok {
				if err := proxySetter.SetProxy(config.Proxy); err != nil {
					b.logger.Warn("设置代理失败",
						logger.String("source", b.name),
						logger.ErrorField("error", err),
					)
				}
			}
		}
	}

	return nil
}

// GetStats 获取统计信息
func (b *BaseSource) GetStats() map[string]interface{} {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	successRate := float64(0)
	if b.stats.totalRequests > 0 {
		successRate = float64(b.stats.successRequests) / float64(b.stats.totalRequests) * 100
	}

	stats := map[string]interface{}{
		"name":              b.name,
		"enabled":           b.enabled,
		"total_requests":    b.stats.totalRequests,
		"success_requests":  b.stats.successRequests,
		"error_requests":    b.stats.errorRequests,
		"success_rate":      successRate,
		"last_request_time": b.stats.lastRequestTime,
		"last_error":        "",
		"last_error_time":   b.stats.lastErrorTime,
	}

	if b.stats.lastError != nil {
		stats["last_error"] = b.stats.lastError.Error()
	}

	return stats
}

// RecordRequest 记录请求统计
func (b *BaseSource) RecordRequest(success bool, err error) {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	b.stats.totalRequests++
	b.stats.lastRequestTime = time.Now()

	if success {
		b.stats.successRequests++
	} else {
		b.stats.errorRequests++
		if err != nil {
			b.stats.lastError = err
			b.stats.lastErrorTime = time.Now()
		}
	}
}

// ResetStats 重置统计信息
func (b *BaseSource) ResetStats() {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	b.stats.totalRequests = 0
	b.stats.successRequests = 0
	b.stats.errorRequests = 0
	b.stats.lastRequestTime = time.Time{}
	b.stats.lastError = nil
	b.stats.lastErrorTime = time.Time{}

	b.logger.Info("统计信息已重置",
		logger.String("source", b.name),
	)
}

// IsAvailable 检查音源是否可用
func (b *BaseSource) IsAvailable(ctx context.Context) bool {
	if !b.IsEnabled() {
		return false
	}

	// 执行健康检查
	return b.performHealthCheck(ctx)
}

// performHealthCheck 执行健康检查
func (b *BaseSource) performHealthCheck(ctx context.Context) bool {
	// 完整实现：检查HTTP客户端是否可用
	if b.httpClient == nil {
		return false
	}

	// 可以被子类重写以实现特定的健康检查逻辑
	return true
}

// GetHTTPClient 获取HTTP客户端
func (b *BaseSource) GetHTTPClient() HTTPClient {
	return b.httpClient
}

// GetLogger 获取日志器
func (b *BaseSource) GetLogger() logger.Logger {
	return b.logger
}

// makeRequest 发起HTTP请求的辅助方法
func (b *BaseSource) makeRequest(ctx context.Context, method, url string, data []byte, headers map[string]string) ([]byte, error) {
	if !b.IsEnabled() {
		return nil, fmt.Errorf("音源已禁用: %s", b.name)
	}

	// 合并默认头部和自定义头部
	allHeaders := make(map[string]string)

	// 添加配置中的默认头部
	for k, v := range b.config.Headers {
		allHeaders[k] = v
	}

	// 添加请求特定的头部
	for k, v := range headers {
		allHeaders[k] = v
	}

	// 设置默认User-Agent
	if _, exists := allHeaders["User-Agent"]; !exists && b.config.UserAgent != "" {
		allHeaders["User-Agent"] = b.config.UserAgent
	}

	var resp []byte
	var err error

	// 发起请求
	switch method {
	case http.MethodGet:
		resp, err = b.httpClient.Get(ctx, url, allHeaders)
	case http.MethodPost:
		resp, err = b.httpClient.Post(ctx, url, data, allHeaders)
	default:
		err = fmt.Errorf("不支持的HTTP方法: %s", method)
	}

	// 记录请求统计
	b.RecordRequest(err == nil, err)

	if err != nil {
		b.logger.Error("HTTP请求失败",
			logger.String("source", b.name),
			logger.String("method", method),
			logger.String("url", url),
			logger.ErrorField("error", err),
		)
		return nil, err
	}

	b.logger.Debug("HTTP请求成功",
		logger.String("source", b.name),
		logger.String("method", method),
		logger.String("url", url),
		logger.Int("response_size", len(resp)),
	)

	return resp, nil
}