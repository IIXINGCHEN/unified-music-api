// Package repository 指标仓库实现
package repository

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// MetricData 指标数据
type MetricData struct {
	Name      string                 `json:"name"`
	Value     float64                `json:"value"`
	Labels    map[string]string      `json:"labels"`
	Timestamp time.Time              `json:"timestamp"`
	Type      string                 `json:"type"` // counter, gauge, histogram
}

// MetricsRepository 指标仓库接口
type MetricsRepository interface {
	// RecordRequest 记录请求指标
	RecordRequest(ctx context.Context, method, path string, statusCode int, duration time.Duration) error
	
	// RecordError 记录错误指标
	RecordError(ctx context.Context, errorType string, statusCode int, message string) error
	
	// RecordSourceMetrics 记录音源指标
	RecordSourceMetrics(ctx context.Context, sourceName string, success bool, duration time.Duration) error
	
	// RecordCacheMetrics 记录缓存指标
	RecordCacheMetrics(ctx context.Context, operation string, hit bool) error
	
	// RecordCustomMetric 记录自定义指标
	RecordCustomMetric(ctx context.Context, name string, value float64, labels map[string]string) error
	
	// GetMetrics 获取指标数据
	GetMetrics(ctx context.Context, name string, start, end time.Time) ([]*MetricData, error)
	
	// GetAllMetrics 获取所有指标
	GetAllMetrics(ctx context.Context) (map[string][]*MetricData, error)
	
	// GetMetricNames 获取指标名称列表
	GetMetricNames(ctx context.Context) ([]string, error)
	
	// ClearMetrics 清空指标数据
	ClearMetrics(ctx context.Context, before time.Time) error
	
	// GetStats 获取统计信息
	GetStats(ctx context.Context) (map[string]interface{}, error)
}

// memoryMetricsRepository 内存指标仓库实现
type memoryMetricsRepository struct {
	metrics map[string][]*MetricData
	mutex   sync.RWMutex
	logger  logger.Logger
	
	// 统计信息
	stats struct {
		totalMetrics    int64
		requestMetrics  int64
		errorMetrics    int64
		sourceMetrics   int64
		cacheMetrics    int64
		customMetrics   int64
	}
}

// NewMemoryMetricsRepository 创建内存指标仓库
func NewMemoryMetricsRepository(log logger.Logger) MetricsRepository {
	repo := &memoryMetricsRepository{
		metrics: make(map[string][]*MetricData),
		logger:  log,
	}
	
	// 启动清理过期指标的goroutine
	go repo.cleanupOldMetrics()
	
	return repo
}

// RecordRequest 记录请求指标
func (r *memoryMetricsRepository) RecordRequest(ctx context.Context, method, path string, statusCode int, duration time.Duration) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	// 记录请求计数
	countMetric := &MetricData{
		Name: "http_requests_total",
		Value: 1,
		Labels: map[string]string{
			"method": method,
			"path":   path,
			"status": fmt.Sprintf("%d", statusCode),
		},
		Timestamp: time.Now(),
		Type:      "counter",
	}
	
	// 记录请求耗时
	durationMetric := &MetricData{
		Name: "http_request_duration_seconds",
		Value: duration.Seconds(),
		Labels: map[string]string{
			"method": method,
			"path":   path,
		},
		Timestamp: time.Now(),
		Type:      "histogram",
	}
	
	r.addMetric(countMetric)
	r.addMetric(durationMetric)
	
	r.stats.requestMetrics += 2
	r.stats.totalMetrics += 2
	
	r.logger.Debug("记录请求指标",
		logger.String("method", method),
		logger.String("path", path),
		logger.Int("status", statusCode),
		logger.Duration("duration", duration),
	)
	
	return nil
}

// RecordError 记录错误指标
func (r *memoryMetricsRepository) RecordError(ctx context.Context, errorType string, statusCode int, message string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	metric := &MetricData{
		Name: "errors_total",
		Value: 1,
		Labels: map[string]string{
			"type":    errorType,
			"status":  fmt.Sprintf("%d", statusCode),
			"message": message,
		},
		Timestamp: time.Now(),
		Type:      "counter",
	}
	
	r.addMetric(metric)
	r.stats.errorMetrics++
	r.stats.totalMetrics++
	
	r.logger.Debug("记录错误指标",
		logger.String("type", errorType),
		logger.Int("status", statusCode),
		logger.String("message", message),
	)
	
	return nil
}

// RecordSourceMetrics 记录音源指标
func (r *memoryMetricsRepository) RecordSourceMetrics(ctx context.Context, sourceName string, success bool, duration time.Duration) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	// 记录音源请求计数
	countMetric := &MetricData{
		Name: "source_requests_total",
		Value: 1,
		Labels: map[string]string{
			"source":  sourceName,
			"success": fmt.Sprintf("%t", success),
		},
		Timestamp: time.Now(),
		Type:      "counter",
	}
	
	// 记录音源请求耗时
	durationMetric := &MetricData{
		Name: "source_request_duration_seconds",
		Value: duration.Seconds(),
		Labels: map[string]string{
			"source": sourceName,
		},
		Timestamp: time.Now(),
		Type:      "histogram",
	}
	
	r.addMetric(countMetric)
	r.addMetric(durationMetric)
	
	r.stats.sourceMetrics += 2
	r.stats.totalMetrics += 2
	
	r.logger.Debug("记录音源指标",
		logger.String("source", sourceName),
		logger.Bool("success", success),
		logger.Duration("duration", duration),
	)
	
	return nil
}

