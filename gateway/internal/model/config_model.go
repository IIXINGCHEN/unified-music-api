// Package model 配置数据模型
package model

import (
	"time"
)

// AppConfig 应用配置模型
type AppConfig struct {
	Server      ServerConfigModel      `json:"server" yaml:"server"`
	Security    SecurityConfigModel    `json:"security" yaml:"security"`
	Performance PerformanceConfigModel `json:"performance" yaml:"performance"`
	Monitoring  MonitoringConfigModel  `json:"monitoring" yaml:"monitoring"`
	Sources     SourcesConfigModel     `json:"sources" yaml:"sources"`
	// 数据库和Redis配置已移除 - 项目不再使用数据库
}

// ServerConfigModel 服务器配置模型
type ServerConfigModel struct {
	Port          int           `json:"port" yaml:"port"`
	Host          string        `json:"host" yaml:"host"`
	AllowedDomain string        `json:"allowed_domain" yaml:"allowed_domain"`
	ProxyURL      string        `json:"proxy_url" yaml:"proxy_url"`
	EnableFlac    bool          `json:"enable_flac" yaml:"enable_flac"`
	EnableHTTPS   bool          `json:"enable_https" yaml:"enable_https"`
	CertFile      string        `json:"cert_file" yaml:"cert_file"`
	KeyFile       string        `json:"key_file" yaml:"key_file"`
	ReadTimeout   time.Duration `json:"read_timeout" yaml:"read_timeout"`
	WriteTimeout  time.Duration `json:"write_timeout" yaml:"write_timeout"`
	IdleTimeout   time.Duration `json:"idle_timeout" yaml:"idle_timeout"`
}

// SecurityConfigModel 安全配置模型 - 生产环境版本
type SecurityConfigModel struct {
	EnableAuth  bool                `json:"enable_auth" yaml:"enable_auth"`
	JWTSecret   string              `json:"jwt_secret" yaml:"jwt_secret"`
	APIKey      string              `json:"api_key" yaml:"api_key"`
	CORSOrigins []string            `json:"cors_origins" yaml:"cors_origins"`
	TLSEnabled  bool                `json:"tls_enabled" yaml:"tls_enabled"`
	TLSCertFile string              `json:"tls_cert_file" yaml:"tls_cert_file"`
	TLSKeyFile  string              `json:"tls_key_file" yaml:"tls_key_file"`
	APIAuth     *APIAuthConfigModel `json:"api_auth" yaml:"api_auth"`
}

// APIAuthConfigModel API认证配置模型
type APIAuthConfigModel struct {
	Enabled            bool     `json:"enabled" yaml:"enabled"`
	APIKey             string   `json:"api_key" yaml:"api_key"`
	AdminKey           string   `json:"admin_key" yaml:"admin_key"`
	RequireHTTPS       bool     `json:"require_https" yaml:"require_https"`
	EnableRateLimit    bool     `json:"enable_rate_limit" yaml:"enable_rate_limit"`
	RateLimitPerMin    int      `json:"rate_limit_per_min" yaml:"rate_limit_per_min"`
	EnableAuditLog     bool     `json:"enable_audit_log" yaml:"enable_audit_log"`
	WhiteList          []string `json:"white_list" yaml:"white_list"`
	AllowedUserAgent   []string `json:"allowed_user_agent" yaml:"allowed_user_agent"`
}

// PerformanceConfigModel 性能配置模型 - 新架构版本
type PerformanceConfigModel struct {
	MaxConcurrentRequests int                         `json:"max_concurrent_requests" yaml:"max_concurrent_requests"`
	RequestTimeout        time.Duration               `json:"request_timeout" yaml:"request_timeout"`
	RateLimit             RateLimitConfigModel        `json:"rate_limit" yaml:"rate_limit"`
	ConnectionPool        ConnectionPoolConfigModel   `json:"connection_pool" yaml:"connection_pool"`
}

