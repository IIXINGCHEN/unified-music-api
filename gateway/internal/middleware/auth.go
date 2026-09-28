package middleware

import (
	"crypto/subtle"
	"fmt"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/response"
)

// AuthConfig 认证配置
type AuthConfig struct {
	APIKey           string   `json:"api_key"`
	AdminKey         string   `json:"admin_key"`
	WhiteList        []string `json:"white_list"`
	EnableRateLimit  bool     `json:"enable_rate_limit"`
	RateLimitPerMin  int      `json:"rate_limit_per_min"`
	EnableAuditLog   bool     `json:"enable_audit_log"`
	RequireHTTPS     bool     `json:"require_https"`
	AllowedUserAgent []string `json:"allowed_user_agent"`
}

// RateLimiter 速率限制器
type RateLimiter struct {
	requests map[string][]time.Time
	mutex    sync.RWMutex
	limit    int
	window   time.Duration
}

// NewRateLimiter 创建速率限制器
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}

	// 启动清理goroutine
	go rl.cleanup()

	return rl
}

// Allow 检查是否允许请求
func (rl *RateLimiter) Allow(key string) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)

	// 清理过期请求
	requests := rl.requests[key]
	validRequests := make([]time.Time, 0, len(requests))
	for _, req := range requests {
		if req.After(cutoff) {
			validRequests = append(validRequests, req)
		}
	}

	// 检查是否超过限制
	if len(validRequests) >= rl.limit {
		rl.requests[key] = validRequests
		return false
	}

	// 添加当前请求
	validRequests = append(validRequests, now)
	rl.requests[key] = validRequests

	return true
}

// cleanup 清理过期数据
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		rl.mutex.Lock()
		now := time.Now()
		cutoff := now.Add(-rl.window)

		for key, requests := range rl.requests {
			validRequests := make([]time.Time, 0, len(requests))
			for _, req := range requests {
				if req.After(cutoff) {
					validRequests = append(validRequests, req)
				}
			}

			if len(validRequests) == 0 {
				delete(rl.requests, key)
			} else {
				rl.requests[key] = validRequests
			}
		}
		rl.mutex.Unlock()
	}
}

// APIKeyAuth API密钥认证中间件
func APIKeyAuth(config *AuthConfig, rateLimiter *RateLimiter, log logger.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()
		clientIP := c.ClientIP()
		userAgent := c.GetHeader("User-Agent")
		requestPath := c.Request.URL.Path

		// 安全检查：HTTPS要求
		if config.RequireHTTPS && c.Request.Header.Get("X-Forwarded-Proto") != "https" && c.Request.TLS == nil {
			auditLog(log, "HTTPS_REQUIRED", clientIP, userAgent, requestPath, "HTTP请求被拒绝，要求HTTPS")
			response.ErrorWithCode(c, http.StatusUpgradeRequired, http.StatusUpgradeRequired, "要求使用HTTPS连接")
			c.Abort()
			return
		}

		// 安全检查：User-Agent验证
		if len(config.AllowedUserAgent) > 0 && !isValidUserAgent(userAgent, config.AllowedUserAgent) {
			auditLog(log, "INVALID_USER_AGENT", clientIP, userAgent, requestPath, "无效的User-Agent")
			response.ErrorWithCode(c, http.StatusForbidden, http.StatusForbidden, "无效的客户端")
			c.Abort()
			return
		}

		// 检查是否在白名单中
		if isInWhiteList(clientIP, config.WhiteList) {
			auditLog(log, "WHITELIST_ACCESS", clientIP, userAgent, requestPath, "白名单访问")
			c.Next()
			return
		}

		// 速率限制检查
		if config.EnableRateLimit && rateLimiter != nil {
			if !rateLimiter.Allow(clientIP) {
				auditLog(log, "RATE_LIMIT_EXCEEDED", clientIP, userAgent, requestPath, "超过速率限制")
				response.ErrorWithCode(c, http.StatusTooManyRequests, http.StatusTooManyRequests, "请求过于频繁，请稍后再试")
				c.Abort()
				return
			}
		}

		// 检查API密钥
		apiKey := getAPIKey(c)
		if apiKey == "" {
			auditLog(log, "MISSING_API_KEY", clientIP, userAgent, requestPath, "缺少API密钥")
			response.ErrorWithCode(c, http.StatusUnauthorized, http.StatusUnauthorized, "缺少API密钥")
			c.Abort()
			return
		}

		// 使用常量时间比较防止时序攻击
		if !secureCompare(apiKey, config.APIKey) {
			auditLog(log, "INVALID_API_KEY", clientIP, userAgent, requestPath, "无效的API密钥")
			response.ErrorWithCode(c, http.StatusUnauthorized, http.StatusUnauthorized, "无效的API密钥")
			c.Abort()
			return
		}

		// 记录成功访问
		auditLog(log, "API_ACCESS_SUCCESS", clientIP, userAgent, requestPath,
			fmt.Sprintf("API访问成功，耗时: %v", time.Since(startTime)))

		c.Next()
	}
}

