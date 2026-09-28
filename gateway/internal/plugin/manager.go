package plugin

import (
	"context"
	"fmt"
	"sort"
	"sync"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// Manager 插件管理器接口
type Manager interface {
	// RegisterPlugin 注册插件
	RegisterPlugin(plugin Plugin) error
	// UnregisterPlugin 注销插件
	UnregisterPlugin(name string) error
	// GetPlugin 获取插件
	GetPlugin(name string) (Plugin, error)
	// ListPlugins 列出所有插件
	ListPlugins() []PluginInfo
	// EnablePlugin 启用插件
	EnablePlugin(name string) error
	// DisablePlugin 禁用插件
	DisablePlugin(name string) error
	// StartAll 启动所有插件
	StartAll(ctx context.Context) error
	// StopAll 停止所有插件
	StopAll(ctx context.Context) error
	// HealthCheck 健康检查
	HealthCheck(ctx context.Context) map[string]error
	
	// GetSourcePlugins 获取音源插件
	GetSourcePlugins() []SourcePlugin
	// GetMiddlewarePlugins 获取中间件插件
	GetMiddlewarePlugins() []MiddlewarePlugin
	// GetFilterPlugins 获取过滤器插件
	GetFilterPlugins() []FilterPlugin
	// GetCachePlugins 获取缓存插件
	GetCachePlugins() []CachePlugin
	
	// Subscribe 订阅插件事件
	Subscribe(callback func(event PluginEvent))
	// LoadFromConfig 从配置加载插件
	LoadFromConfig(configs []PluginConfig) error
}

// DefaultManager 默认插件管理器
type DefaultManager struct {
	plugins     map[string]Plugin
	pluginInfos map[string]*PluginInfo
	configs     map[string]PluginConfig
	mutex       sync.RWMutex
	logger      logger.Logger
	subscribers []func(event PluginEvent)
	ctx         context.Context
	cancel      context.CancelFunc
}

// NewManager 创建插件管理器
func NewManager(logger logger.Logger) Manager {
	ctx, cancel := context.WithCancel(context.Background())
	return &DefaultManager{
		plugins:     make(map[string]Plugin),
		pluginInfos: make(map[string]*PluginInfo),
		configs:     make(map[string]PluginConfig),
		logger:      logger,
		subscribers: make([]func(event PluginEvent), 0),
		ctx:         ctx,
		cancel:      cancel,
	}
}

// RegisterPlugin 注册插件
func (m *DefaultManager) RegisterPlugin(plugin Plugin) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	
	name := plugin.Name()
	if name == "" {
		return fmt.Errorf("插件名称不能为空")
	}
	
	// 检查插件是否已存在
	if _, exists := m.plugins[name]; exists {
		return fmt.Errorf("插件 %s 已存在", name)
	}
	
	// 检查依赖
	if err := m.checkDependencies(plugin); err != nil {
		return fmt.Errorf("插件 %s 依赖检查失败: %w", name, err)
	}
	
	// 注册插件
	m.plugins[name] = plugin
	m.pluginInfos[name] = &PluginInfo{
		Name:        name,
		Version:     plugin.Version(),
		Description: plugin.Description(),
		Type:        m.getPluginType(plugin),
		Status:      "registered",
		LoadTime:    time.Now(),
	}
	
	m.logger.Info("插件注册成功",
		logger.String("name", name),
		logger.String("version", plugin.Version()),
		logger.String("type", m.getPluginType(plugin)),
	)
	
	// 发送事件
	m.publishEvent(PluginEvent{
		Type:      "register",
		Plugin:    name,
		Timestamp: time.Now(),
	})
	
	return nil
}

// UnregisterPlugin 注销插件
func (m *DefaultManager) UnregisterPlugin(name string) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	
	plugin, exists := m.plugins[name]
	if !exists {
		return fmt.Errorf("插件 %s 不存在", name)
	}
	
	// 停止插件
	if err := plugin.Stop(m.ctx); err != nil {
		m.logger.Warn("停止插件失败",
			logger.String("name", name),
			logger.ErrorField("error", err),
		)
	}
	
	// 删除插件
	delete(m.plugins, name)
	delete(m.pluginInfos, name)
	delete(m.configs, name)
	
	m.logger.Info("插件注销成功", logger.String("name", name))
	
	// 发送事件
	m.publishEvent(PluginEvent{
		Type:      "unregister",
		Plugin:    name,
		Timestamp: time.Now(),
	})
	
	return nil
}

