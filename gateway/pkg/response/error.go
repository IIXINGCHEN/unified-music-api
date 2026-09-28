// Package response 错误响应构造器
package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// BusinessError 业务错误响应
func BusinessError(c *gin.Context, code int, message string) {
	ErrorWithCode(c, http.StatusOK, code, message)
}

// ValidationError 参数验证错误响应
func ValidationError(c *gin.Context, message string) {
	BadRequest(c, message)
}

// ParameterMissingError 参数缺失错误响应
func ParameterMissingError(c *gin.Context, parameter string) {
	message := "缺少必要参数 " + parameter
	BadRequest(c, message)
}

// ParameterInvalidError 参数无效错误响应
func ParameterInvalidError(c *gin.Context, parameter string, allowedValues []string) {
	message := "无效" + parameter + "参数"
	data := map[string]interface{}{
		"message":        message,
		"allowed_values": allowedValues,
	}
	response := NewResponse(http.StatusBadRequest, message, data)
	JSON(c, http.StatusBadRequest, response)
}

// MatchFailedError 音乐匹配失败错误响应
func MatchFailedError(c *gin.Context) {
	InternalServerError(c, "匹配失败")
}

// ServiceError 服务错误响应
func ServiceError(c *gin.Context, message string) {
	InternalServerError(c, "服务器处理请求失败")
}

// DomainAccessDeniedError 域名访问被拒绝错误响应
func DomainAccessDeniedError(c *gin.Context) {
	Forbidden(c, "请通过正确的域名访问")
}

// RateLimitExceededError 请求频率超限错误响应
func RateLimitExceededError(c *gin.Context) {
	response := NewResponse(429, "请求频率超限，请稍后再试", nil)
	JSON(c, 429, response)
}

// TimeoutError 请求超时错误响应
func TimeoutError(c *gin.Context) {
	response := NewResponse(408, "请求超时", nil)
	JSON(c, 408, response)
}

// MaintenanceError 系统维护错误响应
func MaintenanceError(c *gin.Context) {
	ServiceUnavailable(c, "系统维护中，请稍后再试")
}
