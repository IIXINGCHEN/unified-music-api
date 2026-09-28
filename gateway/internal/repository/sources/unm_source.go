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

// UNMSource UnblockNeteaseMusic音源实现
type UNMSource struct {
	client  *http.Client
	config  *config.UNMServerConfig
	logger  logger.Logger
	name    string
	enabled bool
	decoder *encoding.JSONDecoder
}

// UNMMatchResponse UNM匹配响应
type UNMMatchResponse struct {
	Code int    `json:"code"`
	Data struct {
		URL    string `json:"url"`
		BR     int    `json:"br"`
		Size   int64  `json:"size"`
		MD5    string `json:"md5"`
		Source string `json:"source"`
	} `json:"data"`
	Message string `json:"message"`
}

// UNMSearchResponse UNM搜索响应
type UNMSearchResponse struct {
	Code int    `json:"code"`
	Data []struct {
		ID      int64    `json:"id"`
		Name    string   `json:"name"`
		Artist  []string `json:"artist"`
		Album   string   `json:"album"`
		PicID   string   `json:"pic_id"`
		LyricID int64    `json:"lyric_id"`
		Source  string   `json:"source"`
	} `json:"data"`
	Message string `json:"message"`
}

// NewUNMSource 创建UNM音源实例
func NewUNMSource(config *config.UNMServerConfig, timeout time.Duration, logger logger.Logger) *UNMSource {
	if config == nil {
		panic("UNM服务器配置不能为空")
	}

	if timeout <= 0 {
		timeout = 30 * time.Second
	}

	return &UNMSource{
		client: &http.Client{
			Timeout: timeout,
		},
		config:  config,
		logger:  logger,
		name:    "unm_server",
		enabled: config.Enabled,
		decoder: encoding.NewJSONDecoder(),
	}
}

// GetName 获取音源名称
func (u *UNMSource) GetName() string {
	return u.name
}

// IsEnabled 检查音源是否启用
func (u *UNMSource) IsEnabled() bool {
	return u.enabled && u.config.Enabled
}

// SetEnabled 设置音源启用状态
func (u *UNMSource) SetEnabled(enabled bool) {
	u.enabled = enabled
}

// IsAvailable 检查音源是否可用
func (u *UNMSource) IsAvailable(ctx context.Context) bool {
	if !u.IsEnabled() {
		return false
	}

	// 简单的健康检查 - 使用根路径
	req, err := http.NewRequestWithContext(ctx, "GET", u.config.BaseURL+"/", nil)
	if err != nil {
		return false
	}

	resp, err := u.client.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode == http.StatusOK
}

// SearchMusic 搜索音乐
func (u *UNMSource) SearchMusic(ctx context.Context, keyword string) ([]*model.SearchResult, error) {
	return u.searchMusicWithLimit(ctx, keyword, 10)
}

// searchMusicWithLimit 带限制的搜索音乐
func (u *UNMSource) searchMusicWithLimit(ctx context.Context, keyword string, limit int) ([]*model.SearchResult, error) {
	if !u.IsEnabled() {
		return nil, fmt.Errorf("UNM音源已禁用")
	}

	if keyword == "" {
		return nil, fmt.Errorf("搜索关键词不能为空")
	}

	// 构建搜索URL - 使用GDStudio API格式
	searchURL := u.config.BaseURL
	params := url.Values{}
	params.Set("types", "search")
	params.Set("source", "netease") // 使用稳定的音乐源
	params.Set("name", keyword)
	if limit > 0 {
		params.Set("count", strconv.Itoa(limit))
	} else {
		params.Set("count", "20") // 默认返回20条结果
	}
	params.Set("pages", "1") // 默认第一页

	fullURL := searchURL + "?" + params.Encode()

	u.logger.Info("UNM搜索音乐",
		logger.String("keyword", keyword),
		logger.String("url", fullURL),
	)

	// 创建请求
	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	// 设置请求头
	req.Header.Set("User-Agent", u.config.UserAgent)
	if u.config.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+u.config.APIKey)
	}

	// 发送请求
	resp, err := u.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("请求失败，状态码: %d", resp.StatusCode)
	}

	// 解析响应（使用编码处理）- 现在使用GDStudio格式（数组）
	var searchResults []struct {
		ID       int64    `json:"id"`        // 曲目ID
		Name     string   `json:"name"`      // 歌曲名
		Artist   []string `json:"artist"`    // 歌手列表
		Album    string   `json:"album"`     // 专辑名
		PicID    string   `json:"pic_id"`    // 专辑图ID
		URLID    int64    `json:"url_id"`    // URL ID（废弃）
		LyricID  int64    `json:"lyric_id"`  // 歌词ID
		Source   string   `json:"source"`    // 音乐源
	}

	if err := u.decoder.DecodeJSONResponse(resp, &searchResults); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	// 转换结果
	results := make([]*model.SearchResult, 0, len(searchResults))
	for _, item := range searchResults {
		// 将艺术家数组转换为字符串
		artistStr := ""
		if len(item.Artist) > 0 {
			// 修复每个艺术家名称的编码
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
			Duration: 0, // API没有提供时长信息
			Source:   u.name,
		}
		results = append(results, result)
	}

	u.logger.Info("UNM搜索完成",
		logger.String("keyword", keyword),
		logger.Int("results", len(results)),
	)

	return results, nil
}

