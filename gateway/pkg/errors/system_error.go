// Package errors 系统错误定义
package errors

import (
	"fmt"
	"runtime"
)

// SystemError 系统错误结构体
type SystemError struct {
	Code       int    `json:"code"`       // 错误码
	Message    string `json:"message"`    // 错误消息
	Details    string `json:"details"`    // 错误详情
	StackTrace string `json:"stack_trace"` // 堆栈跟踪
	Cause      error  `json:"-"`          // 原始错误
}

// Error 实现error接口
func (e *SystemError) Error() string {
	if e.Details != "" {
		return fmt.Sprintf("系统错误[%d]: %s - %s", e.Code, e.Message, e.Details)
	}
	return fmt.Sprintf("系统错误[%d]: %s", e.Code, e.Message)
}

// Unwrap 支持错误链
func (e *SystemError) Unwrap() error {
	return e.Cause
}

// NewSystemError 创建系统错误
func NewSystemError(code int, message string) *SystemError {
	if message == "" {
		message = GetErrorMessage(code)
	}
	
	// 获取堆栈跟踪
	stackTrace := getStackTrace()
	
	return &SystemError{
		Code:       code,
		Message:    message,
		StackTrace: stackTrace,
	}
}

// NewSystemErrorWithDetails 创建带详情的系统错误
func NewSystemErrorWithDetails(code int, message, details string) *SystemError {
	if message == "" {
		message = GetErrorMessage(code)
	}
	
	stackTrace := getStackTrace()
	
	return &SystemError{
		Code:       code,
		Message:    message,
		Details:    details,
		StackTrace: stackTrace,
	}
}

// NewSystemErrorWithCause 创建带原因的系统错误
func NewSystemErrorWithCause(code int, message string, cause error) *SystemError {
	if message == "" {
		message = GetErrorMessage(code)
	}
	
	stackTrace := getStackTrace()
	
	return &SystemError{
		Code:       code,
		Message:    message,
		Cause:      cause,
		StackTrace: stackTrace,
	}
}

// getStackTrace 获取堆栈跟踪信息
func getStackTrace() string {
	buf := make([]byte, 1024)
	for {
		n := runtime.Stack(buf, false)
		if n < len(buf) {
			return string(buf[:n])
		}
		buf = make([]byte, 2*len(buf))
	}
}

// 预定义系统错误
var (
	ErrSystemInternalError = NewSystemError(CodeInternalServerError, "")
	ErrSystemUnavailable   = NewSystemError(CodeServiceUnavailable, "")
	ErrBadGateway          = NewSystemError(CodeBadGateway, "")
	ErrGatewayTimeout      = NewSystemError(CodeGatewayTimeout, "")
)

// 便捷方法
func NewInternalServerError(details string) *SystemError {
	return NewSystemErrorWithDetails(CodeInternalServerError, "内部服务器错误", details)
}

func NewServiceUnavailableError(service string) *SystemError {
	details := fmt.Sprintf("服务 %s 不可用", service)
	return NewSystemErrorWithDetails(CodeServiceUnavailable, "服务不可用", details)
}

func NewConfigurationError(configKey string) *SystemError {
	details := fmt.Sprintf("配置项 %s 错误或缺失", configKey)
	return NewSystemErrorWithDetails(CodeConfigError, "配置错误", details)
}

// PanicError panic错误包装
type PanicError struct {
	Value      interface{} `json:"value"`       // panic值
	StackTrace string      `json:"stack_trace"` // 堆栈跟踪
}

// Error 实现error接口
func (e *PanicError) Error() string {
	return fmt.Sprintf("panic错误: %v", e.Value)
}

// NewPanicError 创建panic错误
func NewPanicError(value interface{}) *PanicError {
	return &PanicError{
		Value:      value,
		StackTrace: getStackTrace(),
	}
}

// RecoverError 从panic中恢复并转换为错误
func RecoverError() error {
	if r := recover(); r != nil {
		return NewPanicError(r)
	}
	return nil
}
