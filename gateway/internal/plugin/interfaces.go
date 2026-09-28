package plugin

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/model"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// Plugin 基础插件接口
type Plugin interface {
	// Name 返回插件名称
	Name() string
	// Version 返回插件版本
	Version() string
	// Description 返回插件描述
	Description() string
	// Initialize 初始化插件
	Initialize(ctx context.Context, config map[string]interface{}, logger logger.Logger) error
	// Start 启动插件
	Start(ctx context.Context) error
	// Stop 停止插件
	Stop(ctx context.Context) error
	// Health 健康检查
	Health(ctx context.Context) error
	// Dependencies 返回插件依赖
	Dependencies() []string
}

// SourcePlugin 音源插件接口
type SourcePlugin interface {
	Plugin
	
	// SearchMusic 搜索音乐
	SearchMusic(ctx context.Context, query SearchQuery) ([]SearchResult, error)
	// GetMusicURL 获取音乐播放链接
	GetMusicURL(ctx context.Context, id string, quality string) (*MusicURL, error)
	// GetMusicInfo 获取音乐信息
	GetMusicInfo(ctx context.Context, id string) (*model.MusicInfo, error)
	// GetLyrics 获取歌词
	GetLyrics(ctx context.Context, id string) (*Lyrics, error)
	// GetPicture 获取专辑图片
	GetPicture(ctx context.Context, id string) (*Picture, error)
	
	// IsEnabled 检查音源是否启用
	IsEnabled() bool
	// GetPriority 获取音源优先级
	GetPriority() int
	// GetSupportedQualities 获取支持的音质列表
	GetSupportedQualities() []string
	// GetRateLimit 获取速率限制配置
	GetRateLimit() RateLimit
}

// MiddlewarePlugin 中间件插件接口
type MiddlewarePlugin interface {
	Plugin

	// Handler 返回Gin中间件处理函数
	Handler() gin.HandlerFunc
	// Order 返回中间件执行顺序（数字越小越先执行）
	Order() int
	// SetOrder 设置中间件执行顺序
	SetOrder(order int)
	// Routes 返回中间件应用的路由模式
	Routes() []string
	// SetRoutes 设置应用的路由模式
	SetRoutes(routes []string)
	// ShouldApplyToRoute 检查是否应该应用到指定路由
	ShouldApplyToRoute(path string) bool
}

// FilterPlugin 过滤器插件接口
type FilterPlugin interface {
	Plugin
	
	// FilterRequest 过滤请求
	FilterRequest(ctx context.Context, req *FilterRequest) (*FilterResponse, error)
	// FilterResponse 过滤响应
	FilterResponse(ctx context.Context, resp *FilterResponse) (*FilterResponse, error)
}

// CachePlugin 缓存插件接口
type CachePlugin interface {
	Plugin
	
	// Get 获取缓存
	Get(ctx context.Context, key string) (interface{}, error)
	// Set 设置缓存
	Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error
	// Delete 删除缓存
	Delete(ctx context.Context, key string) error
	// Clear 清空缓存
	Clear(ctx context.Context) error
	// Stats 获取缓存统计信息
	Stats(ctx context.Context) (*CacheStats, error)
}

// SearchQuery 搜索查询
type SearchQuery struct {
	Keyword string            `json:"keyword"`
	Type    string            `json:"type"`    // song, album, artist, playlist
	Limit   int               `json:"limit"`
	Offset  int               `json:"offset"`
	Filters map[string]string `json:"filters"` // 额外的过滤条件
}

// SearchResult 搜索结果
type SearchResult struct {
	ID       string   `json:"id"`
	Name     string   `json:"name"`
	Artist   []string `json:"artist"`
	Album    string   `json:"album"`
	Duration int      `json:"duration"` // 秒
	Quality  []string `json:"quality"`  // 可用音质
	Source   string   `json:"source"`   // 音源名称
}

// MusicURL 音乐播放链接
type MusicURL struct {
	URL      string             `json:"url"`
	Quality  string             `json:"quality"`
	Size     int64              `json:"size"`     // 文件大小（字节）
	Format   string             `json:"format"`   // 文件格式
	Bitrate  int                `json:"bitrate"`  // 比特率
	Source   string             `json:"source"`   // 音源名称
	ExpireAt time.Time          `json:"expire_at"` // 链接过期时间
	Info     *model.MusicInfo   `json:"info,omitempty"` // 音乐信息
}

