// Package response 成功响应构造器
package response

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// SuccessData 成功响应数据结构
type SuccessData struct {
	URL      string `json:"url,omitempty"`      // 音乐播放链接
	ProxyURL string `json:"proxyUrl,omitempty"` // 代理链接
	ID       string `json:"id,omitempty"`       // 音乐ID
	BR       string `json:"br,omitempty"`       // 音质参数
	Version  string `json:"version,omitempty"`  // 版本信息
}

// MatchSuccess 音乐匹配成功响应
func MatchSuccess(c *gin.Context, url, proxyURL string) {
	data := SuccessData{
		URL:      url,
		ProxyURL: proxyURL,
	}
	Success(c, "匹配成功", data)
}

// NCMGetSuccess 网易云音乐获取成功响应
func NCMGetSuccess(c *gin.Context, id, br, url, proxyURL string) {
	data := SuccessData{
		ID:       id,
		BR:       br,
		URL:      url,
		ProxyURL: proxyURL,
	}
	Success(c, "请求成功", data)
}

// OtherGetSuccess 其他音源获取成功响应
func OtherGetSuccess(c *gin.Context, url string) {
	data := SuccessData{
		URL: url,
	}
	Success(c, "请求成功", data)
}

// TestSuccess 测试接口成功响应
func TestSuccess(c *gin.Context, data interface{}) {
	Success(c, "获取成功", data)
}

// InfoSuccess 系统信息成功响应
func InfoSuccess(c *gin.Context, version string, enableFlac bool) {
	data := map[string]interface{}{
		"version":     version,
		"enable_flac": enableFlac,
	}
	response := NewResponse(http.StatusOK, "", data)
	JSON(c, http.StatusOK, response)
}

// HealthSuccess 健康检查成功响应
func HealthSuccess(c *gin.Context) {
	data := map[string]interface{}{
		"status": "healthy",
		"uptime": time.Now().Unix(),
	}
	Success(c, "服务正常", data)
}

// ReadySuccess 就绪检查成功响应
func ReadySuccess(c *gin.Context) {
	data := map[string]interface{}{
		"status": "ready",
		"uptime": time.Now().Unix(),
	}
	Success(c, "服务就绪", data)
}