// AdminAuth 管理员认证中间件 - 用于敏感操作
func AdminAuth(config *AuthConfig, rateLimiter *RateLimiter, log logger.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()
		clientIP := c.ClientIP()
		userAgent := c.GetHeader("User-Agent")
		requestPath := c.Request.URL.Path

		// 强制HTTPS要求（管理员操作）
		if c.Request.Header.Get("X-Forwarded-Proto") != "https" && c.Request.TLS == nil {
			auditLog(log, "ADMIN_HTTPS_REQUIRED", clientIP, userAgent, requestPath, "管理员操作要求HTTPS")
			response.ErrorWithCode(c, http.StatusUpgradeRequired, http.StatusUpgradeRequired, "管理员操作要求使用HTTPS连接")
			c.Abort()
			return
		}

		// 检查是否在白名单中
		if isInWhiteList(clientIP, config.WhiteList) {
			auditLog(log, "ADMIN_WHITELIST_ACCESS", clientIP, userAgent, requestPath, "管理员白名单访问")
			c.Next()
			return
		}

		// 更严格的速率限制
		if rateLimiter != nil {
			adminLimit := config.RateLimitPerMin / 4 // 管理员接口限制更严格
			if adminLimit < 1 {
				adminLimit = 1
			}
			adminRateLimiter := NewRateLimiter(adminLimit, time.Minute)
			if !adminRateLimiter.Allow(clientIP) {
				auditLog(log, "ADMIN_RATE_LIMIT_EXCEEDED", clientIP, userAgent, requestPath, "管理员接口速率限制")
				response.ErrorWithCode(c, http.StatusTooManyRequests, http.StatusTooManyRequests, "管理员接口访问过于频繁")
				c.Abort()
				return
			}
		}

		// 检查管理员密钥
		adminKey := getAPIKey(c)
		if adminKey == "" {
			auditLog(log, "ADMIN_MISSING_KEY", clientIP, userAgent, requestPath, "缺少管理员密钥")
			response.ErrorWithCode(c, http.StatusUnauthorized, http.StatusUnauthorized, "缺少管理员密钥")
			c.Abort()
			return
		}

		// 使用常量时间比较防止时序攻击
		if !secureCompare(adminKey, config.AdminKey) {
			auditLog(log, "ADMIN_INVALID_KEY", clientIP, userAgent, requestPath, "无效的管理员密钥")
			response.ErrorWithCode(c, http.StatusUnauthorized, http.StatusUnauthorized, "无效的管理员密钥")
			c.Abort()
			return
		}

		// 记录管理员操作
		auditLog(log, "ADMIN_ACCESS_SUCCESS", clientIP, userAgent, requestPath,
			fmt.Sprintf("管理员访问成功，耗时: %v", time.Since(startTime)))

		c.Next()
	}
}

