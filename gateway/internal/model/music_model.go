// Package model 音乐数据模型
package model

import (
	"strings"
)

// MusicInfo 音乐详细信息
type MusicInfo struct {
	ID       string `json:"id" binding:"required"`       // 音乐ID
	Name     string `json:"name"`                        // 歌曲名称
	Artist   string `json:"artist"`                      // 艺术家
	Album    string `json:"album"`                       // 专辑名称
	Duration int64  `json:"duration"`                    // 时长（秒）
	PicURL   string `json:"pic_url"`                     // 封面图片URL
}

// Music 音乐信息别名（兼容性）
type Music struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Artist   string `json:"artist"`
	Album    string `json:"album"`
	Duration int    `json:"duration"`
	Source   string `json:"source"`
}

// MusicURL 音乐播放链接
type MusicURL struct {
	URL      string     `json:"url"`                         // 播放链接
	ProxyURL string     `json:"proxy_url,omitempty"`         // 代理链接
	Quality  string     `json:"quality,omitempty"`           // 音质
	Size     int64      `json:"size,omitempty"`              // 文件大小
	Format   string     `json:"format,omitempty"`            // 文件格式
	Source   string     `json:"source"`                      // 音源名称
	Info     *MusicInfo `json:"info,omitempty"`              // 音乐信息
}

// MatchRequest 音乐匹配请求
type MatchRequest struct {
	ID      string   `form:"id" binding:"required"`      // 音乐ID
	Server  string   `form:"server"`                     // 指定音源，逗号分隔
	Sources []string `json:"sources"`                    // 解析后的音源列表
}

// MatchResponse 音乐匹配响应
type MatchResponse struct {
	ID       string     `json:"id"`                      // 音乐ID
	URL      string     `json:"url"`                     // 播放链接
	ProxyURL string     `json:"proxy_url,omitempty"`     // 代理链接
	Quality  string     `json:"quality,omitempty"`       // 音质
	Source   string     `json:"source"`                  // 成功的音源
	Info     *MusicInfo `json:"info,omitempty"`          // 音乐信息
}

// NCMGetRequest 网易云音乐获取请求
type NCMGetRequest struct {
	ID string `form:"id" binding:"required"`            // 音乐ID
	BR string `form:"br"`                               // 音质参数
}

// NCMGetResponse 网易云音乐获取响应
type NCMGetResponse struct {
	ID       string     `json:"id"`                      // 音乐ID
	BR       string     `json:"br"`                      // 音质参数
	URL      string     `json:"url"`                     // 播放链接
	ProxyURL string     `json:"proxy_url,omitempty"`     // 代理链接
	Quality  string     `json:"quality,omitempty"`       // 实际音质
	Info     *MusicInfo `json:"info,omitempty"`          // 音乐信息
}

// OtherGetRequest 其他音源获取请求
type OtherGetRequest struct {
	Name string `form:"name" binding:"required"`        // 歌曲名称
}

// OtherGetResponse 其他音源获取响应
type OtherGetResponse struct {
	Name     string     `json:"name"`                    // 歌曲名称
	URL      string     `json:"url"`                     // 播放链接
	Source   string     `json:"source"`                  // 音源名称
	Quality  string     `json:"quality,omitempty"`       // 音质
	Info     *MusicInfo `json:"info,omitempty"`          // 音乐信息
}

// SearchResult 搜索结果
type SearchResult struct {
	ID       string `json:"id"`                         // 音乐ID
	Name     string `json:"name"`                       // 歌曲名称
	Artist   string `json:"artist"`                     // 艺术家
	Album    string `json:"album"`                      // 专辑
	Duration int64  `json:"duration"`                   // 时长
	Source   string `json:"source"`                     // 来源音源
	Score    float64 `json:"score"`                     // 匹配度评分
}

// QualityInfo 音质信息
type QualityInfo struct {
	BR       string `json:"br"`                         // 码率标识
	Bitrate  int    `json:"bitrate"`                    // 实际码率
	Format   string `json:"format"`                     // 格式
	Quality  string `json:"quality"`                    // 质量描述
	Size     int64  `json:"size,omitempty"`             // 文件大小
}

// 预定义的音质配置
var (
	// SupportedQualities 支持的音质列表
	SupportedQualities = []QualityInfo{
		{BR: "128", Bitrate: 128, Format: "mp3", Quality: "标准"},
		{BR: "192", Bitrate: 192, Format: "mp3", Quality: "较高"},
		{BR: "320", Bitrate: 320, Format: "mp3", Quality: "极高"},
		{BR: "740", Bitrate: 740, Format: "m4a", Quality: "无损"},
		{BR: "999", Bitrate: 999, Format: "flac", Quality: "Hi-Res"},
	}
)

// GetQualityInfo 根据BR获取音质信息
func GetQualityInfo(br string) *QualityInfo {
	for _, quality := range SupportedQualities {
		if quality.BR == br {
			return &quality
		}
	}
	return nil
}

// IsValidQuality 检查音质是否有效
func IsValidQuality(br string) bool {
	return GetQualityInfo(br) != nil
}

// GetValidQualities 获取有效音质列表
func GetValidQualities() []string {
	qualities := make([]string, len(SupportedQualities))
	for i, quality := range SupportedQualities {
		qualities[i] = quality.BR
	}
	return qualities
}

// IsValidSource 检查音源是否有效 (已弃用，使用SourceConfigManager)
// Deprecated: 使用 config.SourceConfigManager.IsValidSource 替代
func IsValidSource(source string) bool {
	// 为了向后兼容，保留基本验证
	return strings.TrimSpace(source) != ""
}

// ParseSources 解析音源字符串 (已弃用，使用SourceConfigManager)
// Deprecated: 使用 config.SourceConfigManager.ParseSources 替代
func ParseSources(serverParam string) []string {
	// 为了向后兼容，返回基本解析结果
	// 实际应用中应该使用 SourceConfigManager
	if serverParam == "" {
		return []string{"unm_server", "gdstudio"}
	}

	// 按逗号分割
	sources := make([]string, 0)
	for _, source := range splitAndTrim(serverParam, ",") {
		if strings.TrimSpace(source) != "" {
			sources = append(sources, strings.TrimSpace(source))
		}
	}

	// 如果没有有效音源，返回默认列表
	if len(sources) == 0 {
		return []string{"unm_server", "gdstudio"}
	}

	return sources
}

// splitAndTrim 分割字符串并去除空白
func splitAndTrim(s, sep string) []string {
	parts := make([]string, 0)
	for _, part := range strings.Split(s, sep) {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			parts = append(parts, trimmed)
		}
	}
	return parts
}
