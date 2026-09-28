// Package model 响应数据模型
package model

import (
	"time"
)

// SystemInfoResponse 系统信息响应
type SystemInfoResponse struct {
	Version    string `json:"version"`                    // 版本号
	EnableFlac bool   `json:"enable_flac"`                // 是否启用FLAC
	BuildTime  string `json:"build_time,omitempty"`       // 构建时间
	GitCommit  string `json:"git_commit,omitempty"`       // Git提交
	GoVersion  string `json:"go_version,omitempty"`       // Go版本
	Uptime     string `json:"uptime,omitempty"`           // 运行时间
}

// HealthResponse 健康检查响应
type HealthResponse struct {
	Status    string                    `json:"status"`    // 整体状态
	Timestamp int64                     `json:"timestamp"` // 时间戳
	Uptime    string                    `json:"uptime"`    // 运行时间
	Checks    map[string]CheckResult    `json:"checks"`    // 各项检查结果
}

// CheckResult 检查结果（从health包复制，避免循环依赖）
type CheckResult struct {
	Name      string                 `json:"name"`      // 检查项名称
	Status    string                 `json:"status"`    // 状态
	Message   string                 `json:"message"`   // 消息
	Details   map[string]interface{} `json:"details"`   // 详细信息
	Timestamp time.Time              `json:"timestamp"` // 时间戳
	Duration  time.Duration          `json:"duration"`  // 检查耗时
}

// MetricsResponse 指标响应
type MetricsResponse struct {
	StartTime     time.Time     `json:"start_time"`     // 启动时间
	Uptime        string        `json:"uptime"`         // 运行时间
	GoVersion     string        `json:"go_version"`     // Go版本
	NumGoroutines int           `json:"num_goroutines"` // 协程数量
	NumCPU        int           `json:"num_cpu"`        // CPU核心数
	MemoryStats   MemoryStats   `json:"memory_stats"`   // 内存统计
	RequestStats  RequestStats  `json:"request_stats"`  // 请求统计
	ErrorStats    ErrorStats    `json:"error_stats"`    // 错误统计
}

// MemoryStats 内存统计（从health包复制）
type MemoryStats struct {
	Alloc         uint64  `json:"alloc"`          // 当前分配的内存
	TotalAlloc    uint64  `json:"total_alloc"`    // 总分配的内存
	Sys           uint64  `json:"sys"`            // 系统内存
	Lookups       uint64  `json:"lookups"`        // 查找次数
	Mallocs       uint64  `json:"mallocs"`        // 分配次数
	Frees         uint64  `json:"frees"`          // 释放次数
	HeapAlloc     uint64  `json:"heap_alloc"`     // 堆分配
	HeapSys       uint64  `json:"heap_sys"`       // 堆系统内存
	HeapIdle      uint64  `json:"heap_idle"`      // 堆空闲内存
	HeapInuse     uint64  `json:"heap_inuse"`     // 堆使用内存
	HeapReleased  uint64  `json:"heap_released"`  // 堆释放内存
	HeapObjects   uint64  `json:"heap_objects"`   // 堆对象数
	StackInuse    uint64  `json:"stack_inuse"`    // 栈使用内存
	StackSys      uint64  `json:"stack_sys"`      // 栈系统内存
	MSpanInuse    uint64  `json:"mspan_inuse"`    // MSpan使用内存
	MSpanSys      uint64  `json:"mspan_sys"`      // MSpan系统内存
	MCacheInuse   uint64  `json:"mcache_inuse"`   // MCache使用内存
	MCacheSys     uint64  `json:"mcache_sys"`     // MCache系统内存
	GCSys         uint64  `json:"gc_sys"`         // GC系统内存
	NextGC        uint64  `json:"next_gc"`        // 下次GC阈值
	LastGC        uint64  `json:"last_gc"`        // 上次GC时间
	NumGC         uint32  `json:"num_gc"`         // GC次数
	NumForcedGC   uint32  `json:"num_forced_gc"`  // 强制GC次数
	GCCPUFraction float64 `json:"gc_cpu_fraction"` // GC CPU占用比例
}

// RequestStats 请求统计（从health包复制）
type RequestStats struct {
	TotalRequests     int64   `json:"total_requests"`     // 总请求数
	SuccessRequests   int64   `json:"success_requests"`   // 成功请求数
	ErrorRequests     int64   `json:"error_requests"`     // 错误请求数
	AverageLatency    float64 `json:"average_latency"`    // 平均延迟(ms)
	RequestsPerSecond float64 `json:"requests_per_second"` // 每秒请求数
}

