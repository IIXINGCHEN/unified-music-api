package model

import (
	"time"
)

// SourceConfigDetail 音源详细配置
type SourceConfigDetail struct {
	Name        string            `json:"name" yaml:"name"`
	Enabled     bool              `json:"enabled" yaml:"enabled"`
	Priority    int               `json:"priority" yaml:"priority"`
	Timeout     time.Duration     `json:"timeout" yaml:"timeout"`
	RetryCount  int               `json:"retry_count" yaml:"retry_count"`
	RateLimit   int               `json:"rate_limit" yaml:"rate_limit"`
	Headers     map[string]string `json:"headers" yaml:"headers"`
	Cookies     string            `json:"cookies" yaml:"cookies"`
	UserAgent   string            `json:"user_agent" yaml:"user_agent"`
	Proxy       string            `json:"proxy" yaml:"proxy"`
	MaxQuality  string            `json:"max_quality" yaml:"max_quality"`
	Qualities   []string          `json:"qualities" yaml:"qualities"`
}

// SourceStatusDetail 音源详细状态
type SourceStatusDetail struct {
	Name           string        `json:"name"`
	Enabled        bool          `json:"enabled"`
	Available      bool          `json:"available"`
	LastCheck      time.Time     `json:"last_check"`
	ResponseTime   time.Duration `json:"response_time"`
	SuccessRate    float64       `json:"success_rate"`
	TotalRequests  int64         `json:"total_requests"`
	SuccessCount   int64         `json:"success_count"`
	ErrorCount     int64         `json:"error_count"`
	LastError      string        `json:"last_error,omitempty"`
	LastErrorTime  time.Time     `json:"last_error_time,omitempty"`
}

// SourceMetrics 音源指标
type SourceMetrics struct {
	Name              string        `json:"name"`
	TotalRequests     int64         `json:"total_requests"`
	SuccessRequests   int64         `json:"success_requests"`
	FailedRequests    int64         `json:"failed_requests"`
	AverageResponse   time.Duration `json:"average_response"`
	MinResponse       time.Duration `json:"min_response"`
	MaxResponse       time.Duration `json:"max_response"`
	SuccessRate       float64       `json:"success_rate"`
	RequestsPerMinute float64       `json:"requests_per_minute"`
	LastHourRequests  int64         `json:"last_hour_requests"`
	LastDayRequests   int64         `json:"last_day_requests"`
}

// SourceInfo 音源信息
type SourceInfo struct {
	Name        string   `json:"name"`
	DisplayName string   `json:"display_name"`
	Description string   `json:"description"`
	Website     string   `json:"website"`
	Qualities   []string `json:"qualities"`
	Features    []string `json:"features"`
	Enabled     bool     `json:"enabled"`
	Available   bool     `json:"available"`
	Priority    int      `json:"priority"`
}

// SourcesConfigDetail 音源详细配置模型
type SourcesConfigDetail struct {
	NeteaseCookie  string                           `json:"netease_cookie" yaml:"netease_cookie"`
	QQCookie       string                           `json:"qq_cookie" yaml:"qq_cookie"`
	MiguCookie     string                           `json:"migu_cookie" yaml:"migu_cookie"`
	JooxCookie     string                           `json:"joox_cookie" yaml:"joox_cookie"`
	YoutubeKey     string                           `json:"youtube_key" yaml:"youtube_key"`
	DefaultSources []string                         `json:"default_sources" yaml:"default_sources"`
	EnabledSources []string                         `json:"enabled_sources" yaml:"enabled_sources"`
	Timeout        time.Duration                    `json:"timeout" yaml:"timeout"`
	RetryCount     int                              `json:"retry_count" yaml:"retry_count"`
	Sources        map[string]*SourceConfigDetail   `json:"sources" yaml:"sources"`
}

// QualityDetail 音质详细信息
type QualityDetail struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Bitrate     int    `json:"bitrate"`
	Format      string `json:"format"`
	Description string `json:"description"`
}

// SupportedQualityDetails 支持的音质详细列表
var SupportedQualityDetails = []QualityDetail{
	{
		Code:        "128",
		Name:        "标准音质",
		Bitrate:     128,
		Format:      "mp3",
		Description: "128kbps MP3",
	},
	{
		Code:        "192",
		Name:        "高音质",
		Bitrate:     192,
		Format:      "mp3",
		Description: "192kbps MP3",
	},
	{
		Code:        "320",
		Name:        "超高音质",
		Bitrate:     320,
		Format:      "mp3",
		Description: "320kbps MP3",
	},
	{
		Code:        "740",
		Name:        "无损音质",
		Bitrate:     740,
		Format:      "flac",
		Description: "740kbps FLAC",
	},
	{
		Code:        "999",
		Name:        "母带音质",
		Bitrate:     999,
		Format:      "flac",
		Description: "999kbps FLAC",
	},
}

// SourceFeatures 音源功能特性
var SourceFeatures = map[string][]string{
	"kugou": {
		"搜索",
		"获取播放链接",
		"多音质支持",
		"歌词获取",
	},
	"qq": {
		"搜索",
		"获取播放链接",
		"多音质支持",
		"歌词获取",
		"专辑信息",
	},
	"migu": {
		"搜索",
		"获取播放链接",
		"多音质支持",
		"无损音质",
	},
	"netease": {
		"搜索",
		"获取播放链接",
		"多音质支持",
		"歌词获取",
		"评论获取",
	},
}



// GetQualityDetail 获取音质详细信息
func GetQualityDetail(code string) *QualityDetail {
	for _, quality := range SupportedQualityDetails {
		if quality.Code == code {
			return &quality
		}
	}
	return nil
}

// IsValidQualityDetail 检查音质是否有效
func IsValidQualityDetail(code string) bool {
	return GetQualityDetail(code) != nil
}

// GetSourceFeatures 获取音源功能特性
func GetSourceFeatures(sourceName string) []string {
	if features, exists := SourceFeatures[sourceName]; exists {
		return features
	}
	return []string{}
}


