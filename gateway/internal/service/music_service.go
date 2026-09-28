// Package service 音乐服务
package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/config"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/model"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/repository"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/repository/sources"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// MusicService 音乐服务接口
type MusicService interface {
	// MatchMusic 匹配音乐
	MatchMusic(ctx context.Context, req *model.MatchRequest) (*model.MatchResponse, error)

	// GetNCMMusic 获取网易云音乐
	GetNCMMusic(ctx context.Context, req *model.NCMGetRequest) (*model.NCMGetResponse, error)

	// GetOtherMusic 获取其他音源音乐
	GetOtherMusic(ctx context.Context, req *model.OtherGetRequest) (*model.OtherGetResponse, error)

	// SearchMusic 搜索音乐
	SearchMusic(ctx context.Context, keyword string, sources []string) ([]*model.SearchResult, error)

	// GetMusicInfo 获取音乐信息
	GetMusicInfo(ctx context.Context, source, id string) (*model.MusicInfo, error)

	// GetPicture 获取专辑图
	GetPicture(ctx context.Context, sourceName, picID, size string) (string, error)

	// GetLyric 获取歌词
	GetLyric(ctx context.Context, sourceName, lyricID string) (string, string, error)
}

// DefaultMusicService 默认音乐服务实现
type DefaultMusicService struct {
	sourceManager repository.SourceManager
	cache         repository.CacheRepository
	rateLimiter   repository.RateLimiter
	logger        logger.Logger
	configManager *config.SourceConfigManager
}

// NewDefaultMusicService 创建默认音乐服务
func NewDefaultMusicService(
	sourceManager repository.SourceManager,
	cache repository.CacheRepository,
	rateLimiter repository.RateLimiter,
	configManager *config.SourceConfigManager,
	log logger.Logger,
) *DefaultMusicService {
	return &DefaultMusicService{
		sourceManager: sourceManager,
		cache:         cache,
		rateLimiter:   rateLimiter,
		logger:        log,
		configManager: configManager,
	}
}

// MatchMusic 匹配音乐
func (s *DefaultMusicService) MatchMusic(ctx context.Context, req *model.MatchRequest) (*model.MatchResponse, error) {
	if req == nil {
		return nil, fmt.Errorf("请求不能为空")
	}

	if req.ID == "" {
		return nil, fmt.Errorf("音乐ID不能为空")
	}
	
	// 解析音源列表（使用配置管理器）
	sources := req.Sources
	if len(sources) == 0 {
		if s.configManager != nil {
			sources = s.configManager.ParseSources(req.Server)
		} else {
			// 降级到旧方法
			sources = model.ParseSources(req.Server)
		}
	}
	
	s.logger.Info("开始匹配音乐",
		logger.String("id", req.ID),
		logger.Any("sources", sources),
	)
	
	// 检查限流
	if err := s.checkRateLimit(ctx, "match:"+req.ID); err != nil {
		return nil, err
	}
	
	// 尝试从缓存获取
	cacheKey := fmt.Sprintf("unm:match:%s:320", req.ID)
	if cachedResult, err := s.getFromCache(ctx, cacheKey); err == nil {
		s.logger.Info("从缓存获取匹配结果", logger.String("id", req.ID))
		// 安全的类型转换
		if matchResp, ok := cachedResult.(*model.MatchResponse); ok {
			return matchResp, nil
		}
		// 如果类型不匹配，清除缓存并继续
		s.logger.Warn("缓存数据类型不匹配，清除缓存", logger.String("id", req.ID))
		_ = s.clearFromCache(ctx, cacheKey)
	}
	
	// 使用音源管理器匹配音乐
	result, err := s.sourceManager.MatchMusic(ctx, req.ID, sources, "320")
	if err != nil {
		s.logger.Error("匹配音乐失败",
			logger.String("id", req.ID),
			logger.ErrorField("error", err),
		)
		return nil, fmt.Errorf("匹配音乐失败: %w", err)
	}
	
	// 缓存结果
	if err := s.setToCache(ctx, cacheKey, result, 5*time.Minute); err != nil {
		s.logger.Warn("缓存匹配结果失败",
			logger.String("id", req.ID),
			logger.ErrorField("error", err),
		)
	}
	
	s.logger.Info("匹配音乐成功",
		logger.String("id", req.ID),
		logger.String("source", result.Source),
		logger.String("url", result.URL),
	)
	
	return result, nil
}

