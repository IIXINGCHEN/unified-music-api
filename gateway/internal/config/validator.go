// Package config 配置验证器
package config

import (
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// ConfigValidator 配置验证器接口
type ConfigValidator interface {
	Validate(config *Config) error
}

// Validator 配置验证器 - 重构为更强大的版本
type Validator struct{
	logger logger.Logger
}

// NewValidator 创建配置验证器（保持向后兼容）
func NewValidator() *Validator {
	return &Validator{}
}

// NewValidatorWithLogger 创建带日志的配置验证器
func NewValidatorWithLogger(log logger.Logger) *Validator {
	return &Validator{logger: log}
}

// NewConfigValidator 创建配置验证器（新接口）
func NewConfigValidator() ConfigValidator {
	return &Validator{}
}

// Validate 验证配置
func (v *Validator) Validate(config *Config) error {
	if err := v.validateApp(&config.App); err != nil {
		return fmt.Errorf("应用配置验证失败: %w", err)
	}

	if err := v.validateServer(&config.Server); err != nil {
		return fmt.Errorf("服务器配置验证失败: %w", err)
	}

	if err := v.validateLogging(&config.Logging); err != nil {
		return fmt.Errorf("日志配置验证失败: %w", err)
	}

	if err := v.validateSecurity(&config.Security); err != nil {
		return fmt.Errorf("安全配置验证失败: %w", err)
	}

	if err := v.validatePerformance(&config.Performance); err != nil {
		return fmt.Errorf("性能配置验证失败: %w", err)
	}

	if err := v.validateSources(&config.Sources); err != nil {
		return fmt.Errorf("音源配置验证失败: %w", err)
	}

	if err := v.validateCache(&config.Cache); err != nil {
		return fmt.Errorf("缓存配置验证失败: %w", err)
	}

	if err := v.validatePlugins(&config.Plugins); err != nil {
		return fmt.Errorf("插件配置验证失败: %w", err)
	}

	if err := v.validateRoutes(&config.Routes); err != nil {
		return fmt.Errorf("路由配置验证失败: %w", err)
	}
	
	if err := v.validateMonitoring(&config.Monitoring); err != nil {
		return fmt.Errorf("监控配置验证失败: %w", err)
	}

	// 注意：项目不需要数据库和Redis，所以跳过这些验证
	
	return nil
}

// validateServer 验证服务器配置
func (v *Validator) validateServer(config *ServerConfig) error {
	// 验证端口
	if config.Port <= 0 || config.Port > 65535 {
		return fmt.Errorf("端口号必须在1-65535之间，当前值: %d", config.Port)
	}
	
	// 验证主机地址
	if config.Host == "" {
		config.Host = "0.0.0.0"
	}
	
	// 验证允许的域名
	if config.AllowedDomain == "" {
		config.AllowedDomain = "*"
	}
	
	// 验证代理URL
	if config.ProxyURL != "" {
		if _, err := url.Parse(config.ProxyURL); err != nil {
			return fmt.Errorf("代理URL格式无效: %s", config.ProxyURL)
		}
	}
	
	// 验证超时配置
	if config.ReadTimeout <= 0 {
		config.ReadTimeout = 30 * time.Second
	}
	if config.WriteTimeout <= 0 {
		config.WriteTimeout = 30 * time.Second
	}
	if config.IdleTimeout <= 0 {
		config.IdleTimeout = 60 * time.Second
	}
	
	return nil
}

// validateSecurity 验证安全配置
func (v *Validator) validateSecurity(config *SecurityConfig) error {
	// 生产环境安全配置验证
	if config.EnableAuth {
		// JWT密钥验证（如果使用JWT）
		if config.JWTSecret != "" {
			if config.JWTSecret == "your-jwt-secret-key-here" {
				return fmt.Errorf("生产环境不能使用默认JWT密钥")
			}
			if len(config.JWTSecret) < 32 {
				return fmt.Errorf("JWT密钥长度不能少于32个字符")
			}
		}

		// API认证配置验证
		if config.APIAuth != nil {
			if config.APIAuth.Enabled {
				if config.APIAuth.APIKey == "" || config.APIAuth.APIKey == "music-api-proxy-key-2024" {
					// 生产环境警告但不阻止启动
					if v.logger != nil {
						v.logger.Warn("生产环境建议修改默认API密钥")
					}
				}
				if config.APIAuth.AdminKey == "" || config.APIAuth.AdminKey == "music-api-admin-key-2024" {
					// 生产环境警告但不阻止启动
					if v.logger != nil {
						v.logger.Warn("生产环境建议修改默认管理员密钥")
					}
				}
			}
		}
	}
	
	// 验证CORS源
	if len(config.CORSOrigins) == 0 {
		config.CORSOrigins = []string{"*"}
	}
	
	// 验证TLS配置
	if config.TLSEnabled {
		if config.TLSCertFile == "" {
			return fmt.Errorf("启用TLS时必须指定证书文件")
		}
		if config.TLSKeyFile == "" {
			return fmt.Errorf("启用TLS时必须指定私钥文件")
		}
	}
	
	return nil
}

// validatePerformance 验证性能配置 - 新架构版本
func (v *Validator) validatePerformance(config *PerformanceConfig) error {
	// 验证最大并发请求数
	if config.MaxConcurrentRequests <= 0 {
		return fmt.Errorf("最大并发请求数必须大于0")
	}
	if config.MaxConcurrentRequests > 10000 {
		return fmt.Errorf("最大并发请求数不能超过10000，当前值: %d", config.MaxConcurrentRequests)
	}

	// 验证请求超时时间
	if config.RequestTimeout <= 0 {
		return fmt.Errorf("请求超时时间必须大于0")
	}
	if config.RequestTimeout > 5*time.Minute {
		return fmt.Errorf("请求超时时间不能超过5分钟，当前值: %v", config.RequestTimeout)
	}

	// 验证限流配置
	if config.RateLimit.Enabled {
		if config.RateLimit.RequestsPerMinute <= 0 {
			return fmt.Errorf("限流每分钟请求数必须大于0")
		}
		if config.RateLimit.Burst <= 0 {
			return fmt.Errorf("限流突发请求数必须大于0")
		}
	}

	if config.ConnectionPool.MaxIdleConns <= 0 {
		return fmt.Errorf("连接池最大空闲连接数必须大于0")
	}
	if config.ConnectionPool.MaxIdleConnsPerHost <= 0 {
		return fmt.Errorf("连接池每主机最大空闲连接数必须大于0")
	}
	if config.ConnectionPool.IdleConnTimeout <= 0 {
		return fmt.Errorf("连接池空闲连接超时时间必须大于0")
	}

	return nil
}

// validateMonitoring 验证监控配置 - 新架构版本
func (v *Validator) validateMonitoring(config *MonitoringConfig) error {
	// 验证指标配置
	if config.Metrics.Enabled {
		if config.Metrics.Port <= 0 || config.Metrics.Port > 65535 {
			return fmt.Errorf("指标端口号必须在1-65535之间，当前值: %d", config.Metrics.Port)
		}
		if config.Metrics.Path == "" {
			return fmt.Errorf("指标路径不能为空")
		}
	}

	// 验证健康检查配置
	if config.HealthCheck.Enabled {
		if config.HealthCheck.Path == "" {
			return fmt.Errorf("健康检查路径不能为空")
		}
		if config.HealthCheck.Interval <= 0 {
			return fmt.Errorf("健康检查间隔必须大于0")
		}
	}

	if config.Profiling.Enabled {
		if config.Profiling.Path == "" {
			return fmt.Errorf("性能分析路径不能为空")
		}
		if !strings.HasPrefix(config.Profiling.Path, "/") {
			return fmt.Errorf("性能分析路径必须以/开头")
		}
	}

	return nil
}

// validateSources 验证音源配置
func (v *Validator) validateSources(config *SourcesConfig) error {
	// 验证默认音源
	if len(config.DefaultSources) == 0 {
		config.DefaultSources = []string{"pyncmd", "kuwo", "bilibili", "migu", "kugou", "qq", "youtube", "youtube-dl", "yt-dlp"}
	}
	
	// 验证测试音源
	if len(config.TestSources) == 0 {
		config.TestSources = []string{"kugou", "qq", "migu", "netease"}
	}
	
	// 验证超时时间
	if config.Timeout <= 0 {
		config.Timeout = 30 * time.Second
	}
	
	// 验证重试次数
	if config.RetryCount < 0 {
		config.RetryCount = 3
	}
	if config.RetryCount > 10 {
		return fmt.Errorf("重试次数不能超过10次，当前值: %d", config.RetryCount)
	}
	
	return nil
}

// 数据库和Redis验证函数已移除 - 项目不再使用数据库

// validateApp 验证应用配置
func (v *Validator) validateApp(app *AppConfig) error {
	if app.Name == "" {
		return fmt.Errorf("应用名称不能为空")
	}

	if app.Version == "" {
		return fmt.Errorf("应用版本不能为空")
	}

	validModes := []string{"development", "staging", "production"}
	if !contains(validModes, app.Mode) {
		return fmt.Errorf("无效的应用模式: %s，支持的模式: %s", app.Mode, strings.Join(validModes, ", "))
	}

	return nil
}

// validateLogging 验证日志配置
func (v *Validator) validateLogging(logging *LoggingConfig) error {
	validLevels := []string{"debug", "info", "warn", "error", "fatal"}
	if !contains(validLevels, logging.Level) {
		return fmt.Errorf("无效的日志级别: %s，支持的级别: %s", logging.Level, strings.Join(validLevels, ", "))
	}

	validFormats := []string{"json", "text"}
	if !contains(validFormats, logging.Format) {
		return fmt.Errorf("无效的日志格式: %s，支持的格式: %s", logging.Format, strings.Join(validFormats, ", "))
	}

	validOutputs := []string{"stdout", "stderr", "file"}
	if !contains(validOutputs, logging.Output) {
		return fmt.Errorf("无效的日志输出: %s，支持的输出: %s", logging.Output, strings.Join(validOutputs, ", "))
	}

	// 如果输出到文件，检查文件路径
	if logging.Output == "file" && logging.File == "" {
		return fmt.Errorf("日志输出为文件时，文件路径不能为空")
	}

	return nil
}

// validateCache 验证缓存配置
func (v *Validator) validateCache(cache *CacheConfig) error {
	if cache.Enabled {
		validTypes := []string{"memory"}  // 只支持内存缓存
		if !contains(validTypes, cache.Type) {
			return fmt.Errorf("无效的缓存类型: %s，支持的类型: %s", cache.Type, strings.Join(validTypes, ", "))
		}

		if cache.TTL <= 0 {
			return fmt.Errorf("缓存TTL必须大于0")
		}

		if cache.MaxSize == "" {
			return fmt.Errorf("缓存最大大小不能为空")
		}
	}

	return nil
}

// validatePlugins 验证插件配置
func (v *Validator) validatePlugins(plugins *PluginsConfig) error {
	// 验证中间件插件
	for _, middleware := range plugins.Middleware {
		if middleware.Name == "" {
			return fmt.Errorf("中间件插件名称不能为空")
		}
	}

	// 验证音源插件
	for _, source := range plugins.Sources {
		if source.Name == "" {
			return fmt.Errorf("音源插件名称不能为空")
		}
	}

	return nil
}

// validateRoutes 验证路由配置
func (v *Validator) validateRoutes(routes *RoutesConfig) error {
	if routes.APIPrefix == "" {
		return fmt.Errorf("API前缀不能为空")
	}

	// 验证端点配置
	for name, endpoint := range routes.Endpoints {
		if endpoint.Path == "" {
			return fmt.Errorf("端点 %s 的路径不能为空", name)
		}

		if len(endpoint.Methods) == 0 {
			return fmt.Errorf("端点 %s 的HTTP方法不能为空", name)
		}

		// 验证HTTP方法
		validMethods := []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"}
		for _, method := range endpoint.Methods {
			if !contains(validMethods, method) {
				return fmt.Errorf("端点 %s 包含无效的HTTP方法: %s", name, method)
			}
		}
	}

	return nil
}

// contains 检查切片是否包含指定元素
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// ValidateConfig 便捷函数：验证配置
func ValidateConfig(config *Config) error {
	validator := NewValidator()
	return validator.Validate(config)
}
