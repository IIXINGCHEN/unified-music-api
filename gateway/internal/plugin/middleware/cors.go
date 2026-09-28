package middleware

import (
	"context"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/plugin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// CORSPlugin CORS中间件插件
type CORSPlugin struct {
	*BaseMiddlewarePlugin
	allowedOrigins   []string
	allowedMethods   []string
	allowedHeaders   []string
	exposedHeaders   []string
	allowCredentials bool
	maxAge           string
}

// NewCORSPlugin 创建CORS插件
func NewCORSPlugin() plugin.MiddlewarePlugin {
	p := &CORSPlugin{
		BaseMiddlewarePlugin: NewBaseMiddlewarePlugin(
			"cors",
			"v1.0.0",
			"CORS跨域资源共享中间件插件",
			10, // 优先级较高，早期执行
		),
		allowedOrigins:   []string{"*"},
		allowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		allowedHeaders:   []string{"*"},
		exposedHeaders:   []string{},
		allowCredentials: false,
		maxAge:           "12h",
	}
	
	return p
}

// Initialize 初始化CORS插件
func (p *CORSPlugin) Initialize(ctx context.Context, config map[string]interface{}, logger logger.Logger) error {
	// 调用基础初始化
	if err := p.BaseMiddlewarePlugin.Initialize(ctx, config, logger); err != nil {
		return err
	}
	
	// 读取CORS配置
	if origins, exists := config["allowed_origins"]; exists {
		if originList, ok := origins.([]interface{}); ok {
			p.allowedOrigins = make([]string, len(originList))
			for i, origin := range originList {
				if originStr, ok := origin.(string); ok {
					p.allowedOrigins[i] = originStr
				}
			}
		}
	}
	
	if methods, exists := config["allowed_methods"]; exists {
		if methodList, ok := methods.([]interface{}); ok {
			p.allowedMethods = make([]string, len(methodList))
			for i, method := range methodList {
				if methodStr, ok := method.(string); ok {
					p.allowedMethods[i] = methodStr
				}
			}
		}
	}
	
	if headers, exists := config["allowed_headers"]; exists {
		if headerList, ok := headers.([]interface{}); ok {
			p.allowedHeaders = make([]string, len(headerList))
			for i, header := range headerList {
				if headerStr, ok := header.(string); ok {
					p.allowedHeaders[i] = headerStr
				}
			}
		}
	}
	
	p.allowCredentials = p.GetConfigBool("allow_credentials", p.allowCredentials)
	p.maxAge = p.GetConfigString("max_age", p.maxAge)
	
	if p.GetLogger() != nil {
		p.GetLogger().Info("CORS插件初始化完成")
	}
	
	return nil
}

// Handler 返回CORS处理函数
func (p *CORSPlugin) Handler() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		
		// 检查Origin是否被允许
		if p.isOriginAllowed(origin) {
			c.Header("Access-Control-Allow-Origin", origin)
		} else if len(p.allowedOrigins) == 1 && p.allowedOrigins[0] == "*" {
			c.Header("Access-Control-Allow-Origin", "*")
		}
		
		// 设置其他CORS头
		c.Header("Access-Control-Allow-Methods", strings.Join(p.allowedMethods, ", "))
		c.Header("Access-Control-Allow-Headers", strings.Join(p.allowedHeaders, ", "))
		
		if len(p.exposedHeaders) > 0 {
			c.Header("Access-Control-Expose-Headers", strings.Join(p.exposedHeaders, ", "))
		}
		
		if p.allowCredentials {
			c.Header("Access-Control-Allow-Credentials", "true")
		}
		
		if p.maxAge != "" {
			c.Header("Access-Control-Max-Age", p.maxAge)
		}
		
		// 处理预检请求
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})
}

// isOriginAllowed 检查Origin是否被允许
func (p *CORSPlugin) isOriginAllowed(origin string) bool {
	for _, allowedOrigin := range p.allowedOrigins {
		if allowedOrigin == "*" || allowedOrigin == origin {
			return true
		}
	}
	return false
}
