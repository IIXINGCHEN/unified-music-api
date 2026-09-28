package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/model"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/encoding"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// MusicInfoResolver 音乐信息解析器 - 仅使用GDStudio API
type MusicInfoResolver struct {
	config         *model.MusicInfoResolverConfigModel
	gdstudioConfig *model.GDStudioConfigModel
	client         *http.Client
	logger         logger.Logger
	cache          map[string]*model.MusicInfo
	mutex          sync.RWMutex
}

// NewMusicInfoResolver 创建音乐信息解析器
func NewMusicInfoResolver(config *model.MusicInfoResolverConfigModel, gdstudioConfig *model.GDStudioConfigModel, logger logger.Logger) *MusicInfoResolver {
	if config == nil {
		logger.Warn("音乐信息解析器配置为空，使用默认配置")
		config = &model.MusicInfoResolverConfigModel{
			Enabled:  false,
			Timeout:  10 * time.Second,
			CacheTTL: time.Hour,
		}
	}

	if gdstudioConfig == nil || !gdstudioConfig.Enabled {
		logger.Error("GDStudio配置为空或未启用，音乐信息解析器无法工作")
		config.Enabled = false
	}

	return &MusicInfoResolver{
		config:         config,
		gdstudioConfig: gdstudioConfig,
		client: &http.Client{
			Timeout: config.Timeout,
		},
		logger: logger,
		cache:  make(map[string]*model.MusicInfo),
	}
}

// GDStudioSearchResult GDStudio搜索结果
type GDStudioSearchResult struct {
	ID       int64    `json:"id"`        // 曲目ID
	Name     string   `json:"name"`      // 歌曲名
	Artist   []string `json:"artist"`    // 歌手列表
	Album    string   `json:"album"`     // 专辑名
	PicID    string   `json:"pic_id"`    // 专辑图ID
	URLID    int64    `json:"url_id"`    // URL ID（废弃）
	LyricID  int64    `json:"lyric_id"`  // 歌词ID
	Source   string   `json:"source"`    // 音乐源
}

// ResolveMusicInfo 解析音乐信息 - 仅使用GDStudio API
func (mir *MusicInfoResolver) ResolveMusicInfo(ctx context.Context, id string) (*model.MusicInfo, error) {
	// 检查是否启用
	if !mir.config.Enabled {
		return nil, fmt.Errorf("音乐信息解析器未启用")
	}

	// 检查GDStudio配置
	if mir.gdstudioConfig == nil || !mir.gdstudioConfig.Enabled {
		return nil, fmt.Errorf("GDStudio配置未启用")
	}

	// 检查缓存
	mir.mutex.RLock()
	if info, exists := mir.cache[id]; exists {
		mir.mutex.RUnlock()
		return info, nil
	}
	mir.mutex.RUnlock()

	// 构建策略列表（仅使用GDStudio API）
	var strategies []func(context.Context, string) (*model.MusicInfo, error)

	// 1. 尝试直接搜索ID
	strategies = append(strategies, mir.getFromGDStudioDirectSearch)

	// 2. 如果启用搜索回退，尝试关键词搜索
	if mir.config.SearchFallback.Enabled {
		strategies = append(strategies, mir.getFromSearchFallback)
	}

	for i, strategy := range strategies {
		mir.logger.Debug("尝试音乐信息解析策略",
			logger.String("id", id),
			logger.Int("strategy", i+1),
		)

		if info, err := strategy(ctx, id); err == nil {
			// 缓存结果
			mir.mutex.Lock()
			mir.cache[id] = info
			mir.mutex.Unlock()

			mir.logger.Info("成功解析音乐信息",
				logger.String("id", id),
				logger.String("name", info.Name),
				logger.String("artist", info.Artist),
				logger.Int("strategy", i+1),
			)
			return info, nil
		} else {
			mir.logger.Debug("音乐信息解析策略失败",
				logger.String("id", id),
				logger.Int("strategy", i+1),
				logger.ErrorField("error", err),
			)
		}
	}

	return nil, fmt.Errorf("无法解析音乐信息: %s", id)
}

