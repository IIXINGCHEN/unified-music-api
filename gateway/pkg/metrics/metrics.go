// Package metrics 提供Prometheus指标收集功能
package metrics

import (
	"strconv"
	"sync"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// Metrics 指标收集器
type Metrics struct {
	// HTTP请求指标
	httpRequestsTotal    *prometheus.CounterVec
	httpRequestDuration  *prometheus.HistogramVec
	httpRequestSize      *prometheus.HistogramVec
	httpResponseSize     *prometheus.HistogramVec

	// 音乐服务指标
	musicRequestsTotal   *prometheus.CounterVec
	musicRequestDuration *prometheus.HistogramVec
	musicSourcesTotal    *prometheus.CounterVec
	musicCacheHits       *prometheus.CounterVec

	// 系统指标
	systemInfo           *prometheus.GaugeVec
	goInfo               *prometheus.GaugeVec
	processStartTime     prometheus.Gauge
	processUptime        prometheus.Gauge

	// 缓存指标
	cacheOperations      *prometheus.CounterVec
	cacheHitRatio        *prometheus.GaugeVec
	cacheSize            *prometheus.GaugeVec

	// 错误指标
	errorsTotal          *prometheus.CounterVec
}

// NewMetrics 创建指标收集器
func NewMetrics() *Metrics {
	return &Metrics{
		// HTTP请求指标
		httpRequestsTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "unm_http_requests_total",
				Help: "HTTP请求总数",
			},
			[]string{"method", "path", "status_code"},
		),
		httpRequestDuration: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "unm_http_request_duration_seconds",
				Help:    "HTTP请求持续时间",
				Buckets: prometheus.DefBuckets,
			},
			[]string{"method", "path"},
		),
		httpRequestSize: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "unm_http_request_size_bytes",
				Help:    "HTTP请求大小",
				Buckets: prometheus.ExponentialBuckets(100, 10, 8),
			},
			[]string{"method", "path"},
		),
		httpResponseSize: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "unm_http_response_size_bytes",
				Help:    "HTTP响应大小",
				Buckets: prometheus.ExponentialBuckets(100, 10, 8),
			},
			[]string{"method", "path"},
		),

		// 音乐服务指标
		musicRequestsTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "unm_music_requests_total",
				Help: "音乐请求总数",
			},
			[]string{"source", "quality", "status"},
		),
		musicRequestDuration: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "unm_music_request_duration_seconds",
				Help:    "音乐请求持续时间",
				Buckets: prometheus.DefBuckets,
			},
			[]string{"source", "quality"},
		),
		musicSourcesTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "unm_music_sources_total",
				Help: "音源使用统计",
			},
			[]string{"source", "status"},
		),
		musicCacheHits: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "unm_music_cache_hits_total",
				Help: "音乐缓存命中统计",
			},
			[]string{"type"},
		),

		// 系统指标
		systemInfo: promauto.NewGaugeVec(
			prometheus.GaugeOpts{
				Name: "unm_system_info",
				Help: "系统信息",
			},
			[]string{"version", "go_version", "build_time"},
		),
		goInfo: promauto.NewGaugeVec(
			prometheus.GaugeOpts{
				Name: "unm_go_info",
				Help: "Go运行时信息",
			},
			[]string{"version"},
		),
		processStartTime: promauto.NewGauge(
			prometheus.GaugeOpts{
				Name: "unm_process_start_time_seconds",
				Help: "进程启动时间",
			},
		),
		processUptime: promauto.NewGauge(
			prometheus.GaugeOpts{
				Name: "unm_process_uptime_seconds",
				Help: "进程运行时间",
			},
		),

		// 缓存指标
		cacheOperations: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "unm_cache_operations_total",
				Help: "缓存操作统计",
			},
			[]string{"type", "operation", "status"},
		),
		cacheHitRatio: promauto.NewGaugeVec(
			prometheus.GaugeOpts{
				Name: "unm_cache_hit_ratio",
				Help: "缓存命中率",
			},
			[]string{"type"},
		),
		cacheSize: promauto.NewGaugeVec(
			prometheus.GaugeOpts{
				Name: "cache_size_bytes",
				Help: "缓存大小",
			},
			[]string{"type"},
		),

		// 错误指标
		errorsTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "errors_total",
				Help: "错误统计",
			},
			[]string{"type", "source"},
		),
	}
}

// RecordHTTPRequest 记录HTTP请求指标
func (m *Metrics) RecordHTTPRequest(method, path string, statusCode int, duration time.Duration, requestSize, responseSize int64) {
	// 如果指标收集器未正确初始化，直接返回
	if m == nil || m.httpRequestsTotal == nil {
		return
	}

	status := strconv.Itoa(statusCode)

	m.httpRequestsTotal.WithLabelValues(method, path, status).Inc()

	if m.httpRequestDuration != nil {
		m.httpRequestDuration.WithLabelValues(method, path).Observe(duration.Seconds())
	}

	if requestSize > 0 && m.httpRequestSize != nil {
		m.httpRequestSize.WithLabelValues(method, path).Observe(float64(requestSize))
	}
	if responseSize > 0 && m.httpResponseSize != nil {
		m.httpResponseSize.WithLabelValues(method, path).Observe(float64(responseSize))
	}
}

