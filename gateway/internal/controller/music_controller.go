// Package controller 音乐控制器
package controller

import (
	"strconv"
	"strings"
	"time"
	"github.com/gin-gonic/gin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/model"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/service"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/errors"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/response"
)

// MusicController 音乐控制器
type MusicController struct {
	musicService service.MusicService
	logger       logger.Logger
}

// NewMusicController 创建音乐控制器
func NewMusicController(musicService service.MusicService, log logger.Logger) *MusicController {
	return &MusicController{
		musicService: musicService,
		logger:       log,
	}
}

// Match 匹配音乐
// @Summary 匹配音乐
// @Description 根据音乐ID匹配播放链接
// @Tags 音乐
// @Accept json
// @Produce json
// @Param id query string true "音乐ID"
// @Param server query string false "指定音源，逗号分隔"
// @Success 200 {object} model.MatchResponse "匹配成功"
// @Failure 400 {object} response.ErrorResponse "参数错误"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /match [get]
func (c *MusicController) Match(ctx *gin.Context) {
	start := time.Now()
	
	// 解析请求参数
	var req model.MatchRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		c.logger.Warn("参数绑定失败",
			logger.String("path", ctx.Request.URL.Path),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInvalidParameter.WithDetails(map[string]interface{}{
			"error": err.Error(),
		}))
		return
	}
	
	// 解析音源列表
	req.Sources = model.ParseSources(req.Server)
	
	c.logger.Info("开始匹配音乐",
		logger.String("id", req.ID),
		logger.String("server", req.Server),
		logger.Any("sources", req.Sources),
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	result, err := c.musicService.MatchMusic(ctx.Request.Context(), &req)
	if err != nil {
		c.logger.Error("匹配音乐失败",
			logger.String("id", req.ID),
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		
		// 根据错误类型返回不同的HTTP状态码
		if strings.Contains(err.Error(), "参数") {
			response.Error(ctx, errors.ErrInvalidParameter.WithMessage(err.Error()))
		} else if strings.Contains(err.Error(), "限流") {
			response.Error(ctx, errors.ErrRateLimitExceeded.WithMessage(err.Error()))
		} else if strings.Contains(err.Error(), "未找到") {
			response.Error(ctx, errors.ErrResourceNotFound.WithMessage(err.Error()))
		} else {
			response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		}
		return
	}
	
	c.logger.Info("匹配音乐成功",
		logger.String("id", req.ID),
		logger.String("source", result.Source),
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "匹配成功", result)
}

// GetNCM 获取网易云音乐
// @Summary 获取网易云音乐
// @Description 获取网易云音乐播放链接
// @Tags 音乐
// @Accept json
// @Produce json
// @Param id query string true "音乐ID"
// @Param br query string false "音质参数"
// @Success 200 {object} model.NCMGetResponse "获取成功"
// @Failure 400 {object} response.ErrorResponse "参数错误"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /ncm [get]
func (c *MusicController) GetNCM(ctx *gin.Context) {
	start := time.Now()
	
	// 解析请求参数
	var req model.NCMGetRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		c.logger.Warn("参数绑定失败",
			logger.String("path", ctx.Request.URL.Path),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInvalidParameter.WithDetails(map[string]interface{}{
			"error": err.Error(),
		}))
		return
	}
	
	c.logger.Info("开始获取网易云音乐",
		logger.String("id", req.ID),
		logger.String("br", req.BR),
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	result, err := c.musicService.GetNCMMusic(ctx.Request.Context(), &req)
	if err != nil {
		c.logger.Error("获取网易云音乐失败",
			logger.String("id", req.ID),
			logger.String("br", req.BR),
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		
		if strings.Contains(err.Error(), "参数") || strings.Contains(err.Error(), "音质") {
			response.Error(ctx, errors.ErrInvalidParameter.WithMessage(err.Error()))
		} else if strings.Contains(err.Error(), "限流") {
			response.Error(ctx, errors.ErrRateLimitExceeded.WithMessage(err.Error()))
		} else if strings.Contains(err.Error(), "不可用") {
			response.Error(ctx, errors.ErrServiceUnavailable.WithMessage(err.Error()))
		} else {
			response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		}
		return
	}
	
	c.logger.Info("获取网易云音乐成功",
		logger.String("id", req.ID),
		logger.String("br", req.BR),
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "获取成功", result)
}

// GetOther 获取其他音源音乐
// @Summary 获取其他音源音乐
// @Description 根据歌曲名获取其他音源音乐
// @Tags 音乐
// @Accept json
// @Produce json
// @Param name query string true "歌曲名称"
// @Success 200 {object} model.OtherGetResponse "获取成功"
// @Failure 400 {object} response.ErrorResponse "参数错误"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /other [get]
func (c *MusicController) GetOther(ctx *gin.Context) {
	start := time.Now()
	
	// 解析请求参数
	var req model.OtherGetRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		c.logger.Warn("参数绑定失败",
			logger.String("path", ctx.Request.URL.Path),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInvalidParameter.WithDetails(map[string]interface{}{
			"error": err.Error(),
		}))
		return
	}
	
	c.logger.Info("开始获取其他音源音乐",
		logger.String("name", req.Name),
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	result, err := c.musicService.GetOtherMusic(ctx.Request.Context(), &req)
	if err != nil {
		c.logger.Error("获取其他音源音乐失败",
			logger.String("name", req.Name),
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		
		if strings.Contains(err.Error(), "参数") {
			response.Error(ctx, errors.ErrInvalidParameter.WithMessage(err.Error()))
		} else if strings.Contains(err.Error(), "限流") {
			response.Error(ctx, errors.ErrRateLimitExceeded.WithMessage(err.Error()))
		} else if strings.Contains(err.Error(), "未找到") {
			response.Error(ctx, errors.ErrResourceNotFound.WithMessage(err.Error()))
		} else {
			response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		}
		return
	}
	
	c.logger.Info("获取其他音源音乐成功",
		logger.String("name", req.Name),
		logger.String("source", result.Source),
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "获取成功", result)
}



// Search 搜索音乐
// @Summary 搜索音乐
// @Description 根据关键词搜索音乐
// @Tags 音乐
// @Accept json
// @Produce json
// @Param keyword query string true "搜索关键词"
// @Param sources query string false "音源列表，逗号分隔"
// @Param limit query int false "结果数量限制" default(20)
// @Success 200 {object} response.SuccessResponse{data=[]model.SearchResult} "搜索成功"
// @Failure 400 {object} response.ErrorResponse "参数错误"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /search [get]
func (c *MusicController) Search(ctx *gin.Context) {
	start := time.Now()
	
	// 解析参数
	keyword := ctx.Query("keyword")
	if keyword == "" {
		response.Error(ctx, errors.ErrInvalidParameter.WithMessage("搜索关键词不能为空"))
		return
	}
	
	sourcesParam := ctx.Query("sources")
	var sources []string
	if sourcesParam != "" {
		sources = strings.Split(sourcesParam, ",")
		for i, source := range sources {
			sources[i] = strings.TrimSpace(source)
		}
	}
	
	limitParam := ctx.DefaultQuery("limit", "20")
	limit, err := strconv.Atoi(limitParam)
	if err != nil || limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100 // 限制最大返回数量
	}
	
	c.logger.Info("开始搜索音乐",
		logger.String("keyword", keyword),
		logger.Any("sources", sources),
		logger.Int("limit", limit),
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	results, err := c.musicService.SearchMusic(ctx.Request.Context(), keyword, sources)
	if err != nil {
		c.logger.Error("搜索音乐失败",
			logger.String("keyword", keyword),
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		
		if strings.Contains(err.Error(), "参数") {
			response.Error(ctx, errors.ErrInvalidParameter.WithMessage(err.Error()))
		} else if strings.Contains(err.Error(), "限流") {
			response.Error(ctx, errors.ErrRateLimitExceeded.WithMessage(err.Error()))
		} else {
			response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		}
		return
	}
	
	// 限制返回数量
	if len(results) > limit {
		results = results[:limit]
	}
	
	c.logger.Info("搜索音乐成功",
		logger.String("keyword", keyword),
		logger.Int("result_count", len(results)),
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "搜索成功", results)
}

// GetInfo 获取音乐信息
// @Summary 获取音乐信息
// @Description 获取指定音源的音乐详细信息
// @Tags 音乐
// @Accept json
// @Produce json
// @Param source query string true "音源名称"
// @Param id query string true "音乐ID"
// @Success 200 {object} model.MusicInfo "获取成功"
// @Failure 400 {object} response.ErrorResponse "参数错误"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /info [get]
func (c *MusicController) GetInfo(ctx *gin.Context) {
	start := time.Now()
	
	// 解析参数
	source := ctx.Query("source")
	id := ctx.Query("id")
	
	if source == "" {
		response.Error(ctx, errors.ErrInvalidParameter.WithMessage("音源名称不能为空"))
		return
	}
	
	if id == "" {
		response.Error(ctx, errors.ErrInvalidParameter.WithMessage("音乐ID不能为空"))
		return
	}
	
	c.logger.Info("开始获取音乐信息",
		logger.String("source", source),
		logger.String("id", id),
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	info, err := c.musicService.GetMusicInfo(ctx.Request.Context(), source, id)
	if err != nil {
		c.logger.Error("获取音乐信息失败",
			logger.String("source", source),
			logger.String("id", id),
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		
		if strings.Contains(err.Error(), "参数") {
			response.Error(ctx, errors.ErrInvalidParameter.WithMessage(err.Error()))
		} else if strings.Contains(err.Error(), "限流") {
			response.Error(ctx, errors.ErrRateLimitExceeded.WithMessage(err.Error()))
		} else if strings.Contains(err.Error(), "不可用") {
			response.Error(ctx, errors.ErrServiceUnavailable.WithMessage(err.Error()))
		} else if strings.Contains(err.Error(), "未找到") {
			response.Error(ctx, errors.ErrResourceNotFound.WithMessage(err.Error()))
		} else {
			response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		}
		return
	}
	
	c.logger.Info("获取音乐信息成功",
		logger.String("source", source),
		logger.String("id", id),
		logger.String("name", info.Name),
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "获取成功", info)
}

// GetPicture 获取专辑图
func (c *MusicController) GetPicture(ctx *gin.Context) {
	// 获取参数
	source := ctx.DefaultQuery("source", "gdstudio")
	picID := ctx.Query("id")
	size := ctx.DefaultQuery("size", "300")

	// 参数验证
	if picID == "" {
		response.BadRequest(ctx, "专辑图ID不能为空")
		return
	}

	// 验证音源
	if source != "gdstudio" {
		response.BadRequest(ctx, "当前仅支持gdstudio音源")
		return
	}

	// 验证尺寸
	if size != "300" && size != "500" {
		response.BadRequest(ctx, "尺寸只能是300或500")
		return
	}

	c.logger.Info("获取专辑图请求",
		logger.String("source", source),
		logger.String("pic_id", picID),
		logger.String("size", size),
	)

	// 调用服务获取专辑图
	picURL, err := c.musicService.GetPicture(ctx, source, picID, size)
	if err != nil {
		c.logger.Error("获取专辑图失败",
			logger.String("source", source),
			logger.String("pic_id", picID),
			logger.ErrorField("error", err),
		)
		response.InternalServerError(ctx, "获取专辑图失败: "+err.Error())
		return
	}

	response.Success(ctx, "获取成功", map[string]string{
		"url": picURL,
	})
}

// GetLyric 获取歌词
func (c *MusicController) GetLyric(ctx *gin.Context) {
	// 获取参数
	source := ctx.DefaultQuery("source", "gdstudio")
	lyricID := ctx.Query("id")

	// 参数验证
	if lyricID == "" {
		response.BadRequest(ctx, "歌词ID不能为空")
		return
	}

	// 验证音源
	if source != "gdstudio" {
		response.BadRequest(ctx, "当前仅支持gdstudio音源")
		return
	}

	c.logger.Info("获取歌词请求",
		logger.String("source", source),
		logger.String("lyric_id", lyricID),
	)

	// 调用服务获取歌词
	lyric, tlyric, err := c.musicService.GetLyric(ctx, source, lyricID)
	if err != nil {
		c.logger.Error("获取歌词失败",
			logger.String("source", source),
			logger.String("lyric_id", lyricID),
			logger.ErrorField("error", err),
		)
		response.InternalServerError(ctx, "获取歌词失败: "+err.Error())
		return
	}

	response.Success(ctx, "获取成功", map[string]string{
		"lyric":  lyric,
		"tlyric": tlyric,
	})
}

// RegisterRoutes 注册路由
func (c *MusicController) RegisterRoutes(router *gin.RouterGroup) {
	router.GET("/match", c.Match)    // 匹配音乐
	router.GET("/ncmget", c.GetNCM)  // 获取网易云音乐
	router.GET("/other", c.GetOther) // 获取其他音源音乐
	router.GET("/search", c.Search)  // 搜索音乐
	router.GET("/info", c.GetInfo)   // 获取音乐信息
	router.GET("/picture", c.GetPicture)  // 新增专辑图接口
	router.GET("/lyric", c.GetLyric)      // 新增歌词接口
}