// GetPlugin 获取插件
func (m *DefaultManager) GetPlugin(name string) (Plugin, error) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()
	
	plugin, exists := m.plugins[name]
	if !exists {
		return nil, fmt.Errorf("插件 %s 不存在", name)
	}
	
	return plugin, nil
}

// ListPlugins 列出所有插件
func (m *DefaultManager) ListPlugins() []PluginInfo {
	m.mutex.RLock()
	defer m.mutex.RUnlock()
	
	infos := make([]PluginInfo, 0, len(m.pluginInfos))
	for _, info := range m.pluginInfos {
		infos = append(infos, *info)
	}
	
	// 按名称排序
	sort.Slice(infos, func(i, j int) bool {
		return infos[i].Name < infos[j].Name
	})
	
	return infos
}

// EnablePlugin 启用插件
func (m *DefaultManager) EnablePlugin(name string) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	
	plugin, exists := m.plugins[name]
	if !exists {
		return fmt.Errorf("插件 %s 不存在", name)
	}
	
	info := m.pluginInfos[name]
	if info.Status == "enabled" {
		return nil // 已经启用
	}
	
	// 初始化插件
	config := m.configs[name].Config
	if config == nil {
		config = make(map[string]interface{})
	}
	
	if err := plugin.Initialize(m.ctx, config, m.logger); err != nil {
		info.Status = "error"
		info.LastError = err.Error()
		return fmt.Errorf("初始化插件 %s 失败: %w", name, err)
	}
	
	// 启动插件
	if err := plugin.Start(m.ctx); err != nil {
		info.Status = "error"
		info.LastError = err.Error()
		return fmt.Errorf("启动插件 %s 失败: %w", name, err)
	}
	
	info.Status = "enabled"
	info.LastError = ""
	
	m.logger.Info("插件启用成功", logger.String("name", name))
	
	// 发送事件
	m.publishEvent(PluginEvent{
		Type:      "enable",
		Plugin:    name,
		Timestamp: time.Now(),
	})
	
	return nil
}

// DisablePlugin 禁用插件
func (m *DefaultManager) DisablePlugin(name string) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	
	plugin, exists := m.plugins[name]
	if !exists {
		return fmt.Errorf("插件 %s 不存在", name)
	}
	
	info := m.pluginInfos[name]
	if info.Status == "disabled" {
		return nil // 已经禁用
	}
	
	// 停止插件
	if err := plugin.Stop(m.ctx); err != nil {
		m.logger.Warn("停止插件失败",
			logger.String("name", name),
			logger.ErrorField("error", err),
		)
	}
	
	info.Status = "disabled"
	
	m.logger.Info("插件禁用成功", logger.String("name", name))
	
	// 发送事件
	m.publishEvent(PluginEvent{
		Type:      "disable",
		Plugin:    name,
		Timestamp: time.Now(),
	})
	
	return nil
}

// StartAll 启动所有插件
func (m *DefaultManager) StartAll(ctx context.Context) error {
	m.mutex.RLock()
	plugins := make([]string, 0, len(m.plugins))
	for name := range m.plugins {
		if config, exists := m.configs[name]; exists && config.Enabled {
			plugins = append(plugins, name)
		}
	}
	m.mutex.RUnlock()
	
	// 按优先级排序
	sort.Slice(plugins, func(i, j int) bool {
		configI := m.configs[plugins[i]]
		configJ := m.configs[plugins[j]]
		return configI.Priority < configJ.Priority
	})
	
	// 启动插件
	for _, name := range plugins {
		if err := m.EnablePlugin(name); err != nil {
			m.logger.Error("启动插件失败: " + name + " - " + err.Error())
		}
	}
	
	return nil
}

// HealthCheck 健康检查
func (m *DefaultManager) HealthCheck(ctx context.Context) map[string]error {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	results := make(map[string]error)
	for name, plugin := range m.plugins {
		if info := m.pluginInfos[name]; info.Status == "enabled" {
			if err := plugin.Health(ctx); err != nil {
				results[name] = err
				// 更新插件状态
				info.Status = "error"
				info.LastError = err.Error()
			}
		}
	}

	return results
}

// GetSourcePlugins 获取音源插件
func (m *DefaultManager) GetSourcePlugins() []SourcePlugin {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	var sources []SourcePlugin
	for name, plugin := range m.plugins {
		if source, ok := plugin.(SourcePlugin); ok {
			if info := m.pluginInfos[name]; info.Status == "enabled" {
				sources = append(sources, source)
			}
		}
	}

	// 按优先级排序
	sort.Slice(sources, func(i, j int) bool {
		return sources[i].GetPriority() < sources[j].GetPriority()
	})

	return sources
}

