// Package errors 业务错误定义
package errors

import (
	"fmt"
)

// BusinessError 业务错误结构体
type BusinessError struct {
	Code    int    `json:"code"`    // 错误码
	Message string `json:"message"` // 错误消息
	Details string `json:"details"` // 错误详情
	Cause   error  `json:"-"`       // 原始错误
}

// Error 实现error接口
func (e *BusinessError) Error() string {
	if e.Details != "" {
		return fmt.Sprintf("业务错误[%d]: %s - %s", e.Code, e.Message, e.Details)
	}
	return fmt.Sprintf("业务错误[%d]: %s", e.Code, e.Message)
}

// Unwrap 支持错误链
func (e *BusinessError) Unwrap() error {
	return e.Cause
}

// NewBusinessError 创建业务错误
func NewBusinessError(code int, message string) *BusinessError {
	if message == "" {
		message = GetErrorMessage(code)
	}
	return &BusinessError{
		Code:    code,
		Message: message,
	}
}

// NewBusinessErrorWithDetails 创建带详情的业务错误
func NewBusinessErrorWithDetails(code int, message, details string) *BusinessError {
	if message == "" {
		message = GetErrorMessage(code)
	}
	return &BusinessError{
		Code:    code,
		Message: message,
		Details: details,
	}
}

// NewBusinessErrorWithCause 创建带原因的业务错误
func NewBusinessErrorWithCause(code int, message string, cause error) *BusinessError {
	if message == "" {
		message = GetErrorMessage(code)
	}
	return &BusinessError{
		Code:    code,
		Message: message,
		Cause:   cause,
	}
}

// WithMessage 设置错误消息
func (e *BusinessError) WithMessage(message string) *BusinessError {
	return &BusinessError{
		Code:    e.Code,
		Message: message,
		Details: e.Details,
		Cause:   e.Cause,
	}
}

// WithDetails 设置错误详情
func (e *BusinessError) WithDetails(details interface{}) *BusinessError {
	var detailsStr string
	switch v := details.(type) {
	case string:
		detailsStr = v
	case map[string]interface{}:
		// 完整的map转字符串
		detailsStr = fmt.Sprintf("%v", v)
	default:
		detailsStr = fmt.Sprintf("%v", v)
	}

	return &BusinessError{
		Code:    e.Code,
		Message: e.Message,
		Details: detailsStr,
		Cause:   e.Cause,
	}
}

// 预定义业务错误
var (
	// 参数相关错误
	ErrParameterMissing = NewBusinessError(CodeParameterMissing, "")
	ErrParameterInvalid = NewBusinessError(CodeParameterInvalid, "")
	ErrParameterFormat  = NewBusinessError(CodeParameterFormat, "")

	// 音乐相关错误
	ErrMusicNotFound    = NewBusinessError(CodeMusicNotFound, "")
	ErrMusicMatchFailed = NewBusinessError(CodeMusicMatchFailed, "")
	ErrMusicSourceError = NewBusinessError(CodeMusicSourceError, "")
	ErrMusicQualityError = NewBusinessError(CodeMusicQualityError, "")

	// 网络相关错误
	ErrNetworkTimeout = NewBusinessError(CodeNetworkTimeout, "")
	ErrNetworkError   = NewBusinessError(CodeNetworkError, "")
	ErrProxyError     = NewBusinessError(CodeProxyError, "")

	// 认证相关错误
	ErrAuthFailed      = NewBusinessError(CodeAuthFailed, "")
	ErrTokenInvalid    = NewBusinessError(CodeTokenInvalid, "")
	ErrTokenExpired    = NewBusinessError(CodeTokenExpired, "")
	ErrPermissionDenied = NewBusinessError(CodePermissionDenied, "")

	// 限流相关错误
	ErrRateLimitExceeded = NewBusinessError(CodeRateLimitExceeded, "")
	ErrQuotaExceeded     = NewBusinessError(CodeQuotaExceeded, "")

	// 系统相关错误
	ErrSystemMaintenance = NewBusinessError(CodeSystemMaintenance, "")
	ErrSystemOverload    = NewBusinessError(CodeSystemOverload, "")
	ErrConfigError       = NewBusinessError(CodeConfigError, "")

	// 通用错误
	ErrInvalidParameter   = NewBusinessError(CodeParameterInvalid, "")
	ErrResourceNotFound   = NewBusinessError(CodeNotFound, "")
	ErrInternalServer     = NewBusinessError(CodeInternalServerError, "")
	ErrServiceUnavailable = NewBusinessError(CodeServiceUnavailable, "")
)

// 便捷方法
func NewParameterMissingError(parameter string) *BusinessError {
	return NewBusinessErrorWithDetails(CodeParameterMissing, "参数缺失", "缺少必要参数: "+parameter)
}

func NewParameterInvalidError(parameter string, value interface{}) *BusinessError {
	details := fmt.Sprintf("参数 %s 的值 %v 无效", parameter, value)
	return NewBusinessErrorWithDetails(CodeParameterInvalid, "参数无效", details)
}

func NewMusicMatchFailedError(musicID string) *BusinessError {
	details := fmt.Sprintf("音乐ID %s 匹配失败", musicID)
	return NewBusinessErrorWithDetails(CodeMusicMatchFailed, "音乐匹配失败", details)
}

func NewNetworkTimeoutError(url string) *BusinessError {
	details := fmt.Sprintf("请求 %s 超时", url)
	return NewBusinessErrorWithDetails(CodeNetworkTimeout, "网络超时", details)
}