// Lyrics 歌词
type Lyrics struct {
	ID       string       `json:"id"`
	Content  string       `json:"content"`  // 纯文本歌词
	LRC      string       `json:"lrc"`      // LRC格式歌词
	Timeline []LyricLine  `json:"timeline"` // 时间轴歌词
	Source   string       `json:"source"`   // 音源名称
}

// LyricLine 歌词行
type LyricLine struct {
	Time    int    `json:"time"`    // 时间（毫秒）
	Content string `json:"content"` // 歌词内容
}

// Picture 图片
type Picture struct {
	ID     string `json:"id"`
	URL    string `json:"url"`
	Width  int    `json:"width"`
	Height int    `json:"height"`
	Size   int64  `json:"size"`   // 文件大小（字节）
	Format string `json:"format"` // 图片格式
	Source string `json:"source"` // 音源名称
}

// RateLimit 速率限制
type RateLimit struct {
	RequestsPerSecond int           `json:"requests_per_second"`
	RequestsPerMinute int           `json:"requests_per_minute"`
	RequestsPerHour   int           `json:"requests_per_hour"`
	BurstSize         int           `json:"burst_size"`
	Timeout           time.Duration `json:"timeout"`
}

// FilterRequest 过滤器请求
type FilterRequest struct {
	Method  string            `json:"method"`
	Path    string            `json:"path"`
	Headers map[string]string `json:"headers"`
	Query   map[string]string `json:"query"`
	Body    []byte            `json:"body"`
}

// FilterResponse 过滤器响应
type FilterResponse struct {
	StatusCode int               `json:"status_code"`
	Headers    map[string]string `json:"headers"`
	Body       []byte            `json:"body"`
}

// CacheStats 缓存统计信息
type CacheStats struct {
	Hits        int64   `json:"hits"`
	Misses      int64   `json:"misses"`
	HitRate     float64 `json:"hit_rate"`
	Size        int64   `json:"size"`        // 缓存大小（字节）
	ItemCount   int64   `json:"item_count"`  // 缓存项数量
	Evictions   int64   `json:"evictions"`   // 驱逐次数
	LastCleanup time.Time `json:"last_cleanup"` // 最后清理时间
}

// PluginInfo 插件信息
type PluginInfo struct {
	Name         string            `json:"name"`
	Version      string            `json:"version"`
	Description  string            `json:"description"`
	Type         string            `json:"type"`         // source, middleware, filter, cache
	Author       string            `json:"author"`
	License      string            `json:"license"`
	Homepage     string            `json:"homepage"`
	Dependencies []string          `json:"dependencies"`
	Config       map[string]interface{} `json:"config"`
	Status       string            `json:"status"`       // enabled, disabled, error
	LoadTime     time.Time         `json:"load_time"`
	LastError    string            `json:"last_error,omitempty"`
}

// PluginEvent 插件事件
type PluginEvent struct {
	Type      string                 `json:"type"`      // load, unload, enable, disable, error
	Plugin    string                 `json:"plugin"`    // 插件名称
	Timestamp time.Time              `json:"timestamp"`
	Data      map[string]interface{} `json:"data"`
	Error     string                 `json:"error,omitempty"`
}

// PluginConfig 插件配置
type PluginConfig struct {
	Name     string                 `json:"name"`
	Enabled  bool                   `json:"enabled"`
	Priority int                    `json:"priority"`
	Config   map[string]interface{} `json:"config"`
	Routes   []string               `json:"routes,omitempty"`   // 中间件插件使用
	Order    int                    `json:"order,omitempty"`    // 中间件插件使用
}

// PluginMetadata 插件元数据
type PluginMetadata struct {
	Name        string   `json:"name"`
	Version     string   `json:"version"`
	Description string   `json:"description"`
	Type        string   `json:"type"`
	Author      string   `json:"author"`
	License     string   `json:"license"`
	Homepage    string   `json:"homepage"`
	Tags        []string `json:"tags"`
	MinVersion  string   `json:"min_version"` // 最小支持的应用版本
	MaxVersion  string   `json:"max_version"` // 最大支持的应用版本
}
