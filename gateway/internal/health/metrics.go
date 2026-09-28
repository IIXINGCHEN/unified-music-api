// Package health 健康指标
package health

import (
	"runtime"
	"sync"
	"time"
)

// Metrics 健康指标
type Metrics struct {
	mu sync.RWMutex
	
	// 系统指标
	StartTime     time.Time `json:"start_time"`
	Uptime        string    `json:"uptime"`
	
	// 运行时指标
	GoVersion     string `json:"go_version"`
	NumGoroutines int    `json:"num_goroutines"`
	NumCPU        int    `json:"num_cpu"`
	
	// 内存指标
	MemoryStats   MemoryStats `json:"memory_stats"`
	
	// 请求指标
	RequestStats  RequestStats `json:"request_stats"`
	
	// 错误指标
	ErrorStats    ErrorStats `json:"error_stats"`
}

// MemoryStats 内存统计
type MemoryStats struct {
	Alloc        uint64 `json:"alloc"`         // 当前分配的内存
	TotalAlloc   uint64 `json:"total_alloc"`   // 总分配的内存
	Sys          uint64 `json:"sys"`           // 系统内存
	Lookups      uint64 `json:"lookups"`       // 查找次数
	Mallocs      uint64 `json:"mallocs"`       // 分配次数
	Frees        uint64 `json:"frees"`         // 释放次数
	HeapAlloc    uint64 `json:"heap_alloc"`    // 堆分配
	HeapSys      uint64 `json:"heap_sys"`      // 堆系统内存
	HeapIdle     uint64 `json:"heap_idle"`     // 堆空闲内存
	HeapInuse    uint64 `json:"heap_inuse"`    // 堆使用内存
	HeapReleased uint64 `json:"heap_released"` // 堆释放内存
	HeapObjects  uint64 `json:"heap_objects"`  // 堆对象数
	StackInuse   uint64 `json:"stack_inuse"`   // 栈使用内存
	StackSys     uint64 `json:"stack_sys"`     // 栈系统内存
	MSpanInuse   uint64 `json:"mspan_inuse"`   // MSpan使用内存
	MSpanSys     uint64 `json:"mspan_sys"`     // MSpan系统内存
	MCacheInuse  uint64 `json:"mcache_inuse"`  // MCache使用内存
	MCacheSys    uint64 `json:"mcache_sys"`    // MCache系统内存
	GCSys        uint64 `json:"gc_sys"`        // GC系统内存
	NextGC       uint64 `json:"next_gc"`       // 下次GC阈值
	LastGC       uint64 `json:"last_gc"`       // 上次GC时间
	NumGC        uint32 `json:"num_gc"`        // GC次数
	NumForcedGC  uint32 `json:"num_forced_gc"` // 强制GC次数
	GCCPUFraction float64 `json:"gc_cpu_fraction"` // GC CPU占用比例
}

// RequestStats 请求统计
type RequestStats struct {
	TotalRequests    int64   `json:"total_requests"`    // 总请求数
	SuccessRequests  int64   `json:"success_requests"`  // 成功请求数
	ErrorRequests    int64   `json:"error_requests"`    // 错误请求数
	AverageLatency   float64 `json:"average_latency"`   // 平均延迟(ms)
	RequestsPerSecond float64 `json:"requests_per_second"` // 每秒请求数
}

// ErrorStats 错误统计
type ErrorStats struct {
	TotalErrors     int64            `json:"total_errors"`     // 总错误数
	ErrorsByType    map[string]int64 `json:"errors_by_type"`   // 按类型分组的错误数
	ErrorsByCode    map[int]int64    `json:"errors_by_code"`   // 按状态码分组的错误数
	LastError       string           `json:"last_error"`       // 最后一个错误
	LastErrorTime   time.Time        `json:"last_error_time"`  // 最后错误时间
}

// MetricsCollector 指标收集器
type MetricsCollector struct {
	mu        sync.RWMutex
	startTime time.Time
	metrics   *Metrics
}

// NewMetricsCollector 创建指标收集器
func NewMetricsCollector() *MetricsCollector {
	return &MetricsCollector{
		startTime: time.Now(),
		metrics: &Metrics{
			StartTime: time.Now(),
			RequestStats: RequestStats{
				TotalRequests:   0,
				SuccessRequests: 0,
				ErrorRequests:   0,
			},
			ErrorStats: ErrorStats{
				ErrorsByType: make(map[string]int64),
				ErrorsByCode: make(map[int]int64),
			},
		},
	}
}

