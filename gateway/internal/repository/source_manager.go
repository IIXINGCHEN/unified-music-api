// Package repository 音源管理器实现
package repository

import (
	"context"
	"fmt"
	"sort"
	"sync"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/config"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/model"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/repository/sources"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// DefaultSourceManager 默认音源管理器实现
type DefaultSourceManager struct {
	sources      map[string]MusicSource // 注册的音源
	mu           sync.RWMutex           // 读写锁
	logger       logger.Logger          // 日志器
	httpClient   HTTPClient             // HTTP客户端
	config       *model.SourcesConfigModel // 音源配置
	infoProvider *MusicInfoProvider     // 音乐信息提供者
	infoResolver *MusicInfoResolver     // 音乐信息解析器
}

// NewDefaultSourceManager 创建默认音源管理器
func NewDefaultSourceManager(httpClient HTTPClient, config *model.SourcesConfigModel, cache CacheRepository, log logger.Logger) *DefaultSourceManager {
	sm := &DefaultSourceManager{
		sources:      make(map[string]MusicSource),
		logger:       log,
		httpClient:   httpClient,
		config:       config,
		infoProvider: NewMusicInfoProvider(cache, log),
		infoResolver: NewMusicInfoResolver(&config.MusicInfoResolver, &config.GDStudio, log),
	}

	// 初始化所有音源
	sm.initializeSources()

	return sm
}

// initializeSources 初始化所有音源
func (sm *DefaultSourceManager) initializeSources() {
	// 获取超时配置
	timeout := 30 * time.Second
	if sm.config != nil && sm.config.Timeout > 0 {
		timeout = sm.config.Timeout
	}

	sm.logger.Info("开始初始化第三方API音源", logger.String("timeout", timeout.String()))

	// 初始化UNM服务器音源
	if sm.config != nil && sm.config.UNMServer.Enabled {
		unmConfig := &config.UNMServerConfig{
			Enabled:    sm.config.UNMServer.Enabled,
			BaseURL:    sm.config.UNMServer.BaseURL,
			APIKey:     sm.config.UNMServer.APIKey,
			Timeout:    sm.config.UNMServer.Timeout,
			RetryCount: sm.config.UNMServer.RetryCount,
			UserAgent:  sm.config.UNMServer.UserAgent,
		}
		unmSource := sources.NewUNMSource(unmConfig, timeout, sm.logger)
		if err := sm.RegisterSource(unmSource); err != nil {
			sm.logger.Error("注册UNM服务器音源失败",
				logger.ErrorField("error", err),
			)
		} else {
			sm.logger.Info("UNM服务器音源注册成功",
				logger.String("base_url", sm.config.UNMServer.BaseURL),
			)
		}
	}

	// 初始化GDStudio音源
	if sm.config != nil && sm.config.GDStudio.Enabled {
		gdstudioConfig := &config.GDStudioConfig{
			Enabled:    sm.config.GDStudio.Enabled,
			BaseURL:    sm.config.GDStudio.BaseURL,
			APIKey:     sm.config.GDStudio.APIKey,
			Timeout:    sm.config.GDStudio.Timeout,
			RetryCount: sm.config.GDStudio.RetryCount,
			UserAgent:  sm.config.GDStudio.UserAgent,
		}
		gdstudioSource := sources.NewGDStudioSource(gdstudioConfig, timeout, sm.logger)
		if err := sm.RegisterSource(gdstudioSource); err != nil {
			sm.logger.Error("注册GDStudio音源失败",
				logger.ErrorField("error", err),
			)
		} else {
			sm.logger.Info("GDStudio音源注册成功")
		}
	}

	sm.logger.Info("第三方API音源初始化完成",
		logger.Int("count", len(sm.sources)),
	)
}

// RegisterSource 注册音源
func (sm *DefaultSourceManager) RegisterSource(source MusicSource) error {
	if source == nil {
		return fmt.Errorf("音源不能为空")
	}
	
	name := source.GetName()
	if name == "" {
		return fmt.Errorf("音源名称不能为空")
	}
	
	sm.mu.Lock()
	defer sm.mu.Unlock()
	
	if _, exists := sm.sources[name]; exists {
		return fmt.Errorf("音源 %s 已存在", name)
	}
	
	sm.sources[name] = source
	sm.logger.Info("音源注册成功", logger.String("source", name))
	
	return nil
}

// UnregisterSource 取消注册音源
func (sm *DefaultSourceManager) UnregisterSource(name string) error {
	if name == "" {
		return fmt.Errorf("音源名称不能为空")
	}
	
	sm.mu.Lock()
	defer sm.mu.Unlock()
	
	if _, exists := sm.sources[name]; !exists {
		return fmt.Errorf("音源 %s 不存在", name)
	}
	
	delete(sm.sources, name)
	sm.logger.Info("音源取消注册成功", logger.String("source", name))
	
	return nil
}

// GetSource 获取指定音源
func (sm *DefaultSourceManager) GetSource(name string) (MusicSource, error) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	
	source, exists := sm.sources[name]
	if !exists {
		return nil, fmt.Errorf("音源 %s 不存在", name)
	}
	
	return source, nil
}

