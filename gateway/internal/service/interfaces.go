// Package service 服务接口层
package service

import (
	"context"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/model"
)

// ServiceContainer 服务容器接口
type ServiceContainer interface {
	// GetMusicService 获取音乐服务
	GetMusicService() MusicService
	
	// GetSystemService 获取系统服务
	GetSystemService() SystemService
	
	// GetConfigService 获取配置服务
	GetConfigService() ConfigService
	
	// Initialize 初始化服务容器
	Initialize(ctx context.Context) error
	
	// Shutdown 关闭服务容器
	Shutdown(ctx context.Context) error
	
	// HealthCheck 健康检查
	HealthCheck(ctx context.Context) error
	
	// IsReady 检查是否就绪
	IsReady() bool
}

// MusicServiceInterface 音乐服务接口（扩展版）
type MusicServiceInterface interface {
	MusicService
	
	// GetSupportedSources 获取支持的音源列表
	GetSupportedSources(ctx context.Context) ([]string, error)
	
	// GetSourceStatus 获取音源状态
	GetSourceStatus(ctx context.Context, source string) (*model.SourceStatus, error)
	
	// EnableSource 启用音源
	EnableSource(ctx context.Context, source string) error
	
	// DisableSource 禁用音源
	DisableSource(ctx context.Context, source string) error
	
	// GetMusicHistory 获取音乐历史记录
	GetMusicHistory(ctx context.Context, limit int) ([]*model.MusicInfo, error)
	
	// ClearMusicCache 清空音乐缓存
	ClearMusicCache(ctx context.Context) error
}

// SystemServiceInterface 系统服务接口（扩展版）
type SystemServiceInterface interface {
	SystemService
	
	// GetSystemStatus 获取系统状态
	GetSystemStatus(ctx context.Context) (*model.SystemStatus, error)
	
	// UpdateSystemConfig 更新系统配置
	UpdateSystemConfig(ctx context.Context, config map[string]interface{}) error
	
	// RestartService 重启服务
	RestartService(ctx context.Context, serviceName string) error
	
	// GetServiceLogs 获取服务日志
	GetServiceLogs(ctx context.Context, serviceName string, lines int) ([]string, error)
	
	// ExportMetrics 导出指标数据
	ExportMetrics(ctx context.Context, format string) ([]byte, error)
	
	// ImportConfig 导入配置
	ImportConfig(ctx context.Context, configData []byte) error
	
	// ExportConfig 导出配置
	ExportConfig(ctx context.Context) ([]byte, error)
}

// ConfigServiceInterface 配置服务接口（扩展版）
type ConfigServiceInterface interface {
	ConfigService
	
	// GetConfigHistory 获取配置历史
	GetConfigHistory(ctx context.Context, limit int) ([]*model.ConfigChangeLog, error)
	
	// CompareConfig 比较配置
	CompareConfig(ctx context.Context, config1, config2 *model.AppConfig) ([]model.ConfigDiff, error)
	
	// ValidateConfigFile 验证配置文件
	ValidateConfigFile(ctx context.Context, filePath string) (*model.ConfigValidationResult, error)
	
	// ExportConfigToFile 导出配置到文件
	ExportConfigToFile(ctx context.Context, filePath string) error
	
	// ImportConfigFromFile 从文件导入配置
	ImportConfigFromFile(ctx context.Context, filePath string) error
	
	// GetConfigTemplate 获取配置模板
	GetConfigTemplate(ctx context.Context) (*model.AppConfig, error)
	
	// ResetConfigToDefault 重置配置为默认值
	ResetConfigToDefault(ctx context.Context) error
}

