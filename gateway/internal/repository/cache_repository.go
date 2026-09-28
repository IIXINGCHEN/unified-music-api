// Package repository 缓存仓库实现
package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// CacheItem 缓存项
type CacheItem struct {
	Value     interface{} `json:"value"`
	ExpiresAt time.Time   `json:"expires_at"`
	CreatedAt time.Time   `json:"created_at"`
}

// IsExpired 检查是否过期
func (c *CacheItem) IsExpired() bool {
	return time.Now().After(c.ExpiresAt)
}

// CacheRepository 缓存仓库接口
type CacheRepository interface {
	// Get 获取缓存
	Get(ctx context.Context, key string) (interface{}, error)
	
	// Set 设置缓存
	Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error
	
	// Delete 删除缓存
	Delete(ctx context.Context, key string) error
	
	// Exists 检查缓存是否存在
	Exists(ctx context.Context, key string) (bool, error)
	
	// Clear 清空所有缓存
	Clear(ctx context.Context) error
	
	// GetKeys 获取所有键
	GetKeys(ctx context.Context, pattern string) ([]string, error)
	
	// GetTTL 获取剩余过期时间
	GetTTL(ctx context.Context, key string) (time.Duration, error)
	
	// Expire 设置过期时间
	Expire(ctx context.Context, key string, ttl time.Duration) error
	
	// GetStats 获取缓存统计
	GetStats(ctx context.Context) (map[string]interface{}, error)
}

// memoryCacheRepository 内存缓存仓库实现
type memoryCacheRepository struct {
	cache  map[string]*CacheItem
	mutex  sync.RWMutex
	logger logger.Logger
	
	// 统计信息
	stats struct {
		hits        int64
		misses      int64
		sets        int64
		deletes     int64
		evictions   int64
		totalItems  int64
	}
}

// NewMemoryCacheRepository 创建内存缓存仓库
func NewMemoryCacheRepository(log logger.Logger) CacheRepository {
	repo := &memoryCacheRepository{
		cache:  make(map[string]*CacheItem),
		logger: log,
	}
	
	// 启动清理过期项的goroutine
	go repo.cleanupExpiredItems()
	
	return repo
}

// Get 获取缓存
func (r *memoryCacheRepository) Get(ctx context.Context, key string) (interface{}, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	item, exists := r.cache[key]
	if !exists {
		r.stats.misses++
		r.logger.Debug("缓存未命中",
			logger.String("key", key),
		)
		return nil, fmt.Errorf("缓存键不存在: %s", key)
	}
	
	// 检查是否过期
	if item.IsExpired() {
		// 删除过期项
		delete(r.cache, key)
		r.stats.misses++
		r.stats.evictions++
		r.logger.Debug("缓存已过期",
			logger.String("key", key),
		)
		return nil, fmt.Errorf("缓存已过期: %s", key)
	}
	
	r.stats.hits++
	r.logger.Debug("缓存命中",
		logger.String("key", key),
	)
	
	return item.Value, nil
}

// Set 设置缓存
func (r *memoryCacheRepository) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	// 序列化值以确保可以存储
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("序列化缓存值失败: %w", err)
	}
	
	var deserializedValue interface{}
	if err := json.Unmarshal(data, &deserializedValue); err != nil {
		return fmt.Errorf("反序列化缓存值失败: %w", err)
	}
	
	expiresAt := time.Now().Add(ttl)
	if ttl <= 0 {
		// 永不过期
		expiresAt = time.Now().Add(365 * 24 * time.Hour) // 1年后过期
	}
	
	r.cache[key] = &CacheItem{
		Value:     deserializedValue,
		ExpiresAt: expiresAt,
		CreatedAt: time.Now(),
	}
	
	r.stats.sets++
	r.stats.totalItems = int64(len(r.cache))
	
	r.logger.Debug("设置缓存",
		logger.String("key", key),
		logger.Duration("ttl", ttl),
	)
	
	return nil
}

// Delete 删除缓存
func (r *memoryCacheRepository) Delete(ctx context.Context, key string) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	if _, exists := r.cache[key]; !exists {
		return fmt.Errorf("缓存键不存在: %s", key)
	}
	
	delete(r.cache, key)
	r.stats.deletes++
	r.stats.totalItems = int64(len(r.cache))
	
	r.logger.Debug("删除缓存",
		logger.String("key", key),
	)
	
	return nil
}

