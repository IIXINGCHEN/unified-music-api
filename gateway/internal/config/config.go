// Package config 配置管理
package config

import (
	"fmt"
	"time"
)

// Config 应用配置结构体 - 重构为支持新架构
type Config struct {
	App        AppConfig        `json:"app" yaml:"app" mapstructure:"app"`
	Server     ServerConfig     `json:"server" yaml:"server" mapstructure:"server"`
	Logging    LoggingConfig    `json:"logging" yaml:"logging" mapstructure:"logging"`
	Security   SecurityConfig   `json:"security" yaml:"security" mapstructure:"security"`
	Performance PerformanceConfig `json:"performance" yaml:"performance" mapstructure:"performance"`
	Monitoring MonitoringConfig `json:"monitoring" yaml:"monitoring" mapstructure:"monitoring"`
	Sources    SourcesConfig    `json:"sources" yaml:"sources" mapstructure:"sources"`
	Cache      CacheConfig      `json:"cache" yaml:"cache" mapstructure:"cache"`
	// 数据库和Redis配置已移除 - 项目不再使用数据库
	HTTPClient HTTPClientConfig `json:"http_client" yaml:"http_client" mapstructure:"http_client"`
	Middleware MiddlewareConfig `json:"middleware" yaml:"middleware" mapstructure:"middleware"`
	Plugins    PluginsConfig    `json:"plugins" yaml:"plugins" mapstructure:"plugins"`
	Routes     RoutesConfig     `json:"routes" yaml:"routes" mapstructure:"routes"`
}

// AppConfig 应用配置
type AppConfig struct {
	Name        string `json:"name" yaml:"name" mapstructure:"name"`
	Version     string `json:"version" yaml:"version" mapstructure:"version"`
	Mode        string `json:"mode" yaml:"mode" mapstructure:"mode"`
	Description string `json:"description" yaml:"description" mapstructure:"description"`
	Debug       bool   `json:"debug" yaml:"debug" mapstructure:"debug"`
}

// LoggingConfig 日志配置
type LoggingConfig struct {
	Level            string `json:"level" yaml:"level" mapstructure:"level"`
	Format           string `json:"format" yaml:"format" mapstructure:"format"`
	Output           string `json:"output" yaml:"output" mapstructure:"output"`
	File             string `json:"file" yaml:"file" mapstructure:"file"`
	EnableCaller     bool   `json:"enable_caller" yaml:"enable_caller" mapstructure:"enable_caller"`
	EnableStacktrace bool   `json:"enable_stacktrace" yaml:"enable_stacktrace" mapstructure:"enable_stacktrace"`
}

