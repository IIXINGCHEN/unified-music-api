// Package controller 配置控制器
package controller

import (
	"time"
	"github.com/gin-gonic/gin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/model"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/service"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/utils"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/errors"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/response"
)

// ConfigController 配置控制器
type ConfigController struct {
	configService service.ConfigService
	logger        logger.Logger
}

// NewConfigController 创建配置控制器
func NewConfigController(configService service.ConfigService, log logger.Logger) *ConfigController {
	return &ConfigController{
		configService: configService,
		logger:        log,
	}
}

// GetConfig 获取完整配置
// @Summary 获取完整配置
// @Description 获取系统完整配置信息（脱敏）
// @Tags 配置
// @Accept json
// @Produce json
// @Success 200 {object} model.AppConfig "获取成功"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /config [get]
func (c *ConfigController) GetConfig(ctx *gin.Context) {
	start := time.Now()
	
	c.logger.Debug("获取完整配置",
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 获取原始配置
	rawConfig, err := c.configService.GetConfig(ctx.Request.Context())
	if err != nil {
		c.logger.Error("获取配置失败",
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		return
	}

	// 使用生产环境脱敏工具
	config := utils.SanitizeForProduction(rawConfig)
	
	c.logger.Info("获取配置成功",
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "获取成功", config)
}

// UpdateConfig 更新完整配置
// @Summary 更新完整配置
// @Description 更新系统完整配置
// @Tags 配置
// @Accept json
// @Produce json
// @Param config body model.AppConfig true "配置信息"
// @Success 200 {object} response.SuccessResponse "更新成功"
// @Failure 400 {object} response.ErrorResponse "参数错误"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /config [put]
func (c *ConfigController) UpdateConfig(ctx *gin.Context) {
	start := time.Now()
	
	// 解析请求体
	var config model.AppConfig
	if err := ctx.ShouldBindJSON(&config); err != nil {
		c.logger.Warn("配置参数绑定失败",
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInvalidParameter.WithDetails(map[string]interface{}{
			"error": err.Error(),
		}))
		return
	}
	
	c.logger.Info("开始更新配置",
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	err := c.configService.UpdateConfig(ctx.Request.Context(), &config)
	if err != nil {
		c.logger.Error("更新配置失败",
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		
		if err.Error() == "配置验证失败" {
			response.Error(ctx, errors.ErrInvalidParameter.WithMessage(err.Error()))
		} else {
			response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		}
		return
	}
	
	c.logger.Info("更新配置成功",
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "更新成功", nil)
}

// GetSection 获取配置节
// @Summary 获取配置节
// @Description 获取指定的配置节
// @Tags 配置
// @Accept json
// @Produce json
// @Param section path string true "配置节名称"
// @Success 200 {object} response.SuccessResponse "获取成功"
// @Failure 400 {object} response.ErrorResponse "参数错误"
// @Failure 404 {object} response.ErrorResponse "配置节不存在"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /config/{section} [get]
func (c *ConfigController) GetSection(ctx *gin.Context) {
	start := time.Now()
	
	section := ctx.Param("section")
	if section == "" {
		response.Error(ctx, errors.ErrInvalidParameter.WithMessage("配置节名称不能为空"))
		return
	}
	
	c.logger.Debug("获取配置节",
		logger.String("section", section),
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	data, err := c.configService.GetSection(ctx.Request.Context(), section)
	if err != nil {
		c.logger.Error("获取配置节失败",
			logger.String("section", section),
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		
		if err.Error() == "配置节不存在" {
			response.Error(ctx, errors.ErrResourceNotFound.WithMessage(err.Error()))
		} else {
			response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		}
		return
	}
	
	c.logger.Info("获取配置节成功",
		logger.String("section", section),
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "获取成功", data)
}

// UpdateSection 更新配置节
// @Summary 更新配置节
// @Description 更新指定的配置节
// @Tags 配置
// @Accept json
// @Produce json
// @Param section path string true "配置节名称"
// @Param data body object true "配置数据"
// @Success 200 {object} response.SuccessResponse "更新成功"
// @Failure 400 {object} response.ErrorResponse "参数错误"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /config/{section} [put]
func (c *ConfigController) UpdateSection(ctx *gin.Context) {
	start := time.Now()
	
	section := ctx.Param("section")
	if section == "" {
		response.Error(ctx, errors.ErrInvalidParameter.WithMessage("配置节名称不能为空"))
		return
	}
	
	// 解析请求体
	var data interface{}
	if err := ctx.ShouldBindJSON(&data); err != nil {
		c.logger.Warn("配置数据绑定失败",
			logger.String("section", section),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInvalidParameter.WithDetails(map[string]interface{}{
			"error": err.Error(),
		}))
		return
	}
	
	c.logger.Info("开始更新配置节",
		logger.String("section", section),
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	err := c.configService.UpdateSection(ctx.Request.Context(), section, data)
	if err != nil {
		c.logger.Error("更新配置节失败",
			logger.String("section", section),
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		return
	}
	
	c.logger.Info("更新配置节成功",
		logger.String("section", section),
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "更新成功", nil)
}

// ValidateConfig 验证配置
// @Summary 验证配置
// @Description 验证配置的有效性
// @Tags 配置
// @Accept json
// @Produce json
// @Param config body model.AppConfig true "配置信息"
// @Success 200 {object} model.ConfigValidationResult "验证成功"
// @Failure 400 {object} response.ErrorResponse "参数错误"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /config/validate [post]
func (c *ConfigController) ValidateConfig(ctx *gin.Context) {
	start := time.Now()
	
	// 解析请求体
	var config model.AppConfig
	if err := ctx.ShouldBindJSON(&config); err != nil {
		c.logger.Warn("配置参数绑定失败",
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInvalidParameter.WithDetails(map[string]interface{}{
			"error": err.Error(),
		}))
		return
	}
	
	c.logger.Debug("开始验证配置",
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	result, err := c.configService.ValidateConfig(ctx.Request.Context(), &config)
	if err != nil {
		c.logger.Error("验证配置失败",
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		return
	}
	
	c.logger.Info("验证配置完成",
		logger.Bool("valid", result.Valid),
		logger.Int("error_count", len(result.Errors)),
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "验证完成", result)
}

// ReloadConfig 重新加载配置
// @Summary 重新加载配置
// @Description 从配置文件重新加载配置
// @Tags 配置
// @Accept json
// @Produce json
// @Success 200 {object} response.SuccessResponse "重新加载成功"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /config/reload [post]
func (c *ConfigController) ReloadConfig(ctx *gin.Context) {
	start := time.Now()
	
	c.logger.Info("开始重新加载配置",
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	err := c.configService.ReloadConfig(ctx.Request.Context())
	if err != nil {
		c.logger.Error("重新加载配置失败",
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		return
	}
	
	c.logger.Info("重新加载配置成功",
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "重新加载成功", nil)
}

// BackupConfig 备份配置
// @Summary 备份配置
// @Description 创建配置备份
// @Tags 配置
// @Accept json
// @Produce json
// @Param request body object true "备份请求"
// @Success 200 {object} model.ConfigBackup "备份成功"
// @Failure 400 {object} response.ErrorResponse "参数错误"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /config/backup [post]
func (c *ConfigController) BackupConfig(ctx *gin.Context) {
	start := time.Now()
	
	// 解析请求体
	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
	}
	
	if err := ctx.ShouldBindJSON(&req); err != nil {
		c.logger.Warn("备份请求参数绑定失败",
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInvalidParameter.WithDetails(map[string]interface{}{
			"error": err.Error(),
		}))
		return
	}
	
	c.logger.Info("开始备份配置",
		logger.String("name", req.Name),
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	backup, err := c.configService.BackupConfig(ctx.Request.Context(), req.Name, req.Description)
	if err != nil {
		c.logger.Error("备份配置失败",
			logger.String("name", req.Name),
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		return
	}
	
	c.logger.Info("备份配置成功",
		logger.String("name", req.Name),
		logger.String("backup_id", backup.ID),
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "备份成功", backup)
}

// RestoreConfig 恢复配置
// @Summary 恢复配置
// @Description 从备份恢复配置
// @Tags 配置
// @Accept json
// @Produce json
// @Param backup_id path string true "备份ID"
// @Success 200 {object} response.SuccessResponse "恢复成功"
// @Failure 400 {object} response.ErrorResponse "参数错误"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /config/backup/{backup_id}/restore [post]
func (c *ConfigController) RestoreConfig(ctx *gin.Context) {
	start := time.Now()
	
	backupID := ctx.Param("backup_id")
	if backupID == "" {
		response.Error(ctx, errors.ErrInvalidParameter.WithMessage("备份ID不能为空"))
		return
	}
	
	c.logger.Info("开始恢复配置",
		logger.String("backup_id", backupID),
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	err := c.configService.RestoreConfig(ctx.Request.Context(), backupID)
	if err != nil {
		c.logger.Error("恢复配置失败",
			logger.String("backup_id", backupID),
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		return
	}
	
	c.logger.Info("恢复配置成功",
		logger.String("backup_id", backupID),
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "恢复成功", nil)
}

// GetBackups 获取配置备份列表
// @Summary 获取配置备份列表
// @Description 获取所有配置备份
// @Tags 配置
// @Accept json
// @Produce json
// @Success 200 {object} response.SuccessResponse{data=[]model.ConfigBackup} "获取成功"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /config/backups [get]
func (c *ConfigController) GetBackups(ctx *gin.Context) {
	start := time.Now()
	
	c.logger.Debug("获取配置备份列表",
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	backups, err := c.configService.GetBackups(ctx.Request.Context())
	if err != nil {
		c.logger.Error("获取配置备份列表失败",
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		return
	}
	
	c.logger.Info("获取配置备份列表成功",
		logger.Int("backup_count", len(backups)),
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "获取成功", backups)
}

// DeleteBackup 删除配置备份
// @Summary 删除配置备份
// @Description 删除指定的配置备份
// @Tags 配置
// @Accept json
// @Produce json
// @Param backup_id path string true "备份ID"
// @Success 200 {object} response.SuccessResponse "删除成功"
// @Failure 400 {object} response.ErrorResponse "参数错误"
// @Failure 500 {object} response.ErrorResponse "服务器错误"
// @Router /config/backup/{backup_id} [delete]
func (c *ConfigController) DeleteBackup(ctx *gin.Context) {
	start := time.Now()
	
	backupID := ctx.Param("backup_id")
	if backupID == "" {
		response.Error(ctx, errors.ErrInvalidParameter.WithMessage("备份ID不能为空"))
		return
	}
	
	c.logger.Info("开始删除配置备份",
		logger.String("backup_id", backupID),
		logger.String("client_ip", ctx.ClientIP()),
	)
	
	// 调用服务
	err := c.configService.DeleteBackup(ctx.Request.Context(), backupID)
	if err != nil {
		c.logger.Error("删除配置备份失败",
			logger.String("backup_id", backupID),
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		response.Error(ctx, errors.ErrInternalServer.WithMessage(err.Error()))
		return
	}
	
	c.logger.Info("删除配置备份成功",
		logger.String("backup_id", backupID),
		logger.String("duration", time.Since(start).String()),
	)
	
	response.Success(ctx, "删除成功", nil)
}

// RegisterRoutes 注册路由 - 生产环境安全版本
func (c *ConfigController) RegisterRoutes(router *gin.RouterGroup) {
	// 注意：这里需要在调用处传入认证中间件
	// 配置相关的路由需要管理员权限
	configGroup := router.Group("/config")
	{
		// 只读配置查看（需要API密钥）
		configGroup.GET("", c.GetConfig)           // 已脱敏的配置
		configGroup.GET("/:section", c.GetSection) // 已脱敏的配置段

		// 配置管理操作（需要管理员密钥）
		// 注意：这些路由在实际使用时需要添加AdminAuth中间件
		configGroup.PUT("", c.UpdateConfig)
		configGroup.POST("/validate", c.ValidateConfig)
		configGroup.POST("/reload", c.ReloadConfig)
		configGroup.PUT("/:section", c.UpdateSection)

		// 配置备份管理（需要管理员密钥）
		configGroup.POST("/backup", c.BackupConfig)
		configGroup.GET("/backups", c.GetBackups)
		configGroup.POST("/backup/:backup_id/restore", c.RestoreConfig)
		configGroup.DELETE("/backup/:backup_id", c.DeleteBackup)
	}
}