// ErrorStats 错误统计（从health包复制）
type ErrorStats struct {
	TotalErrors   int64            `json:"total_errors"`   // 总错误数
	ErrorsByType  map[string]int64 `json:"errors_by_type"` // 按类型分组的错误数
	ErrorsByCode  map[int]int64    `json:"errors_by_code"` // 按状态码分组的错误数
	LastError     string           `json:"last_error"`     // 最后一个错误
	LastErrorTime time.Time        `json:"last_error_time"` // 最后错误时间
}

// ErrorResponse 错误响应
type ErrorResponse struct {
	Code      int                    `json:"code"`               // 错误码
	Message   string                 `json:"message"`            // 错误消息
	Details   map[string]interface{} `json:"details,omitempty"`  // 错误详情
	Timestamp int64                  `json:"timestamp"`          // 时间戳
	RequestID string                 `json:"request_id,omitempty"` // 请求ID
	Path      string                 `json:"path,omitempty"`     // 请求路径
}

// ValidationErrorResponse 参数验证错误响应
type ValidationErrorResponse struct {
	Code           int                    `json:"code"`            // 错误码
	Message        string                 `json:"message"`         // 错误消息
	Parameter      string                 `json:"parameter"`       // 错误参数
	AllowedValues  []string               `json:"allowed_values,omitempty"` // 允许的值
	Details        map[string]interface{} `json:"details,omitempty"` // 详细信息
	Timestamp      int64                  `json:"timestamp"`       // 时间戳
}

// SuccessResponse 成功响应标准结构
type SuccessResponse struct {
	Code      int         `json:"code"`      // 状态码
	Message   string      `json:"message"`   // 响应消息
	Data      interface{} `json:"data"`      // 响应数据
	Timestamp int64       `json:"timestamp"` // 时间戳
}

// PaginationResponse 分页响应
type PaginationResponse struct {
	Code      int         `json:"code"`      // 状态码
	Message   string      `json:"message"`   // 响应消息
	Data      interface{} `json:"data"`      // 响应数据
	Pagination Pagination `json:"pagination"` // 分页信息
	Timestamp int64       `json:"timestamp"` // 时间戳
}

// Pagination 分页信息
type Pagination struct {
	Page       int   `json:"page"`        // 当前页码
	PageSize   int   `json:"page_size"`   // 每页大小
	Total      int64 `json:"total"`       // 总记录数
	TotalPages int   `json:"total_pages"` // 总页数
	HasNext    bool  `json:"has_next"`    // 是否有下一页
	HasPrev    bool  `json:"has_prev"`    // 是否有上一页
}

// APIResponse 通用API响应接口
type APIResponse interface {
	GetCode() int
	GetMessage() string
	GetData() interface{}
	GetTimestamp() int64
}

// 实现APIResponse接口
func (r *SuccessResponse) GetCode() int         { return r.Code }
func (r *SuccessResponse) GetMessage() string   { return r.Message }
func (r *SuccessResponse) GetData() interface{} { return r.Data }
func (r *SuccessResponse) GetTimestamp() int64  { return r.Timestamp }

func (r *ErrorResponse) GetCode() int         { return r.Code }
func (r *ErrorResponse) GetMessage() string   { return r.Message }
func (r *ErrorResponse) GetData() interface{} { return r.Details }
func (r *ErrorResponse) GetTimestamp() int64  { return r.Timestamp }

// NewSuccessResponse 创建成功响应
func NewSuccessResponse(message string, data interface{}) *SuccessResponse {
	return &SuccessResponse{
		Code:      200,
		Message:   message,
		Data:      data,
		Timestamp: time.Now().Unix(),
	}
}

// NewErrorResponse 创建错误响应
func NewErrorResponse(code int, message string, details map[string]interface{}) *ErrorResponse {
	return &ErrorResponse{
		Code:      code,
		Message:   message,
		Details:   details,
		Timestamp: time.Now().Unix(),
	}
}

// NewValidationErrorResponse 创建参数验证错误响应
func NewValidationErrorResponse(parameter string, allowedValues []string) *ValidationErrorResponse {
	return &ValidationErrorResponse{
		Code:          400,
		Message:       "参数验证失败",
		Parameter:     parameter,
		AllowedValues: allowedValues,
		Timestamp:     time.Now().Unix(),
	}
}

// NewPaginationResponse 创建分页响应
func NewPaginationResponse(message string, data interface{}, pagination Pagination) *PaginationResponse {
	return &PaginationResponse{
		Code:       200,
		Message:    message,
		Data:       data,
		Pagination: pagination,
		Timestamp:  time.Now().Unix(),
	}
}

// CalculatePagination 计算分页信息
func CalculatePagination(page, pageSize int, total int64) Pagination {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}
	
	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))
	
	return Pagination{
		Page:       page,
		PageSize:   pageSize,
		Total:      total,
		TotalPages: totalPages,
		HasNext:    page < totalPages,
		HasPrev:    page > 1,
	}
}