// GetNCMMusic 获取网易云音乐
func (s *DefaultMusicService) GetNCMMusic(ctx context.Context, req *model.NCMGetRequest) (*model.NCMGetResponse, error) {
	if req == nil {
		return nil, fmt.Errorf("请求不能为空")
	}
	
	if req.ID == "" {
		return nil, fmt.Errorf("音乐ID不能为空")
	}
	
	// 设置默认音质
	br := req.BR
	if br == "" {
		br = "320"
	}
	
	// 验证音质参数
	if !model.IsValidQuality(br) {
		return nil, fmt.Errorf("不支持的音质: %s，支持的音质: %v", br, model.GetValidQualities())
	}
	
	s.logger.Info("开始获取网易云音乐",
		logger.String("id", req.ID),
		logger.String("br", br),
	)
	
	// 检查限流
	if err := s.checkRateLimit(ctx, "ncm:"+req.ID); err != nil {
		return nil, err
	}
	
	// 尝试从缓存获取
	cacheKey := fmt.Sprintf("unm:ncm:%s:%s", req.ID, br)
	if cachedResult, err := s.getFromCache(ctx, cacheKey); err == nil {
		s.logger.Info("从缓存获取网易云音乐", logger.String("id", req.ID))
		if ncmResp, ok := cachedResult.(*model.NCMGetResponse); ok {
			return ncmResp, nil
		}
		_ = s.clearFromCache(ctx, cacheKey)
	}
	
	// 使用可用的音源进行匹配
	var availableSources []string
	if s.configManager != nil {
		availableSources = s.configManager.GetAvailableSources()
	} else {
		availableSources = []string{"unm_server", "gdstudio"}
	}

	// 使用音源管理器匹配音乐
	matchResult, err := s.sourceManager.MatchMusic(ctx, req.ID, availableSources, br)
	if err != nil {
		s.logger.Error("获取网易云音乐失败",
			logger.String("id", req.ID),
			logger.String("br", br),
			logger.ErrorField("error", err),
		)
		return nil, fmt.Errorf("获取网易云音乐失败: %w", err)
	}
	
	// 构建响应
	response := &model.NCMGetResponse{
		ID:       req.ID,
		BR:       br,
		URL:      matchResult.URL,
		ProxyURL: matchResult.ProxyURL,
		Quality:  matchResult.Quality,
	}

	// 使用匹配结果中的音乐信息
	if matchResult.Info != nil {
		response.Info = matchResult.Info
	}
	
	// 缓存结果
	if err := s.setToCache(ctx, cacheKey, response, 5*time.Minute); err != nil {
		s.logger.Warn("缓存网易云音乐失败",
			logger.String("id", req.ID),
			logger.ErrorField("error", err),
		)
	}
	
	s.logger.Info("获取网易云音乐成功",
		logger.String("id", req.ID),
		logger.String("br", br),
		logger.String("url", response.URL),
	)
	
	return response, nil
}

// GetOtherMusic 获取其他音源音乐
func (s *DefaultMusicService) GetOtherMusic(ctx context.Context, req *model.OtherGetRequest) (*model.OtherGetResponse, error) {
	if req == nil {
		return nil, fmt.Errorf("请求不能为空")
	}
	
	if req.Name == "" {
		return nil, fmt.Errorf("歌曲名称不能为空")
	}
	
	s.logger.Info("开始获取其他音源音乐", logger.String("name", req.Name))
	
	// 检查限流
	if err := s.checkRateLimit(ctx, "other:"+req.Name); err != nil {
		return nil, err
	}
	
	// 尝试从缓存获取
	cacheKey := fmt.Sprintf("unm:search:other:%s", req.Name)
	if cachedResult, err := s.getFromCache(ctx, cacheKey); err == nil {
		s.logger.Info("从缓存获取其他音源音乐", logger.String("name", req.Name))
		if otherResp, ok := cachedResult.(*model.OtherGetResponse); ok {
			return otherResp, nil
		}
		_ = s.clearFromCache(ctx, cacheKey)
	}
	
	// 搜索音乐
	searchResults, err := s.sourceManager.SearchMusic(ctx, req.Name, nil)
	if err != nil {
		s.logger.Error("搜索音乐失败",
			logger.String("name", req.Name),
			logger.ErrorField("error", err),
		)
		return nil, fmt.Errorf("搜索音乐失败: %w", err)
	}
	
	if len(searchResults) == 0 {
		return nil, fmt.Errorf("未找到歌曲: %s", req.Name)
	}
	
	// 选择最佳匹配结果
	bestResult := searchResults[0]
	
	// 获取播放链接
	source, err := s.sourceManager.GetSource(bestResult.Source)
	if err != nil {
		return nil, fmt.Errorf("音源不可用: %w", err)
	}
	
	musicURL, err := source.GetMusic(ctx, bestResult.ID, "320")
	if err != nil {
		s.logger.Error("获取播放链接失败",
			logger.String("name", req.Name),
			logger.String("source", bestResult.Source),
			logger.ErrorField("error", err),
		)
		return nil, fmt.Errorf("获取播放链接失败: %w", err)
	}
	
	// 构建响应
	response := &model.OtherGetResponse{
		Name:    req.Name,
		URL:     musicURL.URL,
		Source:  bestResult.Source,
		Quality: musicURL.Quality,
		Info: &model.MusicInfo{
			ID:       bestResult.ID,
			Name:     bestResult.Name,
			Artist:   bestResult.Artist,
			Album:    bestResult.Album,
			Duration: bestResult.Duration,
		},
	}
	
	// 缓存结果
	if err := s.setToCache(ctx, cacheKey, response, 5*time.Minute); err != nil {
		s.logger.Warn("缓存其他音源音乐失败",
			logger.String("name", req.Name),
			logger.ErrorField("error", err),
		)
	}
	
	s.logger.Info("获取其他音源音乐成功",
		logger.String("name", req.Name),
		logger.String("source", response.Source),
		logger.String("url", response.URL),
	)
	
	return response, nil
}



