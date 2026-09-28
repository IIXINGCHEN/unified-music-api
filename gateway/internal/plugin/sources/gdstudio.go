package sources

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/model"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/plugin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/encoding"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// GDStudioPlugin GDStudio音源插件
type GDStudioPlugin struct {
	*plugin.BaseSourcePlugin
	baseURL    string
	apiKey     string
	userAgent  string
	timeout    time.Duration
	retryCount int
	client     *http.Client
}

// NewGDStudioPlugin 创建GDStudio插件
func NewGDStudioPlugin() plugin.SourcePlugin {
	p := &GDStudioPlugin{
		BaseSourcePlugin: plugin.NewBaseSourcePlugin(
			"gdstudio",
			"v1.0.0",
			"GDStudio音乐API插件，提供音乐搜索、播放链接、歌词等功能",
		),
		baseURL:    "https://music-api.gdstudio.xyz/api.php",
		userAgent:  "Music-API-Proxy-Plugin/v1.0.0",
		timeout:    30 * time.Second,
		retryCount: 3,
	}
	
	// 设置支持的音质
	p.SetSupportedQualities([]string{"128k", "320k", "flac"})
	
	return p
}

// Initialize 初始化插件
func (p *GDStudioPlugin) Initialize(ctx context.Context, config map[string]interface{}, logger logger.Logger) error {
	// 调用基础初始化
	if err := p.BaseSourcePlugin.Initialize(ctx, config, logger); err != nil {
		return err
	}
	
	// 读取配置
	p.baseURL = p.GetConfigString("base_url", p.baseURL)
	p.apiKey = p.GetConfigString("api_key", "")
	p.userAgent = p.GetConfigString("user_agent", p.userAgent)
	p.timeout = p.GetConfigDuration("timeout", p.timeout)
	p.retryCount = p.GetConfigInt("retry_count", p.retryCount)
	
	// 创建HTTP客户端
	p.client = &http.Client{
		Timeout: p.timeout,
	}
	
	p.GetLogger().Info(fmt.Sprintf("GDStudio插件初始化完成: %s (timeout: %s, retry: %d)",
		p.baseURL, p.timeout.String(), p.retryCount))
	
	return nil
}

// SearchMusic 搜索音乐
func (p *GDStudioPlugin) SearchMusic(ctx context.Context, query plugin.SearchQuery) ([]plugin.SearchResult, error) {
	if !p.IsEnabled() {
		return nil, fmt.Errorf("GDStudio插件未启用")
	}
	
	// 构建请求参数
	params := url.Values{}
	params.Set("types", "search")
	params.Set("source", "netease")
	params.Set("name", query.Keyword)
	params.Set("count", strconv.Itoa(query.Limit))
	params.Set("pages", strconv.Itoa(query.Offset/query.Limit+1))
	
	// 发送请求
	resp, err := p.makeRequest(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("搜索请求失败: %w", err)
	}
	defer resp.Body.Close()
	
	// 解析响应
	var searchResults []GDStudioSearchResult
	if err := json.NewDecoder(resp.Body).Decode(&searchResults); err != nil {
		return nil, fmt.Errorf("解析搜索响应失败: %w", err)
	}
	
	// 转换为标准格式
	results := make([]plugin.SearchResult, len(searchResults))
	for i, item := range searchResults {
		// 处理艺术家列表
		artists := make([]string, len(item.Artist))
		for j, artist := range item.Artist {
			artists[j] = encoding.FixChineseEncoding(artist)
		}
		
		results[i] = plugin.SearchResult{
			ID:       strconv.FormatInt(item.ID, 10),
			Name:     encoding.FixChineseEncoding(item.Name),
			Artist:   artists,
			Album:    encoding.FixChineseEncoding(item.Album),
			Duration: 0, // GDStudio API不提供时长信息
			Quality:  p.GetSupportedQualities(),
			Source:   p.Name(),
		}
	}
	
	return results, nil
}

// GetMusicURL 获取音乐播放链接
func (p *GDStudioPlugin) GetMusicURL(ctx context.Context, id string, quality string) (*plugin.MusicURL, error) {
	if !p.IsEnabled() {
		return nil, fmt.Errorf("GDStudio插件未启用")
	}
	
	// 构建请求参数
	params := url.Values{}
	params.Set("types", "url")
	params.Set("source", "netease")
	params.Set("id", id)
	params.Set("br", p.qualityToBitrate(quality))
	
	// 发送请求
	resp, err := p.makeRequest(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("获取播放链接请求失败: %w", err)
	}
	defer resp.Body.Close()
	
	// 解析响应
	var urlResult GDStudioURLResult
	if err := json.NewDecoder(resp.Body).Decode(&urlResult); err != nil {
		return nil, fmt.Errorf("解析播放链接响应失败: %w", err)
	}
	
	if urlResult.URL == "" {
		return nil, fmt.Errorf("未获取到播放链接")
	}
	
	return &plugin.MusicURL{
		URL:      urlResult.URL,
		Quality:  quality,
		Size:     urlResult.Size,
		Format:   urlResult.Type,
		Bitrate:  p.bitrateToInt(urlResult.BR),
		Source:   p.Name(),
		ExpireAt: time.Now().Add(24 * time.Hour), // 假设链接24小时后过期
	}, nil
}

