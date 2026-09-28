package plugin

import (
	"context"
	"fmt"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// BasePlugin 基础插件实现
type BasePlugin struct {
	name         string
	version      string
	description  string
	dependencies []string
	config       map[string]interface{}
	logger       logger.Logger
	started      bool
}

// NewBasePlugin 创建基础插件
func NewBasePlugin(name, version, description string) *BasePlugin {
	return &BasePlugin{
		name:         name,
		version:      version,
		description:  description,
		dependencies: make([]string, 0),
		started:      false,
	}
}

// Name 返回插件名称
func (p *BasePlugin) Name() string {
	return p.name
}

// Version 返回插件版本
func (p *BasePlugin) Version() string {
	return p.version
}

// Description 返回插件描述
func (p *BasePlugin) Description() string {
	return p.description
}

// Dependencies 返回插件依赖
func (p *BasePlugin) Dependencies() []string {
	return p.dependencies
}

// SetDependencies 设置插件依赖
func (p *BasePlugin) SetDependencies(deps []string) {
	p.dependencies = deps
}

// Initialize 初始化插件
func (p *BasePlugin) Initialize(ctx context.Context, config map[string]interface{}, logger logger.Logger) error {
	p.config = config
	p.logger = logger
	
	if p.logger != nil {
		p.logger.Info("插件初始化完成: " + p.name + " v" + p.version)
	}
	
	return nil
}

// Start 启动插件
func (p *BasePlugin) Start(ctx context.Context) error {
	if p.started {
		return nil
	}
	
	p.started = true
	
	if p.logger != nil {
		p.logger.Info("插件启动: " + p.name)
	}
	
	return nil
}

// Stop 停止插件
func (p *BasePlugin) Stop(ctx context.Context) error {
	if !p.started {
		return nil
	}
	
	p.started = false
	
	if p.logger != nil {
		p.logger.Info("插件停止",
			logger.String("name", p.name),
		)
	}
	
	return nil
}

// Health 健康检查
func (p *BasePlugin) Health(ctx context.Context) error {
	if !p.started {
		return fmt.Errorf("插件未启动")
	}
	return nil
}

// IsStarted 检查插件是否已启动
func (p *BasePlugin) IsStarted() bool {
	return p.started
}

// GetConfig 获取配置
func (p *BasePlugin) GetConfig() map[string]interface{} {
	return p.config
}

// GetConfigString 获取字符串配置
func (p *BasePlugin) GetConfigString(key string, defaultValue string) string {
	if p.config == nil {
		return defaultValue
	}
	
	if value, exists := p.config[key]; exists {
		if str, ok := value.(string); ok {
			return str
		}
	}
	
	return defaultValue
}

// GetConfigInt 获取整数配置
func (p *BasePlugin) GetConfigInt(key string, defaultValue int) int {
	if p.config == nil {
		return defaultValue
	}
	
	if value, exists := p.config[key]; exists {
		switch v := value.(type) {
		case int:
			return v
		case int64:
			return int(v)
		case float64:
			return int(v)
		}
	}
	
	return defaultValue
}

// GetConfigBool 获取布尔配置
func (p *BasePlugin) GetConfigBool(key string, defaultValue bool) bool {
	if p.config == nil {
		return defaultValue
	}
	
	if value, exists := p.config[key]; exists {
		if b, ok := value.(bool); ok {
			return b
		}
	}
	
	return defaultValue
}

// GetConfigDuration 获取时间间隔配置
func (p *BasePlugin) GetConfigDuration(key string, defaultValue time.Duration) time.Duration {
	if p.config == nil {
		return defaultValue
	}
	
	if value, exists := p.config[key]; exists {
		switch v := value.(type) {
		case string:
			if duration, err := time.ParseDuration(v); err == nil {
				return duration
			}
		case time.Duration:
			return v
		}
	}
	
	return defaultValue
}

// GetLogger 获取日志器
func (p *BasePlugin) GetLogger() logger.Logger {
	return p.logger
}

// BaseSourcePlugin 基础音源插件实现
type BaseSourcePlugin struct {
	*BasePlugin
	enabled    bool
	priority   int
	qualities  []string
	rateLimit  RateLimit
}

// NewBaseSourcePlugin 创建基础音源插件
func NewBaseSourcePlugin(name, version, description string) *BaseSourcePlugin {
	return &BaseSourcePlugin{
		BasePlugin: NewBasePlugin(name, version, description),
		enabled:    true,
		priority:   100,
		qualities:  []string{"128k", "320k", "flac"},
		rateLimit: RateLimit{
			RequestsPerSecond: 10,
			RequestsPerMinute: 600,
			RequestsPerHour:   3600,
			BurstSize:         20,
			Timeout:           30 * time.Second,
		},
	}
}

// IsEnabled 检查音源是否启用
func (p *BaseSourcePlugin) IsEnabled() bool {
	return p.enabled && p.started
}

// SetEnabled 设置音源启用状态
func (p *BaseSourcePlugin) SetEnabled(enabled bool) {
	p.enabled = enabled
}

// GetPriority 获取音源优先级
func (p *BaseSourcePlugin) GetPriority() int {
	return p.priority
}

// SetPriority 设置音源优先级
func (p *BaseSourcePlugin) SetPriority(priority int) {
	p.priority = priority
}

// GetSupportedQualities 获取支持的音质列表
func (p *BaseSourcePlugin) GetSupportedQualities() []string {
	return p.qualities
}

// SetSupportedQualities 设置支持的音质列表
func (p *BaseSourcePlugin) SetSupportedQualities(qualities []string) {
	p.qualities = qualities
}

// GetRateLimit 获取速率限制配置
func (p *BaseSourcePlugin) GetRateLimit() RateLimit {
	return p.rateLimit
}

// SetRateLimit 设置速率限制配置
func (p *BaseSourcePlugin) SetRateLimit(rateLimit RateLimit) {
	p.rateLimit = rateLimit
}

// Initialize 初始化音源插件
func (p *BaseSourcePlugin) Initialize(ctx context.Context, config map[string]interface{}, logger logger.Logger) error {
	// 调用基础初始化
	if err := p.BasePlugin.Initialize(ctx, config, logger); err != nil {
		return err
	}
	
	// 从配置中读取音源特定设置
	p.enabled = p.GetConfigBool("enabled", true)
	p.priority = p.GetConfigInt("priority", 100)
	
	// 读取支持的音质
	if qualities, exists := config["qualities"]; exists {
		if qualityList, ok := qualities.([]interface{}); ok {
			p.qualities = make([]string, len(qualityList))
			for i, q := range qualityList {
				if quality, ok := q.(string); ok {
					p.qualities[i] = quality
				}
			}
		}
	}
	
	// 读取速率限制配置
	if rateLimitConfig, exists := config["rate_limit"]; exists {
		if rlMap, ok := rateLimitConfig.(map[string]interface{}); ok {
			if rps, exists := rlMap["requests_per_second"]; exists {
				if rpsInt, ok := rps.(int); ok {
					p.rateLimit.RequestsPerSecond = rpsInt
				}
			}
			if rpm, exists := rlMap["requests_per_minute"]; exists {
				if rpmInt, ok := rpm.(int); ok {
					p.rateLimit.RequestsPerMinute = rpmInt
				}
			}
			if rph, exists := rlMap["requests_per_hour"]; exists {
				if rphInt, ok := rph.(int); ok {
					p.rateLimit.RequestsPerHour = rphInt
				}
			}
			if burst, exists := rlMap["burst_size"]; exists {
				if burstInt, ok := burst.(int); ok {
					p.rateLimit.BurstSize = burstInt
				}
			}
			if timeout, exists := rlMap["timeout"]; exists {
				if timeoutStr, ok := timeout.(string); ok {
					if duration, err := time.ParseDuration(timeoutStr); err == nil {
						p.rateLimit.Timeout = duration
					}
				}
			}
		}
	}
	
	return nil
}
