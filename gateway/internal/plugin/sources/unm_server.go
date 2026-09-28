package sources

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/model"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/plugin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/encoding"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// UNMServerPlugin UNM Server音源插件
type UNMServerPlugin struct {
	*plugin.BaseSourcePlugin
	baseURL    string
	apiKey     string
	userAgent  string
	timeout    time.Duration
	retryCount int
	client     *http.Client
}

// NewUNMServerPlugin 创建UNM Server插件
func NewUNMServerPlugin() plugin.SourcePlugin {
	p := &UNMServerPlugin{
		BaseSourcePlugin: plugin.NewBaseSourcePlugin(
			"unm_server",
			"v1.0.0",
			"UNM Server音乐API插件，提供音乐搜索、播放链接、歌词等功能",
		),
		baseURL:    "https://api-unm.imixc.top",
		userAgent:  "Music-API-Proxy-Plugin/v1.0.0",
		timeout:    30 * time.Second,
		retryCount: 3,
	}
	
	// 设置支持的音质
	p.SetSupportedQualities([]string{"128k", "320k", "flac"})
	
	return p
}

// Initialize 初始化插件
func (p *UNMServerPlugin) Initialize(ctx context.Context, config map[string]interface{}, logger logger.Logger) error {
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
	
	p.GetLogger().Info(fmt.Sprintf("UNM Server插件初始化完成: %s (timeout: %s, retry: %d)",
		p.baseURL, p.timeout.String(), p.retryCount))
	
	return nil
}

// SearchMusic 搜索音乐
func (p *UNMServerPlugin) SearchMusic(ctx context.Context, query plugin.SearchQuery) ([]plugin.SearchResult, error) {
	if !p.IsEnabled() {
		return nil, fmt.Errorf("UNM Server插件未启用")
	}
	
	// 构建请求URL
	searchURL := fmt.Sprintf("%s/search?name=%s&limit=%d",
		p.baseURL,
		url.QueryEscape(query.Keyword),
		query.Limit,
	)
	
	// 发送请求
	resp, err := p.makeRequest(ctx, "GET", searchURL, nil)
	if err != nil {
		return nil, fmt.Errorf("搜索请求失败: %w", err)
	}
	defer resp.Body.Close()
	
	// 解析响应
	var searchResp UNMSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&searchResp); err != nil {
		return nil, fmt.Errorf("解析搜索响应失败: %w", err)
	}
	
	if searchResp.Code != 200 {
		return nil, fmt.Errorf("搜索失败: %s", searchResp.Message)
	}
	
	// 转换为标准格式
	results := make([]plugin.SearchResult, len(searchResp.Data))
	for i, item := range searchResp.Data {
		// 处理艺术家列表
		artists := strings.Split(item.Artist, ", ")
		for j, artist := range artists {
			artists[j] = encoding.FixChineseEncoding(artist)
		}
		
		results[i] = plugin.SearchResult{
			ID:       item.ID,
			Name:     encoding.FixChineseEncoding(item.Name),
			Artist:   artists,
			Album:    encoding.FixChineseEncoding(item.Album),
			Duration: item.Duration,
			Quality:  p.GetSupportedQualities(),
			Source:   p.Name(),
		}
	}
	
	return results, nil
}

// GetMusicURL 获取音乐播放链接
func (p *UNMServerPlugin) GetMusicURL(ctx context.Context, id string, quality string) (*plugin.MusicURL, error) {
	if !p.IsEnabled() {
		return nil, fmt.Errorf("UNM Server插件未启用")
	}
	
	// 构建请求URL
	urlEndpoint := fmt.Sprintf("%s/ncmget?id=%s&quality=%s",
		p.baseURL,
		url.QueryEscape(id),
		url.QueryEscape(quality),
	)
	
	// 发送请求
	resp, err := p.makeRequest(ctx, "GET", urlEndpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("获取播放链接请求失败: %w", err)
	}
	defer resp.Body.Close()
	
	// 解析响应
	var urlResp UNMURLResponse
	if err := json.NewDecoder(resp.Body).Decode(&urlResp); err != nil {
		return nil, fmt.Errorf("解析播放链接响应失败: %w", err)
	}
	
	if urlResp.Code != 200 {
		return nil, fmt.Errorf("获取播放链接失败: %s", urlResp.Message)
	}
	
	if urlResp.Data.URL == "" {
		return nil, fmt.Errorf("未获取到播放链接")
	}
	
	return &plugin.MusicURL{
		URL:      urlResp.Data.URL,
		Quality:  urlResp.Data.Quality,
		Size:     0, // UNM Server API不提供文件大小
		Format:   "mp3",
		Bitrate:  p.qualityToBitrate(urlResp.Data.Quality),
		Source:   p.Name(),
		ExpireAt: time.Now().Add(24 * time.Hour), // 假设链接24小时后过期
		Info:     urlResp.Data.Info,
	}, nil
}