// GetMiddlewarePlugins 获取中间件插件
func (m *DefaultManager) GetMiddlewarePlugins() []MiddlewarePlugin {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	var middlewares []MiddlewarePlugin
	for name, plugin := range m.plugins {
		if middleware, ok := plugin.(MiddlewarePlugin); ok {
			if info := m.pluginInfos[name]; info.Status == "enabled" {
				middlewares = append(middlewares, middleware)
			}
		}
	}

	// 按执行顺序排序
	sort.Slice(middlewares, func(i, j int) bool {
		return middlewares[i].Order() < middlewares[j].Order()
	})

	return middlewares
}

// GetFilterPlugins 获取过滤器插件
func (m *DefaultManager) GetFilterPlugins() []FilterPlugin {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	var filters []FilterPlugin
	for name, plugin := range m.plugins {
		if filter, ok := plugin.(FilterPlugin); ok {
			if info := m.pluginInfos[name]; info.Status == "enabled" {
				filters = append(filters, filter)
			}
		}
	}

	return filters
}

// GetCachePlugins 获取缓存插件
func (m *DefaultManager) GetCachePlugins() []CachePlugin {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	var caches []CachePlugin
	for name, plugin := range m.plugins {
		if cache, ok := plugin.(CachePlugin); ok {
			if info := m.pluginInfos[name]; info.Status == "enabled" {
				caches = append(caches, cache)
			}
		}
	}

	return caches
}

// Subscribe 订阅插件事件
func (m *DefaultManager) Subscribe(callback func(event PluginEvent)) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	m.subscribers = append(m.subscribers, callback)
}

// LoadFromConfig 从配置加载插件
func (m *DefaultManager) LoadFromConfig(configs []PluginConfig) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	for _, config := range configs {
		m.configs[config.Name] = config

		// 如果插件已注册，更新配置
		if _, exists := m.plugins[config.Name]; exists {
			if info := m.pluginInfos[config.Name]; info != nil {
				info.Config = config.Config
			}

			// 如果配置要求启用插件，同步启用
			if config.Enabled {
				// 暂时释放锁，避免死锁
				m.mutex.Unlock()
				if err := m.EnablePlugin(config.Name); err != nil {
					m.logger.Error("从配置启用插件失败: " + config.Name + " - " + err.Error())
				}
				m.mutex.Lock()
			}
		}
	}

	return nil
}

// checkDependencies 检查插件依赖
func (m *DefaultManager) checkDependencies(plugin Plugin) error {
	dependencies := plugin.Dependencies()
	for _, dep := range dependencies {
		if _, exists := m.plugins[dep]; !exists {
			return fmt.Errorf("缺少依赖插件: %s", dep)
		}
	}
	return nil
}

// getPluginType 获取插件类型
func (m *DefaultManager) getPluginType(plugin Plugin) string {
	switch plugin.(type) {
	case SourcePlugin:
		return "source"
	case MiddlewarePlugin:
		return "middleware"
	case FilterPlugin:
		return "filter"
	case CachePlugin:
		return "cache"
	default:
		return "unknown"
	}
}

// publishEvent 发布插件事件
func (m *DefaultManager) publishEvent(event PluginEvent) {
	for _, callback := range m.subscribers {
		go func(cb func(event PluginEvent)) {
			defer func() {
				if r := recover(); r != nil {
					m.logger.Error("插件事件回调异常",
						logger.String("event", event.Type),
						logger.String("plugin", event.Plugin),
						logger.Any("panic", r),
					)
				}
			}()
			cb(event)
		}(callback)
	}
}

// StopAll 停止所有插件
func (m *DefaultManager) StopAll(ctx context.Context) error {
	m.mutex.RLock()
	plugins := make([]string, 0, len(m.plugins))
	for name := range m.plugins {
		plugins = append(plugins, name)
	}
	m.mutex.RUnlock()
	
	// 停止所有插件
	for _, name := range plugins {
		if err := m.DisablePlugin(name); err != nil {
			m.logger.Error("停止插件失败",
				logger.String("name", name),
				logger.ErrorField("error", err),
			)
		}
	}
	
	// 取消上下文
	m.cancel()
	
	return nil
}
