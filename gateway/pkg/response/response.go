// Package response 提供统一的HTTP响应格式
package response

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/errors"
)

// Response 统一响应结构体
type Response struct {
	Code      int         `json:"code"`                // 响应状态码
	Message   string      `json:"message"`             // 响应消息
	Data      interface{} `json:"data,omitempty"`      // 响应数据
	Timestamp int64       `json:"timestamp"`           // 时间戳
}

// NewResponse 创建新的响应实例
func NewResponse(code int, message string, data interface{}) *Response {
	return &Response{
		Code:      code,
		Message:   message,
		Data:      data,
		Timestamp: time.Now().Unix(),
	}
}

// JSON 发送JSON响应
func JSON(c *gin.Context, httpCode int, response *Response) {
	c.Header("Content-Type", "application/json; charset=utf-8")
	c.JSON(httpCode, response)
}

// Success 发送成功响应
func Success(c *gin.Context, message string, data interface{}) {
	response := NewResponse(http.StatusOK, message, data)
	JSON(c, http.StatusOK, response)
}

// Error 发送错误响应 - 支持多种错误类型
func Error(c *gin.Context, err interface{}) {
	var httpCode int
	var code int
	var message string

	switch e := err.(type) {
	case *errors.BusinessError:
		// 业务错误
		code = e.Code
		message = e.Message
		if e.Details != "" {
			message = message + ": " + e.Details
		}

		// 根据业务错误码映射HTTP状态码
		switch e.Code {
		case errors.CodeParameterMissing, errors.CodeParameterInvalid, errors.CodeParameterFormat:
			httpCode = http.StatusBadRequest
		case errors.CodeUnauthorized, errors.CodeAuthFailed, errors.CodeTokenInvalid, errors.CodeTokenExpired:
			httpCode = http.StatusUnauthorized
		case errors.CodeForbidden, errors.CodePermissionDenied:
			httpCode = http.StatusForbidden
		case errors.CodeNotFound, errors.CodeMusicNotFound:
			httpCode = http.StatusNotFound
		case errors.CodeTooManyRequests, errors.CodeRateLimitExceeded:
			httpCode = http.StatusTooManyRequests
		case errors.CodeServiceUnavailable, errors.CodeSystemMaintenance:
			httpCode = http.StatusServiceUnavailable
		default:
			httpCode = http.StatusInternalServerError
		}

	case *errors.SystemError:
		// 系统错误
		code = e.Code
		message = e.Message
		httpCode = http.StatusInternalServerError

	case error:
		// 普通错误
		code = http.StatusInternalServerError
		message = e.Error()
		httpCode = http.StatusInternalServerError

	default:
		// 未知错误类型
		code = http.StatusInternalServerError
		message = "内部服务器错误"
		httpCode = http.StatusInternalServerError
	}

	response := NewResponse(code, message, nil)
	JSON(c, httpCode, response)
}

// ErrorWithCode 发送指定状态码的错误响应
func ErrorWithCode(c *gin.Context, httpCode int, code int, message string) {
	response := NewResponse(code, message, nil)
	JSON(c, httpCode, response)
}

// BadRequest 发送400错误响应
func BadRequest(c *gin.Context, message string) {
	ErrorWithCode(c, http.StatusBadRequest, http.StatusBadRequest, message)
}

// Unauthorized 发送401错误响应
func Unauthorized(c *gin.Context, message string) {
	ErrorWithCode(c, http.StatusUnauthorized, http.StatusUnauthorized, message)
}

// Forbidden 发送403错误响应
func Forbidden(c *gin.Context, message string) {
	ErrorWithCode(c, http.StatusForbidden, http.StatusForbidden, message)
}

// NotFound 发送404错误响应
func NotFound(c *gin.Context, message string) {
	ErrorWithCode(c, http.StatusNotFound, http.StatusNotFound, message)
}

// InternalServerError 发送500错误响应
func InternalServerError(c *gin.Context, message string) {
	ErrorWithCode(c, http.StatusInternalServerError, http.StatusInternalServerError, message)
}

// ServiceUnavailable 发送503错误响应
func ServiceUnavailable(c *gin.Context, message string) {
	ErrorWithCode(c, http.StatusServiceUnavailable, http.StatusServiceUnavailable, message)
}
