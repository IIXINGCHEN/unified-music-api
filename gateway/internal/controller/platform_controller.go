// Package controller 平台聚合控制器
//
// unified-music-api 新增：将 services/ 下的各平台微服务（netease/kugou/unm/lyric/meting）
// 通过统一入口 /api/v1/platform/:name/*path 反向代理出去。
// 网关只做路由与透传，不重写任何平台业务逻辑；各平台原生接口保持 100% 兼容。
package controller

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"

	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/response"
	"github.com/gin-gonic/gin"
)

// platformUpstream 平台名称 -> 上游地址，可用环境变量覆盖。
// 默认值对应 deploy/docker-compose.yml 中的服务名与端口。
func platformUpstream(name string) (string, bool) {
	defaults := map[string]string{
		"netease": "http://netease:3001",
		"kugou":   "http://kugou:3002",
		"unm":     "http://unm:3003",
		"lyric":   "http://lyric:3004",
		"meting":  "http://meting:3005",
	}
	envNames := map[string]string{
		"netease": "PLATFORM_NETEASE_URL",
		"kugou":   "PLATFORM_KUGOU_URL",
		"unm":     "PLATFORM_UNM_URL",
		"lyric":   "PLATFORM_LYRIC_URL",
		"meting":  "PLATFORM_METING_URL",
	}
	def, ok := defaults[name]
	if !ok {
		return "", false
	}
	if v := strings.TrimSpace(os.Getenv(envNames[name])); v != "" {
		return v, true
	}
	return def, true
}

// PlatformController 平台聚合控制器
type PlatformController struct {
	logger logger.Logger
}

// NewPlatformController 创建平台聚合控制器
func NewPlatformController(log logger.Logger) *PlatformController {
	return &PlatformController{logger: log}
}

// RegisterRoutes 注册路由
// @Router /api/v1/platform/{name}/{path} [get,post]
func (c *PlatformController) RegisterRoutes(router *gin.RouterGroup) {
	router.Any("/platform/:name/*path", c.Proxy)
}

// Proxy 反向代理到对应平台微服务
func (c *PlatformController) Proxy(ctx *gin.Context) {
	name := ctx.Param("name")
	target, ok := platformUpstream(name)
	if !ok {
		response.NotFound(ctx, "未知平台: "+name+"，可用平台: netease, kugou, unm, lyric, meting")
		return
	}

	targetURL, err := url.Parse(target)
	if err != nil {
		response.ErrorWithCode(ctx, 500, 500, "平台上游地址配置错误")
		return
	}

	// /api/v1/platform/:name 之后的部分透传给上游（保留 query）
	rest := ctx.Param("path")
	if rest == "" || rest == "/" {
		rest = "/"
	}
	proxy := &httputil.ReverseProxy{
		Director: func(req *http.Request) {
			req.URL.Scheme = targetURL.Scheme
			req.URL.Host = targetURL.Host
			req.URL.Path = singleJoiningSlash(targetURL.Path, rest)
			// 保留原始 query
			req.URL.RawQuery = ctx.Request.URL.RawQuery
			req.Host = targetURL.Host
			// 透传 UA，便于上游风控识别
			if ua := ctx.Request.Header.Get("User-Agent"); ua != "" {
				req.Header.Set("User-Agent", ua)
			}
		},
		ErrorHandler: func(w http.ResponseWriter, req *http.Request, err error) {
			c.logger.Error("平台代理失败",
				logger.String("platform", name),
				logger.String("target", target),
				logger.ErrorField("error", err),
			)
			ctx.AbortWithStatusJSON(http.StatusBadGateway, gin.H{
				"code":     502,
				"message":  "平台服务不可用: " + name,
				"platform": name,
			})
		},
	}
	proxy.ServeHTTP(ctx.Writer, ctx.Request)
}

func singleJoiningSlash(a, b string) string {
	aslash := strings.HasSuffix(a, "/")
	bslash := strings.HasPrefix(b, "/")
	switch {
	case aslash && bslash:
		return a + b[1:]
	case !aslash && !bslash:
		return a + "/" + b
	}
	return a + b
}