// GetMetrics 获取当前指标
func (c *MetricsCollector) GetMetrics() *Metrics {
	c.mu.Lock()
	defer c.mu.Unlock()
	
	// 更新运行时指标
	c.updateRuntimeMetrics()
	
	// 更新内存指标
	c.updateMemoryMetrics()
	
	// 计算运行时间
	c.metrics.Uptime = time.Since(c.startTime).String()
	
	return c.metrics
}

// updateRuntimeMetrics 更新运行时指标
func (c *MetricsCollector) updateRuntimeMetrics() {
	c.metrics.GoVersion = runtime.Version()
	c.metrics.NumGoroutines = runtime.NumGoroutine()
	c.metrics.NumCPU = runtime.NumCPU()
}

// updateMemoryMetrics 更新内存指标
func (c *MetricsCollector) updateMemoryMetrics() {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	
	c.metrics.MemoryStats = MemoryStats{
		Alloc:         m.Alloc,
		TotalAlloc:    m.TotalAlloc,
		Sys:           m.Sys,
		Lookups:       m.Lookups,
		Mallocs:       m.Mallocs,
		Frees:         m.Frees,
		HeapAlloc:     m.HeapAlloc,
		HeapSys:       m.HeapSys,
		HeapIdle:      m.HeapIdle,
		HeapInuse:     m.HeapInuse,
		HeapReleased:  m.HeapReleased,
		HeapObjects:   m.HeapObjects,
		StackInuse:    m.StackInuse,
		StackSys:      m.StackSys,
		MSpanInuse:    m.MSpanInuse,
		MSpanSys:      m.MSpanSys,
		MCacheInuse:   m.MCacheInuse,
		MCacheSys:     m.MCacheSys,
		GCSys:         m.GCSys,
		NextGC:        m.NextGC,
		LastGC:        m.LastGC,
		NumGC:         m.NumGC,
		NumForcedGC:   m.NumForcedGC,
		GCCPUFraction: m.GCCPUFraction,
	}
}

// RecordRequest 记录请求
func (c *MetricsCollector) RecordRequest(success bool, latency time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	
	c.metrics.RequestStats.TotalRequests++
	
	if success {
		c.metrics.RequestStats.SuccessRequests++
	} else {
		c.metrics.RequestStats.ErrorRequests++
	}
	
	// 更新平均延迟（指数加权移动平均）
	if c.metrics.RequestStats.TotalRequests == 1 {
		c.metrics.RequestStats.AverageLatency = float64(latency.Nanoseconds()) / 1e6
	} else {
		currentAvg := c.metrics.RequestStats.AverageLatency
		newLatency := float64(latency.Nanoseconds()) / 1e6
		c.metrics.RequestStats.AverageLatency = (currentAvg*float64(c.metrics.RequestStats.TotalRequests-1) + newLatency) / float64(c.metrics.RequestStats.TotalRequests)
	}
	
	// 计算每秒请求数
	uptime := time.Since(c.startTime).Seconds()
	if uptime > 0 {
		c.metrics.RequestStats.RequestsPerSecond = float64(c.metrics.RequestStats.TotalRequests) / uptime
	}
}

// RecordError 记录错误
func (c *MetricsCollector) RecordError(errorType string, statusCode int, errorMsg string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	
	c.metrics.ErrorStats.TotalErrors++
	c.metrics.ErrorStats.ErrorsByType[errorType]++
	c.metrics.ErrorStats.ErrorsByCode[statusCode]++
	c.metrics.ErrorStats.LastError = errorMsg
	c.metrics.ErrorStats.LastErrorTime = time.Now()
}

// 全局指标收集器实例
var defaultMetricsCollector *MetricsCollector

// InitDefaultMetricsCollector 初始化默认指标收集器
func InitDefaultMetricsCollector() {
	defaultMetricsCollector = NewMetricsCollector()
}

// GetDefaultMetricsCollector 获取默认指标收集器
func GetDefaultMetricsCollector() *MetricsCollector {
	if defaultMetricsCollector == nil {
		InitDefaultMetricsCollector()
	}
	return defaultMetricsCollector
}
