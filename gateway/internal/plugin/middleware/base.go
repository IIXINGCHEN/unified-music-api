package middleware

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/plugin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// BaseMiddlewarePlugin 基础中间件插件实现
type BaseMiddlewarePlugin struct {
	*plugin.BasePlugin
	order  int
	routes []string
}

// NewBaseMiddlewarePlugin 创建基础中间件插件
func NewBaseMiddlewarePlugin(name, version, description string, order int) *BaseMiddlewarePlugin {
	return &BaseMiddlewarePlugin{
		BasePlugin: plugin.NewBasePlugin(name, version, description),
		order:      order,
		routes:     []string{"/*"}, // 默认应用到所有路由
	}
}

// Order 返回中间件执行顺序
func (p *BaseMiddlewarePlugin) Order() int {
	return p.order
}

// SetOrder 设置中间件执行顺序
func (p *BaseMiddlewarePlugin) SetOrder(order int) {
	p.order = order
}

// Routes 返回中间件应用的路由模式
func (p *BaseMiddlewarePlugin) Routes() []string {
	return p.routes
}

// SetRoutes 设置中间件应用的路由模式
func (p *BaseMiddlewarePlugin) SetRoutes(routes []string) {
	p.routes = routes
}

// Initialize 初始化中间件插件
func (p *BaseMiddlewarePlugin) Initialize(ctx context.Context, config map[string]interface{}, logger logger.Logger) error {
	// 调用基础初始化
	if err := p.BasePlugin.Initialize(ctx, config, logger); err != nil {
		return err
	}
	
	// 从配置中读取中间件特定设置
	p.order = p.GetConfigInt("order", p.order)
	
	// 读取路由配置
	if routes, exists := config["routes"]; exists {
		if routeList, ok := routes.([]interface{}); ok {
			p.routes = make([]string, len(routeList))
			for i, route := range routeList {
				if routeStr, ok := route.(string); ok {
					p.routes[i] = routeStr
				}
			}
		}
	}
	
	return nil
}

// Handler 默认处理函数（子类应该重写）
func (p *BaseMiddlewarePlugin) Handler() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// 默认什么都不做，直接继续
		c.Next()
	})
}

// ShouldApplyToRoute 检查是否应该应用到指定路由
func (p *BaseMiddlewarePlugin) ShouldApplyToRoute(path string) bool {
	for _, pattern := range p.routes {
		if matchRoute(pattern, path) {
			return true
		}
	}
	return false
}

// matchRoute 简单的路由匹配函数
func matchRoute(pattern, path string) bool {
	// 简单实现：支持 /* 通配符
	if pattern == "/*" {
		return true
	}
	
	// 精确匹配
	if pattern == path {
		return true
	}
	
	// 前缀匹配（以 /* 结尾）
	if len(pattern) > 2 && pattern[len(pattern)-2:] == "/*" {
		prefix := pattern[:len(pattern)-2]
		return len(path) >= len(prefix) && path[:len(prefix)] == prefix
	}
	
	return false
}