// getFromGDStudioDirectSearch 从GDStudio API直接搜索获取
func (mir *MusicInfoResolver) getFromGDStudioDirectSearch(ctx context.Context, id string) (*model.MusicInfo, error) {
	// 使用配置中的GDStudio API
	apiURL := mir.gdstudioConfig.BaseURL
	params := url.Values{}
	params.Set("types", "search")
	params.Set("source", "netease")
	params.Set("name", id)
	params.Set("count", "50") // 增加搜索结果数量
	params.Set("pages", "1")

	fullURL := apiURL + "?" + params.Encode()

	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	// 使用配置中的User-Agent
	req.Header.Set("User-Agent", mir.gdstudioConfig.UserAgent)
	if mir.gdstudioConfig.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+mir.gdstudioConfig.APIKey)
	}

	resp, err := mir.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	var searchResults []GDStudioSearchResult
	if err := json.NewDecoder(resp.Body).Decode(&searchResults); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	targetID, _ := strconv.ParseInt(id, 10, 64)

	// 查找精确匹配
	for _, item := range searchResults {
		if item.ID == targetID {
			artistStr := ""
			if len(item.Artist) > 0 {
				fixedArtists := make([]string, len(item.Artist))
				for i, artist := range item.Artist {
					fixedArtists[i] = encoding.FixChineseEncoding(artist)
				}
				artistStr = strings.Join(fixedArtists, ", ")
			}

			return &model.MusicInfo{
				ID:       id,
				Name:     encoding.FixChineseEncoding(item.Name),
				Artist:   artistStr,
				Album:    encoding.FixChineseEncoding(item.Album),
				Duration: 0, // GDStudio API没有提供时长信息
				PicURL:   "", // 可以后续通过pic_id获取
			}, nil
		}
	}

	return nil, fmt.Errorf("GDStudio API未找到ID为 %s 的音乐", id)
}

// getFromSearchFallback 搜索回退策略 - 仅使用GDStudio API
func (mir *MusicInfoResolver) getFromSearchFallback(ctx context.Context, id string) (*model.MusicInfo, error) {
	// 使用配置中的搜索关键词
	keywords := mir.config.SearchFallback.Keywords
	maxKeywords := mir.config.SearchFallback.MaxKeywords

	// 限制尝试的关键词数量
	if maxKeywords > 0 && len(keywords) > maxKeywords {
		keywords = keywords[:maxKeywords]
	}

	for _, keyword := range keywords {
		if info, err := mir.searchByKeyword(ctx, keyword, id); err == nil {
			return info, nil
		}
	}

	return nil, fmt.Errorf("搜索回退失败")
}

// searchByKeyword 通过关键词搜索 - 仅使用GDStudio API
func (mir *MusicInfoResolver) searchByKeyword(ctx context.Context, keyword, targetID string) (*model.MusicInfo, error) {
	// 使用配置中的GDStudio API
	apiURL := mir.gdstudioConfig.BaseURL
	params := url.Values{}
	params.Set("types", "search")
	params.Set("source", "netease")
	params.Set("name", keyword)
	params.Set("count", strconv.Itoa(mir.config.SearchFallback.MaxResults))
	params.Set("pages", "1")

	fullURL := apiURL + "?" + params.Encode()

	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		return nil, err
	}

	// 使用配置中的User-Agent
	req.Header.Set("User-Agent", mir.gdstudioConfig.UserAgent)
	if mir.gdstudioConfig.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+mir.gdstudioConfig.APIKey)
	}

	resp, err := mir.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var searchResults []GDStudioSearchResult
	if err := json.NewDecoder(resp.Body).Decode(&searchResults); err != nil {
		return nil, err
	}

	// 如果有搜索结果，使用第一个作为模板
	if len(searchResults) > 0 {
		item := searchResults[0]
		artistStr := ""
		if len(item.Artist) > 0 {
			fixedArtists := make([]string, len(item.Artist))
			for i, artist := range item.Artist {
				fixedArtists[i] = encoding.FixChineseEncoding(artist)
			}
			artistStr = strings.Join(fixedArtists, ", ")
		}

		return &model.MusicInfo{
			ID:       targetID, // 保持目标ID
			Name:     encoding.FixChineseEncoding(item.Name),
			Artist:   artistStr,
			Album:    encoding.FixChineseEncoding(item.Album),
			Duration: 0,
			PicURL:   "",
		}, nil
	}

	return nil, fmt.Errorf("搜索无结果")
}