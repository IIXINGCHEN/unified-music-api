// Package service 服务聚合器
package service

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/config"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/health"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/model"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/repository"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// repositoryLoggerAdapter 仓库日志适配器，将pkg/logger.Logger适配为repository.Logger
type repositoryLoggerAdapter struct {
	logger logger.Logger
}

// Debug 调试日志
func (a *repositoryLoggerAdapter) Debug(msg string, fields ...interface{}) {
	logFields := a.convertFields(fields...)
	a.logger.Debug(msg, logFields...)
}

// Info 信息日志
func (a *repositoryLoggerAdapter) Info(msg string, fields ...interface{}) {
	logFields := a.convertFields(fields...)
	a.logger.Info(msg, logFields...)
}

// Warn 警告日志
func (a *repositoryLoggerAdapter) Warn(msg string, fields ...interface{}) {
	logFields := a.convertFields(fields...)
	a.logger.Warn(msg, logFields...)
}

// Error 错误日志
func (a *repositoryLoggerAdapter) Error(msg string, fields ...interface{}) {
	logFields := a.convertFields(fields...)
	a.logger.Error(msg, logFields...)
}

// Fatal 致命错误日志
func (a *repositoryLoggerAdapter) Fatal(msg string, fields ...interface{}) {
	logFields := a.convertFields(fields...)
	a.logger.Fatal(msg, logFields...)
}

// convertFields 转换字段格式，将interface{}参数对转换为logger.Field切片
// 根据repository.Logger接口的实际使用模式，参数格式为：key1, value1, key2, value2, ...
func (a *repositoryLoggerAdapter) convertFields(fields ...interface{}) []logger.Field {
	var logFields []logger.Field

	// 处理成对的key-value参数
	for i := 0; i < len(fields); i += 2 {
		// 确保有足够的参数形成一对
		if i+1 >= len(fields) {
			// 如果参数数量为奇数，跳过最后一个参数
			break
		}

		// 尝试将第一个参数转换为字符串作为key
		key, keyOk := fields[i].(string)
		if !keyOk {
			// 如果key不是字符串，尝试转换为字符串
			key = fmt.Sprintf("%v", fields[i])
		}

		// 第二个参数作为value
		value := fields[i+1]

		// 创建Field并添加到切片
		logFields = append(logFields, logger.Field{
			Key:   key,
			Value: value,
		})
	}

	return logFields
}

// ServiceManager 服务管理器
type ServiceManager struct {
	// 服务实例
	MusicService  MusicService
	SystemService SystemService
	ConfigService ConfigService
	
	// 仓库实例
	Repository *repository.Repository

	// 应用配置仓库
	AppConfigRepo repository.AppConfigRepository

	// 配置和日志
	Config *config.Config
	Logger logger.Logger
	
	// 初始化状态
	initialized bool
	mu          sync.RWMutex
}

// NewServiceManager 创建服务管理器
func NewServiceManager(cfg *config.Config, log logger.Logger) *ServiceManager {
	return &ServiceManager{
		Config: cfg,
		Logger: log,
	}
}

// Initialize 初始化所有服务
func (sm *ServiceManager) Initialize(ctx context.Context) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	
	if sm.initialized {
		return nil
	}
	
	// 生产环境减少详细日志
	if sm.Config.App.Mode == "development" {
		sm.Logger.Info("开始初始化服务管理器")
	}
	
	// 1. 初始化仓库层
	if err := sm.initializeRepositories(ctx); err != nil {
		return fmt.Errorf("初始化仓库层失败: %w", err)
	}
	
	// 2. 初始化服务层
	if err := sm.initializeServices(ctx); err != nil {
		return fmt.Errorf("初始化服务层失败: %w", err)
	}
	
	sm.initialized = true
	sm.Logger.Info("服务管理器初始化完成")
	
	return nil
}