// Exists 检查缓存是否存在
func (r *memoryCacheRepository) Exists(ctx context.Context, key string) (bool, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	item, exists := r.cache[key]
	if !exists {
		return false, nil
	}
	
	// 检查是否过期
	if item.IsExpired() {
		// 删除过期项
		r.mutex.RUnlock()
		r.mutex.Lock()
		delete(r.cache, key)
		r.stats.evictions++
		r.mutex.Unlock()
		r.mutex.RLock()
		return false, nil
	}
	
	return true, nil
}

// Clear 清空所有缓存
func (r *memoryCacheRepository) Clear(ctx context.Context) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	count := len(r.cache)
	r.cache = make(map[string]*CacheItem)
	r.stats.totalItems = 0
	
	r.logger.Info("清空缓存",
		logger.Int("cleared_count", count),
	)
	
	return nil
}

// GetKeys 获取所有键
func (r *memoryCacheRepository) GetKeys(ctx context.Context, pattern string) ([]string, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	var keys []string
	for key, item := range r.cache {
		// 检查是否过期
		if item.IsExpired() {
			continue
		}
		
		// 完整的模式匹配（支持*通配符）
		if pattern == "" || pattern == "*" || key == pattern {
			keys = append(keys, key)
		}
	}
	
	return keys, nil
}

// GetTTL 获取剩余过期时间
func (r *memoryCacheRepository) GetTTL(ctx context.Context, key string) (time.Duration, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	item, exists := r.cache[key]
	if !exists {
		return 0, fmt.Errorf("缓存键不存在: %s", key)
	}
	
	if item.IsExpired() {
		return 0, fmt.Errorf("缓存已过期: %s", key)
	}
	
	ttl := time.Until(item.ExpiresAt)
	if ttl < 0 {
		ttl = 0
	}
	
	return ttl, nil
}

// Expire 设置过期时间
func (r *memoryCacheRepository) Expire(ctx context.Context, key string, ttl time.Duration) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	
	item, exists := r.cache[key]
	if !exists {
		return fmt.Errorf("缓存键不存在: %s", key)
	}
	
	if item.IsExpired() {
		delete(r.cache, key)
		r.stats.evictions++
		return fmt.Errorf("缓存已过期: %s", key)
	}
	
	item.ExpiresAt = time.Now().Add(ttl)
	
	r.logger.Debug("更新缓存过期时间",
		logger.String("key", key),
		logger.Duration("ttl", ttl),
	)
	
	return nil
}

// GetStats 获取缓存统计
func (r *memoryCacheRepository) GetStats(ctx context.Context) (map[string]interface{}, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	
	hitRate := float64(0)
	totalRequests := r.stats.hits + r.stats.misses
	if totalRequests > 0 {
		hitRate = float64(r.stats.hits) / float64(totalRequests) * 100
	}
	
	stats := map[string]interface{}{
		"hits":         r.stats.hits,
		"misses":       r.stats.misses,
		"sets":         r.stats.sets,
		"deletes":      r.stats.deletes,
		"evictions":    r.stats.evictions,
		"total_items":  r.stats.totalItems,
		"hit_rate":     hitRate,
		"total_requests": totalRequests,
	}
	
	return stats, nil
}

// cleanupExpiredItems 清理过期项
func (r *memoryCacheRepository) cleanupExpiredItems() {
	ticker := time.NewTicker(5 * time.Minute) // 每5分钟清理一次
	defer ticker.Stop()
	
	for range ticker.C {
		r.mutex.Lock()
		
		var expiredKeys []string
		for key, item := range r.cache {
			if item.IsExpired() {
				expiredKeys = append(expiredKeys, key)
			}
		}
		
		for _, key := range expiredKeys {
			delete(r.cache, key)
			r.stats.evictions++
		}
		
		r.stats.totalItems = int64(len(r.cache))
		
		if len(expiredKeys) > 0 {
			r.logger.Debug("清理过期缓存项",
				logger.Int("expired_count", len(expiredKeys)),
				logger.Int64("remaining_items", r.stats.totalItems),
			)
		}
		
		r.mutex.Unlock()
	}
}
