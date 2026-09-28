package plugin

import (
	"context"
	"fmt"
	"sync"

	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// Registry 插件注册表接口
type Registry interface {
	// Register 注册插件工厂函数
	Register(name string, factory PluginFactory) error
	// Unregister 注销插件工厂函数
	Unregister(name string) error
	// Create 创建插件实例
	Create(name string) (Plugin, error)
	// List 列出所有可用的插件
	List() []string
	// Exists 检查插件是否存在
	Exists(name string) bool
	// GetMetadata 获取插件元数据
	GetMetadata(name string) (*PluginMetadata, error)
}

// PluginFactory 插件工厂函数
type PluginFactory func() Plugin

// DefaultRegistry 默认插件注册表
type DefaultRegistry struct {
	factories map[string]PluginFactory
	metadata  map[string]*PluginMetadata
	mutex     sync.RWMutex
	logger    logger.Logger
}

// NewRegistry 创建插件注册表
func NewRegistry(logger logger.Logger) Registry {
	return &DefaultRegistry{
		factories: make(map[string]PluginFactory),
		metadata:  make(map[string]*PluginMetadata),
		logger:    logger,
	}
}

// Register 注册插件工厂函数
func (r *DefaultRegistry) Register(name string, factory PluginFactory) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	if name == "" {
		return fmt.Errorf("插件名称不能为空")
	}
	
	if factory == nil {
		return fmt.Errorf("插件工厂函数不能为空")
	}
	
	// 检查插件是否已存在
	if _, exists := r.factories[name]; exists {
		return fmt.Errorf("插件 %s 已注册", name)
	}
	
	// 创建插件实例以获取元数据
	plugin := factory()
	if plugin == nil {
		return fmt.Errorf("插件工厂函数返回nil")
	}
	
	// 验证插件名称一致性
	if plugin.Name() != name {
		return fmt.Errorf("插件名称不一致: 注册名=%s, 插件名=%s", name, plugin.Name())
	}
	
	// 注册工厂函数
	r.factories[name] = factory
	
	// 保存元数据
	r.metadata[name] = &PluginMetadata{
		Name:        plugin.Name(),
		Version:     plugin.Version(),
		Description: plugin.Description(),
		Type:        r.getPluginType(plugin),
	}
	
	if r.logger != nil {
		r.logger.Info("插件工厂注册成功: " + name + " v" + plugin.Version())
	}
	
	return nil
}

// Unregister 注销插件工厂函数
func (r *DefaultRegistry) Unregister(name string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	if _, exists := r.factories[name]; !exists {
		return fmt.Errorf("插件 %s 未注册", name)
	}
	
	delete(r.factories, name)
	delete(r.metadata, name)
	
	if r.logger != nil {
		r.logger.Info("插件工厂注销成功: " + name)
	}
	
	return nil
}

// Create 创建插件实例
func (r *DefaultRegistry) Create(name string) (Plugin, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	factory, exists := r.factories[name]
	if !exists {
		return nil, fmt.Errorf("插件 %s 未注册", name)
	}
	
	plugin := factory()
	if plugin == nil {
		return nil, fmt.Errorf("插件工厂函数返回nil")
	}
	
	return plugin, nil
}

// List 列出所有可用的插件
func (r *DefaultRegistry) List() []string {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	names := make([]string, 0, len(r.factories))
	for name := range r.factories {
		names = append(names, name)
	}
	
	return names
}

// Exists 检查插件是否存在
func (r *DefaultRegistry) Exists(name string) bool {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	_, exists := r.factories[name]
	return exists
}

// GetMetadata 获取插件元数据
func (r *DefaultRegistry) GetMetadata(name string) (*PluginMetadata, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	metadata, exists := r.metadata[name]
	if !exists {
		return nil, fmt.Errorf("插件 %s 未注册", name)
	}
	
	// 返回副本
	result := *metadata
	return &result, nil
}

