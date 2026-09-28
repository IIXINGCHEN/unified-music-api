package middleware

import (
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/plugin"
)

// RegisterAllMiddleware 注册所有中间件插件
func RegisterAllMiddleware() error {
	// 注册恢复中间件插件
	if err := plugin.RegisterPlugin("recovery", func() plugin.Plugin {
		return NewRecoveryPlugin()
	}); err != nil {
		return err
	}

	// 注册CORS中间件插件
	if err := plugin.RegisterPlugin("cors", func() plugin.Plugin {
		return NewCORSPlugin()
	}); err != nil {
		return err
	}

	// 注册日志中间件插件
	if err := plugin.RegisterPlugin("logging", func() plugin.Plugin {
		return NewLoggingPlugin()
	}); err != nil {
		return err
	}

	return nil
}

// init 自动注册所有中间件插件
func init() {
	// 在包初始化时自动注册所有中间件插件
	if err := RegisterAllMiddleware(); err != nil {
		// 这里只是记录错误，不中断程序启动
		// 实际使用时应该有更好的错误处理机制
		panic("注册中间件插件失败: " + err.Error())
	}
}