// GetAllSources 获取所有音源
func (sm *DefaultSourceManager) GetAllSources() []MusicSource {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	
	sources := make([]MusicSource, 0, len(sm.sources))
	for _, source := range sm.sources {
		sources = append(sources, source)
	}
	
	// 按名称排序
	sort.Slice(sources, func(i, j int) bool {
		return sources[i].GetName() < sources[j].GetName()
	})
	
	return sources
}

// GetEnabledSources 获取启用的音源
func (sm *DefaultSourceManager) GetEnabledSources() []MusicSource {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	
	sources := make([]MusicSource, 0)
	for _, source := range sm.sources {
		if source.IsEnabled() {
			sources = append(sources, source)
		}
	}
	
	// 按优先级排序
	sort.Slice(sources, func(i, j int) bool {
		configI := sources[i].GetConfig()
		configJ := sources[j].GetConfig()
		return configI.Priority < configJ.Priority
	})
	
	return sources
}

// GetSourcesByNames 根据名称获取音源列表
func (sm *DefaultSourceManager) GetSourcesByNames(names []string) []MusicSource {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	
	sources := make([]MusicSource, 0, len(names))
	for _, name := range names {
		if source, exists := sm.sources[name]; exists && source.IsEnabled() {
			sources = append(sources, source)
		}
	}
	
	return sources
}

// MatchMusic 使用多个音源匹配音乐
func (sm *DefaultSourceManager) MatchMusic(ctx context.Context, id string, sourceNames []string, quality string) (*model.MatchResponse, error) {
	if id == "" {
		return nil, fmt.Errorf("音乐ID不能为空")
	}
	
	// 获取要使用的音源
	var sources []MusicSource
	if len(sourceNames) > 0 {
		sm.logger.Info("使用指定音源", logger.String("source_names", fmt.Sprintf("%v", sourceNames)))
		sources = sm.GetSourcesByNames(sourceNames)
	} else {
		sm.logger.Info("使用启用的音源")
		sources = sm.GetEnabledSources()
	}

	sm.logger.Info("获取到的音源数量", logger.Int("count", len(sources)))
	for i, source := range sources {
		sm.logger.Info("音源信息",
			logger.Int("index", i),
			logger.String("name", source.GetName()),
			logger.Bool("enabled", source.IsEnabled()),
		)
	}

	if len(sources) == 0 {
		return nil, fmt.Errorf("没有可用的音源")
	}
	
	// 设置默认音质
	if quality == "" {
		quality = "320"
	}
	
	sm.logger.Info("开始音乐匹配",
		logger.String("id", id),
		logger.String("quality", quality),
		logger.Int("source_count", len(sources)),
	)
	
	// 依次尝试每个音源
	for _, source := range sources {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		default:
		}
		
		start := time.Now()
		musicURL, err := source.GetMusic(ctx, id, quality)
		duration := time.Since(start)
		
		if err != nil {
			sm.logger.Warn("音源匹配失败",
				logger.String("source", source.GetName()),
				logger.String("id", id),
				logger.String("duration", duration.String()),
				logger.ErrorField("error", err),
			)
			continue
		}
		
		if musicURL != nil && musicURL.URL != "" {
			sm.logger.Info("音源匹配成功",
				logger.String("source", source.GetName()),
				logger.String("id", id),
				logger.String("duration", duration.String()),
			)
			
			// 构建响应
			response := &model.MatchResponse{
				ID:       id,
				URL:      musicURL.URL,
				ProxyURL: musicURL.ProxyURL,
				Quality:  musicURL.Quality,
				Source:   source.GetName(),
			}

			// 获取音乐信息（优先使用音乐信息解析器）
			if musicURL.Info != nil {
				response.Info = musicURL.Info
			} else if sm.infoResolver != nil {
				if info, err := sm.infoResolver.ResolveMusicInfo(ctx, id); err == nil {
					response.Info = info
					sm.logger.Info("使用音乐信息解析器获取到真实信息",
						logger.String("id", id),
						logger.String("name", info.Name),
						logger.String("artist", info.Artist),
					)
				} else {
					sm.logger.Warn("音乐信息解析器获取失败，尝试其他方式",
						logger.String("id", id),
						logger.ErrorField("error", err),
					)
				}
			}

			// 如果解析器失败，尝试其他方式
			if response.Info == nil {
				if sm.infoProvider != nil {
					if info, err := sm.infoProvider.GetMusicInfo(ctx, id, []MusicSource{source}); err == nil {
						response.Info = info
					}
				} else if info, err := source.GetMusicInfo(ctx, id); err == nil {
					response.Info = info
				}
			}
			
			return response, nil
		}
	}
	
	return nil, fmt.Errorf("所有音源都无法匹配音乐ID: %s", id)
}

