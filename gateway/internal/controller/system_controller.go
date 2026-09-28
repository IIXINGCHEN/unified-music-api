// Package controller 系统控制器
package controller

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/service"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/errors"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/response"
)

// SystemController 系统控制器
type SystemController struct {
	systemService service.SystemService
	logger        logger.Logger
}

// NewSystemController 创建系统控制器
func NewSystemController(systemService service.SystemService, log logger.Logger) *SystemController {
	return &SystemController{
		systemService: systemService,
		logger:        log,
	}
}

// GetInfo 获取系统信息
// @Summary 获取系统信息
// @Description 获取系统详细信息
// @Tags 系统
// @Accept json
// @Produce json
// @Success 200 {object} model.SystemInfoResponse "获取成功"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /system/info [get]
func (c *SystemController) GetInfo(ctx *gin.Context) {
	start := time.Now()
	
	c.logger.Debug("获取系统信息",
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	info, err := c.systemService.GetSystemInfo(ctx.Request.Context())
	if err != nil {
		c.logger.Error("获取系统信息失败",
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		return
	}
	
	c.logger.Info("获取系统信息成功",
		logger.String("version", info.Version),
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "获取成功", info)
}

// GetHealth 获取健康状态
// @Summary 获取健康状态
// @Description 获取系统健康检查状态
// @Tags 系统
// @Accept json
// @Produce json
// @Success 200 {object} model.HealthResponse "获取成功"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /system/health [get]
func (c *SystemController) GetHealth(ctx *gin.Context) {
	start := time.Now()
	
	c.logger.Debug("获取健康状态",
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	health, err := c.systemService.GetHealthStatus(ctx.Request.Context())
	if err != nil {
		c.logger.Error("获取健康状态失败",
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		return
	}
	
	c.logger.Info("获取健康状态成功",
		logger.String("status", health.Status),
		logger.String("duration", time.Since(start).String()),
	)
	
	// 根据健康状态设置HTTP状态码
	if health.Status == "healthy" {
		response.Success(ctx, "健康检查通过", health)
	} else {
		response.ServiceUnavailable(ctx, "健康检查失败")
	}
}

// GetMetrics 获取系统指标
// @Summary 获取系统指标
// @Description 获取系统性能指标
// @Tags 系统
// @Accept json
// @Produce json
// @Success 200 {object} model.MetricsResponse "获取成功"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /system/metrics [get]
func (c *SystemController) GetMetrics(ctx *gin.Context) {
	start := time.Now()
	
	c.logger.Debug("获取系统指标",
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	metrics, err := c.systemService.GetMetrics(ctx.Request.Context())
	if err != nil {
		c.logger.Error("获取系统指标失败",
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		return
	}
	
	c.logger.Info("获取系统指标成功",
		logger.Int64("total_requests", metrics.RequestStats.TotalRequests),
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "获取成功", metrics)
}

// GetSourcesStatus 获取音源状态
// @Summary 获取音源状态
// @Description 获取所有音源的状态信息
// @Tags 系统
// @Accept json
// @Produce json
// @Success 200 {object} response.SuccessResponse{data=[]model.SourceStatus} "获取成功"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /system/sources [get]
func (c *SystemController) GetSourcesStatus(ctx *gin.Context) {
	start := time.Now()
	
	c.logger.Debug("获取音源状态",
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	statuses, err := c.systemService.GetSourcesStatus(ctx.Request.Context())
	if err != nil {
		c.logger.Error("获取音源状态失败",
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		return
	}
	
	c.logger.Info("获取音源状态成功",
		logger.Int("source_count", len(statuses)),
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "获取成功", statuses)
}

// RefreshSources 刷新音源配置
// @Summary 刷新音源配置
// @Description 重新加载所有音源的配置
// @Tags 系统
// @Accept json
// @Produce json
// @Success 200 {object} response.SuccessResponse "刷新成功"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /system/sources/refresh [post]
func (c *SystemController) RefreshSources(ctx *gin.Context) {
	start := time.Now()
	
	c.logger.Info("开始刷新音源配置",
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	err := c.systemService.RefreshSources(ctx.Request.Context())
	if err != nil {
		c.logger.Error("刷新音源配置失败",
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		return
	}
	
	c.logger.Info("刷新音源配置成功",
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "刷新成功", nil)
}

// ClearCache 清空缓存
// @Summary 清空缓存
// @Description 清空所有缓存数据
// @Tags 系统
// @Accept json
// @Produce json
// @Success 200 {object} response.SuccessResponse "清空成功"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /system/cache/clear [post]
func (c *SystemController) ClearCache(ctx *gin.Context) {
	start := time.Now()
	
	c.logger.Info("开始清空缓存",
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	err := c.systemService.ClearCache(ctx.Request.Context())
	if err != nil {
		c.logger.Error("清空缓存失败",
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		return
	}
	
	c.logger.Info("清空缓存成功",
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "清空成功", nil)
}

// GetCacheStats 获取缓存统计
// @Summary 获取缓存统计
// @Description 获取缓存使用统计信息
// @Tags 系统
// @Accept json
// @Produce json
// @Success 200 {object} response.SuccessResponse{data=map[string]interface{}} "获取成功"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /system/cache/stats [get]
func (c *SystemController) GetCacheStats(ctx *gin.Context) {
	start := time.Now()
	
	c.logger.Debug("获取缓存统计",
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	stats, err := c.systemService.GetCacheStats(ctx.Request.Context())
	if err != nil {
		c.logger.Error("获取缓存统计失败",
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		return
	}
	
	c.logger.Info("获取缓存统计成功",
		logger.Any("stats", stats),
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "获取成功", stats)
}

// GetVersion 获取版本信息
// @Summary 获取版本信息
// @Description 获取系统版本号
// @Tags 系统
// @Accept json
// @Produce json
// @Success 200 {object} response.SuccessResponse{data=string} "获取成功"
// @Router /version [get]
func (c *SystemController) GetVersion(ctx *gin.Context) {
	version := c.systemService.GetVersion()
	response.Success(ctx, "获取成功", map[string]string{
		"version": version,
	})
}

// Ping 健康检查
// @Summary 健康检查
// @Description 健康检查接口
// @Tags 系统
// @Accept json
// @Produce json
// @Success 200 {object} response.SuccessResponse{data=string} "服务正常"
// @Router /ping [get]
func (c *SystemController) Ping(ctx *gin.Context) {
	isHealthy := c.systemService.IsHealthy(ctx.Request.Context())
	
	if isHealthy {
		response.Success(ctx, "pong", map[string]interface{}{
			"status":    "healthy",
			"timestamp": time.Now().Unix(),
		})
	} else {
		response.ServiceUnavailable(ctx, "服务不健康")
	}
}

// RegisterRoutes 注册路由
func (c *SystemController) RegisterRoutes(router *gin.RouterGroup) {
	// 系统信息路由组
	systemGroup := router.Group("/system")
	{
		systemGroup.GET("/info", c.GetInfo)
		systemGroup.GET("/health", c.GetHealth)
		systemGroup.GET("/metrics", c.GetMetrics)
		systemGroup.GET("/sources", c.GetSourcesStatus)
		systemGroup.POST("/sources/refresh", c.RefreshSources)
		
		// 缓存管理
		cacheGroup := systemGroup.Group("/cache")
		{
			cacheGroup.GET("/stats", c.GetCacheStats)
			cacheGroup.POST("/clear", c.ClearCache)
		}
	}
	
	// 兼容接口
	router.GET("/version", c.GetVersion)
	router.GET("/ping", c.Ping)
}