// getAPIKey 从请求中获取API密钥
func getAPIKey(c *gin.Context) string {
	// 优先级：Header > Authorization > Query（生产环境不建议Query）

	// 从X-API-Key Header中获取（推荐方式）
	if key := c.GetHeader("X-API-Key"); key != "" {
		return strings.TrimSpace(key)
	}

	// 从Authorization Header中获取
	if auth := c.GetHeader("Authorization"); auth != "" {
		if strings.HasPrefix(auth, "Bearer ") {
			return strings.TrimSpace(strings.TrimPrefix(auth, "Bearer "))
		}
		if strings.HasPrefix(auth, "ApiKey ") {
			return strings.TrimSpace(strings.TrimPrefix(auth, "ApiKey "))
		}
	}

	// 从自定义Header中获取
	if key := c.GetHeader("X-Auth-Token"); key != "" {
		return strings.TrimSpace(key)
	}

	// 生产环境警告：不建议从查询参数获取密钥（可能被日志记录）
	if key := c.Query("api_key"); key != "" {
		return strings.TrimSpace(key)
	}

	return ""
}

// isInWhiteList 检查IP是否在白名单中
func isInWhiteList(ip string, whiteList []string) bool {
	if len(whiteList) == 0 {
		return false
	}

	// 解析客户端IP
	clientIP := net.ParseIP(ip)
	if clientIP == nil {
		return false
	}

	for _, allowedIP := range whiteList {
		// 通配符匹配
		if allowedIP == "*" {
			return true
		}

		// 精确IP匹配
		if allowedIP == ip {
			return true
		}

		// CIDR网段匹配
		if strings.Contains(allowedIP, "/") {
			_, cidr, err := net.ParseCIDR(allowedIP)
			if err == nil && cidr.Contains(clientIP) {
				return true
			}
		}

		// IP范围匹配（简单实现）
		if strings.Contains(allowedIP, "-") {
			parts := strings.Split(allowedIP, "-")
			if len(parts) == 2 {
				startIP := net.ParseIP(strings.TrimSpace(parts[0]))
				endIP := net.ParseIP(strings.TrimSpace(parts[1]))
				if startIP != nil && endIP != nil {
					if isIPInRange(clientIP, startIP, endIP) {
						return true
					}
				}
			}
		}
	}

	return false
}

// isIPInRange 检查IP是否在指定范围内
func isIPInRange(ip, start, end net.IP) bool {
	if ip.To4() != nil {
		return compareIPv4(ip, start) >= 0 && compareIPv4(ip, end) <= 0
	}
	return compareIPv6(ip, start) >= 0 && compareIPv6(ip, end) <= 0
}

// compareIPv4 比较IPv4地址
func compareIPv4(a, b net.IP) int {
	a4 := a.To4()
	b4 := b.To4()
	if a4 == nil || b4 == nil {
		return 0
	}

	for i := 0; i < 4; i++ {
		if a4[i] < b4[i] {
			return -1
		}
		if a4[i] > b4[i] {
			return 1
		}
	}
	return 0
}

// compareIPv6 比较IPv6地址
func compareIPv6(a, b net.IP) int {
	a16 := a.To16()
	b16 := b.To16()
	if a16 == nil || b16 == nil {
		return 0
	}

	for i := 0; i < 16; i++ {
		if a16[i] < b16[i] {
			return -1
		}
		if a16[i] > b16[i] {
			return 1
		}
	}
	return 0
}

// secureCompare 安全比较字符串（防止时序攻击）
func secureCompare(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}

// isValidUserAgent 验证User-Agent
func isValidUserAgent(userAgent string, allowedAgents []string) bool {
	if len(allowedAgents) == 0 {
		return true
	}

	for _, allowed := range allowedAgents {
		if allowed == "*" {
			return true
		}
		if strings.Contains(userAgent, allowed) {
			return true
		}
	}

	return false
}

// auditLog 审计日志
func auditLog(log logger.Logger, action, clientIP, userAgent, path, message string) {
	if log != nil {
		log.Info("安全审计",
			logger.String("action", action),
			logger.String("client_ip", clientIP),
			logger.String("user_agent", userAgent),
			logger.String("path", path),
			logger.String("message", message),
			logger.String("timestamp", time.Now().Format(time.RFC3339)),
		)
	}
}