// GetMusic 获取音乐播放链接
func (u *UNMSource) GetMusic(ctx context.Context, id string, quality string) (*model.MusicURL, error) {
	if !u.IsEnabled() {
		return nil, fmt.Errorf("UNM音源已禁用")
	}

	if id == "" {
		return nil, fmt.Errorf("音乐ID不能为空")
	}

	// 首先尝试通过搜索获取音乐信息
	var musicInfo *model.MusicInfo
	if info, err := u.getMusicInfoBySearch(ctx, id); err == nil {
		musicInfo = info
	}

	// 构建获取音乐URL - 使用GDStudio API格式
	matchURL := u.config.BaseURL
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

	u.logger.Info("UNM获取音乐",
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
	req.Header.Set("User-Agent", u.config.UserAgent)
	if u.config.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+u.config.APIKey)
	}

	// 发送请求
	resp, err := u.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("请求失败，状态码: %d", resp.StatusCode)
	}

	// 解析响应（使用编码处理）- 现在使用GDStudio格式
	var urlResp struct {
		URL  string `json:"url"`  // 音乐链接
		BR   int    `json:"br"`   // 实际返回音质
		Size int64  `json:"size"` // 文件大小，单位为KB
		From string `json:"from"` // 来源信息
	}

	if err := u.decoder.DecodeJSONResponse(resp, &urlResp); err != nil {
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
		Source:   u.name,
		Info:     musicInfo, // 添加音乐信息
	}

	u.logger.Info("UNM获取音乐成功",
		logger.String("id", id),
		logger.String("url", musicURL.URL),
	)

	return musicURL, nil
}

// getMusicInfoBySearch 通过搜索获取音乐信息
func (u *UNMSource) getMusicInfoBySearch(ctx context.Context, id string) (*model.MusicInfo, error) {
	// 使用GDStudio API格式搜索
	searchURL := u.config.BaseURL
	params := url.Values{}
	params.Set("types", "search")
	params.Set("source", "netease")
	params.Set("name", id) // 使用ID作为关键词搜索
	params.Set("count", "20") // 搜索更多结果
	params.Set("pages", "1")

	strategyURL := searchURL + "?" + params.Encode()

	if info, err := u.tryGetMusicInfo(ctx, strategyURL, id); err == nil {
		return info, nil
	}

	return nil, fmt.Errorf("未找到ID为 %s 的音乐信息", id)
}

// tryGetMusicInfo 尝试从指定URL获取音乐信息
func (u *UNMSource) tryGetMusicInfo(ctx context.Context, fullURL, targetID string) (*model.MusicInfo, error) {

	// 创建请求
	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	// 设置请求头
	req.Header.Set("User-Agent", u.config.UserAgent)
	if u.config.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+u.config.APIKey)
	}

	// 发送请求
	resp, err := u.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	// 解析GDStudio格式的搜索响应（数组）
	var searchResults []struct {
		ID       int64    `json:"id"`        // 曲目ID
		Name     string   `json:"name"`      // 歌曲名
		Artist   []string `json:"artist"`    // 歌手列表
		Album    string   `json:"album"`     // 专辑名
		PicID    string   `json:"pic_id"`    // 专辑图ID
		URLID    int64    `json:"url_id"`    // URL ID（废弃）
		LyricID  int64    `json:"lyric_id"`  // 歌词ID
		Source   string   `json:"source"`    // 音乐源
	}

	if err := u.decoder.DecodeJSONResponse(resp, &searchResults); err == nil {
		// 查找匹配的音乐信息
		for _, item := range searchResults {
			if strconv.FormatInt(item.ID, 10) == targetID {
				// 找到匹配的音乐
				artistStr := ""
				if len(item.Artist) > 0 {
					fixedArtists := make([]string, len(item.Artist))
					for i, artist := range item.Artist {
						fixedArtists[i] = encoding.FixChineseEncoding(artist)
					}
					artistStr = strings.Join(fixedArtists, ", ")
				}

				return &model.MusicInfo{
					ID:       targetID,
					Name:     encoding.FixChineseEncoding(item.Name),
					Artist:   artistStr,
					Album:    encoding.FixChineseEncoding(item.Album),
					Duration: 0, // API没有提供时长信息
					PicURL:   "", // 可以后续添加封面URL处理
				}, nil
			}
		}
	}

	return nil, fmt.Errorf("未找到匹配的音乐信息")
}

// GetMusicInfo 获取音乐详细信息
func (u *UNMSource) GetMusicInfo(ctx context.Context, id string) (*model.MusicInfo, error) {
	if !u.IsEnabled() {
		return nil, fmt.Errorf("UNM音源已禁用")
	}

	if id == "" {
		return nil, fmt.Errorf("音乐ID不能为空")
	}

	// 尝试通过搜索获取真实的音乐信息
	if info, err := u.getMusicInfoBySearch(ctx, id); err == nil {
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
func (u *UNMSource) HealthCheck(ctx context.Context) error {
	if !u.IsEnabled() {
		return fmt.Errorf("音源已禁用")
	}

	// 简化健康检查，只检查是否启用
	return nil
}

// GetConfig 获取音源配置
func (u *UNMSource) GetConfig() *model.SourceConfig {
	return &model.SourceConfig{
		Name:      u.name,
		Enabled:   u.enabled,
		Priority:  1, // 设置优先级
		APIKey:    u.config.APIKey,
		UserAgent: u.config.UserAgent,
	}
}

// UpdateConfig 更新音源配置
func (u *UNMSource) UpdateConfig(config *model.SourceConfig) error {
	if config == nil {
		return fmt.Errorf("配置不能为空")
	}

	u.name = config.Name
	u.enabled = config.Enabled

	u.logger.Info("UNM音源配置已更新",
		logger.String("name", config.Name),
		logger.Bool("enabled", config.Enabled),
	)

	return nil
}
