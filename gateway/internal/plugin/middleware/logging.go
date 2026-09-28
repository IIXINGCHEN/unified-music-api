package middleware

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/plugin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// LoggingPlugin 日志中间件插件
type LoggingPlugin struct {
	*BaseMiddlewarePlugin
	skipPaths     []string
	enableDetails bool
}

// NewLoggingPlugin 创建日志插件
func NewLoggingPlugin() plugin.MiddlewarePlugin {
	p := &LoggingPlugin{
		BaseMiddlewarePlugin: NewBaseMiddlewarePlugin(
			"logging",
			"v1.0.0",
			"HTTP请求日志中间件插件",
			20, // 在CORS之后执行
		),
		skipPaths:     []string{"/health", "/ready", "/metrics"},
		enableDetails: true,
	}
	
	return p
}

// Initialize 初始化日志插件
func (p *LoggingPlugin) Initialize(ctx context.Context, config map[string]interface{}, logger logger.Logger) error {
	// 调用基础初始化
	if err := p.BaseMiddlewarePlugin.Initialize(ctx, config, logger); err != nil {
		return err
	}
	
	// 读取配置
	p.enableDetails = p.GetConfigBool("enable_details", p.enableDetails)
	
	// 读取跳过路径
	if skipPaths, exists := config["skip_paths"]; exists {
		if pathList, ok := skipPaths.([]interface{}); ok {
			p.skipPaths = make([]string, len(pathList))
			for i, path := range pathList {
				if pathStr, ok := path.(string); ok {
					p.skipPaths[i] = pathStr
				}
			}
		}
	}
	
	if p.GetLogger() != nil {
		p.GetLogger().Info("日志插件初始化完成")
	}
	
	return nil
}

// Handler 返回日志处理函数
func (p *LoggingPlugin) Handler() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// 检查是否跳过此路径
		if p.shouldSkipPath(c.Request.URL.Path) {
			c.Next()
			return
		}
		
		startTime := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery
		
		// 处理请求
		c.Next()
		
		// 计算耗时
		latency := time.Since(startTime)
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()
		
		if raw != "" {
			path = path + "?" + raw
		}
		
		// 记录日志
		if p.GetLogger() != nil {
			if p.enableDetails {
				p.GetLogger().Info("HTTP请求",
					logger.String("method", method),
					logger.String("path", path),
					logger.Int("status", statusCode),
					logger.String("latency", latency.String()),
					logger.String("client_ip", clientIP),
					logger.String("user_agent", c.Request.UserAgent()),
				)
			} else {
				p.GetLogger().Info("HTTP请求: " + method + " " + path)
			}
		}
	})
}

// shouldSkipPath 检查是否应该跳过此路径
func (p *LoggingPlugin) shouldSkipPath(path string) bool {
	for _, skipPath := range p.skipPaths {
		if path == skipPath {
			return true
		}
	}
	return false
}
