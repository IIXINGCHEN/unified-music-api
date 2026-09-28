package config

import (
	"fmt"
	"strings"
	"time"
)

// SourceConfigManager 音源配置管理器
type SourceConfigManager struct {
	config *Config
}

// NewSourceConfigManager 创建音源配置管理器
func NewSourceConfigManager(config *Config) *SourceConfigManager {
	return &SourceConfigManager{
		config: config,
	}
}

// GetAvailableSources 获取可用音源列表
func (scm *SourceConfigManager) GetAvailableSources() []string {
	sources := make([]string, 0)
	
	if scm.config.Sources.UNMServer.Enabled {
		sources = append(sources, "unm_server")
	}
	if scm.config.Sources.GDStudio.Enabled {
		sources = append(sources, "gdstudio")
	}
	
	return sources
}

// GetDefaultSources 获取默认音源列表
func (scm *SourceConfigManager) GetDefaultSources() []string {
	if len(scm.config.Sources.DefaultSources) > 0 {
		return scm.config.Sources.DefaultSources
	}
	return scm.GetAvailableSources()
}

// GetEnabledSources 获取启用的音源列表
func (scm *SourceConfigManager) GetEnabledSources() []string {
	if len(scm.config.Sources.EnabledSources) > 0 {
		return scm.config.Sources.EnabledSources
	}
	return scm.GetAvailableSources()
}

// IsValidSource 检查音源是否有效
func (scm *SourceConfigManager) IsValidSource(source string) bool {
	availableSources := scm.GetAvailableSources()
	for _, availableSource := range availableSources {
		if availableSource == source {
			return true
		}
	}
	return false
}

// ParseSources 解析音源字符串
func (scm *SourceConfigManager) ParseSources(serverParam string) []string {
	defaultSources := scm.GetDefaultSources()

	if serverParam == "" {
		return defaultSources
	}

	// 按逗号分割
	sources := make([]string, 0)
	for _, source := range strings.Split(serverParam, ",") {
		source = strings.TrimSpace(source)
		if source != "" && scm.IsValidSource(source) {
			sources = append(sources, source)
		}
	}

	// 如果没有有效音源，返回默认列表
	if len(sources) == 0 {
		return defaultSources
	}

	return sources
}

// GetSourceConfig 获取指定音源的配置
func (scm *SourceConfigManager) GetSourceConfig(sourceName string) (interface{}, error) {
	switch sourceName {
	case "unm_server":
		if !scm.config.Sources.UNMServer.Enabled {
			return nil, fmt.Errorf("UNM服务器音源未启用")
		}
		return &scm.config.Sources.UNMServer, nil
	case "gdstudio":
		if !scm.config.Sources.GDStudio.Enabled {
			return nil, fmt.Errorf("GDStudio音源未启用")
		}
		return &scm.config.Sources.GDStudio, nil
	default:
		return nil, fmt.Errorf("未知音源: %s", sourceName)
	}
}

// ValidateSourceConfig 验证音源配置
func (scm *SourceConfigManager) ValidateSourceConfig() error {
	availableSources := scm.GetAvailableSources()
	if len(availableSources) == 0 {
		return fmt.Errorf("没有可用的音源")
	}

	// 验证默认音源
	for _, source := range scm.config.Sources.DefaultSources {
		if !scm.IsValidSource(source) {
			return fmt.Errorf("默认音源 %s 不可用", source)
		}
	}

	// 验证启用的音源
	for _, source := range scm.config.Sources.EnabledSources {
		if !scm.IsValidSource(source) {
			return fmt.Errorf("启用的音源 %s 不可用", source)
		}
	}

	return nil
}

// GetSupportedQualities 获取支持的音质列表
func (scm *SourceConfigManager) GetSupportedQualities() []string {
	return []string{"128", "192", "320", "740", "999"}
}

// IsValidQuality 检查音质是否有效
func (scm *SourceConfigManager) IsValidQuality(quality string) bool {
	supportedQualities := scm.GetSupportedQualities()
	for _, supportedQuality := range supportedQualities {
		if supportedQuality == quality {
			return true
		}
	}
	return false
}

// SourceConfig 音源配置接口
type SourceConfig interface {
	GetName() string
	IsEnabled() bool
	GetBaseURL() string
	GetTimeout() time.Duration
	GetRetryCount() int
	GetUserAgent() string
	Validate() error
}