// GetMusicInfo 获取音乐信息
func (p *UNMServerPlugin) GetMusicInfo(ctx context.Context, id string) (*model.MusicInfo, error) {
	if !p.IsEnabled() {
		return nil, fmt.Errorf("UNM Server插件未启用")
	}
	
	// 构建请求URL
	infoURL := fmt.Sprintf("%s/info?id=%s", p.baseURL, url.QueryEscape(id))
	
	// 发送请求
	resp, err := p.makeRequest(ctx, "GET", infoURL, nil)
	if err != nil {
		return nil, fmt.Errorf("获取音乐信息请求失败: %w", err)
	}
	defer resp.Body.Close()
	
	// 解析响应
	var infoResp UNMInfoResponse
	if err := json.NewDecoder(resp.Body).Decode(&infoResp); err != nil {
		return nil, fmt.Errorf("解析音乐信息响应失败: %w", err)
	}
	
	if infoResp.Code != 200 {
		return nil, fmt.Errorf("获取音乐信息失败: %s", infoResp.Message)
	}
	
	return &infoResp.Data, nil
}

// GetLyrics 获取歌词
func (p *UNMServerPlugin) GetLyrics(ctx context.Context, id string) (*plugin.Lyrics, error) {
	if !p.IsEnabled() {
		return nil, fmt.Errorf("UNM Server插件未启用")
	}
	
	// 构建请求URL
	lyricURL := fmt.Sprintf("%s/lyric?id=%s", p.baseURL, url.QueryEscape(id))
	
	// 发送请求
	resp, err := p.makeRequest(ctx, "GET", lyricURL, nil)
	if err != nil {
		return nil, fmt.Errorf("获取歌词请求失败: %w", err)
	}
	defer resp.Body.Close()
	
	// 解析响应
	var lyricResp UNMLyricResponse
	if err := json.NewDecoder(resp.Body).Decode(&lyricResp); err != nil {
		return nil, fmt.Errorf("解析歌词响应失败: %w", err)
	}
	
	if lyricResp.Code != 200 {
		return nil, fmt.Errorf("获取歌词失败: %s", lyricResp.Message)
	}
	
	return &plugin.Lyrics{
		ID:      id,
		Content: lyricResp.Data.Content,
		LRC:     lyricResp.Data.LRC,
		Source:  p.Name(),
	}, nil
}

// GetPicture 获取专辑图片
func (p *UNMServerPlugin) GetPicture(ctx context.Context, id string) (*plugin.Picture, error) {
	if !p.IsEnabled() {
		return nil, fmt.Errorf("UNM Server插件未启用")
	}
	
	// 构建请求URL
	picURL := fmt.Sprintf("%s/picture?id=%s", p.baseURL, url.QueryEscape(id))
	
	// 发送请求
	resp, err := p.makeRequest(ctx, "GET", picURL, nil)
	if err != nil {
		return nil, fmt.Errorf("获取图片请求失败: %w", err)
	}
	defer resp.Body.Close()
	
	// 解析响应
	var picResp UNMPictureResponse
	if err := json.NewDecoder(resp.Body).Decode(&picResp); err != nil {
		return nil, fmt.Errorf("解析图片响应失败: %w", err)
	}
	
	if picResp.Code != 200 {
		return nil, fmt.Errorf("获取图片失败: %s", picResp.Message)
	}
	
	return &plugin.Picture{
		ID:     id,
		URL:    picResp.Data.URL,
		Width:  picResp.Data.Width,
		Height: picResp.Data.Height,
		Size:   picResp.Data.Size,
		Format: picResp.Data.Format,
		Source: p.Name(),
	}, nil
}

// makeRequest 发送HTTP请求
func (p *UNMServerPlugin) makeRequest(ctx context.Context, method, url string, body interface{}) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, method, url, nil)
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
func (p *UNMServerPlugin) qualityToBitrate(quality string) int {
	switch quality {
	case "128k":
		return 128000
	case "320k":
		return 320000
	case "flac":
		return 999000
	default:
		return 320000
	}
}

// UNM Server API响应结构体
type UNMSearchResponse struct {
	Code      int                `json:"code"`
	Message   string             `json:"message"`
	Data      []UNMSearchResult  `json:"data"`
	Timestamp int64              `json:"timestamp"`
}

type UNMSearchResult struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Artist   string `json:"artist"`
	Album    string `json:"album"`
	Duration int    `json:"duration"`
	Source   string `json:"source"`
}

type UNMURLResponse struct {
	Code      int        `json:"code"`
	Message   string     `json:"message"`
	Data      UNMURLData `json:"data"`
	Timestamp int64      `json:"timestamp"`
}

type UNMURLData struct {
	ID      string           `json:"id"`
	URL     string           `json:"url"`
	Quality string           `json:"quality"`
	Source  string           `json:"source"`
	Info    *model.MusicInfo `json:"info,omitempty"`
}

type UNMInfoResponse struct {
	Code      int              `json:"code"`
	Message   string           `json:"message"`
	Data      model.MusicInfo  `json:"data"`
	Timestamp int64            `json:"timestamp"`
}

type UNMLyricResponse struct {
	Code      int           `json:"code"`
	Message   string        `json:"message"`
	Data      UNMLyricData  `json:"data"`
	Timestamp int64         `json:"timestamp"`
}

type UNMLyricData struct {
	Content string `json:"content"`
	LRC     string `json:"lrc"`
}

type UNMPictureResponse struct {
	Code      int             `json:"code"`
	Message   string          `json:"message"`
	Data      UNMPictureData  `json:"data"`
	Timestamp int64           `json:"timestamp"`
}

type UNMPictureData struct {
	URL    string `json:"url"`
	Width  int    `json:"width"`
	Height int    `json:"height"`
	Size   int64  `json:"size"`
	Format string `json:"format"`
}