// CacheServiceInterface 缓存服务接口
type CacheServiceInterface interface {
	// Get 获取缓存
	Get(ctx context.Context, key string) (interface{}, error)
	
	// Set 设置缓存
	Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error
	
	// Delete 删除缓存
	Delete(ctx context.Context, key string) error
	
	// Clear 清空缓存
	Clear(ctx context.Context) error
	
	// GetStats 获取缓存统计
	GetStats(ctx context.Context) (map[string]interface{}, error)
	
	// GetKeys 获取所有键
	GetKeys(ctx context.Context, pattern string) ([]string, error)
	
	// Exists 检查键是否存在
	Exists(ctx context.Context, key string) (bool, error)
	
	// GetTTL 获取键的TTL
	GetTTL(ctx context.Context, key string) (time.Duration, error)
	
	// SetTTL 设置键的TTL
	SetTTL(ctx context.Context, key string, ttl time.Duration) error
}

// MetricsServiceInterface 指标服务接口
type MetricsServiceInterface interface {
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
	
	// ExportMetrics 导出指标
	ExportMetrics(ctx context.Context, format string, timeRange string) ([]byte, error)
	
	// ResetMetrics 重置指标
	ResetMetrics(ctx context.Context) error
}

// LogServiceInterface 日志服务接口
type LogServiceInterface interface {
	// GetLogs 获取日志
	GetLogs(ctx context.Context, level string, limit int, offset int) ([]map[string]interface{}, error)
	
	// SearchLogs 搜索日志
	SearchLogs(ctx context.Context, query string, timeRange string, limit int) ([]map[string]interface{}, error)
	
	// GetLogStats 获取日志统计
	GetLogStats(ctx context.Context, timeRange string) (map[string]interface{}, error)
	
	// SetLogLevel 设置日志级别
	SetLogLevel(ctx context.Context, level string) error
	
	// GetLogLevel 获取日志级别
	GetLogLevel(ctx context.Context) (string, error)
	
	// ExportLogs 导出日志
	ExportLogs(ctx context.Context, format string, timeRange string) ([]byte, error)
	
	// ClearLogs 清空日志
	ClearLogs(ctx context.Context, olderThan time.Duration) error
}

// SecurityServiceInterface 安全服务接口
type SecurityServiceInterface interface {
	// ValidateAPIKey 验证API密钥
	ValidateAPIKey(ctx context.Context, apiKey string) (bool, error)
	
	// GenerateAPIKey 生成API密钥
	GenerateAPIKey(ctx context.Context, name string, permissions []string) (string, error)
	
	// RevokeAPIKey 撤销API密钥
	RevokeAPIKey(ctx context.Context, apiKey string) error
	
	// GetAPIKeys 获取API密钥列表
	GetAPIKeys(ctx context.Context) ([]map[string]interface{}, error)
	
	// ValidateJWT 验证JWT令牌
	ValidateJWT(ctx context.Context, token string) (map[string]interface{}, error)
	
	// GenerateJWT 生成JWT令牌
	GenerateJWT(ctx context.Context, claims map[string]interface{}) (string, error)
	
	// GetSecurityEvents 获取安全事件
	GetSecurityEvents(ctx context.Context, limit int) ([]map[string]interface{}, error)
	
	// RecordSecurityEvent 记录安全事件
	RecordSecurityEvent(ctx context.Context, eventType, description string, metadata map[string]interface{}) error
}

// NotificationServiceInterface 通知服务接口
type NotificationServiceInterface interface {
	// SendNotification 发送通知
	SendNotification(ctx context.Context, notification *Notification) error
	
	// GetNotifications 获取通知列表
	GetNotifications(ctx context.Context, limit int, offset int) ([]*Notification, error)
	
	// MarkAsRead 标记为已读
	MarkAsRead(ctx context.Context, notificationID string) error
	
	// DeleteNotification 删除通知
	DeleteNotification(ctx context.Context, notificationID string) error
	
	// GetUnreadCount 获取未读数量
	GetUnreadCount(ctx context.Context) (int, error)
	
	// Subscribe 订阅通知
	Subscribe(ctx context.Context, channel string, callback func(*Notification)) error
	
	// Unsubscribe 取消订阅
	Unsubscribe(ctx context.Context, channel string) error
}

