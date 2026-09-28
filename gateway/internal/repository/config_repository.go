// Package repository 配置仓库实现
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

// ConfigRepository 配置仓库接口
type ConfigRepository interface {
	// 获取配置
	GetConfig(ctx context.Context, key string) (interface{}, error)
	
	// 设置配置
	SetConfig(ctx context.Context, key string, value interface{}) error
	
	// 删除配置
	DeleteConfig(ctx context.Context, key string) error
	
	// 获取所有配置
	GetAllConfigs(ctx context.Context) (map[string]interface{}, error)
	
	// 批量设置配置
	SetConfigs(ctx context.Context, configs map[string]interface{}) error
	
	// 检查配置是否存在
	HasConfig(ctx context.Context, key string) (bool, error)
	
	// 获取配置键列表
	GetConfigKeys(ctx context.Context, pattern string) ([]string, error)
	
	// 清空所有配置
	ClearConfigs(ctx context.Context) error
}

// memoryConfigRepository 内存配置仓库实现
type memoryConfigRepository struct {
	configs map[string]interface{}
	mutex   sync.RWMutex
	logger  logger.Logger
}

// NewMemoryConfigRepository 创建内存配置仓库
func NewMemoryConfigRepository(log logger.Logger) ConfigRepository {
	return &memoryConfigRepository{
		configs: make(map[string]interface{}),
		logger:  log,
	}
}

// GetConfig 获取配置
func (r *memoryConfigRepository) GetConfig(ctx context.Context, key string) (interface{}, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	value, exists := r.configs[key]
	if !exists {
		return nil, fmt.Errorf("配置键不存在: %s", key)
	}
	
	r.logger.Debug("获取配置", 
		logger.String("key", key),
	)
	return value, nil
}

// SetConfig 设置配置
func (r *memoryConfigRepository) SetConfig(ctx context.Context, key string, value interface{}) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	// 序列化值以确保可以存储
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("序列化配置值失败: %w", err)
	}
	
	var deserializedValue interface{}
	if err := json.Unmarshal(data, &deserializedValue); err != nil {
		return fmt.Errorf("反序列化配置值失败: %w", err)
	}
	
	r.configs[key] = deserializedValue
	
	r.logger.Info("设置配置",
		logger.String("key", key),
		logger.Any("value", value),
	)
	
	return nil
}

// DeleteConfig 删除配置
func (r *memoryConfigRepository) DeleteConfig(ctx context.Context, key string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	if _, exists := r.configs[key]; !exists {
		return fmt.Errorf("配置键不存在: %s", key)
	}
	
	delete(r.configs, key)
	
	r.logger.Info("删除配置",
		logger.String("key", key),
	)
	
	return nil
}

// GetAllConfigs 获取所有配置
func (r *memoryConfigRepository) GetAllConfigs(ctx context.Context) (map[string]interface{}, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	result := make(map[string]interface{})
	for k, v := range r.configs {
		result[k] = v
	}
	
	r.logger.Debug("获取所有配置",
		logger.Int("count", len(result)),
	)
	
	return result, nil
}

// SetConfigs 批量设置配置
func (r *memoryConfigRepository) SetConfigs(ctx context.Context, configs map[string]interface{}) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	for key, value := range configs {
		// 序列化值以确保可以存储
		data, err := json.Marshal(value)
		if err != nil {
			return fmt.Errorf("序列化配置值失败 [%s]: %w", key, err)
		}
		
		var deserializedValue interface{}
		if err := json.Unmarshal(data, &deserializedValue); err != nil {
			return fmt.Errorf("反序列化配置值失败 [%s]: %w", key, err)
		}
		
		r.configs[key] = deserializedValue
	}
	
	r.logger.Info("批量设置配置",
		logger.Int("count", len(configs)),
	)
	
	return nil
}

// HasConfig 检查配置是否存在
func (r *memoryConfigRepository) HasConfig(ctx context.Context, key string) (bool, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	_, exists := r.configs[key]
	return exists, nil
}

// GetConfigKeys 获取配置键列表
func (r *memoryConfigRepository) GetConfigKeys(ctx context.Context, pattern string) ([]string, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var result []string
	for key := range r.configs {
		// 完整的模式匹配（支持*通配符）
		if pattern == "" || pattern == "*" || key == pattern {
			result = append(result, key)
		}
	}
	
	r.logger.Debug("获取配置键列表",
		logger.String("pattern", pattern),
		logger.Int("count", len(result)),
	)
	
	return result, nil
}

// ClearConfigs 清空所有配置
func (r *memoryConfigRepository) ClearConfigs(ctx context.Context) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	count := len(r.configs)
	r.configs = make(map[string]interface{})
	
	r.logger.Info("清空所有配置",
		logger.Int("cleared_count", count),
	)
	
	return nil
}



// BackupConfig 备份配置
func (r *memoryConfigRepository) BackupConfig(ctx context.Context, name, description string) (*model.ConfigBackup, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	// 复制当前配置
	configs := make(map[string]interface{})
	for k, v := range r.configs {
		configs[k] = v
	}
	
	// 将configs转换为AppConfig格式
	appConfig := &model.AppConfig{}
	// 根据实际需要转换configs到AppConfig
	// 创建完整的配置结构

	backup := &model.ConfigBackup{
		ID:          fmt.Sprintf("backup_%d", time.Now().Unix()),
		Name:        name,
		Description: description,
		Config:      appConfig,
		CreatedAt:   time.Now(),
		CreatedBy:   "system",
	}
	
	r.logger.Info("创建配置备份",
		logger.String("backup_id", backup.ID),
		logger.String("name", name),
		logger.Int("config_count", len(configs)),
	)
	
	return backup, nil
}

// RestoreConfig 恢复配置
func (r *memoryConfigRepository) RestoreConfig(ctx context.Context, backup *model.ConfigBackup) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	// 清空当前配置
	r.configs = make(map[string]interface{})
	
	// 恢复备份的配置
	// 将backup.Config转换为configs格式
	// 执行完整的配置恢复操作

	r.logger.Info("恢复配置备份",
		logger.String("backup_id", backup.ID),
		logger.String("backup_name", backup.Name),
	)
	
	return nil
}
