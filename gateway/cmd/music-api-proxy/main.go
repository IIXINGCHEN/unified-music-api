// Package main Music API Proxy 主程序入口
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/config"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/controller"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/health"
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/plugin"
	_ "github.com/IIXINGCHEN/unified-music-api/gateway/internal/plugin/middleware" // 导入中间件插件
	_ "github.com/IIXINGCHEN/unified-music-api/gateway/internal/plugin/sources"    // 导入音源插件
	"github.com/IIXINGCHEN/unified-music-api/gateway/internal/service"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/response"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/useragent"
)

// 版本信息（构建时注入）
var (
	Version   = "dev"
	BuildTime = "unknown"
	GitCommit = "unknown"
)

func main() {
	// 初始化User-Agent构建器
	useragent.InitGlobal("Music-API-Proxy", Version, BuildTime, GitCommit)

	// 打印版本信息
	fmt.Printf("Music API Proxy %s (构建时间: %s, 提交: %s)\n", Version, BuildTime, GitCommit)
	fmt.Printf("User-Agent: %s\n", useragent.Build())
	
	// 加载配置
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}
	
	// 验证配置
	if err := config.ValidateConfig(cfg); err != nil {
		log.Fatalf("配置验证失败: %v", err)
	}
	
	// 初始化日志系统
	if err := initLogger(cfg); err != nil {
		log.Fatalf("初始化日志系统失败: %v", err)
	}

	// 初始化健康检查器
	health.InitDefaultChecker()

	// 初始化指标收集器
	health.InitDefaultMetricsCollector()

	logger.Info("Music API Proxy 启动中...",
		logger.String("version", Version),
		logger.String("build_time", BuildTime),
		logger.String("git_commit", GitCommit),
	)
	
	// 初始化服务管理器
	if err := service.InitGlobalServiceManager(cfg, logger.GetDefault()); err != nil {
		logger.Fatal("初始化服务管理器失败", logger.ErrorField("error", err))
	}

	// 获取服务管理器
	serviceManager := service.GetGlobalServiceManager()

	// 插件系统已通过导入自动初始化

	// 创建路由器
	r, err := createRouter(cfg, serviceManager, logger.GetDefault())
	if err != nil {
		logger.Fatal("创建路由器失败", logger.ErrorField("error", err))
	}
	
	// 创建HTTP服务器
	server := &http.Server{
		Addr:         cfg.Server.GetAddr(),
		Handler:      r,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}
	
	// 启动服务器
	go func() {
		logger.Info("HTTP服务器启动",
			logger.String("addr", server.Addr),
			logger.Bool("tls_enabled", cfg.Security.TLSEnabled),
		)
		
		var err error
		if cfg.Security.TLSEnabled {
			err = server.ListenAndServeTLS(cfg.Security.TLSCertFile, cfg.Security.TLSKeyFile)
		} else {
			err = server.ListenAndServe()
		}
		
		if err != nil && err != http.ErrServerClosed {
			logger.Fatal("HTTP服务器启动失败", logger.ErrorField("error", err))
		}
	}()
	
	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	
	logger.Info("收到关闭信号，正在优雅关闭服务器...")
	
	// 优雅关闭服务器
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	if err := server.Shutdown(ctx); err != nil {
		logger.Error("服务器关闭失败", logger.ErrorField("error", err))
	} else {
		logger.Info("服务器已优雅关闭")
	}
	
	// 同步日志
	if err := logger.Sync(); err != nil {
		log.Printf("同步日志失败: %v", err)
	}
}

// createRouter 创建路由器
func createRouter(cfg *config.Config, serviceManager *service.ServiceManager, log logger.Logger) (*gin.Engine, error) {
	// 设置Gin模式
	if cfg.Logging.Level == "debug" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建Gin引擎
	r := gin.New()

	// 创建插件服务
	pluginService := plugin.NewService(log)
	if err := pluginService.Initialize(context.Background(), cfg, log); err != nil {
		return nil, fmt.Errorf("初始化插件服务失败: %w", err)
	}

	// 应用插件化中间件
	if err := pluginService.ApplyMiddleware(r); err != nil {
		return nil, fmt.Errorf("应用中间件插件失败: %w", err)
	}

	// 初始化控制器管理器
	if err := controller.InitGlobalControllerManager(serviceManager, log); err != nil {
		return nil, fmt.Errorf("初始化控制器管理器失败: %w", err)
	}

	// 注册控制器路由
	controller.RegisterGlobalRoutes(r)

	// 静态文件服务
	r.Static("/public", "./public")

	// 404和405处理
	r.NoRoute(func(c *gin.Context) {
		response.NotFound(c, "接口不存在")
	})

	r.NoMethod(func(c *gin.Context) {
		response.ErrorWithCode(c, 405, 405, "方法不允许")
	})

	return r, nil
}

// initLogger 初始化日志系统
func initLogger(cfg *config.Config) error {
	// 创建日志配置
	loggerConfig := &logger.Config{
		Level:            logger.ParseLevel(cfg.Logging.Level),
		Format:           cfg.Logging.Format,
		OutputPaths:      []string{cfg.Logging.Output},
		ErrorOutputPaths: []string{"stderr"},
		EnableCaller:     cfg.Logging.EnableCaller,
		EnableStacktrace: cfg.Logging.EnableStacktrace,
	}

	// 如果是文件输出，设置文件路径
	if cfg.Logging.Output == "file" && cfg.Logging.File != "" {
		loggerConfig.OutputPaths = []string{cfg.Logging.File}
	}

	// 初始化日志器
	return logger.InitDefault(loggerConfig)
}