// Notification 通知结构
type Notification struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"`
	Title       string                 `json:"title"`
	Message     string                 `json:"message"`
	Data        map[string]interface{} `json:"data"`
	CreatedAt   time.Time              `json:"created_at"`
	ReadAt      *time.Time             `json:"read_at"`
	Priority    string                 `json:"priority"`
	Channel     string                 `json:"channel"`
}

// ServiceRegistry 服务注册表接口
type ServiceRegistry interface {
	// RegisterService 注册服务
	RegisterService(name string, service interface{}) error
	
	// UnregisterService 取消注册服务
	UnregisterService(name string) error
	
	// GetService 获取服务
	GetService(name string) (interface{}, error)
	
	// ListServices 列出所有服务
	ListServices() []string
	
	// IsServiceRegistered 检查服务是否已注册
	IsServiceRegistered(name string) bool
	
	// GetServiceHealth 获取服务健康状态
	GetServiceHealth(ctx context.Context, name string) (bool, error)
}

// ServiceFactory 服务工厂接口
type ServiceFactory interface {
	// CreateMusicService 创建音乐服务
	CreateMusicService() MusicService
	
	// CreateSystemService 创建系统服务
	CreateSystemService() SystemService
	
	// CreateConfigService 创建配置服务
	CreateConfigService() ConfigService
	
	// CreateCacheService 创建缓存服务
	CreateCacheService() CacheServiceInterface
	
	// CreateMetricsService 创建指标服务
	CreateMetricsService() MetricsServiceInterface
	
	// CreateLogService 创建日志服务
	CreateLogService() LogServiceInterface
	
	// CreateSecurityService 创建安全服务
	CreateSecurityService() SecurityServiceInterface
	
	// CreateNotificationService 创建通知服务
	CreateNotificationService() NotificationServiceInterface
}

// ServiceMiddleware 服务中间件接口
type ServiceMiddleware interface {
	// Before 前置处理
	Before(ctx context.Context, serviceName, methodName string, args []interface{}) (context.Context, error)
	
	// After 后置处理
	After(ctx context.Context, serviceName, methodName string, result interface{}, err error) error
	
	// OnError 错误处理
	OnError(ctx context.Context, serviceName, methodName string, err error) error
}

// ServiceInterceptor 服务拦截器接口
type ServiceInterceptor interface {
	// Intercept 拦截服务调用
	Intercept(ctx context.Context, serviceName, methodName string, args []interface{}, next func() (interface{}, error)) (interface{}, error)
}

// ServiceMonitor 服务监控接口
type ServiceMonitor interface {
	// StartMonitoring 开始监控
	StartMonitoring(ctx context.Context) error
	
	// StopMonitoring 停止监控
	StopMonitoring(ctx context.Context) error
	
	// GetMonitoringData 获取监控数据
	GetMonitoringData(ctx context.Context, timeRange string) (map[string]interface{}, error)
	
	// SetAlertRule 设置告警规则
	SetAlertRule(ctx context.Context, rule *AlertRule) error
	
	// RemoveAlertRule 移除告警规则
	RemoveAlertRule(ctx context.Context, ruleID string) error
	
	// GetAlerts 获取告警列表
	GetAlerts(ctx context.Context, status string) ([]*Alert, error)
}

// AlertRule 告警规则
type AlertRule struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Condition   string                 `json:"condition"`
	Threshold   float64                `json:"threshold"`
	Duration    time.Duration          `json:"duration"`
	Severity    string                 `json:"severity"`
	Enabled     bool                   `json:"enabled"`
	Metadata    map[string]interface{} `json:"metadata"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// Alert 告警
type Alert struct {
	ID          string                 `json:"id"`
	RuleID      string                 `json:"rule_id"`
	RuleName    string                 `json:"rule_name"`
	Status      string                 `json:"status"`
	Severity    string                 `json:"severity"`
	Message     string                 `json:"message"`
	Value       float64                `json:"value"`
	Threshold   float64                `json:"threshold"`
	StartTime   time.Time              `json:"start_time"`
	EndTime     *time.Time             `json:"end_time"`
	Metadata    map[string]interface{} `json:"metadata"`
}
