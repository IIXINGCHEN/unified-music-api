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

// MusicInfoCache 音乐信息缓存
type MusicInfoCache struct {
	cache  map[string]*model.MusicInfo
	mutex  sync.RWMutex
	logger logger.Logger
}

// NewMusicInfoCache 创建音乐信息缓存
func NewMusicInfoCache(logger logger.Logger) *MusicInfoCache {
	return &MusicInfoCache{
		cache:  make(map[string]*model.MusicInfo),
		logger: logger,
	}
}

// Get 获取音乐信息
func (mic *MusicInfoCache) Get(id string) (*model.MusicInfo, bool) {
	mic.mutex.RLock()
	defer mic.mutex.RUnlock()
	
	info, exists := mic.cache[id]
	return info, exists
}

// Set 设置音乐信息
func (mic *MusicInfoCache) Set(id string, info *model.MusicInfo) {
	mic.mutex.Lock()
	defer mic.mutex.Unlock()
	
	mic.cache[id] = info
}

// GetOrCreate 获取或创建音乐信息
func (mic *MusicInfoCache) GetOrCreate(id string, creator func() (*model.MusicInfo, error)) (*model.MusicInfo, error) {
	// 首先尝试从缓存获取
	if info, exists := mic.Get(id); exists {
		return info, nil
	}
	
	// 如果缓存中没有，使用创建函数
	info, err := creator()
	if err != nil {
		return nil, err
	}
	
	// 缓存结果
	mic.Set(id, info)
	return info, nil
}

// MusicInfoProvider 音乐信息提供者
type MusicInfoProvider struct {
	cache       *MusicInfoCache
	sourceCache CacheRepository
	logger      logger.Logger
}

// NewMusicInfoProvider 创建音乐信息提供者
func NewMusicInfoProvider(cache CacheRepository, logger logger.Logger) *MusicInfoProvider {
	return &MusicInfoProvider{
		cache:       NewMusicInfoCache(logger),
		sourceCache: cache,
		logger:      logger,
	}
}

// GetMusicInfo 获取音乐信息
func (mip *MusicInfoProvider) GetMusicInfo(ctx context.Context, id string, sources []MusicSource) (*model.MusicInfo, error) {
	// 尝试从持久化缓存获取
	if info, err := mip.getFromPersistentCache(ctx, id); err == nil {
		return info, nil
	}
	
	// 尝试从搜索结果中获取
	if info, err := mip.getFromSearchResults(ctx, id, sources); err == nil {
		// 缓存到持久化存储
		_ = mip.setToPersistentCache(ctx, id, info)
		return info, nil
	}
	
	// 如果都失败了，返回基本信息
	basicInfo := &model.MusicInfo{
		ID:       id,
		Name:     fmt.Sprintf("音乐 %s", id),
		Artist:   "未知艺术家",
		Album:    "未知专辑",
		Duration: 0,
		PicURL:   "",
	}
	
	return basicInfo, nil
}

// getFromPersistentCache 从持久化缓存获取
func (mip *MusicInfoProvider) getFromPersistentCache(ctx context.Context, id string) (*model.MusicInfo, error) {
	if mip.sourceCache == nil {
		return nil, fmt.Errorf("缓存不可用")
	}
	
	cacheKey := fmt.Sprintf("music_info:%s", id)
	data, err := mip.sourceCache.Get(ctx, cacheKey)
	if err != nil {
		return nil, err
	}
	
	var info model.MusicInfo
	dataStr, ok := data.(string)
	if !ok {
		return nil, fmt.Errorf("缓存数据类型错误")
	}
	if err := json.Unmarshal([]byte(dataStr), &info); err != nil {
		return nil, err
	}
	
	return &info, nil
}

// setToPersistentCache 设置到持久化缓存
func (mip *MusicInfoProvider) setToPersistentCache(ctx context.Context, id string, info *model.MusicInfo) error {
	if mip.sourceCache == nil {
		return nil
	}
	
	cacheKey := fmt.Sprintf("music_info:%s", id)
	data, err := json.Marshal(info)
	if err != nil {
		return err
	}
	
	return mip.sourceCache.Set(ctx, cacheKey, string(data), 24*time.Hour) // 缓存24小时
}

// getFromSearchResults 从搜索结果中获取
func (mip *MusicInfoProvider) getFromSearchResults(ctx context.Context, id string, sources []MusicSource) (*model.MusicInfo, error) {
	// 尝试使用每个音源搜索
	for _, source := range sources {
		if !source.IsEnabled() {
			continue
		}

		// 尝试多种搜索策略来找到这首歌
		strategies := []string{
			id, // 直接使用ID
		}

		// 如果ID是数字，尝试一些常见的歌曲名
		if len(id) > 6 { // 长ID可能需要其他策略
			strategies = append(strategies, "hello", "love", "music") // 添加一些常见关键词
		}

		for _, keyword := range strategies {
			if results, err := source.SearchMusic(ctx, keyword); err == nil {
				// 查找匹配的结果
				for _, result := range results {
					if result.ID == id {
						mip.logger.Info("从搜索结果中找到音乐信息",
							logger.String("id", id),
							logger.String("name", result.Name),
							logger.String("artist", result.Artist),
						)
						return &model.MusicInfo{
							ID:       result.ID,
							Name:     result.Name,
							Artist:   result.Artist,
							Album:    result.Album,
							Duration: result.Duration,
							PicURL:   "",
						}, nil
					}
				}

				// 如果没有精确匹配，但有搜索结果，使用第一个结果作为参考
				if len(results) > 0 && keyword == id {
					mip.logger.Info("使用搜索结果中的第一个作为音乐信息",
						logger.String("id", id),
						logger.String("name", results[0].Name),
						logger.String("artist", results[0].Artist),
					)
					return &model.MusicInfo{
						ID:       id, // 保持原ID
						Name:     results[0].Name,
						Artist:   results[0].Artist,
						Album:    results[0].Album,
						Duration: results[0].Duration,
						PicURL:   "",
					}, nil
				}
			}
		}
	}

	return nil, fmt.Errorf("未找到音乐信息")
}

// PreloadMusicInfo 预加载音乐信息
func (mip *MusicInfoProvider) PreloadMusicInfo(ctx context.Context, ids []string, sources []MusicSource) {
	for _, id := range ids {
		go func(musicID string) {
			_, _ = mip.GetMusicInfo(ctx, musicID, sources)
		}(id)
	}
}
