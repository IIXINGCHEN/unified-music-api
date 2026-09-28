// Package repository 应用配置仓库实现
package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/model"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// memoryAppConfigRepository 内存应用配置仓库实现
type memoryAppConfigRepository struct {
	config    *model.AppConfig
	backups   map[string]*model.ConfigBackup
	changeLogs []*model.ConfigChangeLog
	mutex     sync.RWMutex
	logger    logger.Logger
}

// NewMemoryAppConfigRepository 创建内存应用配置仓库
func NewMemoryAppConfigRepository(log logger.Logger) AppConfigRepository {
	return &memoryAppConfigRepository{
		config:     nil, // 配置必须通过LoadConfig或UpdateConfig设置
		backups:    make(map[string]*model.ConfigBackup),
		changeLogs: make([]*model.ConfigChangeLog, 0),
		logger:     log,
	}
}

// GetConfig 获取配置
func (r *memoryAppConfigRepository) GetConfig(ctx context.Context) (*model.AppConfig, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	if r.config == nil {
		return nil, fmt.Errorf("配置未初始化，请先通过LoadConfig或UpdateConfig设置配置")
	}

	// 返回配置副本
	configData, err := json.Marshal(r.config)
	if err != nil {
		return nil, fmt.Errorf("序列化配置失败: %w", err)
	}

	var configCopy model.AppConfig
	if err := json.Unmarshal(configData, &configCopy); err != nil {
		return nil, fmt.Errorf("反序列化配置失败: %w", err)
	}

	r.logger.Debug("获取应用配置")
	return &configCopy, nil
}

// UpdateConfig 更新配置
func (r *memoryAppConfigRepository) UpdateConfig(ctx context.Context, config *model.AppConfig) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if config == nil {
		return fmt.Errorf("配置不能为空")
	}

	// 记录变更日志
	changeLog := &model.ConfigChangeLog{
		ID:        fmt.Sprintf("change_%d", time.Now().Unix()),
		Timestamp: time.Now(),
		Action:    "update",
		Section:   "全部",
		Changes:   []model.ConfigDiff{
			{
				Section:  "全部",
				Field:    "config",
				OldValue: "旧配置",
				NewValue: "新配置",
				Action:   "update",
			},
		},
		User:   "system",
		Reason: "更新完整配置",
	}

	// 更新配置
	oldConfig := r.config
	r.config = config

	// 添加变更日志
	r.changeLogs = append(r.changeLogs, changeLog)

	// 限制变更日志数量
	if len(r.changeLogs) > 100 {
		r.changeLogs = r.changeLogs[len(r.changeLogs)-100:]
	}

	r.logger.Info("更新应用配置",
		logger.String("change_id", changeLog.ID),
		logger.String("action", changeLog.Action),
	)

	// 验证新配置
	if err := r.validateConfig(config); err != nil {
		// 回滚配置
		r.config = oldConfig
		r.logger.Error("配置验证失败，已回滚",
			logger.ErrorField("error", err),
		)
		return fmt.Errorf("配置验证失败: %w", err)
	}

	return nil
}

// GetSection 获取配置节
func (r *memoryAppConfigRepository) GetSection(ctx context.Context, section string) (interface{}, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	if r.config == nil {
		return nil, fmt.Errorf("配置未初始化")
	}

	switch section {
	case "server":
		return r.config.Server, nil
	case "security":
		return r.config.Security, nil
	case "performance":
		return r.config.Performance, nil
	case "monitoring":
		return r.config.Monitoring, nil
	case "sources":
		return r.config.Sources, nil
	// 数据库和Redis配置节已移除 - 项目不再使用数据库
	default:
		return nil, fmt.Errorf("未知的配置节: %s", section)
	}
}