// getPluginType 获取插件类型
func (r *DefaultRegistry) getPluginType(plugin Plugin) string {
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

// GlobalRegistry 全局插件注册表
var GlobalRegistry Registry

// init 初始化全局注册表
func init() {
	// 这里使用一个简单的logger，实际使用时应该传入真正的logger
	GlobalRegistry = NewRegistry(nil)
}

// RegisterPlugin 注册插件到全局注册表
func RegisterPlugin(name string, factory PluginFactory) error {
	return GlobalRegistry.Register(name, factory)
}

// CreatePlugin 从全局注册表创建插件
func CreatePlugin(name string) (Plugin, error) {
	return GlobalRegistry.Create(name)
}

// ListPlugins 列出全局注册表中的所有插件
func ListPlugins() []string {
	return GlobalRegistry.List()
}

// PluginExists 检查插件是否在全局注册表中存在
func PluginExists(name string) bool {
	return GlobalRegistry.Exists(name)
}

// GetPluginMetadata 从全局注册表获取插件元数据
func GetPluginMetadata(name string) (*PluginMetadata, error) {
	return GlobalRegistry.GetMetadata(name)
}

// AutoDiscovery 自动发现机制
type AutoDiscovery struct {
	registry Registry
	manager  Manager
	logger   logger.Logger
}

// NewAutoDiscovery 创建自动发现实例
func NewAutoDiscovery(registry Registry, manager Manager, logger logger.Logger) *AutoDiscovery {
	return &AutoDiscovery{
		registry: registry,
		manager:  manager,
		logger:   logger,
	}
}

// DiscoverAndLoad 发现并加载插件
func (ad *AutoDiscovery) DiscoverAndLoad(ctx context.Context, configs []PluginConfig) error {
	// 从注册表获取所有可用插件
	availablePlugins := ad.registry.List()
	
	// 创建配置映射
	configMap := make(map[string]PluginConfig)
	for _, config := range configs {
		configMap[config.Name] = config
	}
	
	// 遍历可用插件
	for _, name := range availablePlugins {
		config, hasConfig := configMap[name]
		
		// 如果没有配置或配置为禁用，跳过
		if !hasConfig || !config.Enabled {
			if ad.logger != nil {
				ad.logger.Debug("跳过插件: " + name + " (未配置或已禁用)")
			}
			continue
		}
		
		// 创建插件实例
		plugin, err := ad.registry.Create(name)
		if err != nil {
			if ad.logger != nil {
				ad.logger.Error("创建插件实例失败: " + name + " - " + err.Error())
			}
			continue
		}
		
		// 注册到管理器
		if err := ad.manager.RegisterPlugin(plugin); err != nil {
			if ad.logger != nil {
				ad.logger.Error("注册插件到管理器失败: " + name + " - " + err.Error())
			}
			continue
		}

		if ad.logger != nil {
			ad.logger.Info("插件发现并加载成功: " + name + " v" + plugin.Version())
		}
	}
	
	// 加载配置到管理器
	if err := ad.manager.LoadFromConfig(configs); err != nil {
		return fmt.Errorf("加载插件配置失败: %w", err)
	}
	
	return nil
}

// ValidateConfig 验证插件配置
func (ad *AutoDiscovery) ValidateConfig(configs []PluginConfig) []error {
	var errors []error
	
	for _, config := range configs {
		// 检查插件是否存在
		if !ad.registry.Exists(config.Name) {
			errors = append(errors, fmt.Errorf("插件 %s 不存在", config.Name))
			continue
		}
		
		// 获取插件元数据
		metadata, err := ad.registry.GetMetadata(config.Name)
		if err != nil {
			errors = append(errors, fmt.Errorf("获取插件 %s 元数据失败: %w", config.Name, err))
			continue
		}
		
		// 验证插件类型
		if metadata.Type == "unknown" {
			errors = append(errors, fmt.Errorf("插件 %s 类型未知", config.Name))
		}
		
		// 验证优先级
		if config.Priority < 0 {
			errors = append(errors, fmt.Errorf("插件 %s 优先级不能为负数", config.Name))
		}
		
		// 验证中间件插件的特定配置
		if metadata.Type == "middleware" {
			if config.Order < 0 {
				errors = append(errors, fmt.Errorf("中间件插件 %s 执行顺序不能为负数", config.Name))
			}
		}
	}
	
	return errors
}
