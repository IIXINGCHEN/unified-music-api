// Package controller 健康检查控制器
package controller

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/health"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/response"
)

// HealthController 健康检查控制器
type HealthController struct {
	checker *health.Checker
	metrics *health.MetricsCollector
}

// NewHealthController 创建健康检查控制器
func NewHealthController() *HealthController {
	return &HealthController{
		checker: health.GetDefaultChecker(),
		metrics: health.GetDefaultMetricsCollector(),
	}
}

// Health 健康检查接口
// @Summary 健康检查
// @Description 检查服务健康状态
// @Tags 健康检查
// @Accept json
// @Produce json
// @Success 200 {object} response.Response
// @Failure 503 {object} response.Response
// @Router /health [get]
func (h *HealthController) Health(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()
	
	// 执行健康检查
	results := h.checker.Check(ctx)
	isHealthy := h.checker.IsHealthy(ctx)
	
	// 构建响应数据
	data := map[string]interface{}{
		"status":    getOverallStatus(isHealthy),
		"timestamp": time.Now().Unix(),
		"uptime":    h.checker.GetUptime().String(),
		"checks":    results,
	}
	
	// 根据健康状态返回相应的HTTP状态码
	if isHealthy {
		response.Success(c, "服务健康", data)
	} else {
		c.JSON(http.StatusServiceUnavailable, response.NewResponse(503, "服务不健康", data))
	}
}

// Ready 就绪检查接口
// @Summary 就绪检查
// @Description 检查服务是否就绪
// @Tags 健康检查
// @Accept json
// @Produce json
// @Success 200 {object} response.Response
// @Failure 503 {object} response.Response
// @Router /ready [get]
func (h *HealthController) Ready(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()
	
	// 执行就绪检查（通常比健康检查更快）
	isReady := h.checker.IsHealthy(ctx)
	
	// 构建响应数据
	data := map[string]interface{}{
		"status":    getOverallStatus(isReady),
		"timestamp": time.Now().Unix(),
		"uptime":    h.checker.GetUptime().String(),
	}
	
	// 根据就绪状态返回相应的HTTP状态码
	if isReady {
		response.Success(c, "服务就绪", data)
	} else {
		c.JSON(http.StatusServiceUnavailable, response.NewResponse(503, "服务未就绪", data))
	}
}

// Metrics 指标接口
// @Summary 获取服务指标
// @Description 获取详细的服务运行指标
// @Tags 健康检查
// @Accept json
// @Produce json
// @Success 200 {object} response.Response
// @Router /metrics [get]
func (h *HealthController) Metrics(c *gin.Context) {
	// 获取指标数据
	metrics := h.metrics.GetMetrics()
	
	response.Success(c, "指标获取成功", metrics)
}

// LivenessProbe Kubernetes存活性探针
// @Summary 存活性探针
// @Description Kubernetes存活性探针接口
// @Tags 健康检查
// @Accept json
// @Produce json
// @Success 200 {object} response.Response
// @Router /healthz [get]
func (h *HealthController) LivenessProbe(c *gin.Context) {
	// 存活性探针只检查服务是否还在运行
	// 不进行复杂的健康检查
	data := map[string]interface{}{
		"status":    "alive",
		"timestamp": time.Now().Unix(),
		"uptime":    h.checker.GetUptime().String(),
	}
	
	response.Success(c, "服务存活", data)
}

// ReadinessProbe Kubernetes就绪性探针
// @Summary 就绪性探针
// @Description Kubernetes就绪性探针接口
// @Tags 健康检查
// @Accept json
// @Produce json
// @Success 200 {object} response.Response
// @Failure 503 {object} response.Response
// @Router /readyz [get]
func (h *HealthController) ReadinessProbe(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()
	
	// 就绪性探针检查服务是否准备好接收流量
	isReady := h.checker.IsHealthy(ctx)
	
	data := map[string]interface{}{
		"status":    getOverallStatus(isReady),
		"timestamp": time.Now().Unix(),
	}
	
	if isReady {
		response.Success(c, "服务就绪", data)
	} else {
		c.JSON(http.StatusServiceUnavailable, response.NewResponse(503, "服务未就绪", data))
	}
}

// StartupProbe Kubernetes启动探针
// @Summary 启动探针
// @Description Kubernetes启动探针接口
// @Tags 健康检查
// @Accept json
// @Produce json
// @Success 200 {object} response.Response
// @Failure 503 {object} response.Response
// @Router /startupz [get]
func (h *HealthController) StartupProbe(c *gin.Context) {
	// 启动探针检查服务是否已经启动完成
	// 通常在服务启动后的一段时间内返回成功
	uptime := h.checker.GetUptime()
	
	// 假设服务启动需要30秒
	const startupTime = 30 * time.Second
	isStarted := uptime > startupTime
	
	data := map[string]interface{}{
		"status":    getOverallStatus(isStarted),
		"timestamp": time.Now().Unix(),
		"uptime":    uptime.String(),
	}
	
	if isStarted {
		response.Success(c, "服务已启动", data)
	} else {
		c.JSON(http.StatusServiceUnavailable, response.NewResponse(503, "服务启动中", data))
	}
}

// getOverallStatus 获取整体状态字符串
func getOverallStatus(isHealthy bool) string {
	if isHealthy {
		return "healthy"
	}
	return "unhealthy"
}

// RegisterHealthRoutes 注册健康检查路由
func RegisterHealthRoutes(r *gin.Engine) {
	controller := NewHealthController()
	
	// 标准健康检查路由
	r.GET("/health", controller.Health)
	r.GET("/ready", controller.Ready)
	r.GET("/metrics", controller.Metrics)
	
	// Kubernetes探针路由
	r.GET("/healthz", controller.LivenessProbe)
	r.GET("/readyz", controller.ReadinessProbe)
	r.GET("/startupz", controller.StartupProbe)
}