// initializeRepositories 初始化仓库层
func (sm *ServiceManager) initializeRepositories(ctx context.Context) error {
	// 生产环境减少详细日志
	if sm.Config.App.Mode == "development" {
		sm.Logger.Info("初始化仓库层")
	}
	
	// 创建HTTP客户端配置
	httpConfig := &repository.HTTPClientConfig{
		UserAgent:           sm.Config.HTTPClient.UserAgent,
		Timeout:             sm.Config.HTTPClient.Timeout,
		MaxIdleConns:        sm.Config.HTTPClient.MaxIdleConns,
		MaxIdleConnsPerHost: sm.Config.HTTPClient.MaxIdleConnsPerHost,
		IdleConnTimeout:     sm.Config.HTTPClient.IdleConnTimeout,
		DisableCompression:  sm.Config.HTTPClient.DisableCompression,
	}

	// 创建HTTP客户端
	httpClient := repository.NewDefaultHTTPClient(httpConfig, sm.Logger)
	
	// 创建缓存仓库
	cache := repository.NewMemoryCacheRepository(sm.Logger)
	
	// 创建限流器
	rateLimiter := repository.NewMemoryRateLimiter(100, 10, sm.Logger)
	
	// 创建音源管理器
	sourcesConfig := &model.SourcesConfigModel{
		UNMServer: model.UNMServerConfigModel{
			Enabled:    sm.Config.Sources.UNMServer.Enabled,
			BaseURL:    sm.Config.Sources.UNMServer.BaseURL,
			APIKey:     sm.Config.Sources.UNMServer.APIKey,
			Timeout:    sm.Config.Sources.UNMServer.Timeout,
			RetryCount: sm.Config.Sources.UNMServer.RetryCount,
			UserAgent:  sm.Config.Sources.UNMServer.UserAgent,
		},
		GDStudio: model.GDStudioConfigModel{
			Enabled:    sm.Config.Sources.GDStudio.Enabled,
			BaseURL:    sm.Config.Sources.GDStudio.BaseURL,
			APIKey:     sm.Config.Sources.GDStudio.APIKey,
			Timeout:    sm.Config.Sources.GDStudio.Timeout,
			RetryCount: sm.Config.Sources.GDStudio.RetryCount,
			UserAgent:  sm.Config.Sources.GDStudio.UserAgent,
		},
		MusicInfoResolver: model.MusicInfoResolverConfigModel{
			Enabled:  sm.Config.Sources.MusicInfoResolver.Enabled,
			Timeout:  sm.Config.Sources.MusicInfoResolver.Timeout,
			CacheTTL: sm.Config.Sources.MusicInfoResolver.CacheTTL,
			SearchFallback: model.SearchFallbackConfigModel{
				Enabled:     sm.Config.Sources.MusicInfoResolver.SearchFallback.Enabled,
				Keywords:    sm.Config.Sources.MusicInfoResolver.SearchFallback.Keywords,
				MaxResults:  sm.Config.Sources.MusicInfoResolver.SearchFallback.MaxResults,
				MaxKeywords: sm.Config.Sources.MusicInfoResolver.SearchFallback.MaxKeywords,
			},
		},
		DefaultSources: sm.Config.Sources.DefaultSources,
		EnabledSources: sm.Config.Sources.EnabledSources,
		TestSources:    sm.Config.Sources.TestSources,
		Timeout:        sm.Config.Sources.Timeout,
		RetryCount:     sm.Config.Sources.RetryCount,
	}
	sourceManager := repository.NewDefaultSourceManager(httpClient, sourcesConfig, cache, sm.Logger)
	
	// 创建配置仓库
	configRepo := repository.NewMemoryConfigRepository(sm.Logger)

	// 创建应用配置仓库
	sm.AppConfigRepo = repository.NewMemoryAppConfigRepository(sm.Logger)

	// 创建指标仓库
	metricsRepo := repository.NewMemoryMetricsRepository(sm.Logger)
	
	// 创建日志适配器
	loggerAdapter := &repositoryLoggerAdapter{logger: sm.Logger}

	// 创建仓库聚合
	sm.Repository = repository.NewRepository(
		sourceManager,
		cache,
		configRepo,
		metricsRepo,
		httpClient,
		rateLimiter,
		loggerAdapter,
	)
	
	sm.Logger.Info("仓库层初始化完成")
	return nil
}

