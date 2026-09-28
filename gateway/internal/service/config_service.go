// Package service 配置服务
package service

import (
	"context"
	"fmt"

	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/config"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/model"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/repository"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// ConfigService 配置服务接口
type ConfigService interface {
	// GetConfig 获取完整配置
	GetConfig(ctx context.Context) (*model.AppConfig, error)
	
	// GetSafeConfig 获取脱敏配置
	GetSafeConfig(ctx context.Context) (*model.AppConfig, error)
	
	// UpdateConfig 更新完整配置
	UpdateConfig(ctx context.Context, config *model.AppConfig) error
	
	// GetSection 获取配置节
	GetSection(ctx context.Context, section string) (interface{}, error)
	
	// UpdateSection 更新配置节
	UpdateSection(ctx context.Context, section string, data interface{}) error
	
	// ValidateConfig 验证配置
	ValidateConfig(ctx context.Context, config *model.AppConfig) (*model.ConfigValidationResult, error)
	
	// ReloadConfig 重新加载配置
	ReloadConfig(ctx context.Context) error
	
	// BackupConfig 备份配置
	BackupConfig(ctx context.Context, name, description string) (*model.ConfigBackup, error)
	
	// RestoreConfig 恢复配置
	RestoreConfig(ctx context.Context, backupID string) error
	
	// GetBackups 获取配置备份列表
	GetBackups(ctx context.Context) ([]*model.ConfigBackup, error)
	
	// DeleteBackup 删除配置备份
	DeleteBackup(ctx context.Context, backupID string) error
}

// DefaultConfigService 默认配置服务实现
type DefaultConfigService struct {
	configRepo   repository.AppConfigRepository
	configLoader *config.Loader
	validator    *config.Validator
	logger       logger.Logger
	currentConfig *config.Config
	config       *config.Config // 添加config字段
}

// NewDefaultConfigService 创建默认配置服务
func NewDefaultConfigService(
	configRepo repository.AppConfigRepository,
	configLoader *config.Loader,
	validator *config.Validator,
	currentConfig *config.Config,
	log logger.Logger,
) *DefaultConfigService {
	return &DefaultConfigService{
		configRepo:    configRepo,
		configLoader:  configLoader,
		validator:     validator,
		logger:        log,
		currentConfig: currentConfig,
		config:        currentConfig, // 初始化config字段
	}
}

// GetConfig 获取完整配置
func (s *DefaultConfigService) GetConfig(ctx context.Context) (*model.AppConfig, error) {
	s.logger.Debug("获取完整配置")
	
	// 如果有配置仓库，从仓库获取
	if s.configRepo != nil {
		config, err := s.configRepo.GetConfig(ctx)
		if err != nil {
			s.logger.Warn("从配置仓库获取配置失败，使用当前配置",
				logger.ErrorField("error", err),
			)
		} else {
			return config, nil
		}
	}
	
	// 转换当前配置为模型
	appConfig := s.convertToAppConfig(s.currentConfig)
	
	s.logger.Info("获取完整配置成功")
	return appConfig, nil
}

// GetSafeConfig 获取脱敏配置
func (s *DefaultConfigService) GetSafeConfig(ctx context.Context) (*model.AppConfig, error) {
	s.logger.Debug("获取脱敏配置")
	
	config, err := s.GetConfig(ctx)
	if err != nil {
		return nil, err
	}
	
	// 返回脱敏后的配置
	safeConfig := config.GetSafeConfig()
	
	s.logger.Info("获取脱敏配置成功")
	return safeConfig, nil
}

// UpdateConfig 更新完整配置
func (s *DefaultConfigService) UpdateConfig(ctx context.Context, config *model.AppConfig) error {
	if config == nil {
		return fmt.Errorf("配置不能为空")
	}
	
	s.logger.Info("开始更新配置")
	
	// 验证配置
	validationResult := config.Validate()
	if !validationResult.Valid {
		s.logger.Error("配置验证失败",
			logger.Any("errors", validationResult.Errors),
		)
		return fmt.Errorf("配置验证失败: %v", validationResult.Errors)
	}
	
	// 如果有警告，记录日志
	if len(validationResult.Warnings) > 0 {
		s.logger.Warn("配置验证有警告",
			logger.Any("warnings", validationResult.Warnings),
		)
	}
	
	// 更新到配置仓库
	if s.configRepo != nil {
		if err := s.configRepo.UpdateConfig(ctx, config); err != nil {
			s.logger.Error("更新配置到仓库失败", logger.ErrorField("error", err))
			return fmt.Errorf("更新配置失败: %w", err)
		}
	}
	
	// 更新当前配置
	s.updateCurrentConfig(config)
	
	s.logger.Info("更新配置成功")
	return nil
}

// GetSection 获取配置节
func (s *DefaultConfigService) GetSection(ctx context.Context, section string) (interface{}, error) {
	if section == "" {
		return nil, fmt.Errorf("配置节名称不能为空")
	}
	
	s.logger.Debug("获取配置节", logger.String("section", section))
	
	// 如果有配置仓库，从仓库获取
	if s.configRepo != nil {
		data, err := s.configRepo.GetSection(ctx, section)
		if err != nil {
			s.logger.Warn("从配置仓库获取配置节失败",
				logger.String("section", section),
				logger.ErrorField("error", err),
			)
		} else {
			return data, nil
		}
	}
	
	// 从当前配置获取
	data := s.getSectionFromCurrentConfig(section)
	if data == nil {
		return nil, fmt.Errorf("配置节不存在: %s", section)
	}
	
	s.logger.Info("获取配置节成功", logger.String("section", section))
	return data, nil
}

// UpdateSection 更新配置节
func (s *DefaultConfigService) UpdateSection(ctx context.Context, section string, data interface{}) error {
	if section == "" {
		return fmt.Errorf("配置节名称不能为空")
	}
	
	if data == nil {
		return fmt.Errorf("配置数据不能为空")
	}
	
	s.logger.Info("开始更新配置节", logger.String("section", section))
	
	// 更新到配置仓库
	if s.configRepo != nil {
		if err := s.configRepo.UpdateSection(ctx, section, data); err != nil {
			s.logger.Error("更新配置节到仓库失败",
				logger.String("section", section),
				logger.ErrorField("error", err),
			)
			return fmt.Errorf("更新配置节失败: %w", err)
		}
	}
	
	// 更新当前配置
	s.updateSectionInCurrentConfig(section, data)
	
	s.logger.Info("更新配置节成功", logger.String("section", section))
	return nil
}

// ValidateConfig 验证配置
func (s *DefaultConfigService) ValidateConfig(ctx context.Context, config *model.AppConfig) (*model.ConfigValidationResult, error) {
	if config == nil {
		return nil, fmt.Errorf("配置不能为空")
	}
	
	s.logger.Debug("验证配置")
	
	// 如果有配置仓库，使用仓库验证
	if s.configRepo != nil {
		result, err := s.configRepo.ValidateConfig(ctx, config)
		if err != nil {
			s.logger.Warn("使用配置仓库验证失败，使用本地验证",
				logger.ErrorField("error", err),
			)
		} else {
			return result, nil
		}
	}
	
	// 使用本地验证
	result := config.Validate()
	
	s.logger.Info("验证配置完成",
		logger.Bool("valid", result.Valid),
		logger.Int("error_count", len(result.Errors)),
		logger.Int("warning_count", len(result.Warnings)),
	)
	
	return result, nil
}

// ReloadConfig 重新加载配置
func (s *DefaultConfigService) ReloadConfig(ctx context.Context) error {
	s.logger.Info("开始重新加载配置")
	
	// 使用配置加载器重新加载
	newConfig, err := s.configLoader.Load("")
	if err != nil {
		s.logger.Error("重新加载配置失败", logger.ErrorField("error", err))
		return fmt.Errorf("重新加载配置失败: %w", err)
	}
	
	// 验证新配置
	if err := s.validator.Validate(newConfig); err != nil {
		s.logger.Error("新配置验证失败", logger.ErrorField("error", err))
		return fmt.Errorf("新配置验证失败: %w", err)
	}
	
	// 更新当前配置
	s.currentConfig = newConfig
	
	s.logger.Info("重新加载配置成功")
	return nil
}

// BackupConfig 备份配置
func (s *DefaultConfigService) BackupConfig(ctx context.Context, name, description string) (*model.ConfigBackup, error) {
	if name == "" {
		return nil, fmt.Errorf("备份名称不能为空")
	}
	
	s.logger.Info("开始备份配置", logger.String("name", name))
	
	if s.configRepo == nil {
		return nil, fmt.Errorf("配置仓库不可用")
	}
	
	backup, err := s.configRepo.BackupConfig(ctx, name, description)
	if err != nil {
		s.logger.Error("备份配置失败",
			logger.String("name", name),
			logger.ErrorField("error", err),
		)
		return nil, fmt.Errorf("备份配置失败: %w", err)
	}
	
	s.logger.Info("备份配置成功",
		logger.String("name", name),
		logger.String("backup_id", backup.ID),
	)
	
	return backup, nil
}

// RestoreConfig 恢复配置
func (s *DefaultConfigService) RestoreConfig(ctx context.Context, backupID string) error {
	if backupID == "" {
		return fmt.Errorf("备份ID不能为空")
	}
	
	s.logger.Info("开始恢复配置", logger.String("backup_id", backupID))
	
	if s.configRepo == nil {
		return fmt.Errorf("配置仓库不可用")
	}
	
	err := s.configRepo.RestoreConfig(ctx, backupID)
	if err != nil {
		s.logger.Error("恢复配置失败",
			logger.String("backup_id", backupID),
			logger.ErrorField("error", err),
		)
		return fmt.Errorf("恢复配置失败: %w", err)
	}
	
	// 重新加载配置
	if err := s.ReloadConfig(ctx); err != nil {
		s.logger.Error("恢复配置后重新加载失败", logger.ErrorField("error", err))
		return fmt.Errorf("恢复配置后重新加载失败: %w", err)
	}
	
	s.logger.Info("恢复配置成功", logger.String("backup_id", backupID))
	return nil
}

// GetBackups 获取配置备份列表
func (s *DefaultConfigService) GetBackups(ctx context.Context) ([]*model.ConfigBackup, error) {
	s.logger.Debug("获取配置备份列表")
	
	if s.configRepo == nil {
		return []*model.ConfigBackup{}, nil
	}
	
	backups, err := s.configRepo.GetBackups(ctx)
	if err != nil {
		s.logger.Error("获取配置备份列表失败", logger.ErrorField("error", err))
		return nil, fmt.Errorf("获取配置备份列表失败: %w", err)
	}
	
	s.logger.Info("获取配置备份列表成功",
		logger.Int("backup_count", len(backups)),
	)
	
	return backups, nil
}

// DeleteBackup 删除配置备份
func (s *DefaultConfigService) DeleteBackup(ctx context.Context, backupID string) error {
	if backupID == "" {
		return fmt.Errorf("备份ID不能为空")
	}
	
	s.logger.Info("开始删除配置备份", logger.String("backup_id", backupID))
	
	if s.configRepo == nil {
		return fmt.Errorf("配置仓库不可用")
	}
	
	err := s.configRepo.DeleteBackup(ctx, backupID)
	if err != nil {
		s.logger.Error("删除配置备份失败",
			logger.String("backup_id", backupID),
			logger.ErrorField("error", err),
		)
		return fmt.Errorf("删除配置备份失败: %w", err)
	}
	
	s.logger.Info("删除配置备份成功", logger.String("backup_id", backupID))
	return nil
}

// convertToAppConfig 转换当前配置为应用配置模型
func (s *DefaultConfigService) convertToAppConfig(cfg *config.Config) *model.AppConfig {
	return &model.AppConfig{
		Server: model.ServerConfigModel{
			Port:          cfg.Server.Port,
			Host:          cfg.Server.Host,
			AllowedDomain: cfg.Server.AllowedDomain,
			ProxyURL:      cfg.Server.ProxyURL,
			EnableFlac:    cfg.Server.EnableFlac,
			ReadTimeout:   cfg.Server.ReadTimeout,
			WriteTimeout:  cfg.Server.WriteTimeout,
			IdleTimeout:   cfg.Server.IdleTimeout,
		},
		Security: model.SecurityConfigModel{
			JWTSecret:   cfg.Security.JWTSecret,
			APIKey:      cfg.Security.APIKey,
			CORSOrigins: cfg.Security.CORSOrigins,
			TLSEnabled:  cfg.Security.TLSEnabled,
			TLSCertFile: cfg.Security.TLSCertFile,
			TLSKeyFile:  cfg.Security.TLSKeyFile,
		},
		Performance: model.PerformanceConfigModel{
			MaxConcurrentRequests: cfg.Performance.MaxConcurrentRequests,
			RequestTimeout:        cfg.Performance.RequestTimeout,
			RateLimit: model.RateLimitConfigModel{
				Enabled:           cfg.Performance.RateLimit.Enabled,
				RequestsPerMinute: cfg.Performance.RateLimit.RequestsPerMinute,
				Burst:             cfg.Performance.RateLimit.Burst,
			},
			ConnectionPool: model.ConnectionPoolConfigModel{
				MaxIdleConns:        cfg.Performance.ConnectionPool.MaxIdleConns,
				MaxIdleConnsPerHost: cfg.Performance.ConnectionPool.MaxIdleConnsPerHost,
				IdleConnTimeout:     cfg.Performance.ConnectionPool.IdleConnTimeout,
			},
		},
		Monitoring: model.MonitoringConfigModel{
			Enabled: cfg.Monitoring.Enabled,
			Metrics: model.MetricsConfigModel{
				Enabled: cfg.Monitoring.Metrics.Enabled,
				Path:    cfg.Monitoring.Metrics.Path,
				Port:    cfg.Monitoring.Metrics.Port,
			},
			HealthCheck: model.HealthCheckConfigModel{
				Enabled:  cfg.Monitoring.HealthCheck.Enabled,
				Path:     cfg.Monitoring.HealthCheck.Path,
				Interval: cfg.Monitoring.HealthCheck.Interval,
			},
			Profiling: model.ProfilingConfigModel{
				Enabled: cfg.Monitoring.Profiling.Enabled,
				Path:    cfg.Monitoring.Profiling.Path,
			},
		},
		Sources: model.SourcesConfigModel{
			UNMServer: model.UNMServerConfigModel{
				Enabled:    cfg.Sources.UNMServer.Enabled,
				BaseURL:    cfg.Sources.UNMServer.BaseURL,
				APIKey:     cfg.Sources.UNMServer.APIKey,
				Timeout:    cfg.Sources.UNMServer.Timeout,
				RetryCount: cfg.Sources.UNMServer.RetryCount,
				UserAgent:  cfg.Sources.UNMServer.UserAgent,
			},
			GDStudio: model.GDStudioConfigModel{
				Enabled:    cfg.Sources.GDStudio.Enabled,
				BaseURL:    cfg.Sources.GDStudio.BaseURL,
				APIKey:     cfg.Sources.GDStudio.APIKey,
				Timeout:    cfg.Sources.GDStudio.Timeout,
				RetryCount: cfg.Sources.GDStudio.RetryCount,
				UserAgent:  cfg.Sources.GDStudio.UserAgent,
			},
			DefaultSources: cfg.Sources.DefaultSources,
			EnabledSources: cfg.Sources.EnabledSources,
			TestSources:    cfg.Sources.TestSources,
			Timeout:        cfg.Sources.Timeout,
			RetryCount:     cfg.Sources.RetryCount,
		},

	}
}

// updateCurrentConfig 更新当前配置
func (s *DefaultConfigService) updateCurrentConfig(appConfig *model.AppConfig) {
	// 将应用配置模型转换回内部配置结构
	if appConfig == nil {
		s.logger.Error("应用配置为空，无法更新")
		return
	}

	// 更新服务器配置
	s.config.Server.Host = appConfig.Server.Host
	s.config.Server.Port = appConfig.Server.Port
	s.config.Server.EnableFlac = appConfig.Server.EnableFlac
	s.config.Server.EnableHTTPS = appConfig.Server.EnableHTTPS
	s.config.Server.CertFile = appConfig.Server.CertFile
	s.config.Server.KeyFile = appConfig.Server.KeyFile

	// 更新音源配置
	s.config.Sources.UNMServer = config.UNMServerConfig{
		Enabled:    appConfig.Sources.UNMServer.Enabled,
		BaseURL:    appConfig.Sources.UNMServer.BaseURL,
		APIKey:     appConfig.Sources.UNMServer.APIKey,
		Timeout:    appConfig.Sources.UNMServer.Timeout,
		RetryCount: appConfig.Sources.UNMServer.RetryCount,
		UserAgent:  appConfig.Sources.UNMServer.UserAgent,
	}
	s.config.Sources.GDStudio = config.GDStudioConfig{
		Enabled:    appConfig.Sources.GDStudio.Enabled,
		BaseURL:    appConfig.Sources.GDStudio.BaseURL,
		APIKey:     appConfig.Sources.GDStudio.APIKey,
		Timeout:    appConfig.Sources.GDStudio.Timeout,
		RetryCount: appConfig.Sources.GDStudio.RetryCount,
		UserAgent:  appConfig.Sources.GDStudio.UserAgent,
	}
	s.config.Sources.DefaultSources = appConfig.Sources.DefaultSources
	s.config.Sources.EnabledSources = appConfig.Sources.EnabledSources
	s.config.Sources.TestSources = appConfig.Sources.TestSources
	s.config.Sources.Timeout = appConfig.Sources.Timeout
	s.config.Sources.RetryCount = appConfig.Sources.RetryCount
	
	s.logger.Info("当前配置已更新")
}

// getSectionFromCurrentConfig 从当前配置获取配置节
func (s *DefaultConfigService) getSectionFromCurrentConfig(section string) interface{} {
	switch section {
	case "server":
		return s.currentConfig.Server
	case "security":
		return s.currentConfig.Security
	case "performance":
		return s.currentConfig.Performance
	case "monitoring":
		return s.currentConfig.Monitoring
	case "sources":
		return s.currentConfig.Sources
	// 数据库和Redis配置节已移除 - 项目不再使用数据库
	default:
		return nil
	}
}

// updateSectionInCurrentConfig 更新当前配置的配置节
func (s *DefaultConfigService) updateSectionInCurrentConfig(section string, data interface{}) {
	if data == nil {
		s.logger.Error("配置数据为空", logger.String("section", section))
		return
	}

	switch section {
	case "server":
		if serverConfig, ok := data.(map[string]interface{}); ok {
			if host, exists := serverConfig["host"]; exists {
				if hostStr, ok := host.(string); ok {
					s.config.Server.Host = hostStr
				}
			}
			if port, exists := serverConfig["port"]; exists {
				if portInt, ok := port.(int); ok {
					s.config.Server.Port = portInt
				}
			}
			if enableFlac, exists := serverConfig["enable_flac"]; exists {
				if enableFlacBool, ok := enableFlac.(bool); ok {
					s.config.Server.EnableFlac = enableFlacBool
				}
			}
		}
	case "sources":
		if sourcesConfig, ok := data.(map[string]interface{}); ok {
			// 更新UNM服务器配置
			if unmServer, exists := sourcesConfig["unm_server"]; exists {
				if unmConfig, ok := unmServer.(map[string]interface{}); ok {
					if enabled, exists := unmConfig["enabled"]; exists {
						if enabledBool, ok := enabled.(bool); ok {
							s.config.Sources.UNMServer.Enabled = enabledBool
						}
					}
					if baseURL, exists := unmConfig["base_url"]; exists {
						if urlStr, ok := baseURL.(string); ok {
							s.config.Sources.UNMServer.BaseURL = urlStr
						}
					}
					if apiKey, exists := unmConfig["api_key"]; exists {
						if keyStr, ok := apiKey.(string); ok {
							s.config.Sources.UNMServer.APIKey = keyStr
						}
					}
				}
			}
			// 更新GDStudio配置
			if gdStudio, exists := sourcesConfig["gdstudio"]; exists {
				if gdConfig, ok := gdStudio.(map[string]interface{}); ok {
					if enabled, exists := gdConfig["enabled"]; exists {
						if enabledBool, ok := enabled.(bool); ok {
							s.config.Sources.GDStudio.Enabled = enabledBool
						}
					}
					if baseURL, exists := gdConfig["base_url"]; exists {
						if urlStr, ok := baseURL.(string); ok {
							s.config.Sources.GDStudio.BaseURL = urlStr
						}
					}
					if apiKey, exists := gdConfig["api_key"]; exists {
						if keyStr, ok := apiKey.(string); ok {
							s.config.Sources.GDStudio.APIKey = keyStr
						}
					}
				}
			}
		}
	default:
		s.logger.Warn("未知的配置节", logger.String("section", section))
		return
	}

	s.logger.Info("配置节已更新", logger.String("section", section))
}