// CacheConfig 缓存配置
type CacheConfig struct {
	Enabled         bool          `json:"enabled" yaml:"enabled" mapstructure:"enabled"`
	Type            string        `json:"type" yaml:"type" mapstructure:"type"`
	TTL             time.Duration `json:"ttl" yaml:"ttl" mapstructure:"ttl"`
	MaxSize         string        `json:"max_size" yaml:"max_size" mapstructure:"max_size"`
	CleanupInterval time.Duration `json:"cleanup_interval" yaml:"cleanup_interval" mapstructure:"cleanup_interval"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port         int           `json:"port" yaml:"port" mapstructure:"port"`
	Host         string        `json:"host" yaml:"host" mapstructure:"host"`
	AllowedDomain string       `json:"allowed_domain" yaml:"allowed_domain" mapstructure:"allowed_domain"`
	ProxyURL     string        `json:"proxy_url" yaml:"proxy_url" mapstructure:"proxy_url"`
	EnableFlac   bool          `json:"enable_flac" yaml:"enable_flac" mapstructure:"enable_flac"`
	EnableHTTPS  bool          `json:"enable_https" yaml:"enable_https" mapstructure:"enable_https"`
	CertFile     string        `json:"cert_file" yaml:"cert_file" mapstructure:"cert_file"`
	KeyFile      string        `json:"key_file" yaml:"key_file" mapstructure:"key_file"`
	ReadTimeout  time.Duration `json:"read_timeout" yaml:"read_timeout" mapstructure:"read_timeout"`
	WriteTimeout time.Duration `json:"write_timeout" yaml:"write_timeout" mapstructure:"write_timeout"`
	IdleTimeout  time.Duration `json:"idle_timeout" yaml:"idle_timeout" mapstructure:"idle_timeout"`
}

// SecurityConfig 安全配置
type SecurityConfig struct {
	EnableAuth   bool     `json:"enable_auth" yaml:"enable_auth" mapstructure:"enable_auth"`
	JWTSecret    string   `json:"jwt_secret" yaml:"jwt_secret" mapstructure:"jwt_secret"`
	APIKey       string   `json:"api_key" yaml:"api_key" mapstructure:"api_key"`
	CORSOrigins  []string `json:"cors_origins" yaml:"cors_origins" mapstructure:"cors_origins"`
	TLSEnabled   bool     `json:"tls_enabled" yaml:"tls_enabled" mapstructure:"tls_enabled"`
	TLSCertFile  string   `json:"tls_cert_file" yaml:"tls_cert_file" mapstructure:"tls_cert_file"`
	TLSKeyFile   string   `json:"tls_key_file" yaml:"tls_key_file" mapstructure:"tls_key_file"`

	// API认证配置
	APIAuth *APIAuthConfig `json:"api_auth" yaml:"api_auth" mapstructure:"api_auth"`

	// 安全头配置
	EnableHSTS             bool     `json:"enable_hsts" yaml:"enable_hsts" mapstructure:"enable_hsts"`
	HSTSMaxAge             int      `json:"hsts_max_age" yaml:"hsts_max_age" mapstructure:"hsts_max_age"`
	HSTSIncludeSubdomains  bool     `json:"hsts_include_subdomains" yaml:"hsts_include_subdomains" mapstructure:"hsts_include_subdomains"`
	EnableContentTypeNoSniff bool   `json:"enable_content_type_no_sniff" yaml:"enable_content_type_no_sniff" mapstructure:"enable_content_type_no_sniff"`
	EnableFrameOptions     bool     `json:"enable_frame_options" yaml:"enable_frame_options" mapstructure:"enable_frame_options"`
	FrameOptionsValue      string   `json:"frame_options_value" yaml:"frame_options_value" mapstructure:"frame_options_value"`
	EnableXSSProtection    bool     `json:"enable_xss_protection" yaml:"enable_xss_protection" mapstructure:"enable_xss_protection"`
	EnableReferrerPolicy   bool     `json:"enable_referrer_policy" yaml:"enable_referrer_policy" mapstructure:"enable_referrer_policy"`
	ReferrerPolicyValue    string   `json:"referrer_policy_value" yaml:"referrer_policy_value" mapstructure:"referrer_policy_value"`
	EnableCSP              bool     `json:"enable_csp" yaml:"enable_csp" mapstructure:"enable_csp"`
	CSPDirectives          string   `json:"csp_directives" yaml:"csp_directives" mapstructure:"csp_directives"`
	AllowedIPs             []string `json:"allowed_ips" yaml:"allowed_ips" mapstructure:"allowed_ips"`
	BlockedUserAgents      []string `json:"blocked_user_agents" yaml:"blocked_user_agents" mapstructure:"blocked_user_agents"`
	MaxRequestSize         int64    `json:"max_request_size" yaml:"max_request_size" mapstructure:"max_request_size"`
}

// PerformanceConfig 性能配置 - 新架构版本
type PerformanceConfig struct {
	MaxConcurrentRequests int                    `json:"max_concurrent_requests" yaml:"max_concurrent_requests" mapstructure:"max_concurrent_requests"`
	RequestTimeout        time.Duration          `json:"request_timeout" yaml:"request_timeout" mapstructure:"request_timeout"`
	RateLimit             RateLimitConfig        `json:"rate_limit" yaml:"rate_limit" mapstructure:"rate_limit"`
	ConnectionPool        ConnectionPoolConfig   `json:"connection_pool" yaml:"connection_pool" mapstructure:"connection_pool"`
}

// RateLimitConfig 限流配置
type RateLimitConfig struct {
	Enabled            bool `json:"enabled" yaml:"enabled" mapstructure:"enabled"`
	RequestsPerMinute  int  `json:"requests_per_minute" yaml:"requests_per_minute" mapstructure:"requests_per_minute"`
	Burst              int  `json:"burst" yaml:"burst" mapstructure:"burst"`
}

// ConnectionPoolConfig 连接池配置
type ConnectionPoolConfig struct {
	MaxIdleConns        int           `json:"max_idle_conns" yaml:"max_idle_conns" mapstructure:"max_idle_conns"`
	MaxIdleConnsPerHost int           `json:"max_idle_conns_per_host" yaml:"max_idle_conns_per_host" mapstructure:"max_idle_conns_per_host"`
	IdleConnTimeout     time.Duration `json:"idle_conn_timeout" yaml:"idle_conn_timeout" mapstructure:"idle_conn_timeout"`
}

// MonitoringConfig 监控配置 - 新架构版本
type MonitoringConfig struct {
	Enabled     bool                `json:"enabled" yaml:"enabled" mapstructure:"enabled"`
	Metrics     MetricsConfig       `json:"metrics" yaml:"metrics" mapstructure:"metrics"`
	HealthCheck HealthCheckConfig   `json:"health_check" yaml:"health_check" mapstructure:"health_check"`
	Profiling   ProfilingConfig     `json:"profiling" yaml:"profiling" mapstructure:"profiling"`
}

// MetricsConfig 指标配置
type MetricsConfig struct {
	Enabled bool   `json:"enabled" yaml:"enabled" mapstructure:"enabled"`
	Path    string `json:"path" yaml:"path" mapstructure:"path"`
	Port    int    `json:"port" yaml:"port" mapstructure:"port"`
}

// HealthCheckConfig 健康检查配置
type HealthCheckConfig struct {
	Enabled  bool          `json:"enabled" yaml:"enabled" mapstructure:"enabled"`
	Path     string        `json:"path" yaml:"path" mapstructure:"path"`
	Interval time.Duration `json:"interval" yaml:"interval" mapstructure:"interval"`
}

// ProfilingConfig 性能分析配置
type ProfilingConfig struct {
	Enabled bool   `json:"enabled" yaml:"enabled" mapstructure:"enabled"`
	Path    string `json:"path" yaml:"path" mapstructure:"path"`
}

// SourcesConfig 音源配置
type SourcesConfig struct {
	// 第三方API配置
	UNMServer   UNMServerConfig   `json:"unm_server" yaml:"unm_server" mapstructure:"unm_server"`
	GDStudio    GDStudioConfig    `json:"gdstudio" yaml:"gdstudio" mapstructure:"gdstudio"`

	// 音乐信息解析器配置
	MusicInfoResolver MusicInfoResolverConfig `json:"music_info_resolver" yaml:"music_info_resolver" mapstructure:"music_info_resolver"`

	// 通用配置
	DefaultSources []string `json:"default_sources" yaml:"default_sources" mapstructure:"default_sources"`
	EnabledSources []string `json:"enabled_sources" yaml:"enabled_sources" mapstructure:"enabled_sources"`
	TestSources    []string `json:"test_sources" yaml:"test_sources" mapstructure:"test_sources"`
	Timeout       time.Duration `json:"timeout" yaml:"timeout" mapstructure:"timeout"`
	RetryCount    int      `json:"retry_count" yaml:"retry_count" mapstructure:"retry_count"`
}

// UNMServerConfig UnblockNeteaseMusic服务器配置
type UNMServerConfig struct {
	Enabled    bool          `json:"enabled" yaml:"enabled" mapstructure:"enabled"`
	BaseURL    string        `json:"base_url" yaml:"base_url" mapstructure:"base_url"`
	APIKey     string        `json:"api_key" yaml:"api_key" mapstructure:"api_key"`
	Timeout    time.Duration `json:"timeout" yaml:"timeout" mapstructure:"timeout"`
	RetryCount int           `json:"retry_count" yaml:"retry_count" mapstructure:"retry_count"`
	UserAgent  string        `json:"user_agent" yaml:"user_agent" mapstructure:"user_agent"`
}

// GDStudioConfig GDStudio API配置
type GDStudioConfig struct {
	Enabled    bool          `json:"enabled" yaml:"enabled" mapstructure:"enabled"`
	BaseURL    string        `json:"base_url" yaml:"base_url" mapstructure:"base_url"`
	APIKey     string        `json:"api_key" yaml:"api_key" mapstructure:"api_key"`
	Timeout    time.Duration `json:"timeout" yaml:"timeout" mapstructure:"timeout"`
	RetryCount int           `json:"retry_count" yaml:"retry_count" mapstructure:"retry_count"`
	UserAgent  string        `json:"user_agent" yaml:"user_agent" mapstructure:"user_agent"`
}

// MusicInfoResolverConfig 音乐信息解析器配置
type MusicInfoResolverConfig struct {
	Enabled        bool                 `json:"enabled" yaml:"enabled" mapstructure:"enabled"`
	Timeout        time.Duration        `json:"timeout" yaml:"timeout" mapstructure:"timeout"`
	CacheTTL       time.Duration        `json:"cache_ttl" yaml:"cache_ttl" mapstructure:"cache_ttl"`
	SearchFallback SearchFallbackConfig `json:"search_fallback" yaml:"search_fallback" mapstructure:"search_fallback"`
}

// SearchFallbackConfig 搜索回退配置
type SearchFallbackConfig struct {
	Enabled     bool     `json:"enabled" yaml:"enabled" mapstructure:"enabled"`
	Keywords    []string `json:"keywords" yaml:"keywords" mapstructure:"keywords"`
	MaxResults  int      `json:"max_results" yaml:"max_results" mapstructure:"max_results"`
	MaxKeywords int      `json:"max_keywords" yaml:"max_keywords" mapstructure:"max_keywords"`
}

// 数据库和Redis配置结构已移除 - 项目不再使用数据库

// HTTPClientConfig HTTP客户端配置
type HTTPClientConfig struct {
	UserAgent           string        `json:"user_agent" yaml:"user_agent" mapstructure:"user_agent"`
	Timeout             time.Duration `json:"timeout" yaml:"timeout" mapstructure:"timeout"`
	MaxIdleConns        int           `json:"max_idle_conns" yaml:"max_idle_conns" mapstructure:"max_idle_conns"`
	MaxIdleConnsPerHost int           `json:"max_idle_conns_per_host" yaml:"max_idle_conns_per_host" mapstructure:"max_idle_conns_per_host"`
	IdleConnTimeout     time.Duration `json:"idle_conn_timeout" yaml:"idle_conn_timeout" mapstructure:"idle_conn_timeout"`
	DisableCompression  bool          `json:"disable_compression" yaml:"disable_compression" mapstructure:"disable_compression"`
	MaxRetries          int           `json:"max_retries" yaml:"max_retries" mapstructure:"max_retries"`
	RetryDelay          time.Duration `json:"retry_delay" yaml:"retry_delay" mapstructure:"retry_delay"`
}

// MiddlewareConfig 中间件配置
type MiddlewareConfig struct {
	// 日志中间件配置
	Logging LoggingMiddlewareConfig `json:"logging" yaml:"logging" mapstructure:"logging"`

	// 指标中间件配置
	Metrics MetricsMiddlewareConfig `json:"metrics" yaml:"metrics" mapstructure:"metrics"`
}

// LoggingMiddlewareConfig 日志中间件配置
type LoggingMiddlewareConfig struct {
	SkipPaths       []string `json:"skip_paths" yaml:"skip_paths" mapstructure:"skip_paths"`
	LogRequestBody  bool     `json:"log_request_body" yaml:"log_request_body" mapstructure:"log_request_body"`
	LogResponseBody bool     `json:"log_response_body" yaml:"log_response_body" mapstructure:"log_response_body"`
	MaxBodySize     int64    `json:"max_body_size" yaml:"max_body_size" mapstructure:"max_body_size"`
}

// MetricsMiddlewareConfig 指标中间件配置
type MetricsMiddlewareConfig struct {
	SkipPaths     []string `json:"skip_paths" yaml:"skip_paths" mapstructure:"skip_paths"`
	RecordBody    bool     `json:"record_body" yaml:"record_body" mapstructure:"record_body"`
	PathNormalize bool     `json:"path_normalize" yaml:"path_normalize" mapstructure:"path_normalize"`
}

// GetAddr 获取服务器地址
func (c *ServerConfig) GetAddr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

// 数据库和Redis相关方法已移除 - 项目不再使用数据库

// PluginsConfig 插件配置
type PluginsConfig struct {
	Enabled    []string                   `json:"enabled" yaml:"enabled" mapstructure:"enabled"`
	ConfigPath string                     `json:"config_path" yaml:"config_path" mapstructure:"config_path"`
	Middleware []PluginMiddlewareConfig   `json:"middleware" yaml:"middleware" mapstructure:"middleware"`
	Sources    []PluginSourceConfig       `json:"sources" yaml:"sources" mapstructure:"sources"`
}

// PluginMiddlewareConfig 中间件插件配置
type PluginMiddlewareConfig struct {
	Name    string                 `json:"name" yaml:"name" mapstructure:"name"`
	Enabled bool                   `json:"enabled" yaml:"enabled" mapstructure:"enabled"`
	Config  map[string]interface{} `json:"config" yaml:"config" mapstructure:"config"`
}

// PluginSourceConfig 音源插件配置
type PluginSourceConfig struct {
	Name    string                 `json:"name" yaml:"name" mapstructure:"name"`
	Enabled bool                   `json:"enabled" yaml:"enabled" mapstructure:"enabled"`
	Config  map[string]interface{} `json:"config" yaml:"config" mapstructure:"config"`
}

// RoutesConfig 路由配置
type RoutesConfig struct {
	APIPrefix string                    `json:"api_prefix" yaml:"api_prefix" mapstructure:"api_prefix"`
	Endpoints map[string]EndpointConfig `json:"endpoints" yaml:"endpoints" mapstructure:"endpoints"`
}

// EndpointConfig 端点配置
type EndpointConfig struct {
	Path       string   `json:"path" yaml:"path" mapstructure:"path"`
	Methods    []string `json:"methods" yaml:"methods" mapstructure:"methods"`
	Middleware []string `json:"middleware" yaml:"middleware" mapstructure:"middleware"`
	Sources    []string `json:"sources" yaml:"sources" mapstructure:"sources"`
}

// IsProduction 判断是否为生产环境
func (c *AppConfig) IsProduction() bool {
	return c.Mode == "production"
}

// IsDevelopment 判断是否为开发环境
func (c *AppConfig) IsDevelopment() bool {
	return c.Mode == "development"
}

// IsStaging 判断是否为测试环境
func (c *AppConfig) IsStaging() bool {
	return c.Mode == "staging"
}

// APIAuthConfig API认证配置
type APIAuthConfig struct {
	Enabled            bool     `json:"enabled" yaml:"enabled" mapstructure:"enabled"`
	APIKey             string   `json:"api_key" yaml:"api_key" mapstructure:"api_key"`
	AdminKey           string   `json:"admin_key" yaml:"admin_key" mapstructure:"admin_key"`
	RequireHTTPS       bool     `json:"require_https" yaml:"require_https" mapstructure:"require_https"`
	EnableRateLimit    bool     `json:"enable_rate_limit" yaml:"enable_rate_limit" mapstructure:"enable_rate_limit"`
	RateLimitPerMin    int      `json:"rate_limit_per_min" yaml:"rate_limit_per_min" mapstructure:"rate_limit_per_min"`
	EnableAuditLog     bool     `json:"enable_audit_log" yaml:"enable_audit_log" mapstructure:"enable_audit_log"`
	WhiteList          []string `json:"white_list" yaml:"white_list" mapstructure:"white_list"`
	AllowedUserAgent   []string `json:"allowed_user_agent" yaml:"allowed_user_agent" mapstructure:"allowed_user_agent"`
}