// RateLimitConfigModel 限流配置模型
type RateLimitConfigModel struct {
	Enabled            bool `json:"enabled" yaml:"enabled"`
	RequestsPerMinute  int  `json:"requests_per_minute" yaml:"requests_per_minute"`
	Burst              int  `json:"burst" yaml:"burst"`
}

// ConnectionPoolConfigModel 连接池配置模型
type ConnectionPoolConfigModel struct {
	MaxIdleConns        int           `json:"max_idle_conns" yaml:"max_idle_conns"`
	MaxIdleConnsPerHost int           `json:"max_idle_conns_per_host" yaml:"max_idle_conns_per_host"`
	IdleConnTimeout     time.Duration `json:"idle_conn_timeout" yaml:"idle_conn_timeout"`
}

// MonitoringConfigModel 监控配置模型 - 新架构版本
type MonitoringConfigModel struct {
	Enabled     bool                      `json:"enabled" yaml:"enabled"`
	Metrics     MetricsConfigModel        `json:"metrics" yaml:"metrics"`
	HealthCheck HealthCheckConfigModel    `json:"health_check" yaml:"health_check"`
	Profiling   ProfilingConfigModel      `json:"profiling" yaml:"profiling"`
}

// MetricsConfigModel 指标配置模型
type MetricsConfigModel struct {
	Enabled bool   `json:"enabled" yaml:"enabled"`
	Path    string `json:"path" yaml:"path"`
	Port    int    `json:"port" yaml:"port"`
}

// HealthCheckConfigModel 健康检查配置模型
type HealthCheckConfigModel struct {
	Enabled  bool          `json:"enabled" yaml:"enabled"`
	Path     string        `json:"path" yaml:"path"`
	Interval time.Duration `json:"interval" yaml:"interval"`
}

// ProfilingConfigModel 性能分析配置模型
type ProfilingConfigModel struct {
	Enabled bool   `json:"enabled" yaml:"enabled"`
	Path    string `json:"path" yaml:"path"`
}

// SourcesConfigModel 音源配置模型
type SourcesConfigModel struct {
	// 第三方API配置
	UNMServer   UNMServerConfigModel   `json:"unm_server" yaml:"unm_server"`
	GDStudio    GDStudioConfigModel    `json:"gdstudio" yaml:"gdstudio"`

	// 音乐信息解析器配置
	MusicInfoResolver MusicInfoResolverConfigModel `json:"music_info_resolver" yaml:"music_info_resolver"`

	// 通用配置
	DefaultSources []string      `json:"default_sources" yaml:"default_sources"`
	EnabledSources []string      `json:"enabled_sources" yaml:"enabled_sources"`
	TestSources    []string      `json:"test_sources" yaml:"test_sources"`
	Timeout        time.Duration `json:"timeout" yaml:"timeout"`
	RetryCount     int           `json:"retry_count" yaml:"retry_count"`
}

// UNMServerConfigModel UnblockNeteaseMusic服务器配置模型
type UNMServerConfigModel struct {
	Enabled    bool          `json:"enabled" yaml:"enabled"`
	BaseURL    string        `json:"base_url" yaml:"base_url"`
	APIKey     string        `json:"api_key" yaml:"api_key"`
	Timeout    time.Duration `json:"timeout" yaml:"timeout"`
	RetryCount int           `json:"retry_count" yaml:"retry_count"`
	UserAgent  string        `json:"user_agent" yaml:"user_agent"`
}

// GDStudioConfigModel GDStudio API配置模型
type GDStudioConfigModel struct {
	Enabled    bool          `json:"enabled" yaml:"enabled"`
	BaseURL    string        `json:"base_url" yaml:"base_url"`
	APIKey     string        `json:"api_key" yaml:"api_key"`
	Timeout    time.Duration `json:"timeout" yaml:"timeout"`
	RetryCount int           `json:"retry_count" yaml:"retry_count"`
	UserAgent  string        `json:"user_agent" yaml:"user_agent"`
}