// SearchMusic 使用多个音源搜索音乐
func (sm *DefaultSourceManager) SearchMusic(ctx context.Context, keyword string, sourceNames []string) ([]*model.SearchResult, error) {
	if keyword == "" {
		return nil, fmt.Errorf("搜索关键词不能为空")
	}
	
	// 获取要使用的音源
	var sources []MusicSource
	if len(sourceNames) > 0 {
		sources = sm.GetSourcesByNames(sourceNames)
	} else {
		sources = sm.GetEnabledSources()
	}
	
	if len(sources) == 0 {
		return nil, fmt.Errorf("没有可用的音源")
	}
	
	sm.logger.Info("开始音乐搜索",
		logger.String("keyword", keyword),
		logger.Int("source_count", len(sources)),
	)
	
	allResults := make([]*model.SearchResult, 0)
	
	// 并行搜索所有音源
	resultChan := make(chan []*model.SearchResult, len(sources))
	errorChan := make(chan error, len(sources))
	
	for _, source := range sources {
		go func(src MusicSource) {
			start := time.Now()
			results, err := src.SearchMusic(ctx, keyword)
			duration := time.Since(start)
			
			if err != nil {
				sm.logger.Warn("音源搜索失败",
					logger.String("source", src.GetName()),
					logger.String("keyword", keyword),
					logger.String("duration", duration.String()),
					logger.ErrorField("error", err),
				)
				errorChan <- err
				return
			}
			
			sm.logger.Info("音源搜索成功",
				logger.String("source", src.GetName()),
				logger.String("keyword", keyword),
				logger.Int("result_count", len(results)),
				logger.String("duration", duration.String()),
			)
			
			resultChan <- results
		}(source)
	}
	
	// 收集结果
	for i := 0; i < len(sources); i++ {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case results := <-resultChan:
			allResults = append(allResults, results...)
		case <-errorChan:
			// 忽略单个音源的错误，继续处理其他音源
		}
	}
	
	// 去重和排序
	uniqueResults := sm.deduplicateResults(allResults)
	sm.sortResultsByScore(uniqueResults)
	
	return uniqueResults, nil
}



// GetSourcesStatus 获取音源状态
func (sm *DefaultSourceManager) GetSourcesStatus(ctx context.Context) ([]*model.SourceStatus, error) {
	sources := sm.GetAllSources()
	statuses := make([]*model.SourceStatus, len(sources))
	
	// 并行检查所有音源状态
	statusChan := make(chan *model.SourceStatus, len(sources))
	
	for _, source := range sources {
		go func(src MusicSource) {
			status := &model.SourceStatus{
				Name:      src.GetName(),
				Enabled:   src.IsEnabled(),
				Available: false,
				LastCheck: time.Now(),
			}
			
			if src.IsEnabled() {
				start := time.Now()
				err := src.HealthCheck(ctx)
				status.ResponseTime = time.Since(start)
				
				if err != nil {
					status.LastError = err.Error()
				} else {
					status.Available = true
				}
			}
			
			statusChan <- status
		}(source)
	}
	
	// 收集状态结果
	for i := 0; i < len(sources); i++ {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case status := <-statusChan:
			statuses[i] = status
		}
	}
	
	return statuses, nil
}

// RefreshSources 刷新音源配置
func (sm *DefaultSourceManager) RefreshSources() error {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	
	// 重新加载所有音源的配置
	for name, source := range sm.sources {
		config := source.GetConfig()
		if err := source.UpdateConfig(config); err != nil {
			sm.logger.Error("刷新音源配置失败",
				logger.String("source", name),
				logger.ErrorField("error", err),
			)
		}
	}
	
	sm.logger.Info("音源配置刷新完成")
	return nil
}

// deduplicateResults 去重搜索结果
func (sm *DefaultSourceManager) deduplicateResults(results []*model.SearchResult) []*model.SearchResult {
	seen := make(map[string]*model.SearchResult)
	
	for _, result := range results {
		key := fmt.Sprintf("%s-%s-%s", result.Name, result.Artist, result.Album)
		if existing, exists := seen[key]; exists {
			// 保留评分更高的结果
			if result.Score > existing.Score {
				seen[key] = result
			}
		} else {
			seen[key] = result
		}
	}
	
	unique := make([]*model.SearchResult, 0, len(seen))
	for _, result := range seen {
		unique = append(unique, result)
	}
	
	return unique
}

// sortResultsByScore 按评分排序搜索结果
func (sm *DefaultSourceManager) sortResultsByScore(results []*model.SearchResult) {
	sort.Slice(results, func(i, j int) bool {
		return results[i].Score > results[j].Score
	})
}
