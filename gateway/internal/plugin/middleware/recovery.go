package middleware

import (
	"context"
	"fmt"
	"runtime/debug"

	"github.com/gin-gonic/gin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/plugin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/response"
)

// RecoveryPlugin 恢复中间件插件
type RecoveryPlugin struct {
	*BaseMiddlewarePlugin
	enableStackTrace bool
	enableLogging    bool
}

// NewRecoveryPlugin 创建恢复插件
func NewRecoveryPlugin() plugin.MiddlewarePlugin {
	p := &RecoveryPlugin{
		BaseMiddlewarePlugin: NewBaseMiddlewarePlugin(
			"recovery",
			"v1.0.0",
			"Panic恢复中间件插件，防止程序崩溃",
			5, // 最高优先级，最先执行
		),
		enableStackTrace: true,
		enableLogging:    true,
	}
	
	return p
}

// Initialize 初始化恢复插件
func (p *RecoveryPlugin) Initialize(ctx context.Context, config map[string]interface{}, logger logger.Logger) error {
	// 调用基础初始化
	if err := p.BaseMiddlewarePlugin.Initialize(ctx, config, logger); err != nil {
		return err
	}
	
	// 读取配置
	p.enableStackTrace = p.GetConfigBool("enable_stack_trace", p.enableStackTrace)
	p.enableLogging = p.GetConfigBool("enable_logging", p.enableLogging)
	
	if p.GetLogger() != nil {
		p.GetLogger().Info("恢复插件初始化完成")
	}
	
	return nil
}

// Handler 返回恢复处理函数
func (p *RecoveryPlugin) Handler() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				// 记录panic信息
				if p.enableLogging && p.GetLogger() != nil {
					stack := ""
					if p.enableStackTrace {
						stack = string(debug.Stack())
					}
					
					p.GetLogger().Error(fmt.Sprintf("Panic恢复: %v", err),
						logger.String("path", c.Request.URL.Path),
						logger.String("method", c.Request.Method),
						logger.String("client_ip", c.ClientIP()),
						logger.String("stack", stack),
					)
				}
				
				// 检查连接是否已断开
				if !c.IsAborted() {
					response.Error(c, "服务器内部错误")
				}
				
				c.Abort()
			}
		}()
		
		c.Next()
	})
}
