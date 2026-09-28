package plugin

import (
	"context"
	"fmt"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/config"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// Service 插件服务接口
type Service interface {
	// Initialize 初始化插件服务
	Initialize(ctx context.Context, cfg *config.Config, logger logger.Logger) error
	// Start 启动插件服务
	Start(ctx context.Context) error
	// Stop 停止插件服务
	Stop(ctx context.Context) error
	// GetManager 获取插件管理器
	GetManager() Manager
	// GetRegistry 获取插件注册表
	GetRegistry() Registry
	// GetAutoDiscovery 获取自动发现
	GetAutoDiscovery() *AutoDiscovery
	// ApplyMiddleware 应用中间件插件到Gin引擎
	ApplyMiddleware(engine *gin.Engine) error
	// GetSourcePlugins 获取音源插件
	GetSourcePlugins() []SourcePlugin
	// SearchMusic 通过插件搜索音乐
	SearchMusic(ctx context.Context, query SearchQuery) ([]SearchResult, error)
	// GetMusicURL 通过插件获取音乐链接
	GetMusicURL(ctx context.Context, id string, quality string) (*MusicURL, error)
}

// DefaultService 默认插件服务实现
type DefaultService struct {
	manager       Manager
	registry      Registry
	autoDiscovery *AutoDiscovery
	logger        logger.Logger
	config        *config.Config
	mutex         sync.RWMutex
	started       bool
}

// NewService 创建插件服务
func NewService(logger logger.Logger) Service {
	registry := NewRegistry(logger)
	manager := NewManager(logger)
	autoDiscovery := NewAutoDiscovery(registry, manager, logger)
	
	return &DefaultService{
		manager:       manager,
		registry:      registry,
		autoDiscovery: autoDiscovery,
		logger:        logger,
		started:       false,
	}
}

// Initialize 初始化插件服务
func (s *DefaultService) Initialize(ctx context.Context, cfg *config.Config, logger logger.Logger) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	
	s.config = cfg
	s.logger = logger
	
	// 转换配置格式
	pluginConfigs := s.convertPluginConfigs(cfg)
	
	// 验证插件配置 - 生产环境使用DEBUG级别
	if errors := s.autoDiscovery.ValidateConfig(pluginConfigs); len(errors) > 0 {
		for _, err := range errors {
			s.logger.Debug("插件配置验证: " + err.Error())
		}
	}
	
	// 发现并加载插件
	if err := s.autoDiscovery.DiscoverAndLoad(ctx, pluginConfigs); err != nil {
		return fmt.Errorf("发现和加载插件失败: %w", err)
	}
	
	s.logger.Info(fmt.Sprintf("插件服务初始化完成，加载插件数量: %d", len(s.manager.ListPlugins())))
	
	return nil
}

// Start 启动插件服务
func (s *DefaultService) Start(ctx context.Context) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	
	if s.started {
		return nil
	}
	
	// 启动所有插件
	if err := s.manager.StartAll(ctx); err != nil {
		return fmt.Errorf("启动插件失败: %w", err)
	}
	
	s.started = true
	s.logger.Info("插件服务启动完成")
	
	return nil
}

// Stop 停止插件服务
func (s *DefaultService) Stop(ctx context.Context) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	
	if !s.started {
		return nil
	}
	
	// 停止所有插件
	if err := s.manager.StopAll(ctx); err != nil {
		s.logger.Error("停止插件失败", logger.ErrorField("error", err))
	}
	
	s.started = false
	s.logger.Info("插件服务停止完成")
	
	return nil
}

// GetManager 获取插件管理器
func (s *DefaultService) GetManager() Manager {
	return s.manager
}

// GetRegistry 获取插件注册表
func (s *DefaultService) GetRegistry() Registry {
	return s.registry
}

// GetAutoDiscovery 获取自动发现
func (s *DefaultService) GetAutoDiscovery() *AutoDiscovery {
	return s.autoDiscovery
}

// ApplyMiddleware 应用中间件插件到Gin引擎
func (s *DefaultService) ApplyMiddleware(engine *gin.Engine) error {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	
	// 获取所有中间件插件
	middlewares := s.manager.GetMiddlewarePlugins()
	
	// 按顺序应用中间件
	for _, middleware := range middlewares {
		handler := middleware.Handler()
		routes := middleware.Routes()
		
		// 如果指定了特定路由，只应用到这些路由
		if len(routes) > 0 && routes[0] != "/*" {
			for range routes {
				engine.Use(func(c *gin.Context) {
					if mw, ok := middleware.(MiddlewarePlugin); ok && mw.ShouldApplyToRoute(c.Request.URL.Path) {
						handler(c)
					} else {
						c.Next()
					}
				})
			}
		} else {
			// 应用到所有路由
			engine.Use(handler)
		}
		
		s.logger.Debug(fmt.Sprintf("中间件插件已应用: %s (order: %d)", middleware.Name(), middleware.Order()))
	}
	
	return nil
}

// GetSourcePlugins 获取音源插件
func (s *DefaultService) GetSourcePlugins() []SourcePlugin {
	return s.manager.GetSourcePlugins()
}