// GetMusicInfo 获取音乐信息
func (p *GDStudioPlugin) GetMusicInfo(ctx context.Context, id string) (*model.MusicInfo, error) {
	if !p.IsEnabled() {
		return nil, fmt.Errorf("GDStudio插件未启用")
	}
	
	// 通过搜索获取音乐信息
	query := plugin.SearchQuery{
		Keyword: id,
		Type:    "song",
		Limit:   50,
		Offset:  0,
	}
	
	results, err := p.SearchMusic(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("搜索音乐信息失败: %w", err)
	}
	
	// 查找匹配的ID
	targetID, _ := strconv.ParseInt(id, 10, 64)
	for _, result := range results {
		if resultID, _ := strconv.ParseInt(result.ID, 10, 64); resultID == targetID {
			return &model.MusicInfo{
				ID:       id,
				Name:     result.Name,
				Artist:   strings.Join(result.Artist, ", "),
				Album:    result.Album,
				Duration: int64(result.Duration),
				PicURL:   "", // 需要单独获取
			}, nil
		}
	}
	
	return nil, fmt.Errorf("未找到ID为 %s 的音乐信息", id)
}

// GetLyrics 获取歌词
func (p *GDStudioPlugin) GetLyrics(ctx context.Context, id string) (*plugin.Lyrics, error) {
	if !p.IsEnabled() {
		return nil, fmt.Errorf("GDStudio插件未启用")
	}
	
	// 构建请求参数
	params := url.Values{}
	params.Set("types", "lyric")
	params.Set("source", "netease")
	params.Set("id", id)
	
	// 发送请求
	resp, err := p.makeRequest(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("获取歌词请求失败: %w", err)
	}
	defer resp.Body.Close()
	
	// 解析响应
	var lyricResult GDStudioLyricResult
	if err := json.NewDecoder(resp.Body).Decode(&lyricResult); err != nil {
		return nil, fmt.Errorf("解析歌词响应失败: %w", err)
	}
	
	return &plugin.Lyrics{
		ID:      id,
		Content: lyricResult.Lyric,
		LRC:     lyricResult.Lyric,
		Source:  p.Name(),
	}, nil
}

// GetPicture 获取专辑图片
func (p *GDStudioPlugin) GetPicture(ctx context.Context, id string) (*plugin.Picture, error) {
	if !p.IsEnabled() {
		return nil, fmt.Errorf("GDStudio插件未启用")
	}
	
	// 构建请求参数
	params := url.Values{}
	params.Set("types", "pic")
	params.Set("source", "netease")
	params.Set("id", id)
	
	// 发送请求
	resp, err := p.makeRequest(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("获取图片请求失败: %w", err)
	}
	defer resp.Body.Close()
	
	// 解析响应
	var picResult GDStudioPicResult
	if err := json.NewDecoder(resp.Body).Decode(&picResult); err != nil {
		return nil, fmt.Errorf("解析图片响应失败: %w", err)
	}
	
	return &plugin.Picture{
		ID:     id,
		URL:    picResult.URL,
		Width:  0, // GDStudio API不提供尺寸信息
		Height: 0,
		Size:   0,
		Format: "jpg",
		Source: p.Name(),
	}, nil
}

// makeRequest 发送HTTP请求
func (p *GDStudioPlugin) makeRequest(ctx context.Context, params url.Values) (*http.Response, error) {
	fullURL := p.baseURL + "?" + params.Encode()
	
	req, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		return nil, err
	}
	
	// 设置请求头
	req.Header.Set("User-Agent", p.userAgent)
	if p.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+p.apiKey)
	}
	
	// 发送请求
	return p.client.Do(req)
}

// qualityToBitrate 将音质转换为比特率
func (p *GDStudioPlugin) qualityToBitrate(quality string) string {
	switch quality {
	case "128k":
		return "128000"
	case "320k":
		return "320000"
	case "flac":
		return "999000"
	default:
		return "320000"
	}
}

// bitrateToInt 将比特率字符串转换为整数
func (p *GDStudioPlugin) bitrateToInt(br string) int {
	if bitrate, err := strconv.Atoi(br); err == nil {
		return bitrate
	}
	return 320000
}

// GDStudio API响应结构体
type GDStudioSearchResult struct {
	ID     int64    `json:"id"`
	Name   string   `json:"name"`
	Artist []string `json:"artist"`
	Album  string   `json:"album"`
	PicID  string   `json:"pic_id"`
	Source string   `json:"source"`
}

type GDStudioURLResult struct {
	URL  string `json:"url"`
	BR   string `json:"br"`
	Size int64  `json:"size"`
	Type string `json:"type"`
}

type GDStudioLyricResult struct {
	Lyric string `json:"lyric"`
}

type GDStudioPicResult struct {
	URL string `json:"url"`
}
