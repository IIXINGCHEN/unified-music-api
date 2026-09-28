package sources

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/config"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/model"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/encoding"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// GDStudioSource GDStudio API音源实现
type GDStudioSource struct {
	client  *http.Client
	config  *config.GDStudioConfig
	logger  logger.Logger
	name    string
	enabled bool
	decoder *encoding.JSONDecoder
}

// GDStudioMatchResponse GDStudio匹配响应
type GDStudioMatchResponse struct {
	Code int    `json:"code"`
	Data struct {
		ID       string `json:"id"`
		URL      string `json:"url"`
		Quality  string `json:"quality"`
		Source   string `json:"source"`
		ProxyURL string `json:"proxy_url,omitempty"`
	} `json:"data"`
	Message string `json:"message"`
}

// GDStudioSearchResponse GDStudio搜索响应
type GDStudioSearchResponse struct {
	ID       int64    `json:"id"`        // 曲目ID
	Name     string   `json:"name"`      // 歌曲名
	Artist   []string `json:"artist"`    // 歌手列表
	Album    string   `json:"album"`     // 专辑名
	PicID    string   `json:"pic_id"`    // 专辑图ID
	URLID    int64    `json:"url_id"`    // URL ID（废弃）
	LyricID  int64    `json:"lyric_id"`  // 歌词ID
	Source   string   `json:"source"`    // 音乐源
}

// GDStudioURLResponse GDStudio获取歌曲响应
type GDStudioURLResponse struct {
	URL  string `json:"url"`  // 音乐链接
	BR   int    `json:"br"`   // 实际返回音质
	Size int64  `json:"size"` // 文件大小，单位为KB
	From string `json:"from"` // 来源信息
}

// GDStudioPicResponse GDStudio获取专辑图响应
type GDStudioPicResponse struct {
	URL string `json:"url"` // 专辑图链接
}

// GDStudioLyricResponse GDStudio获取歌词响应
type GDStudioLyricResponse struct {
	Lyric  string `json:"lyric"`  // LRC格式的原语种歌词
	TLyric string `json:"tlyric"` // LRC格式的中文翻译歌词
}

// NewGDStudioSource 创建GDStudio音源实例
func NewGDStudioSource(config *config.GDStudioConfig, timeout time.Duration, logger logger.Logger) *GDStudioSource {
	if config == nil {
		panic("GDStudio配置不能为空")
	}

	if timeout <= 0 {
		timeout = 30 * time.Second
	}

	return &GDStudioSource{
		client: &http.Client{
			Timeout: timeout,
		},
		config:  config,
		logger:  logger,
		name:    "gdstudio",
		enabled: config.Enabled,
		decoder: encoding.NewJSONDecoder(),
	}
}

// GetName 获取音源名称
func (g *GDStudioSource) GetName() string {
	return g.name
}

// IsEnabled 检查音源是否启用
func (g *GDStudioSource) IsEnabled() bool {
	return g.enabled && g.config.Enabled
}

// SetEnabled 设置音源启用状态
func (g *GDStudioSource) SetEnabled(enabled bool) {
	g.enabled = enabled
}

// IsAvailable 检查音源是否可用
func (g *GDStudioSource) IsAvailable(ctx context.Context) bool {
	if !g.IsEnabled() {
		return false
	}

	// 简单的健康检查
	req, err := http.NewRequestWithContext(ctx, "GET", g.config.BaseURL+"/health", nil)
	if err != nil {
		return false
	}

	resp, err := g.client.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode == http.StatusOK
}

// SearchMusic 搜索音乐
func (g *GDStudioSource) SearchMusic(ctx context.Context, keyword string) ([]*model.SearchResult, error) {
	return g.searchMusicWithLimit(ctx, keyword, 10)
}

// searchMusicWithLimit 带限制的搜索音乐
func (g *GDStudioSource) searchMusicWithLimit(ctx context.Context, keyword string, limit int) ([]*model.SearchResult, error) {
	if !g.IsEnabled() {
		return nil, fmt.Errorf("GDStudio音源已禁用")
	}

	if keyword == "" {
		return nil, fmt.Errorf("搜索关键词不能为空")
	}

	// 构建搜索URL - 使用GDStudio API格式
	searchURL := g.config.BaseURL
	params := url.Values{}
	params.Set("types", "search")
	params.Set("source", "netease") // 使用稳定的音乐源
	params.Set("name", keyword)
	if limit > 0 {
		params.Set("count", strconv.Itoa(limit))
	}
	params.Set("pages", "1") // 默认第一页

	fullURL := searchURL + "?" + params.Encode()

	g.logger.Info("GDStudio搜索音乐",
		logger.String("keyword", keyword),
		logger.String("url", fullURL),
	)

	// 创建请求
	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	// 设置请求头
	req.Header.Set("User-Agent", g.config.UserAgent)
	if g.config.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+g.config.APIKey)
	}

	// 发送请求
	resp, err := g.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("请求失败，状态码: %d", resp.StatusCode)
	}

	// 解析响应（使用编码处理）- GDStudio返回数组
	var searchResults []GDStudioSearchResponse
	if err := g.decoder.DecodeJSONResponse(resp, &searchResults); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	// 转换结果
	results := make([]*model.SearchResult, 0, len(searchResults))
	for _, item := range searchResults {
		// 将艺术家数组转换为字符串
		artistStr := ""
		if len(item.Artist) > 0 {
			fixedArtists := make([]string, len(item.Artist))
			for i, artist := range item.Artist {
				fixedArtists[i] = encoding.FixChineseEncoding(artist)
			}
			artistStr = strings.Join(fixedArtists, ", ")
		}

		result := &model.SearchResult{
			ID:       strconv.FormatInt(item.ID, 10),
			Name:     encoding.FixChineseEncoding(item.Name),
			Artist:   artistStr,
			Album:    encoding.FixChineseEncoding(item.Album),
			Duration: 0, // GDStudio API没有提供时长信息
			Source:   g.name,
		}
		results = append(results, result)
	}

	g.logger.Info("GDStudio搜索完成",
		logger.String("keyword", keyword),
		logger.Int("results", len(results)),
	)

	return results, nil
}

