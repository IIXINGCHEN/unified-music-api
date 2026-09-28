package config

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// ConfigManager 配置管理器接口
type ConfigManager interface {
	// Load 加载配置
	Load(configPath string, env string) error
	// GetConfig 获取当前配置
	GetConfig() *Config
	// Reload 重新加载配置
	Reload() error
	// Watch 监听配置变化
	Watch(ctx context.Context) error
	// Stop 停止配置管理器
	Stop() error
	// OnConfigChange 注册配置变化回调
	OnConfigChange(callback ConfigChangeCallback)
}

// ConfigChangeCallback 配置变化回调函数
type ConfigChangeCallback func(oldConfig, newConfig *Config) error

// DefaultConfigManager 默认配置管理器
type DefaultConfigManager struct {
	loader      ConfigLoader
	config      *Config
	configMutex sync.RWMutex
	callbacks   []ConfigChangeCallback
	logger      logger.Logger
	stopChan    chan struct{}
	stopped     bool
}

// NewConfigManager 创建配置管理器
func NewConfigManager(logger logger.Logger) ConfigManager {
	return &DefaultConfigManager{
		loader:    NewLoader(logger),
		callbacks: make([]ConfigChangeCallback, 0),
		logger:    logger,
		stopChan:  make(chan struct{}),
	}
}

// Load 加载配置
func (cm *DefaultConfigManager) Load(configPath string, env string) error {
	config, err := cm.loader.LoadWithEnv(configPath, env)
	if err != nil {
		return fmt.Errorf("加载配置失败: %w", err)
	}

	cm.configMutex.Lock()
	cm.config = config
	cm.configMutex.Unlock()

	cm.logger.Info("配置加载成功",
		logger.String("config_path", cm.loader.GetConfigPath()),
		logger.String("env", env),
		logger.String("app_mode", config.App.Mode),
	)

	return nil
}

// GetConfig 获取当前配置
func (cm *DefaultConfigManager) GetConfig() *Config {
	cm.configMutex.RLock()
	defer cm.configMutex.RUnlock()
	return cm.config
}

// Reload 重新加载配置
func (cm *DefaultConfigManager) Reload() error {
	cm.logger.Info("开始重新加载配置")

	newConfig, err := cm.loader.Reload()
	if err != nil {
		cm.logger.Error("重新加载配置失败", logger.ErrorField("error", err))
		return fmt.Errorf("重新加载配置失败: %w", err)
	}

	// 获取旧配置
	oldConfig := cm.GetConfig()

	// 更新配置
	cm.configMutex.Lock()
	cm.config = newConfig
	cm.configMutex.Unlock()

	// 执行配置变化回调
	for _, callback := range cm.callbacks {
		if err := callback(oldConfig, newConfig); err != nil {
			cm.logger.Error("配置变化回调执行失败",
				logger.ErrorField("error", err),
			)
		}
	}

	cm.logger.Info("配置重新加载成功",
		logger.String("app_mode", newConfig.App.Mode),
	)

	return nil
}

// Watch 监听配置变化
func (cm *DefaultConfigManager) Watch(ctx context.Context) error {
	if cm.stopped {
		return fmt.Errorf("配置管理器已停止")
	}

	// 启动配置文件监听
	if err := cm.loader.Watch(func(config *Config) {
		cm.logger.Info("检测到配置文件变化，开始重新加载")
		
		// 获取旧配置
		oldConfig := cm.GetConfig()

		// 更新配置
		cm.configMutex.Lock()
		cm.config = config
		cm.configMutex.Unlock()

		// 执行配置变化回调
		for _, callback := range cm.callbacks {
			if err := callback(oldConfig, config); err != nil {
				cm.logger.Error("配置变化回调执行失败",
					logger.ErrorField("error", err),
				)
			}
		}

		cm.logger.Info("配置热重载完成")
	}); err != nil {
		return fmt.Errorf("启动配置监听失败: %w", err)
	}

	// 监听停止信号
	go func() {
		select {
		case <-ctx.Done():
			cm.logger.Info("收到停止信号，停止配置监听")
			cm.Stop()
		case <-cm.stopChan:
			cm.logger.Info("配置管理器已停止")
		}
	}()

	cm.logger.Info("配置监听已启动")
	return nil
}