// SearchMusic 通过插件搜索音乐
func (s *DefaultService) SearchMusic(ctx context.Context, query SearchQuery) ([]SearchResult, error) {
	sources := s.GetSourcePlugins()
	if len(sources) == 0 {
		return nil, fmt.Errorf("没有可用的音源插件")
	}
	
	var allResults []SearchResult
	var lastError error
	
	// 尝试所有音源插件
	for _, source := range sources {
		if !source.IsEnabled() {
			continue
		}

		results, err := source.SearchMusic(ctx, query)
		if err != nil {
			if s.logger != nil {
				s.logger.Warn("音源搜索失败: " + source.Name() + " - " + err.Error())
			}
			lastError = err
			continue
		}
		
		allResults = append(allResults, results...)
		
		// 如果已经获得足够的结果，可以提前返回
		if len(allResults) >= query.Limit {
			break
		}
	}
	
	if len(allResults) == 0 && lastError != nil {
		return nil, fmt.Errorf("所有音源搜索失败: %w", lastError)
	}
	
	// 限制结果数量
	if len(allResults) > query.Limit {
		allResults = allResults[:query.Limit]
	}
	
	return allResults, nil
}

// GetMusicURL 通过插件获取音乐链接
func (s *DefaultService) GetMusicURL(ctx context.Context, id string, quality string) (*MusicURL, error) {
	sources := s.GetSourcePlugins()
	if len(sources) == 0 {
		return nil, fmt.Errorf("没有可用的音源插件")
	}
	
	var lastError error
	
	// 尝试所有音源插件
	for _, source := range sources {
		if !source.IsEnabled() {
			continue
		}
		
		musicURL, err := source.GetMusicURL(ctx, id, quality)
		if err != nil {
			s.logger.Warn("获取音乐链接失败",
				logger.String("source", source.Name()),
				logger.String("id", id),
				logger.ErrorField("error", err),
			)
			lastError = err
			continue
		}
		
		if musicURL != nil && musicURL.URL != "" {
			return musicURL, nil
		}
	}
	
	if lastError != nil {
		return nil, fmt.Errorf("所有音源获取链接失败: %w", lastError)
	}
	
	return nil, fmt.Errorf("未找到音乐链接")
}

// convertPluginConfigs 转换插件配置格式
func (s *DefaultService) convertPluginConfigs(cfg *config.Config) []PluginConfig {
	var configs []PluginConfig

	// 转换音源插件配置
	for _, sourceConfig := range cfg.Plugins.Sources {
		if sourceConfig.Enabled {
			configs = append(configs, PluginConfig{
				Name:     sourceConfig.Name,
				Enabled:  sourceConfig.Enabled,
				Priority: 100, // 默认优先级
				Config:   sourceConfig.Config,
			})
		}
	}

	// 如果没有插件配置，使用传统配置作为后备
	if len(cfg.Plugins.Sources) == 0 {
		// 转换GDStudio配置
		if cfg.Sources.GDStudio.Enabled {
			configs = append(configs, PluginConfig{
				Name:     "gdstudio",
				Enabled:  true,
				Priority: 100,
				Config: map[string]interface{}{
					"base_url":    cfg.Sources.GDStudio.BaseURL,
					"api_key":     cfg.Sources.GDStudio.APIKey,
					"timeout":     cfg.Sources.GDStudio.Timeout.String(),
					"retry_count": cfg.Sources.GDStudio.RetryCount,
				},
			})
		}

		// 转换UNM Server配置
		if cfg.Sources.UNMServer.Enabled {
			configs = append(configs, PluginConfig{
				Name:     "unm_server",
				Enabled:  true,
				Priority: 90,
				Config: map[string]interface{}{
					"base_url":    cfg.Sources.UNMServer.BaseURL,
					"api_key":     cfg.Sources.UNMServer.APIKey,
					"timeout":     cfg.Sources.UNMServer.Timeout.String(),
					"retry_count": cfg.Sources.UNMServer.RetryCount,
				},
			})
		}
	}

	// 转换中间件插件配置
	for _, middlewareConfig := range cfg.Plugins.Middleware {
		if middlewareConfig.Enabled {
			configs = append(configs, PluginConfig{
				Name:    middlewareConfig.Name,
				Enabled: middlewareConfig.Enabled,
				Order:   0, // 从配置中读取或使用默认值
				Config:  middlewareConfig.Config,
			})
		}
	}

	// 如果没有中间件插件配置，使用默认配置
	if len(cfg.Plugins.Middleware) == 0 {
		configs = append(configs, PluginConfig{
			Name:    "recovery",
			Enabled: true,
			Order:   5,
			Config: map[string]interface{}{
				"enable_stack_trace": true,
				"stack_size":         4096,
			},
		})

		configs = append(configs, PluginConfig{
			Name:    "cors",
			Enabled: true,
			Order:   10,
			Config: map[string]interface{}{
				"allow_origins":     cfg.Security.CORSOrigins,
				"allow_methods":     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
				"allow_headers":     []string{"Origin", "Content-Type", "Authorization"},
				"allow_credentials": false,
				"max_age":           "12h",
			},
		})

		configs = append(configs, PluginConfig{
			Name:    "logging",
			Enabled: true,
			Order:   20,
			Config: map[string]interface{}{
				"log_level":         cfg.Logging.Level,
				"log_format":        cfg.Logging.Format,
				"skip_health_check": true,
			},
		})
	}

	return configs
}