// initializeServices 初始化服务层
func (sm *ServiceManager) initializeServices(ctx context.Context) error {
	sm.Logger.Info("初始化服务层")
	
	// 获取健康检查器和指标收集器
	healthChecker := health.GetDefaultChecker()
	metricsCollector := health.GetDefaultMetricsCollector()
	
	// 创建配置管理器
	configManager := config.NewSourceConfigManager(sm.Config)

	// 创建音乐服务
	sm.MusicService = NewDefaultMusicService(
		sm.Repository.SourceManager,
		sm.Repository.Cache,
		sm.Repository.RateLimiter,
		configManager,
		sm.Logger,
	)
	
	// 创建系统服务
	sm.SystemService = NewDefaultSystemService(
		sm.Repository.SourceManager,
		sm.Repository.Cache,
		healthChecker,
		metricsCollector,
		sm.Config,
		sm.Logger,
		"1.0.4",        // version
		"2025-06-28",   // buildTime
		"unknown",      // gitCommit
	)
	
	// 创建配置服务
	configLoader := config.NewLoader(sm.Logger)
	validator := config.NewValidator()
	sm.ConfigService = NewDefaultConfigService(
		sm.AppConfigRepo,
		configLoader,
		validator,
		sm.Config,
		sm.Logger,
	)

	// 初始化配置仓库
	if err := sm.initializeConfigRepository(ctx); err != nil {
		return fmt.Errorf("初始化配置仓库失败: %w", err)
	}

	sm.Logger.Info("服务层初始化完成")
	return nil
}



// Shutdown 关闭服务管理器
func (sm *ServiceManager) Shutdown(ctx context.Context) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	
	if !sm.initialized {
		return nil
	}
	
	sm.Logger.Info("开始关闭服务管理器")
	
	// 清理资源
	if sm.Repository != nil && sm.Repository.Cache != nil {
		if err := sm.Repository.Cache.Clear(ctx); err != nil {
			sm.Logger.Warn("清理缓存失败", logger.ErrorField("error", err))
		}
	}
	
	sm.initialized = false
	sm.Logger.Info("服务管理器关闭完成")
	
	return nil
}

// IsInitialized 检查是否已初始化
func (sm *ServiceManager) IsInitialized() bool {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	return sm.initialized
}

// GetMusicService 获取音乐服务
func (sm *ServiceManager) GetMusicService() MusicService {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	return sm.MusicService
}

// GetSystemService 获取系统服务
func (sm *ServiceManager) GetSystemService() SystemService {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	return sm.SystemService
}

// GetConfigService 获取配置服务
func (sm *ServiceManager) GetConfigService() ConfigService {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	return sm.ConfigService
}

// GetRepository 获取仓库聚合
func (sm *ServiceManager) GetRepository() *repository.Repository {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	return sm.Repository
}

// HealthCheck 健康检查
func (sm *ServiceManager) HealthCheck(ctx context.Context) error {
	if !sm.IsInitialized() {
		return fmt.Errorf("服务管理器未初始化")
	}
	
	// 检查系统服务健康状态
	if !sm.SystemService.IsHealthy(ctx) {
		return fmt.Errorf("系统服务不健康")
	}
	
	return nil
}