// MusicInfoResolverConfigModel 音乐信息解析器配置模型
type MusicInfoResolverConfigModel struct {
	Enabled        bool                      `json:"enabled" yaml:"enabled"`
	Timeout        time.Duration             `json:"timeout" yaml:"timeout"`
	CacheTTL       time.Duration             `json:"cache_ttl" yaml:"cache_ttl"`
	SearchFallback SearchFallbackConfigModel `json:"search_fallback" yaml:"search_fallback"`
}

// SearchFallbackConfigModel 搜索回退配置模型
type SearchFallbackConfigModel struct {
	Enabled     bool     `json:"enabled" yaml:"enabled"`
	Keywords    []string `json:"keywords" yaml:"keywords"`
	MaxResults  int      `json:"max_results" yaml:"max_results"`
	MaxKeywords int      `json:"max_keywords" yaml:"max_keywords"`
}

// SourceDetailConfigModel 音源详细配置模型
type SourceDetailConfigModel struct {
	BaseURL    string            `json:"base_url" yaml:"base_url"`
	SearchAPI  string            `json:"search_api" yaml:"search_api"`
	MusicAPI   string            `json:"music_api" yaml:"music_api"`
	Headers    map[string]string `json:"headers" yaml:"headers"`
	Enabled    bool              `json:"enabled" yaml:"enabled"`
	Priority   int               `json:"priority" yaml:"priority"`
	RateLimit  int               `json:"rate_limit" yaml:"rate_limit"`
	Qualities  []string          `json:"qualities" yaml:"qualities"`
}

// 数据库和Redis配置模型已移除 - 项目不再使用数据库

// SourceConfigModel 单个音源配置模型
type SourceConfigModel struct {
	Name       string            `json:"name" yaml:"name"`
	Enabled    bool              `json:"enabled" yaml:"enabled"`
	Priority   int               `json:"priority" yaml:"priority"`
	Timeout    time.Duration     `json:"timeout" yaml:"timeout"`
	RetryCount int               `json:"retry_count" yaml:"retry_count"`
	RateLimit  int               `json:"rate_limit" yaml:"rate_limit"`
	Cookie     string            `json:"cookie" yaml:"cookie"`
	Cookies    string            `json:"cookies" yaml:"cookies"`
	APIKey     string            `json:"api_key" yaml:"api_key"`
	ProxyURL   string            `json:"proxy_url" yaml:"proxy_url"`
	Proxy      string            `json:"proxy" yaml:"proxy"`
	UserAgent  string            `json:"user_agent" yaml:"user_agent"`
	Headers    map[string]string `json:"headers" yaml:"headers"`
	Params     map[string]string `json:"params" yaml:"params"`
}

// SourceConfig 音源配置别名（兼容性）
type SourceConfig = SourceConfigModel

// ConfigUpdateRequest 配置更新请求
type ConfigUpdateRequest struct {
	Section string      `json:"section" binding:"required"` // 配置节名称
	Data    interface{} `json:"data" binding:"required"`    // 配置数据
}

// ConfigResponse 配置响应
type ConfigResponse struct {
	Section   string      `json:"section"`   // 配置节名称
	Data      interface{} `json:"data"`      // 配置数据
	UpdatedAt time.Time   `json:"updated_at"` // 更新时间
}

// ConfigValidationResult 配置验证结果
type ConfigValidationResult struct {
	Valid   bool     `json:"valid"`   // 是否有效
	Errors  []string `json:"errors"`  // 错误列表
	Warnings []string `json:"warnings"` // 警告列表
}

// SourceStatus 音源状态
type SourceStatus struct {
	Name         string        `json:"name"`         // 音源名称
	Enabled      bool          `json:"enabled"`      // 是否启用
	Available    bool          `json:"available"`    // 是否可用
	LastCheck    time.Time     `json:"last_check"`   // 最后检查时间
	ResponseTime time.Duration `json:"response_time"` // 响应时间
	ErrorCount   int           `json:"error_count"`  // 错误次数
	LastError    string        `json:"last_error"`   // 最后错误
}