// SearchMusic 搜索音乐
func (s *DefaultMusicService) SearchMusic(ctx context.Context, keyword string, sources []string) ([]*model.SearchResult, error) {
	if keyword == "" {
		return nil, fmt.Errorf("搜索关键词不能为空")
	}
	
	s.logger.Info("开始搜索音乐",
		logger.String("keyword", keyword),
		logger.Any("sources", sources),
	)
	
	// 检查限流
	if err := s.checkRateLimit(ctx, "search:"+keyword); err != nil {
		return nil, err
	}
	
	// 尝试从缓存获取
	cacheKey := fmt.Sprintf("unm:search:all:%s", keyword)
	if cachedResult, err := s.getSearchResultsFromCache(ctx, cacheKey); err == nil {
		s.logger.Info("从缓存获取搜索结果", logger.String("keyword", keyword))
		return cachedResult, nil
	}
	
	// 使用音源管理器搜索
	results, err := s.sourceManager.SearchMusic(ctx, keyword, sources)
	if err != nil {
		s.logger.Error("搜索音乐失败",
			logger.String("keyword", keyword),
			logger.ErrorField("error", err),
		)
		return nil, fmt.Errorf("搜索音乐失败: %w", err)
	}
	
	// 缓存结果
	if err := s.setToCache(ctx, cacheKey, results, 10*time.Minute); err != nil {
		s.logger.Warn("缓存搜索结果失败",
			logger.String("keyword", keyword),
			logger.ErrorField("error", err),
		)
	}
	
	s.logger.Info("搜索音乐成功",
		logger.String("keyword", keyword),
		logger.Int("result_count", len(results)),
	)
	
	return results, nil
}

// GetMusicInfo 获取音乐信息
func (s *DefaultMusicService) GetMusicInfo(ctx context.Context, sourceName, id string) (*model.MusicInfo, error) {
	if sourceName == "" {
		return nil, fmt.Errorf("音源名称不能为空")
	}
	
	if id == "" {
		return nil, fmt.Errorf("音乐ID不能为空")
	}
	
	s.logger.Info("开始获取音乐信息",
		logger.String("source", sourceName),
		logger.String("id", id),
	)
	
	// 检查限流
	if err := s.checkRateLimit(ctx, "info:"+sourceName+":"+id); err != nil {
		return nil, err
	}
	
	// 尝试从缓存获取
	cacheKey := fmt.Sprintf("unm:info:%s:%s", sourceName, id)
	if cachedResult, err := s.getFromCache(ctx, cacheKey); err == nil {
		s.logger.Info("从缓存获取音乐信息",
			logger.String("source", sourceName),
			logger.String("id", id),
		)
		if musicInfo, ok := cachedResult.(*model.MusicInfo); ok {
			return musicInfo, nil
		}
		_ = s.clearFromCache(ctx, cacheKey)
	}
	
	// 获取音源
	source, err := s.sourceManager.GetSource(sourceName)
	if err != nil {
		return nil, fmt.Errorf("音源不可用: %w", err)
	}
	
	// 获取音乐信息
	info, err := source.GetMusicInfo(ctx, id)
	if err != nil {
		s.logger.Error("获取音乐信息失败",
			logger.String("source", sourceName),
			logger.String("id", id),
			logger.ErrorField("error", err),
		)
		return nil, fmt.Errorf("获取音乐信息失败: %w", err)
	}
	
	// 缓存结果
	if err := s.setToCache(ctx, cacheKey, info, 30*time.Minute); err != nil {
		s.logger.Warn("缓存音乐信息失败",
			logger.String("source", sourceName),
			logger.String("id", id),
			logger.ErrorField("error", err),
		)
	}
	
	s.logger.Info("获取音乐信息成功",
		logger.String("source", sourceName),
		logger.String("id", id),
		logger.String("name", info.Name),
	)
	
	return info, nil
}

