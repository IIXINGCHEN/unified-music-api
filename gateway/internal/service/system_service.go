// Package service 系统服务
package service

import (
	"context"
	"runtime"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/config"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/health"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/model"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/repository"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// SystemService 系统服务接口
type SystemService interface {
	// GetSystemInfo 获取系统信息
	GetSystemInfo(ctx context.Context) (*model.SystemInfoResponse, error)

	// GetHealthStatus 获取健康状态
	GetHealthStatus(ctx context.Context) (*model.HealthResponse, error)

	// GetMetrics 获取系统指标
	GetMetrics(ctx context.Context) (*model.MetricsResponse, error)

	// GetSourcesStatus 获取音源状态
	GetSourcesStatus(ctx context.Context) ([]*model.SourceStatus, error)

	// RefreshSources 刷新音源配置
	RefreshSources(ctx context.Context) error

	// ClearCache 清空缓存
	ClearCache(ctx context.Context) error

	// GetCacheStats 获取缓存统计
	GetCacheStats(ctx context.Context) (map[string]interface{}, error)

	// IsHealthy 检查系统是否健康
	IsHealthy(ctx context.Context) bool

	// GetUptime 获取运行时间
	GetUptime() time.Duration

	// GetVersion 获取版本信息
	GetVersion() string

	// GetEnabledSources 获取启用的音源列表
	GetEnabledSources() []string

	// RecordRequest 记录请求指标
	RecordRequest(success bool, latency time.Duration)

	// RecordError 记录错误指标
	RecordError(errorType string, statusCode int, errorMsg string)
}

// DefaultSystemService 默认系统服务实现
type DefaultSystemService struct {
	sourceManager   repository.SourceManager
	cache           repository.CacheRepository
	healthChecker   *health.Checker
	metricsCollector *health.MetricsCollector
	logger          logger.Logger
	config          *config.Config

	// 系统信息
	version   string
	buildTime string
	gitCommit string
	startTime time.Time
}

// NewDefaultSystemService 创建默认系统服务
func NewDefaultSystemService(
	sourceManager repository.SourceManager,
	cache repository.CacheRepository,
	healthChecker *health.Checker,
	metricsCollector *health.MetricsCollector,
	cfg *config.Config,
	log logger.Logger,
	version, buildTime, gitCommit string,
) *DefaultSystemService {
	return &DefaultSystemService{
		sourceManager:    sourceManager,
		cache:            cache,
		healthChecker:    healthChecker,
		metricsCollector: metricsCollector,
		logger:           log,
		config:           cfg,
		version:          version,
		buildTime:        buildTime,
		gitCommit:        gitCommit,
		startTime:        time.Now(),
	}
}

// GetSystemInfo 获取系统信息
func (s *DefaultSystemService) GetSystemInfo(ctx context.Context) (*model.SystemInfoResponse, error) {
	s.logger.Debug("获取系统信息")
	
	uptime := time.Since(s.startTime)
	
	// 从配置获取FLAC支持状态
	enableFlac := false
	if s.config != nil {
		enableFlac = s.config.Server.EnableFlac
	}

	info := &model.SystemInfoResponse{
		Version:    s.version,
		EnableFlac: enableFlac,
		BuildTime:  s.buildTime,
		GitCommit:  s.gitCommit,
		GoVersion:  runtime.Version(),
		Uptime:     uptime.String(),
	}
	
	s.logger.Info("获取系统信息成功",
		logger.String("version", info.Version),
		logger.String("uptime", info.Uptime),
	)
	
	return info, nil
}

// GetHealthStatus 获取健康状态
func (s *DefaultSystemService) GetHealthStatus(ctx context.Context) (*model.HealthResponse, error) {
	s.logger.Debug("获取健康状态")
	
	// 执行健康检查
	results := s.healthChecker.Check(ctx)
	isHealthy := s.healthChecker.IsHealthy(ctx)
	
	// 转换检查结果
	checks := make(map[string]model.CheckResult)
	for name, result := range results {
		checks[name] = model.CheckResult{
			Name:      result.Name,
			Status:    string(result.Status),
			Message:   result.Message,
			Details:   result.Details,
			Timestamp: result.Timestamp,
			Duration:  result.Duration,
		}
	}
	
	status := "healthy"
	if !isHealthy {
		status = "unhealthy"
	}
	
	response := &model.HealthResponse{
		Status:    status,
		Timestamp: time.Now().Unix(),
		Uptime:    time.Since(s.startTime).String(),
		Checks:    checks,
	}
	
	s.logger.Info("获取健康状态成功",
		logger.String("status", status),
		logger.Int("check_count", len(checks)),
	)
	
	return response, nil
}

// GetMetrics 获取系统指标
func (s *DefaultSystemService) GetMetrics(ctx context.Context) (*model.MetricsResponse, error) {
	s.logger.Debug("获取系统指标")
	
	// 获取指标数据
	metrics := s.metricsCollector.GetMetrics()
	
	// 转换为响应模型
	response := &model.MetricsResponse{
		StartTime:     metrics.StartTime,
		Uptime:        metrics.Uptime,
		GoVersion:     metrics.GoVersion,
		NumGoroutines: metrics.NumGoroutines,
		NumCPU:        metrics.NumCPU,
		MemoryStats: model.MemoryStats{
			Alloc:         metrics.MemoryStats.Alloc,
			TotalAlloc:    metrics.MemoryStats.TotalAlloc,
			Sys:           metrics.MemoryStats.Sys,
			Lookups:       metrics.MemoryStats.Lookups,
			Mallocs:       metrics.MemoryStats.Mallocs,
			Frees:         metrics.MemoryStats.Frees,
			HeapAlloc:     metrics.MemoryStats.HeapAlloc,
			HeapSys:       metrics.MemoryStats.HeapSys,
			HeapIdle:      metrics.MemoryStats.HeapIdle,
			HeapInuse:     metrics.MemoryStats.HeapInuse,
			HeapReleased:  metrics.MemoryStats.HeapReleased,
			HeapObjects:   metrics.MemoryStats.HeapObjects,
			StackInuse:    metrics.MemoryStats.StackInuse,
			StackSys:      metrics.MemoryStats.StackSys,
			MSpanInuse:    metrics.MemoryStats.MSpanInuse,
			MSpanSys:      metrics.MemoryStats.MSpanSys,
			MCacheInuse:   metrics.MemoryStats.MCacheInuse,
			MCacheSys:     metrics.MemoryStats.MCacheSys,
			GCSys:         metrics.MemoryStats.GCSys,
			NextGC:        metrics.MemoryStats.NextGC,
			LastGC:        metrics.MemoryStats.LastGC,
			NumGC:         metrics.MemoryStats.NumGC,
			NumForcedGC:   metrics.MemoryStats.NumForcedGC,
			GCCPUFraction: metrics.MemoryStats.GCCPUFraction,
		},
		RequestStats: model.RequestStats{
			TotalRequests:     metrics.RequestStats.TotalRequests,
			SuccessRequests:   metrics.RequestStats.SuccessRequests,
			ErrorRequests:     metrics.RequestStats.ErrorRequests,
			AverageLatency:    metrics.RequestStats.AverageLatency,
			RequestsPerSecond: metrics.RequestStats.RequestsPerSecond,
		},
		ErrorStats: model.ErrorStats{
			TotalErrors:   metrics.ErrorStats.TotalErrors,
			ErrorsByType:  metrics.ErrorStats.ErrorsByType,
			ErrorsByCode:  metrics.ErrorStats.ErrorsByCode,
			LastError:     metrics.ErrorStats.LastError,
			LastErrorTime: metrics.ErrorStats.LastErrorTime,
		},
	}
	
	s.logger.Info("获取系统指标成功",
		logger.Int64("total_requests", response.RequestStats.TotalRequests),
		logger.Int64("total_errors", response.ErrorStats.TotalErrors),
		logger.Uint64("heap_alloc", response.MemoryStats.HeapAlloc),
	)
	
	return response, nil
}

// GetSourcesStatus 获取音源状态
func (s *DefaultSystemService) GetSourcesStatus(ctx context.Context) ([]*model.SourceStatus, error) {
	s.logger.Debug("获取音源状态")
	
	// 使用音源管理器获取状态
	statuses, err := s.sourceManager.GetSourcesStatus(ctx)
	if err != nil {
		s.logger.Error("获取音源状态失败", logger.ErrorField("error", err))
		return nil, err
	}
	
	s.logger.Info("获取音源状态成功",
		logger.Int("source_count", len(statuses)),
	)
	
	return statuses, nil
}

// RefreshSources 刷新音源配置
func (s *DefaultSystemService) RefreshSources(ctx context.Context) error {
	s.logger.Info("开始刷新音源配置")
	
	err := s.sourceManager.RefreshSources()
	if err != nil {
		s.logger.Error("刷新音源配置失败", logger.ErrorField("error", err))
		return err
	}
	
	s.logger.Info("刷新音源配置成功")
	return nil
}

// ClearCache 清空缓存
func (s *DefaultSystemService) ClearCache(ctx context.Context) error {
	if s.cache == nil {
		return nil
	}
	
	s.logger.Info("开始清空缓存")
	
	err := s.cache.Clear(ctx)
	if err != nil {
		s.logger.Error("清空缓存失败", logger.ErrorField("error", err))
		return err
	}
	
	s.logger.Info("清空缓存成功")
	return nil
}

// GetCacheStats 获取缓存统计
func (s *DefaultSystemService) GetCacheStats(ctx context.Context) (map[string]interface{}, error) {
	if s.cache == nil {
		return map[string]interface{}{
			"enabled": false,
		}, nil
	}
	
	s.logger.Debug("获取缓存统计")
	
	stats, err := s.cache.GetStats(ctx)
	if err != nil {
		s.logger.Error("获取缓存统计失败", logger.ErrorField("error", err))
		return nil, err
	}
	
	// 添加缓存启用状态
	stats["enabled"] = true
	
	s.logger.Info("获取缓存统计成功",
		logger.Any("stats", stats),
	)
	
	return stats, nil
}

// RecordRequest 记录请求指标
func (s *DefaultSystemService) RecordRequest(success bool, latency time.Duration) {
	if s.metricsCollector != nil {
		s.metricsCollector.RecordRequest(success, latency)
	}
}

// RecordError 记录错误指标
func (s *DefaultSystemService) RecordError(errorType string, statusCode int, errorMsg string) {
	if s.metricsCollector != nil {
		s.metricsCollector.RecordError(errorType, statusCode, errorMsg)
	}
}

// GetUptime 获取运行时间
func (s *DefaultSystemService) GetUptime() time.Duration {
	return time.Since(s.startTime)
}

// GetStartTime 获取启动时间
func (s *DefaultSystemService) GetStartTime() time.Time {
	return s.startTime
}

// GetVersion 获取版本信息
func (s *DefaultSystemService) GetVersion() string {
	return s.version
}

// GetBuildInfo 获取构建信息
func (s *DefaultSystemService) GetBuildInfo() (string, string) {
	return s.buildTime, s.gitCommit
}

// IsHealthy 检查系统是否健康
func (s *DefaultSystemService) IsHealthy(ctx context.Context) bool {
	if s.healthChecker == nil {
		return true
	}
	return s.healthChecker.IsHealthy(ctx)
}

// GetEnabledSources 获取启用的音源列表
func (s *DefaultSystemService) GetEnabledSources() []string {
	sources := s.sourceManager.GetEnabledSources()
	names := make([]string, len(sources))
	for i, source := range sources {
		names[i] = source.GetName()
	}
	return names
}

// GetAllSources 获取所有音源列表
func (s *DefaultSystemService) GetAllSources() []string {
	sources := s.sourceManager.GetAllSources()
	names := make([]string, len(sources))
	for i, source := range sources {
		names[i] = source.GetName()
	}
	return names
}
