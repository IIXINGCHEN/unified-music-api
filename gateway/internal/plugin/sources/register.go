package sources

import (
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/plugin"
)

// RegisterAllSources 注册所有音源插件
func RegisterAllSources() error {
	// 注册GDStudio插件
	if err := plugin.RegisterPlugin("gdstudio", func() plugin.Plugin {
		return NewGDStudioPlugin()
	}); err != nil {
		return err
	}
	
	// 注册UNM Server插件
	if err := plugin.RegisterPlugin("unm_server", func() plugin.Plugin {
		return NewUNMServerPlugin()
	}); err != nil {
		return err
	}
	
	return nil
}

// init 自动注册所有音源插件
func init() {
	// 在包初始化时自动注册所有音源插件
	if err := RegisterAllSources(); err != nil {
		// 这里只是记录错误，不中断程序启动
		// 实际使用时应该有更好的错误处理机制
		panic("注册音源插件失败: " + err.Error())
	}
}