// GetMusic 获取音乐播放链接
func (g *GDStudioSource) GetMusic(ctx context.Context, id string, quality string) (*model.MusicURL, error) {
	if !g.IsEnabled() {
		return nil, fmt.Errorf("GDStudio音源已禁用")
	}

	if id == "" {
		return nil, fmt.Errorf("音乐ID不能为空")
	}

	// 首先尝试通过搜索获取音乐信息
	var musicInfo *model.MusicInfo
	if info, err := g.getMusicInfoBySearch(ctx, id); err == nil {
		musicInfo = info
	}

	// 构建获取歌曲URL - 使用GDStudio API格式
	matchURL := g.config.BaseURL
	params := url.Values{}
	params.Set("types", "url")
	params.Set("source", "netease") // 使用稳定的音乐源
	params.Set("id", id)
	if quality != "" {
		params.Set("br", quality)
	} else {
		params.Set("br", "320") // 默认音质
	}

	fullURL := matchURL + "?" + params.Encode()

	g.logger.Info("GDStudio获取音乐",
		logger.String("id", id),
		logger.String("quality", quality),
		logger.String("url", fullURL),
	)

	// 创建请求
	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	// 设置请求头
	req.Header.Set("User-Agent", g.config.UserAgent)
	if g.config.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+g.config.APIKey)
	}

	// 发送请求
	resp, err := g.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("请求失败，状态码: %d", resp.StatusCode)
	}

	// 解析响应（使用编码处理）- GDStudio返回直接对象
	var urlResp GDStudioURLResponse
	if err := g.decoder.DecodeJSONResponse(resp, &urlResp); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	// 检查是否获取到有效URL
	if urlResp.URL == "" {
		return nil, fmt.Errorf("未获取到有效的音乐链接")
	}

	// 构建结果
	musicURL := &model.MusicURL{
		URL:      urlResp.URL,
		ProxyURL: "", // GDStudio API没有提供ProxyURL
		Quality:  strconv.Itoa(urlResp.BR),
		Size:     urlResp.Size,
		Source:   g.name,
		Info:     musicInfo, // 添加音乐信息
	}

	g.logger.Info("GDStudio获取音乐成功",
		logger.String("id", id),
		logger.String("url", musicURL.URL),
	)

	return musicURL, nil
}

// GetPicture 获取专辑图
func (g *GDStudioSource) GetPicture(ctx context.Context, picID string, size string) (string, error) {
	if !g.IsEnabled() {
		return "", fmt.Errorf("GDStudio音源已禁用")
	}

	if picID == "" {
		return "", fmt.Errorf("专辑图ID不能为空")
	}

	// 构建获取专辑图URL
	picURL := g.config.BaseURL
	params := url.Values{}
	params.Set("types", "pic")
	params.Set("source", "netease")
	params.Set("id", picID)
	if size != "" {
		params.Set("size", size)
	} else {
		params.Set("size", "300") // 默认尺寸
	}

	fullURL := picURL + "?" + params.Encode()

	// 创建请求
	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		return "", fmt.Errorf("创建请求失败: %w", err)
	}

	// 设置请求头
	req.Header.Set("User-Agent", g.config.UserAgent)

	// 发送请求
	resp, err := g.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("请求失败，状态码: %d", resp.StatusCode)
	}

	// 解析响应
	var picResp GDStudioPicResponse
	if err := g.decoder.DecodeJSONResponse(resp, &picResp); err != nil {
		return "", fmt.Errorf("解析响应失败: %w", err)
	}

	return picResp.URL, nil
}