// RecordMusicRequest 记录音乐请求指标
func (m *Metrics) RecordMusicRequest(source, quality, status string, duration time.Duration) {
	m.musicRequestsTotal.WithLabelValues(source, quality, status).Inc()
	m.musicRequestDuration.WithLabelValues(source, quality).Observe(duration.Seconds())
}

// RecordMusicSource 记录音源使用指标
func (m *Metrics) RecordMusicSource(source, status string) {
	m.musicSourcesTotal.WithLabelValues(source, status).Inc()
}

// RecordMusicCacheHit 记录音乐缓存命中指标
func (m *Metrics) RecordMusicCacheHit(cacheType string) {
	m.musicCacheHits.WithLabelValues(cacheType).Inc()
}

// SetSystemInfo 设置系统信息指标
func (m *Metrics) SetSystemInfo(version, goVersion, buildTime string) {
	m.systemInfo.WithLabelValues(version, goVersion, buildTime).Set(1)
}

// SetGoInfo 设置Go信息指标
func (m *Metrics) SetGoInfo(version string) {
	m.goInfo.WithLabelValues(version).Set(1)
}

// SetProcessStartTime 设置进程启动时间
func (m *Metrics) SetProcessStartTime(startTime time.Time) {
	m.processStartTime.Set(float64(startTime.Unix()))
}

// UpdateProcessUptime 更新进程运行时间
func (m *Metrics) UpdateProcessUptime(startTime time.Time) {
	uptime := time.Since(startTime)
	m.processUptime.Set(uptime.Seconds())
}

// RecordCacheOperation 记录缓存操作指标
func (m *Metrics) RecordCacheOperation(cacheType, operation, status string) {
	m.cacheOperations.WithLabelValues(cacheType, operation, status).Inc()
}

// SetCacheHitRatio 设置缓存命中率
func (m *Metrics) SetCacheHitRatio(cacheType string, ratio float64) {
	m.cacheHitRatio.WithLabelValues(cacheType).Set(ratio)
}

// SetCacheSize 设置缓存大小
func (m *Metrics) SetCacheSize(cacheType string, size int64) {
	m.cacheSize.WithLabelValues(cacheType).Set(float64(size))
}

// RecordError 记录错误指标
func (m *Metrics) RecordError(errorType, source string) {
	m.errorsTotal.WithLabelValues(errorType, source).Inc()
}

// 全局指标实例
var (
	defaultMetrics *Metrics
	once           sync.Once
)

// Init 初始化默认指标收集器
func Init() {
	once.Do(func() {
		defaultMetrics = NewMetrics()
	})
}

// GetDefault 获取默认指标收集器
func GetDefault() *Metrics {
	if defaultMetrics == nil {
		Init()
	}
	// 如果初始化失败，返回一个空的指标收集器以避免panic
	if defaultMetrics == nil {
		return &Metrics{}
	}
	return defaultMetrics
}

// 便捷方法 - 使用默认指标收集器
func RecordHTTPRequest(method, path string, statusCode int, duration time.Duration, requestSize, responseSize int64) {
	GetDefault().RecordHTTPRequest(method, path, statusCode, duration, requestSize, responseSize)
}

func RecordMusicRequest(source, quality, status string, duration time.Duration) {
	GetDefault().RecordMusicRequest(source, quality, status, duration)
}

func RecordMusicSource(source, status string) {
	GetDefault().RecordMusicSource(source, status)
}

func RecordMusicCacheHit(cacheType string) {
	GetDefault().RecordMusicCacheHit(cacheType)
}

func SetSystemInfo(version, goVersion, buildTime string) {
	GetDefault().SetSystemInfo(version, goVersion, buildTime)
}

func SetGoInfo(version string) {
	GetDefault().SetGoInfo(version)
}

func SetProcessStartTime(startTime time.Time) {
	GetDefault().SetProcessStartTime(startTime)
}

func UpdateProcessUptime(startTime time.Time) {
	GetDefault().UpdateProcessUptime(startTime)
}

func RecordCacheOperation(cacheType, operation, status string) {
	GetDefault().RecordCacheOperation(cacheType, operation, status)
}

func SetCacheHitRatio(cacheType string, ratio float64) {
	GetDefault().SetCacheHitRatio(cacheType, ratio)
}

func SetCacheSize(cacheType string, size int64) {
	GetDefault().SetCacheSize(cacheType, size)
}

func RecordError(errorType, source string) {
	GetDefault().RecordError(errorType, source)
}
