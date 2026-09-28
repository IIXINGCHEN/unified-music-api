// Package repository 音源接口定义
package repository

import (
	"context"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/model"
)

// MusicSource 音源接口
type MusicSource interface {
	// GetName 获取音源名称
	GetName() string
	
	// IsEnabled 检查音源是否启用
	IsEnabled() bool
	
	// SetEnabled 设置音源启用状态
	SetEnabled(enabled bool)
	
	// GetMusic 根据音乐ID获取播放链接
	GetMusic(ctx context.Context, id string, quality string) (*model.MusicURL, error)
	
	// SearchMusic 根据歌曲名搜索音乐
	SearchMusic(ctx context.Context, keyword string) ([]*model.SearchResult, error)
	
	// GetMusicInfo 获取音乐详细信息
	GetMusicInfo(ctx context.Context, id string) (*model.MusicInfo, error)
	
	// HealthCheck 健康检查
	HealthCheck(ctx context.Context) error
	
	// GetConfig 获取音源配置
	GetConfig() *model.SourceConfig
	
	// UpdateConfig 更新音源配置
	UpdateConfig(config *model.SourceConfig) error
}

// SourceManager 音源管理器接口
type SourceManager interface {
	// RegisterSource 注册音源
	RegisterSource(source MusicSource) error
	
	// UnregisterSource 取消注册音源
	UnregisterSource(name string) error
	
	// GetSource 获取指定音源
	GetSource(name string) (MusicSource, error)
	
	// GetAllSources 获取所有音源
	GetAllSources() []MusicSource
	
	// GetEnabledSources 获取启用的音源
	GetEnabledSources() []MusicSource
	
	// GetSourcesByNames 根据名称获取音源列表
	GetSourcesByNames(names []string) []MusicSource
	
	// MatchMusic 使用多个音源匹配音乐
	MatchMusic(ctx context.Context, id string, sources []string, quality string) (*model.MatchResponse, error)
	
	// SearchMusic 使用多个音源搜索音乐
	SearchMusic(ctx context.Context, keyword string, sources []string) ([]*model.SearchResult, error)

	// GetSourcesStatus 获取音源状态
	GetSourcesStatus(ctx context.Context) ([]*model.SourceStatus, error)
	
	// RefreshSources 刷新音源配置
	RefreshSources() error
}



// AppConfigRepository 应用配置仓库接口
type AppConfigRepository interface {
	// GetConfig 获取配置
	GetConfig(ctx context.Context) (*model.AppConfig, error)
	
	// UpdateConfig 更新配置
	UpdateConfig(ctx context.Context, config *model.AppConfig) error
	
	// GetSection 获取配置节
	GetSection(ctx context.Context, section string) (interface{}, error)
	
	// UpdateSection 更新配置节
	UpdateSection(ctx context.Context, section string, data interface{}) error
	
	// ValidateConfig 验证配置
	ValidateConfig(ctx context.Context, config *model.AppConfig) (*model.ConfigValidationResult, error)
	
	// BackupConfig 备份配置
	BackupConfig(ctx context.Context, name, description string) (*model.ConfigBackup, error)
	
	// RestoreConfig 恢复配置
	RestoreConfig(ctx context.Context, backupID string) error
	
	// GetBackups 获取配置备份列表
	GetBackups(ctx context.Context) ([]*model.ConfigBackup, error)
	
	// DeleteBackup 删除配置备份
	DeleteBackup(ctx context.Context, backupID string) error
	
	// GetChangeLog 获取配置变更日志
	GetChangeLog(ctx context.Context, limit int) ([]*model.ConfigChangeLog, error)
}

// AppMetricsRepository 应用指标仓库接口
type AppMetricsRepository interface {
	// RecordRequest 记录请求指标
	RecordRequest(ctx context.Context, method, path string, statusCode int, duration time.Duration) error
	
	// RecordError 记录错误指标
	RecordError(ctx context.Context, errorType string, statusCode int, message string) error
	
	// RecordSourceUsage 记录音源使用指标
	RecordSourceUsage(ctx context.Context, source string, success bool, duration time.Duration) error
	
	// GetRequestMetrics 获取请求指标
	GetRequestMetrics(ctx context.Context, timeRange string) (*model.RequestStats, error)
	
	// GetErrorMetrics 获取错误指标
	GetErrorMetrics(ctx context.Context, timeRange string) (*model.ErrorStats, error)
	
	// GetSourceMetrics 获取音源指标
	GetSourceMetrics(ctx context.Context, source string, timeRange string) (map[string]interface{}, error)
	
	// GetSystemMetrics 获取系统指标
	GetSystemMetrics(ctx context.Context) (*model.MetricsResponse, error)
}