// GetStats 获取统计信息
func (sm *ServiceManager) GetStats(ctx context.Context) map[string]interface{} {
	stats := make(map[string]interface{})
	
	stats["initialized"] = sm.IsInitialized()
	stats["uptime"] = sm.SystemService.GetUptime().String()
	stats["version"] = sm.SystemService.GetVersion()
	
	// 获取音源状态
	if sources := sm.SystemService.GetEnabledSources(); len(sources) > 0 {
		stats["enabled_sources"] = sources
		stats["source_count"] = len(sources)
	}
	
	// 获取缓存统计
	if cacheStats, err := sm.SystemService.GetCacheStats(ctx); err == nil {
		stats["cache"] = cacheStats
	}
	
	return stats
}

// RecordMetrics 记录指标
func (sm *ServiceManager) RecordMetrics(success bool, latency time.Duration, errorType string, statusCode int, errorMsg string) {
	if sm.SystemService == nil {
		return
	}
	
	// 记录请求指标
	sm.SystemService.RecordRequest(success, latency)
	
	// 记录错误指标
	if !success && errorType != "" {
		sm.SystemService.RecordError(errorType, statusCode, errorMsg)
	}
}

// ValidateConfig 验证配置
func (sm *ServiceManager) ValidateConfig() error {
	if sm.Config == nil {
		return fmt.Errorf("配置不能为空")
	}
	
	validator := config.NewValidator()
	return validator.Validate(sm.Config)
}

// ReloadConfig 重新加载配置
func (sm *ServiceManager) ReloadConfig(ctx context.Context) error {
	if sm.ConfigService == nil {
		return fmt.Errorf("配置服务未初始化")
	}
	
	return sm.ConfigService.ReloadConfig(ctx)
}

// GetSourceManager 获取音源管理器
func (sm *ServiceManager) GetSourceManager() repository.SourceManager {
	if sm.Repository == nil {
		return nil
	}
	return sm.Repository.SourceManager
}

// GetCache 获取缓存仓库
func (sm *ServiceManager) GetCache() repository.CacheRepository {
	if sm.Repository == nil {
		return nil
	}
	return sm.Repository.Cache
}

// GetRateLimiter 获取限流器
func (sm *ServiceManager) GetRateLimiter() repository.RateLimiter {
	if sm.Repository == nil {
		return nil
	}
	return sm.Repository.RateLimiter
}

// GetHTTPClient 获取HTTP客户端
func (sm *ServiceManager) GetHTTPClient() repository.HTTPClient {
	if sm.Repository == nil {
		return nil
	}
	return sm.Repository.HTTPClient
}

// 全局服务管理器实例
var globalServiceManager *ServiceManager
var globalServiceManagerOnce sync.Once

// InitGlobalServiceManager 初始化全局服务管理器
func InitGlobalServiceManager(cfg *config.Config, log logger.Logger) error {
	var err error
	globalServiceManagerOnce.Do(func() {
		globalServiceManager = NewServiceManager(cfg, log)
		err = globalServiceManager.Initialize(context.Background())
	})
	return err
}

// GetGlobalServiceManager 获取全局服务管理器
func GetGlobalServiceManager() *ServiceManager {
	return globalServiceManager
}

// ShutdownGlobalServiceManager 关闭全局服务管理器
func ShutdownGlobalServiceManager(ctx context.Context) error {
	if globalServiceManager != nil {
		return globalServiceManager.Shutdown(ctx)
	}
	return nil
}

// initializeConfigRepository 初始化配置仓库
func (sm *ServiceManager) initializeConfigRepository(ctx context.Context) error {
	if sm.AppConfigRepo == nil || sm.Config == nil {
		return fmt.Errorf("配置仓库或配置未初始化")
	}

	// 使用配置服务的转换方法
	if configService, ok := sm.ConfigService.(*DefaultConfigService); ok {
		appConfig := configService.convertToAppConfig(sm.Config)

		// 存储初始配置
		if err := sm.AppConfigRepo.UpdateConfig(ctx, appConfig); err != nil {
			return fmt.Errorf("存储初始配置失败: %w", err)
		}
	} else {
		return fmt.Errorf("配置服务类型不匹配")
	}

	sm.Logger.Info("配置仓库初始化完成")
	return nil
}
