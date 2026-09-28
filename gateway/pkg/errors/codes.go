// Package errors 错误码定义
package errors

// HTTP状态码相关错误
const (
	// 成功
	CodeSuccess = 200

	// 客户端错误 4xx
	CodeBadRequest          = 400 // 请求参数错误
	CodeUnauthorized        = 401 // 未授权
	CodeForbidden           = 403 // 禁止访问
	CodeNotFound            = 404 // 资源不存在
	CodeMethodNotAllowed    = 405 // 方法不允许
	CodeRequestTimeout      = 408 // 请求超时
	CodeTooManyRequests     = 429 // 请求频率超限

	// 服务器错误 5xx
	CodeInternalServerError = 500 // 内部服务器错误
	CodeBadGateway          = 502 // 网关错误
	CodeServiceUnavailable  = 503 // 服务不可用
	CodeGatewayTimeout      = 504 // 网关超时
)

// 业务错误码 (1000-9999)
const (
	// 参数相关错误 1000-1099
	CodeParameterMissing = 1001 // 参数缺失
	CodeParameterInvalid = 1002 // 参数无效
	CodeParameterFormat  = 1003 // 参数格式错误

	// 音乐相关错误 2000-2099
	CodeMusicNotFound    = 2001 // 音乐未找到
	CodeMusicMatchFailed = 2002 // 音乐匹配失败
	CodeMusicSourceError = 2003 // 音源错误
	CodeMusicQualityError = 2004 // 音质错误

	// 网络相关错误 3000-3099
	CodeNetworkTimeout = 3001 // 网络超时
	CodeNetworkError   = 3002 // 网络错误
	CodeProxyError     = 3003 // 代理错误

	// 认证相关错误 4000-4099
	CodeAuthFailed      = 4001 // 认证失败
	CodeTokenInvalid    = 4002 // 令牌无效
	CodeTokenExpired    = 4003 // 令牌过期
	CodePermissionDenied = 4004 // 权限不足

	// 限流相关错误 5000-5099
	CodeRateLimitExceeded = 5001 // 请求频率超限
	CodeQuotaExceeded     = 5002 // 配额超限

	// 系统相关错误 9000-9099
	CodeSystemMaintenance = 9001 // 系统维护
	CodeSystemOverload    = 9002 // 系统过载
	CodeConfigError       = 9003 // 配置错误
)

// 错误消息映射
var ErrorMessages = map[int]string{
	// HTTP状态码错误消息
	CodeSuccess:             "成功",
	CodeBadRequest:          "请求参数错误",
	CodeUnauthorized:        "未授权访问",
	CodeForbidden:           "禁止访问",
	CodeNotFound:            "资源不存在",
	CodeMethodNotAllowed:    "请求方法不允许",
	CodeRequestTimeout:      "请求超时",
	CodeTooManyRequests:     "请求频率超限",
	CodeInternalServerError: "内部服务器错误",
	CodeBadGateway:          "网关错误",
	CodeServiceUnavailable:  "服务不可用",
	CodeGatewayTimeout:      "网关超时",

	// 业务错误消息
	CodeParameterMissing:  "参数缺失",
	CodeParameterInvalid:  "参数无效",
	CodeParameterFormat:   "参数格式错误",
	CodeMusicNotFound:     "音乐未找到",
	CodeMusicMatchFailed:  "音乐匹配失败",
	CodeMusicSourceError:  "音源错误",
	CodeMusicQualityError: "音质错误",
	CodeNetworkTimeout:    "网络超时",
	CodeNetworkError:      "网络错误",
	CodeProxyError:        "代理错误",
	CodeAuthFailed:        "认证失败",
	CodeTokenInvalid:      "令牌无效",
	CodeTokenExpired:      "令牌过期",
	CodePermissionDenied:  "权限不足",
	CodeRateLimitExceeded: "请求频率超限",
	CodeQuotaExceeded:     "配额超限",
	CodeSystemMaintenance: "系统维护中",
	CodeSystemOverload:    "系统过载",
	CodeConfigError:       "配置错误",
}

// GetErrorMessage 获取错误消息
func GetErrorMessage(code int) string {
	if message, exists := ErrorMessages[code]; exists {
		return message
	}
	return "未知错误"
}