// Stop 停止配置管理器
func (cm *DefaultConfigManager) Stop() error {
	if cm.stopped {
		return nil
	}

	cm.stopped = true
	close(cm.stopChan)
	cm.logger.Info("配置管理器已停止")
	return nil
}

// OnConfigChange 注册配置变化回调
func (cm *DefaultConfigManager) OnConfigChange(callback ConfigChangeCallback) {
	cm.callbacks = append(cm.callbacks, callback)
}

// ConfigWatcher 配置监听器
type ConfigWatcher struct {
	manager   ConfigManager
	logger    logger.Logger
	ctx       context.Context
	cancel    context.CancelFunc
	callbacks map[string]ConfigChangeCallback
}

// NewConfigWatcher 创建配置监听器
func NewConfigWatcher(manager ConfigManager, logger logger.Logger) *ConfigWatcher {
	ctx, cancel := context.WithCancel(context.Background())
	return &ConfigWatcher{
		manager:   manager,
		logger:    logger,
		ctx:       ctx,
		cancel:    cancel,
		callbacks: make(map[string]ConfigChangeCallback),
	}
}

// Start 启动配置监听
func (cw *ConfigWatcher) Start() error {
	// 注册所有回调
	for name, callback := range cw.callbacks {
		cw.manager.OnConfigChange(func(oldConfig, newConfig *Config) error {
			cw.logger.Debug("执行配置变化回调", logger.String("callback", name))
			return callback(oldConfig, newConfig)
		})
	}

	// 启动监听
	return cw.manager.Watch(cw.ctx)
}

// Stop 停止配置监听
func (cw *ConfigWatcher) Stop() {
	cw.cancel()
	cw.manager.Stop()
}

// RegisterCallback 注册配置变化回调
func (cw *ConfigWatcher) RegisterCallback(name string, callback ConfigChangeCallback) {
	cw.callbacks[name] = callback
}

// ConfigChangeEvent 配置变化事件
type ConfigChangeEvent struct {
	Type      string    `json:"type"`
	Timestamp time.Time `json:"timestamp"`
	OldConfig *Config   `json:"old_config,omitempty"`
	NewConfig *Config   `json:"new_config"`
	Changes   []string  `json:"changes"`
}

// DetectChanges 检测配置变化
func DetectChanges(oldConfig, newConfig *Config) []string {
	var changes []string

	// 检测应用配置变化
	if oldConfig.App.Mode != newConfig.App.Mode {
		changes = append(changes, fmt.Sprintf("app.mode: %s -> %s", oldConfig.App.Mode, newConfig.App.Mode))
	}

	// 检测服务器配置变化
	if oldConfig.Server.Port != newConfig.Server.Port {
		changes = append(changes, fmt.Sprintf("server.port: %d -> %d", oldConfig.Server.Port, newConfig.Server.Port))
	}

	// 检测日志配置变化
	if oldConfig.Logging.Level != newConfig.Logging.Level {
		changes = append(changes, fmt.Sprintf("logging.level: %s -> %s", oldConfig.Logging.Level, newConfig.Logging.Level))
	}

	// 检测音源配置变化
	if len(oldConfig.Sources.EnabledSources) != len(newConfig.Sources.EnabledSources) {
		changes = append(changes, "sources.enabled_sources: 数量变化")
	}

	return changes
}

// ValidateConfigChange 验证配置变化是否安全
func ValidateConfigChange(oldConfig, newConfig *Config) error {
	// 检查关键配置是否发生不安全的变化
	if oldConfig.App.Mode == "production" && newConfig.App.Mode != "production" {
		return fmt.Errorf("不允许从生产模式切换到其他模式")
	}

	// 检查端口变化
	if oldConfig.Server.Port != newConfig.Server.Port {
		if newConfig.Server.Port <= 0 || newConfig.Server.Port > 65535 {
			return fmt.Errorf("无效的端口号: %d", newConfig.Server.Port)
		}
	}

	return nil
}