// SystemStatus 系统状态
type SystemStatus struct {
	Version     string         `json:"version"`     // 版本号
	BuildTime   string         `json:"build_time"`  // 构建时间
	GitCommit   string         `json:"git_commit"`  // Git提交
	GoVersion   string         `json:"go_version"`  // Go版本
	StartTime   time.Time      `json:"start_time"`  // 启动时间
	Uptime      time.Duration  `json:"uptime"`      // 运行时间
	Sources     []SourceStatus `json:"sources"`     // 音源状态
	Config      *AppConfig     `json:"config,omitempty"` // 配置信息（敏感信息已脱敏）
}

// ConfigBackup 配置备份
type ConfigBackup struct {
	ID          string     `json:"id"`          // 备份ID
	Name        string     `json:"name"`        // 备份名称
	Description string     `json:"description"` // 备份描述
	Config      *AppConfig `json:"config"`      // 配置内容
	CreatedAt   time.Time  `json:"created_at"`  // 创建时间
	CreatedBy   string     `json:"created_by"`  // 创建者
}

// ConfigDiff 配置差异
type ConfigDiff struct {
	Section string      `json:"section"` // 配置节
	Field   string      `json:"field"`   // 字段名
	OldValue interface{} `json:"old_value"` // 旧值
	NewValue interface{} `json:"new_value"` // 新值
	Action  string      `json:"action"`  // 操作类型：add/update/delete
}

// ConfigChangeLog 配置变更日志
type ConfigChangeLog struct {
	ID        string       `json:"id"`        // 变更ID
	Timestamp time.Time    `json:"timestamp"` // 变更时间
	User      string       `json:"user"`      // 操作用户
	Action    string       `json:"action"`    // 操作类型
	Section   string       `json:"section"`   // 配置节
	Changes   []ConfigDiff `json:"changes"`   // 变更详情
	Reason    string       `json:"reason"`    // 变更原因
}

// GetSafeConfig 获取脱敏后的配置（隐藏敏感信息）
func (c *AppConfig) GetSafeConfig() *AppConfig {
	safe := *c
	
	// 脱敏敏感信息
	safe.Security.JWTSecret = maskSensitive(c.Security.JWTSecret)
	safe.Security.APIKey = maskSensitive(c.Security.APIKey)
	safe.Sources.UNMServer.APIKey = maskSensitive(c.Sources.UNMServer.APIKey)
	safe.Sources.GDStudio.APIKey = maskSensitive(c.Sources.GDStudio.APIKey)
	// 数据库和Redis密码脱敏已移除 - 项目不再使用数据库
	
	return &safe
}

// maskSensitive 脱敏敏感信息
func maskSensitive(value string) string {
	if value == "" {
		return ""
	}
	if len(value) <= 8 {
		return "****"
	}
	return value[:4] + "****" + value[len(value)-4:]
}

// Validate 验证配置
func (c *AppConfig) Validate() *ConfigValidationResult {
	result := &ConfigValidationResult{
		Valid:    true,
		Errors:   make([]string, 0),
		Warnings: make([]string, 0),
	}
	
	// 验证服务器配置
	if c.Server.Port <= 0 || c.Server.Port > 65535 {
		result.Valid = false
		result.Errors = append(result.Errors, "服务器端口必须在1-65535之间")
	}
	
	// 验证安全配置
	if c.Security.JWTSecret == "" || c.Security.JWTSecret == "your-jwt-secret-key-here" {
		result.Valid = false
		result.Errors = append(result.Errors, "JWT密钥不能为空或使用默认值")
	}
	
	if len(c.Security.JWTSecret) < 32 {
		result.Valid = false
		result.Errors = append(result.Errors, "JWT密钥长度不能少于32个字符")
	}
	
	// 验证性能配置
	if c.Performance.MaxConcurrentRequests <= 0 {
		result.Warnings = append(result.Warnings, "最大并发请求数未设置，将使用默认值")
	}
	
	// 验证音源配置
	if len(c.Sources.DefaultSources) == 0 {
		result.Warnings = append(result.Warnings, "未配置默认音源，将使用内置默认值")
	}
	
	return result
}