// RecordCacheMetrics 记录缓存指标
func (r *memoryMetricsRepository) RecordCacheMetrics(ctx context.Context, operation string, hit bool) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	metric := &MetricData{
		Name: "cache_operations_total",
		Value: 1,
		Labels: map[string]string{
			"operation": operation,
			"result":    fmt.Sprintf("%t", hit),
		},
		Timestamp: time.Now(),
		Type:      "counter",
	}
	
	r.addMetric(metric)
	r.stats.cacheMetrics++
	r.stats.totalMetrics++
	
	r.logger.Debug("记录缓存指标",
		logger.String("operation", operation),
		logger.Bool("hit", hit),
	)
	
	return nil
}

// RecordCustomMetric 记录自定义指标
func (r *memoryMetricsRepository) RecordCustomMetric(ctx context.Context, name string, value float64, labels map[string]string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	metric := &MetricData{
		Name:      name,
		Value:     value,
		Labels:    labels,
		Timestamp: time.Now(),
		Type:      "gauge",
	}
	
	r.addMetric(metric)
	r.stats.customMetrics++
	r.stats.totalMetrics++
	
	r.logger.Debug("记录自定义指标",
		logger.String("name", name),
		logger.Float64("value", value),
	)
	
	return nil
}

// GetMetrics 获取指标数据
func (r *memoryMetricsRepository) GetMetrics(ctx context.Context, name string, start, end time.Time) ([]*MetricData, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	metrics, exists := r.metrics[name]
	if !exists {
		return []*MetricData{}, nil
	}
	
	var result []*MetricData
	for _, metric := range metrics {
		if metric.Timestamp.After(start) && metric.Timestamp.Before(end) {
			result = append(result, metric)
		}
	}
	
	return result, nil
}

// GetAllMetrics 获取所有指标
func (r *memoryMetricsRepository) GetAllMetrics(ctx context.Context) (map[string][]*MetricData, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	result := make(map[string][]*MetricData)
	for name, metrics := range r.metrics {
		result[name] = make([]*MetricData, len(metrics))
		copy(result[name], metrics)
	}
	
	return result, nil
}

// GetMetricNames 获取指标名称列表
func (r *memoryMetricsRepository) GetMetricNames(ctx context.Context) ([]string, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var names []string
	for name := range r.metrics {
		names = append(names, name)
	}
	
	return names, nil
}

// ClearMetrics 清空指标数据
func (r *memoryMetricsRepository) ClearMetrics(ctx context.Context, before time.Time) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	clearedCount := 0
	for name, metrics := range r.metrics {
		var remaining []*MetricData
		for _, metric := range metrics {
			if metric.Timestamp.After(before) {
				remaining = append(remaining, metric)
			} else {
				clearedCount++
			}
		}
		r.metrics[name] = remaining
		
		// 如果没有剩余指标，删除该指标名称
		if len(remaining) == 0 {
			delete(r.metrics, name)
		}
	}
	
	r.stats.totalMetrics -= int64(clearedCount)
	
	r.logger.Info("清理指标数据",
		logger.Int("cleared_count", clearedCount),
		logger.Time("before", before),
	)
	
	return nil
}

// GetStats 获取统计信息
func (r *memoryMetricsRepository) GetStats(ctx context.Context) (map[string]interface{}, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	stats := map[string]interface{}{
		"total_metrics":   r.stats.totalMetrics,
		"request_metrics": r.stats.requestMetrics,
		"error_metrics":   r.stats.errorMetrics,
		"source_metrics":  r.stats.sourceMetrics,
		"cache_metrics":   r.stats.cacheMetrics,
		"custom_metrics":  r.stats.customMetrics,
		"metric_names":    len(r.metrics),
	}
	
	return stats, nil
}

// addMetric 添加指标
func (r *memoryMetricsRepository) addMetric(metric *MetricData) {
	if r.metrics[metric.Name] == nil {
		r.metrics[metric.Name] = make([]*MetricData, 0)
	}
	
	r.metrics[metric.Name] = append(r.metrics[metric.Name], metric)
	
	// 限制每个指标的数据点数量（保留最近1000个）
	if len(r.metrics[metric.Name]) > 1000 {
		r.metrics[metric.Name] = r.metrics[metric.Name][len(r.metrics[metric.Name])-1000:]
	}
}

// cleanupOldMetrics 清理旧指标
func (r *memoryMetricsRepository) cleanupOldMetrics() {
	ticker := time.NewTicker(1 * time.Hour) // 每小时清理一次
	defer ticker.Stop()
	
	for range ticker.C {
		// 清理24小时前的指标
		before := time.Now().Add(-24 * time.Hour)
		if err := r.ClearMetrics(context.Background(), before); err != nil {
			r.logger.Error("清理旧指标失败",
				logger.ErrorField("error", err),
			)
		}
	}
}