// checkRateLimit 检查限流
func (s *DefaultMusicService) checkRateLimit(ctx context.Context, key string) error {
	if s.rateLimiter == nil {
		return nil
	}
	
	allowed, err := s.rateLimiter.Allow(ctx, key)
	if err != nil {
		return fmt.Errorf("检查限流失败: %w", err)
	}
	
	if !allowed {
		return fmt.Errorf("请求频率超限，请稍后再试")
	}
	
	return nil
}

// getFromCache 从缓存获取数据
func (s *DefaultMusicService) getFromCache(ctx context.Context, key string) (interface{}, error) {
	if s.cache == nil {
		return nil, fmt.Errorf("缓存不可用")
	}

	// 从缓存获取序列化数据
	value, err := s.cache.Get(ctx, key)
	if err != nil {
		return nil, err
	}

	if value == "" {
		return nil, fmt.Errorf("缓存数据为空")
	}

	// 反序列化缓存数据
	var result interface{}
	valueBytes, ok := value.([]byte)
	if !ok {
		if valueStr, ok := value.(string); ok {
			valueBytes = []byte(valueStr)
		} else {
			return nil, fmt.Errorf("缓存值类型错误")
		}
	}

	if err := json.Unmarshal(valueBytes, &result); err != nil {
		s.logger.Error("缓存数据反序列化失败",
			logger.String("key", key),
			logger.String("value", string(valueBytes)),
			logger.ErrorField("error", err),
		)
		return nil, fmt.Errorf("缓存数据反序列化失败: %w", err)
	}

	return result, nil
}

// getSearchResultsFromCache 从缓存获取搜索结果
func (s *DefaultMusicService) getSearchResultsFromCache(ctx context.Context, key string) ([]*model.SearchResult, error) {
	if s.cache == nil {
		return nil, fmt.Errorf("缓存不可用")
	}

	// 从缓存获取序列化数据
	value, err := s.cache.Get(ctx, key)
	if err != nil {
		return nil, err
	}

	if value == "" {
		return nil, fmt.Errorf("缓存数据为空")
	}

	// 反序列化缓存数据
	var results []*model.SearchResult
	valueBytes, ok := value.([]byte)
	if !ok {
		if valueStr, ok := value.(string); ok {
			valueBytes = []byte(valueStr)
		} else {
			return nil, fmt.Errorf("缓存值类型错误")
		}
	}

	if err := json.Unmarshal(valueBytes, &results); err != nil {
		s.logger.Error("搜索结果缓存数据反序列化失败",
			logger.String("key", key),
			logger.String("value", string(valueBytes)),
			logger.ErrorField("error", err),
		)
		return nil, fmt.Errorf("搜索结果缓存数据反序列化失败: %w", err)
	}

	return results, nil
}

// setToCache 设置缓存数据
func (s *DefaultMusicService) setToCache(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	if s.cache == nil {
		return nil
	}
	
	// 序列化数据为JSON
	data, err := json.Marshal(value)
	if err != nil {
		s.logger.Error("缓存数据序列化失败",
			logger.String("key", key),
			logger.ErrorField("error", err),
		)
		return err
	}

	return s.cache.Set(ctx, key, string(data), ttl)
}

// GetPicture 获取专辑图
func (s *DefaultMusicService) GetPicture(ctx context.Context, sourceName, picID, size string) (string, error) {
	if sourceName == "" {
		return "", fmt.Errorf("音源名称不能为空")
	}

	if picID == "" {
		return "", fmt.Errorf("专辑图ID不能为空")
	}

	// 获取指定音源
	source, err := s.sourceManager.GetSource(sourceName)
	if err != nil {
		return "", fmt.Errorf("获取音源失败: %w", err)
	}

	// 检查音源是否支持获取专辑图
	if gdSource, ok := source.(*sources.GDStudioSource); ok {
		return gdSource.GetPicture(ctx, picID, size)
	}

	return "", fmt.Errorf("音源 %s 不支持获取专辑图", sourceName)
}

// GetLyric 获取歌词
func (s *DefaultMusicService) GetLyric(ctx context.Context, sourceName, lyricID string) (string, string, error) {
	if sourceName == "" {
		return "", "", fmt.Errorf("音源名称不能为空")
	}

	if lyricID == "" {
		return "", "", fmt.Errorf("歌词ID不能为空")
	}

	// 获取指定音源
	source, err := s.sourceManager.GetSource(sourceName)
	if err != nil {
		return "", "", fmt.Errorf("获取音源失败: %w", err)
	}

	// 检查音源是否支持获取歌词
	if gdSource, ok := source.(*sources.GDStudioSource); ok {
		return gdSource.GetLyric(ctx, lyricID)
	}

	return "", "", fmt.Errorf("音源 %s 不支持获取歌词", sourceName)
}

// clearFromCache 清除缓存数据
func (s *DefaultMusicService) clearFromCache(ctx context.Context, key string) error {
	if s.cache == nil {
		return nil
	}
	return s.cache.Delete(ctx, key)
}