// UpdateSection 更新配置节
func (r *memoryAppConfigRepository) UpdateSection(ctx context.Context, section string, data interface{}) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if r.config == nil {
		return fmt.Errorf("配置未初始化，无法更新配置")
	}

	// 记录变更日志
	changeLog := &model.ConfigChangeLog{
		ID:        fmt.Sprintf("change_%d", time.Now().Unix()),
		Timestamp: time.Now(),
		Action:    "update_section",
		Section:   section,
		Changes:   []model.ConfigDiff{
			{
				Section:  section,
				Field:    "config",
				OldValue: "旧值",
				NewValue: "新值",
				Action:   "update",
			},
		},
		User:   "system",
		Reason: fmt.Sprintf("更新配置节: %s", section),
	}

	switch section {
	case "server":
		if serverConfig, ok := data.(model.ServerConfigModel); ok {
			r.config.Server = serverConfig
		} else {
			return fmt.Errorf("无效的服务器配置数据类型")
		}
	case "security":
		if securityConfig, ok := data.(model.SecurityConfigModel); ok {
			r.config.Security = securityConfig
		} else {
			return fmt.Errorf("无效的安全配置数据类型")
		}
	case "performance":
		if performanceConfig, ok := data.(model.PerformanceConfigModel); ok {
			r.config.Performance = performanceConfig
		} else {
			return fmt.Errorf("无效的性能配置数据类型")
		}
	case "monitoring":
		if monitoringConfig, ok := data.(model.MonitoringConfigModel); ok {
			r.config.Monitoring = monitoringConfig
		} else {
			return fmt.Errorf("无效的监控配置数据类型")
		}
	case "sources":
		if sourcesConfig, ok := data.(model.SourcesConfigModel); ok {
			r.config.Sources = sourcesConfig
		} else {
			return fmt.Errorf("无效的音源配置数据类型")
		}
	// 数据库和Redis配置处理已移除 - 项目不再使用数据库
	default:
		return fmt.Errorf("未知的配置节: %s", section)
	}

	// 添加变更日志
	r.changeLogs = append(r.changeLogs, changeLog)

	// 限制变更日志数量
	if len(r.changeLogs) > 100 {
		r.changeLogs = r.changeLogs[len(r.changeLogs)-100:]
	}

	r.logger.Info("更新配置节",
		logger.String("section", section),
		logger.String("change_id", changeLog.ID),
	)

	return nil
}

// ValidateConfig 验证配置
func (r *memoryAppConfigRepository) ValidateConfig(ctx context.Context, config *model.AppConfig) (*model.ConfigValidationResult, error) {
	if config == nil {
		return &model.ConfigValidationResult{
			Valid:  false,
			Errors: []string{"配置不能为空"},
		}, nil
	}

	var errors []string
	var warnings []string

	// 验证服务器配置
	if config.Server.Port <= 0 || config.Server.Port > 65535 {
		errors = append(errors, "服务器端口必须在1-65535范围内")
	}

	if config.Server.Host == "" {
		errors = append(errors, "服务器主机地址不能为空")
	}

	// 验证性能配置
	if config.Performance.MaxConcurrentRequests <= 0 {
		warnings = append(warnings, "最大并发请求数应该大于0")
	}

	if config.Performance.RequestTimeout <= 0 {
		warnings = append(warnings, "请求超时时间应该大于0")
	}

	// 验证音源配置
	if len(config.Sources.DefaultSources) == 0 {
		warnings = append(warnings, "建议配置至少一个默认音源")
	}

	result := &model.ConfigValidationResult{
		Valid:    len(errors) == 0,
		Errors:   errors,
		Warnings: warnings,
	}

	r.logger.Debug("配置验证完成",
		logger.Bool("valid", result.Valid),
		logger.Int("errors", len(errors)),
		logger.Int("warnings", len(warnings)),
	)

	return result, nil
}

