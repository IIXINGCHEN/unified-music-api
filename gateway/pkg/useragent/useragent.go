// Package useragent ser-Agent生成
package useragent

import (
	"fmt"
	"runtime"
	"strings"
)

// UserAgentBuilder User-Agent构建器
type UserAgentBuilder struct {
	appName    string
	version    string
	buildTime  string
	gitCommit  string
	goVersion  string
	platform   string
	arch       string
}

// NewUserAgentBuilder 创建User-Agent构建器
func NewUserAgentBuilder(appName, version, buildTime, gitCommit string) *UserAgentBuilder {
	return &UserAgentBuilder{
		appName:   appName,
		version:   version,
		buildTime: buildTime,
		gitCommit: gitCommit,
		goVersion: runtime.Version(),
		platform:  runtime.GOOS,
		arch:      runtime.GOARCH,
	}
}

// Build 构建标准User-Agent
func (b *UserAgentBuilder) Build() string {
	// 格式: AppName/Version (Platform; Architecture; Go/Version) BuildInfo/GitCommit
	platform := strings.Title(b.platform)
	arch := strings.ToUpper(b.arch)
	
	userAgent := fmt.Sprintf("%s/%s (%s; %s; %s)",
		b.appName,
		b.version,
		platform,
		arch,
		b.goVersion,
	)
	
	// 添加构建信息
	if b.gitCommit != "" && b.gitCommit != "unknown" {
		userAgent += fmt.Sprintf(" BuildInfo/%s", b.gitCommit)
	}
	
	return userAgent
}

// BuildForAPI 构建API专用User-Agent
func (b *UserAgentBuilder) BuildForAPI() string {
	// 格式: AppName-API/Version (Platform-Architecture) Go/Version
	return fmt.Sprintf("%s-API/%s (%s-%s) %s",
		b.appName,
		b.version,
		strings.Title(b.platform),
		strings.ToUpper(b.arch),
		b.goVersion,
	)
}

// BuildForSource 构建音源专用User-Agent
func (b *UserAgentBuilder) BuildForSource(sourceName string) string {
	// 格式: AppName-Source-SourceName/Version (Platform; Architecture)
	return fmt.Sprintf("%s-Source-%s/%s (%s; %s)",
		b.appName,
		strings.Title(sourceName),
		b.version,
		strings.Title(b.platform),
		strings.ToUpper(b.arch),
	)
}

// BuildForHTTPClient 构建HTTP客户端专用User-Agent
func (b *UserAgentBuilder) BuildForHTTPClient() string {
	// 格式: AppName-HTTPClient/Version (Platform; Architecture; Go/Version)
	return fmt.Sprintf("%s-HTTPClient/%s (%s; %s; %s)",
		b.appName,
		b.version,
		strings.Title(b.platform),
		strings.ToUpper(b.arch),
		b.goVersion,
	)
}

// BuildCustom 构建自定义User-Agent
func (b *UserAgentBuilder) BuildCustom(component string, extra ...string) string {
	// 格式: AppName-Component/Version (Platform; Architecture) [Extra]
	userAgent := fmt.Sprintf("%s-%s/%s (%s; %s)",
		b.appName,
		component,
		b.version,
		strings.Title(b.platform),
		strings.ToUpper(b.arch),
	)
	
	if len(extra) > 0 {
		userAgent += " " + strings.Join(extra, " ")
	}
	
	return userAgent
}

// GetAppInfo 获取应用信息
func (b *UserAgentBuilder) GetAppInfo() map[string]string {
	return map[string]string{
		"app_name":   b.appName,
		"version":    b.version,
		"build_time": b.buildTime,
		"git_commit": b.gitCommit,
		"go_version": b.goVersion,
		"platform":   b.platform,
		"arch":       b.arch,
	}
}

// 全局User-Agent构建器实例
var globalBuilder *UserAgentBuilder

// InitGlobal 初始化全局User-Agent构建器
func InitGlobal(appName, version, buildTime, gitCommit string) {
	globalBuilder = NewUserAgentBuilder(appName, version, buildTime, gitCommit)
}

// GetGlobal 获取全局User-Agent构建器
func GetGlobal() *UserAgentBuilder {
	if globalBuilder == nil {
		// 如果没有初始化，使用默认值
		globalBuilder = NewUserAgentBuilder("Music-API-Proxy", "dev", "unknown", "unknown")
	}
	return globalBuilder
}

// Build 全局构建标准User-Agent
func Build() string {
	return GetGlobal().Build()
}

// BuildForAPI 全局构建API专用User-Agent
func BuildForAPI() string {
	return GetGlobal().BuildForAPI()
}

// BuildForSource 全局构建音源专用User-Agent
func BuildForSource(sourceName string) string {
	return GetGlobal().BuildForSource(sourceName)
}

// BuildForHTTPClient 全局构建HTTP客户端专用User-Agent
func BuildForHTTPClient() string {
	return GetGlobal().BuildForHTTPClient()
}

// BuildCustom 全局构建自定义User-Agent
func BuildCustom(component string, extra ...string) string {
	return GetGlobal().BuildCustom(component, extra...)
}

// 预定义的常用User-Agent类型
const (
	TypeStandard   = "standard"
	TypeAPI        = "api"
	TypeHTTPClient = "http_client"
	TypeSource     = "source"
)

// BuildByType 根据类型构建User-Agent
func BuildByType(userAgentType string, extra ...string) string {
	builder := GetGlobal()
	
	switch userAgentType {
	case TypeStandard:
		return builder.Build()
	case TypeAPI:
		return builder.BuildForAPI()
	case TypeHTTPClient:
		return builder.BuildForHTTPClient()
	case TypeSource:
		if len(extra) > 0 {
			return builder.BuildForSource(extra[0])
		}
		return builder.BuildCustom("Source")
	default:
		if len(extra) > 0 {
			return builder.BuildCustom(userAgentType, extra...)
		}
		return builder.BuildCustom(userAgentType)
	}
}

// ValidateUserAgent 验证User-Agent是否为真实应用标识
func ValidateUserAgent(userAgent string) bool {
	// 检查是否包含应用名称
	if !strings.Contains(userAgent, "Music-API-Proxy") {
		return false
	}
	
	// 检查是否为假的浏览器标识
	fakeBrowserPatterns := []string{
		"Mozilla/5.0",
		"Chrome/",
		"Safari/",
		"Firefox/",
		"Edge/",
		"Opera/",
		"WebKit/",
		"AppleWebKit/",
	}
	
	for _, pattern := range fakeBrowserPatterns {
		if strings.Contains(userAgent, pattern) {
			return false
		}
	}
	
	return true
}

// GetRecommendedUserAgents 获取推荐的User-Agent列表
func GetRecommendedUserAgents() map[string]string {
	builder := GetGlobal()
	
	return map[string]string{
		"standard":    builder.Build(),
		"api":         builder.BuildForAPI(),
		"http_client": builder.BuildForHTTPClient(),
		"kugou":       builder.BuildForSource("kugou"),
		"qq":          builder.BuildForSource("qq"),
		"migu":        builder.BuildForSource("migu"),
		"netease":     builder.BuildForSource("netease"),
		"health":      builder.BuildCustom("HealthCheck"),
		"metrics":     builder.BuildCustom("Metrics"),
	}
}