// SourceResult 音源查询结果
type SourceResult struct {
	Source   string           // 音源名称
	Success  bool             // 是否成功
	URL      *model.MusicURL  // 音乐链接
	Info     *model.MusicInfo // 音乐信息
	Error    error            // 错误信息
	Duration time.Duration    // 查询耗时
}

// SourceQuery 音源查询参数
type SourceQuery struct {
	ID       string   // 音乐ID
	Quality  string   // 音质要求
	Sources  []string // 指定音源
	Timeout  time.Duration // 超时时间
	Parallel bool     // 是否并行查询
}

// SearchQuery 搜索查询参数
type SearchQuery struct {
	Keyword  string   // 搜索关键词
	Sources  []string // 指定音源
	Limit    int      // 结果数量限制
	Timeout  time.Duration // 超时时间
}

// SourceConfig 音源配置接口
type SourceConfig interface {
	// GetTimeout 获取超时时间
	GetTimeout() time.Duration
	
	// GetRetryCount 获取重试次数
	GetRetryCount() int
	
	// GetRateLimit 获取限流配置
	GetRateLimit() int
	
	// GetHeaders 获取请求头
	GetHeaders() map[string]string
	
	// GetCookie 获取Cookie
	GetCookie() string
	
	// GetAPIKey 获取API密钥
	GetAPIKey() string
	
	// GetProxyURL 获取代理URL
	GetProxyURL() string
	
	// IsValid 检查配置是否有效
	IsValid() bool
}

// HTTPClient HTTP客户端接口
type HTTPClient interface {
	// Get 发送GET请求
	Get(ctx context.Context, url string, headers map[string]string) ([]byte, error)
	
	// Post 发送POST请求
	Post(ctx context.Context, url string, data []byte, headers map[string]string) ([]byte, error)
	
	// Put 发送PUT请求
	Put(ctx context.Context, url string, data []byte, headers map[string]string) ([]byte, error)
	
	// Delete 发送DELETE请求
	Delete(ctx context.Context, url string, headers map[string]string) ([]byte, error)
	
	// SetTimeout 设置超时时间
	SetTimeout(timeout time.Duration)
	
	// SetProxy 设置代理
	SetProxy(proxyURL string) error
	
	// SetUserAgent 设置User-Agent
	SetUserAgent(userAgent string)
	
	// SetCookie 设置Cookie
	SetCookie(cookie string)
}

// RateLimiter 限流器接口
type RateLimiter interface {
	// Allow 检查是否允许请求
	Allow(ctx context.Context, key string) (bool, error)
	
	// Wait 等待直到允许请求
	Wait(ctx context.Context, key string) error
	
	// Reset 重置限流计数
	Reset(ctx context.Context, key string) error
	
	// GetRemaining 获取剩余请求数
	GetRemaining(ctx context.Context, key string) (int, error)
	
	// GetResetTime 获取重置时间
	GetResetTime(ctx context.Context, key string) (time.Time, error)
}

// Logger 日志接口
type Logger interface {
	Debug(msg string, fields ...interface{})
	Info(msg string, fields ...interface{})
	Warn(msg string, fields ...interface{})
	Error(msg string, fields ...interface{})
	Fatal(msg string, fields ...interface{})
}

// Repository 仓库聚合接口
type Repository struct {
	SourceManager SourceManager
	Cache         CacheRepository
	Config        ConfigRepository
	Metrics       MetricsRepository
	HTTPClient    HTTPClient
	RateLimiter   RateLimiter
	Logger        Logger
}

// NewRepository 创建仓库实例
func NewRepository(
	sourceManager SourceManager,
	cache CacheRepository,
	config ConfigRepository,
	metrics MetricsRepository,
	httpClient HTTPClient,
	rateLimiter RateLimiter,
	logger Logger,
) *Repository {
	return &Repository{
		SourceManager: sourceManager,
		Cache:         cache,
		Config:        config,
		Metrics:       metrics,
		HTTPClient:    httpClient,
		RateLimiter:   rateLimiter,
		Logger:        logger,
	}
}