// BackupConfig 备份配置
func (r *memoryAppConfigRepository) BackupConfig(ctx context.Context, name, description string) (*model.ConfigBackup, error) {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if r.config == nil {
		return nil, fmt.Errorf("配置未初始化")
	}

	// 创建配置副本
	configData, err := json.Marshal(r.config)
	if err != nil {
		return nil, fmt.Errorf("序列化配置失败: %w", err)
	}

	var configCopy model.AppConfig
	if err := json.Unmarshal(configData, &configCopy); err != nil {
		return nil, fmt.Errorf("反序列化配置失败: %w", err)
	}

	backup := &model.ConfigBackup{
		ID:          fmt.Sprintf("backup_%d", time.Now().Unix()),
		Name:        name,
		Description: description,
		Config:      &configCopy,
		CreatedAt:   time.Now(),
		CreatedBy:   "system",
	}

	r.backups[backup.ID] = backup

	r.logger.Info("创建配置备份",
		logger.String("backup_id", backup.ID),
		logger.String("name", name),
	)

	return backup, nil
}

// RestoreConfig 恢复配置
func (r *memoryAppConfigRepository) RestoreConfig(ctx context.Context, backupID string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	backup, exists := r.backups[backupID]
	if !exists {
		return fmt.Errorf("备份不存在: %s", backupID)
	}

	if backup.Config == nil {
		return fmt.Errorf("备份配置为空")
	}

	// 创建配置副本
	configData, err := json.Marshal(backup.Config)
	if err != nil {
		return fmt.Errorf("序列化备份配置失败: %w", err)
	}

	var configCopy model.AppConfig
	if err := json.Unmarshal(configData, &configCopy); err != nil {
		return fmt.Errorf("反序列化备份配置失败: %w", err)
	}

	// 记录变更日志
	changeLog := &model.ConfigChangeLog{
		ID:        fmt.Sprintf("change_%d", time.Now().Unix()),
		Timestamp: time.Now(),
		Action:    "restore",
		Section:   "全部",
		Changes:   []model.ConfigDiff{
			{
				Section:  "全部",
				Field:    "config",
				OldValue: "当前配置",
				NewValue: "备份配置",
				Action:   "restore",
			},
		},
		User:   "system",
		Reason: fmt.Sprintf("从备份恢复配置: %s", backup.Name),
	}

	r.config = &configCopy
	r.changeLogs = append(r.changeLogs, changeLog)

	r.logger.Info("恢复配置备份",
		logger.String("backup_id", backupID),
		logger.String("backup_name", backup.Name),
	)

	return nil
}

// GetBackups 获取配置备份列表
func (r *memoryAppConfigRepository) GetBackups(ctx context.Context) ([]*model.ConfigBackup, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	var backups []*model.ConfigBackup
	for _, backup := range r.backups {
		backups = append(backups, backup)
	}

	r.logger.Debug("获取配置备份列表",
		logger.Int("count", len(backups)),
	)

	return backups, nil
}

// DeleteBackup 删除配置备份
func (r *memoryAppConfigRepository) DeleteBackup(ctx context.Context, backupID string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if _, exists := r.backups[backupID]; !exists {
		return fmt.Errorf("备份不存在: %s", backupID)
	}

	delete(r.backups, backupID)

	r.logger.Info("删除配置备份",
		logger.String("backup_id", backupID),
	)

	return nil
}

// GetChangeLog 获取配置变更日志
func (r *memoryAppConfigRepository) GetChangeLog(ctx context.Context, limit int) ([]*model.ConfigChangeLog, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	if limit <= 0 {
		limit = 50
	}

	start := 0
	if len(r.changeLogs) > limit {
		start = len(r.changeLogs) - limit
	}

	result := make([]*model.ConfigChangeLog, len(r.changeLogs[start:]))
	copy(result, r.changeLogs[start:])

	r.logger.Debug("获取配置变更日志",
		logger.Int("limit", limit),
		logger.Int("count", len(result)),
	)

	return result, nil
}

// validateConfig 内部配置验证
func (r *memoryAppConfigRepository) validateConfig(config *model.AppConfig) error {
	if config == nil {
		return fmt.Errorf("配置不能为空")
	}

	// 完整验证
	if config.Server.Port <= 0 || config.Server.Port > 65535 {
		return fmt.Errorf("服务器端口必须在1-65535范围内")
	}

	if config.Server.Host == "" {
		return fmt.Errorf("服务器主机地址不能为空")
	}

	return nil
}