// GetLyric 获取歌词
func (g *GDStudioSource) GetLyric(ctx context.Context, lyricID string) (string, string, error) {
	if !g.IsEnabled() {
		return "", "", fmt.Errorf("GDStudio音源已禁用")
	}

	if lyricID == "" {
		return "", "", fmt.Errorf("歌词ID不能为空")
	}

	// 构建获取歌词URL
	lyricURL := g.config.BaseURL
	params := url.Values{}
	params.Set("types", "lyric")
	params.Set("source", "netease")
	params.Set("id", lyricID)

	fullURL := lyricURL + "?" + params.Encode()

	// 创建请求
	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		return "", "", fmt.Errorf("创建请求失败: %w", err)
	}

	// 设置请求头
	req.Header.Set("User-Agent", g.config.UserAgent)

	// 发送请求
	resp, err := g.client.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("请求失败，状态码: %d", resp.StatusCode)
	}

	// 解析响应
	var lyricResp GDStudioLyricResponse
	if err := g.decoder.DecodeJSONResponse(resp, &lyricResp); err != nil {
		return "", "", fmt.Errorf("解析响应失败: %w", err)
	}

	return lyricResp.Lyric, lyricResp.TLyric, nil
}

// getMusicInfoBySearch 通过搜索获取音乐信息
func (g *GDStudioSource) getMusicInfoBySearch(ctx context.Context, id string) (*model.MusicInfo, error) {
	// 构建搜索URL - 使用GDStudio API格式
	searchURL := g.config.BaseURL
	params := url.Values{}
	params.Set("types", "search")
	params.Set("source", "netease")
	params.Set("name", id) // 使用ID作为关键词搜索
	params.Set("count", "20") // 搜索更多结果
	params.Set("pages", "1")

	fullURL := searchURL + "?" + params.Encode()

	// 创建请求
	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	// 设置请求头
	req.Header.Set("User-Agent", g.config.UserAgent)
	if g.config.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+g.config.APIKey)
	}

	// 发送请求
	resp, err := g.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	// 解析响应 - GDStudio返回数组
	var searchResults []GDStudioSearchResponse
	if err := g.decoder.DecodeJSONResponse(resp, &searchResults); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	// 查找匹配的音乐信息
	targetID := id
	for _, item := range searchResults {
		if strconv.FormatInt(item.ID, 10) == targetID {
			// 将艺术家数组转换为字符串
			artistStr := ""
			if len(item.Artist) > 0 {
				fixedArtists := make([]string, len(item.Artist))
				for i, artist := range item.Artist {
					fixedArtists[i] = encoding.FixChineseEncoding(artist)
				}
				artistStr = strings.Join(fixedArtists, ", ")
			}

			// 尝试获取专辑图URL
			picURL := ""
			if item.PicID != "" {
				if url, err := g.GetPicture(ctx, item.PicID, "300"); err == nil {
					picURL = url
				}
			}

			// 找到匹配的音乐
			return &model.MusicInfo{
				ID:       targetID,
				Name:     encoding.FixChineseEncoding(item.Name),
				Artist:   artistStr,
				Album:    encoding.FixChineseEncoding(item.Album),
				Duration: 0, // GDStudio API没有提供时长信息
				PicURL:   picURL,
			}, nil
		}
	}

	// 如果没有找到精确匹配，返回nil（不是错误）
	return nil, fmt.Errorf("未找到ID为 %s 的音乐信息", id)
}

// GetMusicInfo 获取音乐详细信息
func (g *GDStudioSource) GetMusicInfo(ctx context.Context, id string) (*model.MusicInfo, error) {
	if !g.IsEnabled() {
		return nil, fmt.Errorf("GDStudio音源已禁用")
	}

	if id == "" {
		return nil, fmt.Errorf("音乐ID不能为空")
	}

	// 尝试通过搜索获取真实的音乐信息
	if info, err := g.getMusicInfoBySearch(ctx, id); err == nil {
		return info, nil
	}

	// 如果搜索失败，返回基本信息
	return &model.MusicInfo{
		ID:       id,
		Name:     "未知歌曲",
		Artist:   "未知艺术家",
		Album:    "未知专辑",
		Duration: 0,
	}, nil
}

// HealthCheck 健康检查
func (g *GDStudioSource) HealthCheck(ctx context.Context) error {
	if !g.IsEnabled() {
		return fmt.Errorf("音源已禁用")
	}

	if !g.IsAvailable(ctx) {
		return fmt.Errorf("GDStudio服务器不可用")
	}

	return nil
}

// GetConfig 获取音源配置
func (g *GDStudioSource) GetConfig() *model.SourceConfig {
	return &model.SourceConfig{
		Name:      g.name,
		Enabled:   g.enabled,
		Priority:  2, // 设置优先级，比UNM低
		APIKey:    g.config.APIKey,
		UserAgent: g.config.UserAgent,
	}
}

// UpdateConfig 更新音源配置
func (g *GDStudioSource) UpdateConfig(config *model.SourceConfig) error {
	if config == nil {
		return fmt.Errorf("配置不能为空")
	}

	g.name = config.Name
	g.enabled = config.Enabled

	g.logger.Info("GDStudio音源配置已更新",
		logger.String("name", config.Name),
		logger.Bool("enabled", config.Enabled),
	)

	return nil
}
