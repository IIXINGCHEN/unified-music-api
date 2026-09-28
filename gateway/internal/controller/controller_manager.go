// Package controller 控制器聚合器
package controller

import (
	"context"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/middleware"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/service"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// ControllerManager 控制器管理器 - 生产环境安全版本
type ControllerManager struct {
	// 控制器实例
	MusicController    *MusicController
	PlatformController *PlatformController // unified-music-api 新增：平台聚合
	SystemController   *SystemController
	ConfigController   *ConfigController
	HealthController   *HealthController

	// 服务管理器
	ServiceManager *service.ServiceManager

	// 日志器
	Logger logger.Logger

	// 安全中间件
	authConfig    *middleware.AuthConfig
	rateLimiter   *middleware.RateLimiter
	securityEnabled bool
}

// NewControllerManager 创建控制器管理器 - 生产环境安全版本
func NewControllerManager(serviceManager *service.ServiceManager, log logger.Logger) *ControllerManager {
	cm := &ControllerManager{
		ServiceManager: serviceManager,
		Logger:         log,
	}

	// 初始化安全配置
	cm.initializeSecurity()

	return cm
}

// initializeSecurity 初始化安全配置
func (cm *ControllerManager) initializeSecurity() {
	// 获取应用配置
	appConfig, err := cm.ServiceManager.GetConfigService().GetConfig(context.Background())
	if err != nil || appConfig == nil {
		cm.Logger.Warn("无法获取应用配置，安全功能将被禁用",
			logger.ErrorField("error", err),
		)
		cm.securityEnabled = false
		return
	}

	// 调试：检查配置状态
	cm.Logger.Debug("安全配置检查",
		logger.Bool("enable_auth", appConfig.Security.EnableAuth),
		logger.Bool("api_auth_not_nil", appConfig.Security.APIAuth != nil),
	)
	if appConfig.Security.APIAuth != nil {
		cm.Logger.Debug("API认证配置",
			logger.Bool("enabled", appConfig.Security.APIAuth.Enabled),
			logger.String("api_key_set", func() string {
				if appConfig.Security.APIAuth.APIKey != "" {
					return "yes"
				}
				return "no"
			}()),
		)
	}

	// 检查是否启用安全功能
	if appConfig.Security.EnableAuth && appConfig.Security.APIAuth != nil && appConfig.Security.APIAuth.Enabled {
		cm.securityEnabled = true

		// 创建认证配置
		cm.authConfig = &middleware.AuthConfig{
			APIKey:           appConfig.Security.APIAuth.APIKey,
			AdminKey:         appConfig.Security.APIAuth.AdminKey,
			WhiteList:        appConfig.Security.APIAuth.WhiteList,
			EnableRateLimit:  appConfig.Security.APIAuth.EnableRateLimit,
			RateLimitPerMin:  appConfig.Security.APIAuth.RateLimitPerMin,
			EnableAuditLog:   appConfig.Security.APIAuth.EnableAuditLog,
			RequireHTTPS:     appConfig.Security.APIAuth.RequireHTTPS,
			AllowedUserAgent: appConfig.Security.APIAuth.AllowedUserAgent,
		}

		// 创建速率限制器
		if cm.authConfig.EnableRateLimit {
			cm.rateLimiter = middleware.NewRateLimiter(
				cm.authConfig.RateLimitPerMin,
				time.Minute,
			)
		}

		cm.Logger.Info("安全功能已启用",
			logger.Bool("rate_limit", cm.authConfig.EnableRateLimit),
			logger.Bool("audit_log", cm.authConfig.EnableAuditLog),
			logger.Bool("require_https", cm.authConfig.RequireHTTPS),
			logger.Int("white_list_count", len(cm.authConfig.WhiteList)),
		)
	} else {
		cm.securityEnabled = false
		cm.Logger.Info("安全功能已禁用")
	}
}

// Initialize 初始化所有控制器
func (cm *ControllerManager) Initialize() error {
	cm.Logger.Info("开始初始化控制器管理器")
	
	// 检查服务管理器是否已初始化
	if !cm.ServiceManager.IsInitialized() {
		return fmt.Errorf("服务管理器未初始化")
	}
	
	// 创建音乐控制器
	cm.MusicController = NewMusicController(
		cm.ServiceManager.GetMusicService(),
		cm.Logger,
	)
	
	// 创建平台聚合控制器（unified-music-api 新增）
	cm.PlatformController = NewPlatformController(cm.Logger)
	
	// 创建系统控制器
	cm.SystemController = NewSystemController(
		cm.ServiceManager.GetSystemService(),
		cm.Logger,
	)
	
	// 创建配置控制器
	cm.ConfigController = NewConfigController(
		cm.ServiceManager.GetConfigService(),
		cm.Logger,
	)
	
	// 创建健康检查控制器
	cm.HealthController = NewHealthController()
	
	cm.Logger.Info("控制器管理器初始化完成")
	return nil
}

// RegisterRoutes 注册所有路由 - 生产环境安全版本
func (cm *ControllerManager) RegisterRoutes(router *gin.Engine) {
	cm.Logger.Info("开始注册路由",
		logger.Bool("security_enabled", cm.securityEnabled),
	)

	// API版本组
	v1 := router.Group("/api/v1")

	// 注册音乐相关路由（公开API，可选认证）
	if cm.MusicController != nil {
		musicGroup := v1.Group("")
		if cm.securityEnabled {
			// 音乐API使用较宽松的认证（可选）
			cm.Logger.Debug("为音乐API应用可选认证")
		}
		cm.MusicController.RegisterRoutes(musicGroup)
		cm.Logger.Debug("音乐控制器路由注册完成")
	}

	// 注册平台聚合路由（公开API，可选认证；unified-music-api 新增）
	if cm.PlatformController != nil {
		platformGroup := v1.Group("")
		cm.PlatformController.RegisterRoutes(platformGroup)
		cm.Logger.Debug("平台聚合控制器路由注册完成")
	}

	// 注册系统相关路由（需要API密钥）
	if cm.SystemController != nil {
		systemGroup := v1.Group("/system")
		if cm.securityEnabled {
			// 系统API需要API密钥认证
			systemGroup.Use(middleware.APIKeyAuth(cm.authConfig, cm.rateLimiter, cm.Logger))
			cm.Logger.Debug("为系统API应用API密钥认证")
		}
		cm.SystemController.RegisterRoutes(v1) // 保持原有路径结构
		cm.Logger.Debug("系统控制器路由注册完成")
	}

	// 注册配置相关路由（需要管理员密钥）
	if cm.ConfigController != nil {
		configGroup := v1.Group("/config")
		if cm.securityEnabled {
			// 配置API需要管理员密钥认证
			configGroup.Use(middleware.AdminAuth(cm.authConfig, cm.rateLimiter, cm.Logger))
			cm.Logger.Debug("为配置API应用管理员认证")
		}
		cm.ConfigController.RegisterRoutes(v1) // 保持原有路径结构
		cm.Logger.Debug("配置控制器路由注册完成")
	}

	// 注册健康检查路由（根路径，无需认证）
	if cm.HealthController != nil {
		RegisterHealthRoutes(router)
		cm.Logger.Debug("健康检查控制器路由注册完成")
	}

	// 注册根路径路由（无需认证）
	cm.registerRootRoutes(router)

	cm.Logger.Info("路由注册完成",
		logger.Bool("security_applied", cm.securityEnabled),
	)
}

// registerRootRoutes 注册根路径路由
func (cm *ControllerManager) registerRootRoutes(router *gin.Engine) {
	// 根路径显示前端页面
	router.GET("/", func(ctx *gin.Context) {
		ctx.File("./public/index.html")
	})
	
	// API根路径信息
	router.GET("/api", func(ctx *gin.Context) {
		ctx.JSON(200, gin.H{
			"name":        "music-api-proxy",
			"version":     cm.ServiceManager.GetSystemService().GetVersion(),
			"description": "解锁网易云音乐灰色歌曲的Go语言实现",
			"endpoints": map[string]string{
				"health":  "/health",
				"ping":    "/ping",
				"version": "/version",
				"api_v1":  "/api/v1",
			},
			"documentation": "/docs",
		})
	})
	
	// API v1 信息 - 生产环境安全版本
	router.GET("/api/v1", func(ctx *gin.Context) {
		endpoints := map[string]interface{}{
			"music": map[string]string{
				"search": "GET /api/v1/search",
				"info":   "GET /api/v1/info",
				"picture": "GET /api/v1/picture",
				"lyric":  "GET /api/v1/lyric",
			},
		}

		// 根据安全配置决定是否显示敏感端点
		if cm.securityEnabled {
			// 生产环境隐藏管理端点
			endpoints["system"] = map[string]string{
				"info": "GET /api/v1/system/info",
				"ping": "GET /ping",
			}
			// 配置端点需要认证，不在公开API列表中显示
		} else {
			// 开发环境显示所有端点
			endpoints["system"] = map[string]string{
				"info":    "GET /api/v1/system/info",
				"health":  "GET /api/v1/system/health",
				"metrics": "GET /api/v1/system/metrics",
				"sources": "GET /api/v1/system/sources",
				"cache":   "GET /api/v1/system/cache/stats",
			}
			endpoints["config"] = map[string]string{
				"get":      "GET /api/v1/config",
				"update":   "PUT /api/v1/config",
				"validate": "POST /api/v1/config/validate",
				"reload":   "POST /api/v1/config/reload",
				"backup":   "POST /api/v1/config/backup",
			}
		}

		response := gin.H{
			"version":   "v1",
			"endpoints": endpoints,
		}

		// 添加安全状态信息（非敏感）
		if cm.securityEnabled {
			response["security"] = map[string]interface{}{
				"authentication_required": true,
				"rate_limiting_enabled":   cm.authConfig != nil && cm.authConfig.EnableRateLimit,
			}
		}

		ctx.JSON(200, response)
	})
}

// GetMusicController 获取音乐控制器
func (cm *ControllerManager) GetMusicController() *MusicController {
	return cm.MusicController
}

// GetSystemController 获取系统控制器
func (cm *ControllerManager) GetSystemController() *SystemController {
	return cm.SystemController
}

// GetConfigController 获取配置控制器
func (cm *ControllerManager) GetConfigController() *ConfigController {
	return cm.ConfigController
}

// GetHealthController 获取健康检查控制器
func (cm *ControllerManager) GetHealthController() *HealthController {
	return cm.HealthController
}

// IsInitialized 检查是否已初始化
func (cm *ControllerManager) IsInitialized() bool {
	return cm.MusicController != nil &&
		cm.SystemController != nil &&
		cm.ConfigController != nil &&
		cm.HealthController != nil
}

// GetRouteInfo 获取路由信息
func (cm *ControllerManager) GetRouteInfo() map[string]interface{} {
	return map[string]interface{}{
		"music_routes": []string{
			"GET /api/v1/match",
			"GET /api/v1/ncm",
			"GET /api/v1/other",
			"GET /api/v1/test",
			"GET /api/v1/search",
			"GET /api/v1/info",
		},
		"system_routes": []string{
			"GET /api/v1/system/info",
			"GET /api/v1/system/health",
			"GET /api/v1/system/metrics",
			"GET /api/v1/system/sources",
			"POST /api/v1/system/sources/refresh",
			"GET /api/v1/system/cache/stats",
			"POST /api/v1/system/cache/clear",
			"GET /ping",
			"GET /version",
		},
		"config_routes": []string{
			"GET /api/v1/config",
			"PUT /api/v1/config",
			"GET /api/v1/config/:section",
			"PUT /api/v1/config/:section",
			"POST /api/v1/config/validate",
			"POST /api/v1/config/reload",
			"POST /api/v1/config/backup",
			"GET /api/v1/config/backups",
			"POST /api/v1/config/backup/:backup_id/restore",
			"DELETE /api/v1/config/backup/:backup_id",
		},
		"health_routes": []string{
			"GET /health",
			"GET /health/live",
			"GET /health/ready",
		},
		"root_routes": []string{
			"GET /",
			"GET /api",
			"GET /api/v1",
		},
	}
}

// ValidateControllers 验证控制器状态
func (cm *ControllerManager) ValidateControllers() error {
	if cm.MusicController == nil {
		return fmt.Errorf("音乐控制器未初始化")
	}
	
	if cm.SystemController == nil {
		return fmt.Errorf("系统控制器未初始化")
	}
	
	if cm.ConfigController == nil {
		return fmt.Errorf("配置控制器未初始化")
	}
	
	if cm.HealthController == nil {
		return fmt.Errorf("健康检查控制器未初始化")
	}
	
	return nil
}

// GetStats 获取控制器统计信息 - 包含安全状态
func (cm *ControllerManager) GetStats() map[string]interface{} {
	stats := make(map[string]interface{})

	stats["initialized"] = cm.IsInitialized()
	stats["controller_count"] = 4
	stats["security_enabled"] = cm.securityEnabled

	if cm.IsInitialized() {
		stats["controllers"] = map[string]bool{
			"music":  cm.MusicController != nil,
			"system": cm.SystemController != nil,
			"config": cm.ConfigController != nil,
			"health": cm.HealthController != nil,
		}
	}

	// 安全状态信息（脱敏）
	if cm.securityEnabled && cm.authConfig != nil {
		stats["security"] = map[string]interface{}{
			"rate_limit_enabled": cm.authConfig.EnableRateLimit,
			"audit_log_enabled":  cm.authConfig.EnableAuditLog,
			"https_required":     cm.authConfig.RequireHTTPS,
			"whitelist_count":    len(cm.authConfig.WhiteList),
			"user_agent_filter":  len(cm.authConfig.AllowedUserAgent) > 0,
		}
	}

	return stats
}

// IsSecurityEnabled 检查安全功能是否启用
func (cm *ControllerManager) IsSecurityEnabled() bool {
	return cm.securityEnabled
}

// GetSecurityConfig 获取安全配置（脱敏版本）
func (cm *ControllerManager) GetSecurityConfig() map[string]interface{} {
	if !cm.securityEnabled || cm.authConfig == nil {
		return map[string]interface{}{
			"enabled": false,
		}
	}

	return map[string]interface{}{
		"enabled":            true,
		"rate_limit_enabled": cm.authConfig.EnableRateLimit,
		"rate_limit_per_min": cm.authConfig.RateLimitPerMin,
		"audit_log_enabled":  cm.authConfig.EnableAuditLog,
		"https_required":     cm.authConfig.RequireHTTPS,
		"whitelist_count":    len(cm.authConfig.WhiteList),
		"user_agent_filter":  len(cm.authConfig.AllowedUserAgent) > 0,
		"api_key_configured": cm.authConfig.APIKey != "",
		"admin_key_configured": cm.authConfig.AdminKey != "",
	}
}

// 全局控制器管理器实例
var globalControllerManager *ControllerManager

// InitGlobalControllerManager 初始化全局控制器管理器
func InitGlobalControllerManager(serviceManager *service.ServiceManager, log logger.Logger) error {
	globalControllerManager = NewControllerManager(serviceManager, log)
	return globalControllerManager.Initialize()
}

// GetGlobalControllerManager 获取全局控制器管理器
func GetGlobalControllerManager() *ControllerManager {
	return globalControllerManager
}

// RegisterGlobalRoutes 注册全局路由
func RegisterGlobalRoutes(router *gin.Engine) {
	if globalControllerManager != nil {
		globalControllerManager.RegisterRoutes(router)
	}
}
