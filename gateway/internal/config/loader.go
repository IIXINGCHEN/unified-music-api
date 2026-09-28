// Package config 配置加载器
package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/spf13/viper"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// ConfigLoader 统一配置加载器接口
type ConfigLoader interface {
	// Load 加载配置
	Load(configPath string) (*Config, error)
	// LoadWithEnv 加载配置并应用环境变量
	LoadWithEnv(configPath string, env string) (*Config, error)
	// Reload 重新加载配置
	Reload() (*Config, error)
	// Watch 监听配置变化
	Watch(callback func(*Config)) error
	// Validate 验证配置
	Validate(config *Config) error
	// GetConfigPath 获取配置文件路径
	GetConfigPath() string
}

// Loader 配置加载器 - 重构为更强大的版本
type Loader struct {
	viper      *viper.Viper
	configPath string
	env        string
	logger     logger.Logger
	validator  ConfigValidator
}

// NewLoader 创建配置加载器
func NewLoader(logger logger.Logger) *Loader {
	v := viper.New()

	// 设置配置文件类型
	v.SetConfigType("yaml")

	// 设置环境变量前缀
	v.SetEnvPrefix("MUSIC_API")
	v.AutomaticEnv()

	// 设置环境变量键名替换
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	return &Loader{
		viper:     v,
		logger:    logger,
		validator: NewConfigValidator(),
	}
}

// Load 加载配置
func (l *Loader) Load(configPath string) (*Config, error) {
	return l.LoadWithEnv(configPath, "")
}

// LoadWithEnv 加载配置并应用环境变量
func (l *Loader) LoadWithEnv(configPath string, env string) (*Config, error) {
	l.configPath = configPath
	l.env = env

	// 设置配置文件路径
	if configPath != "" {
		l.viper.SetConfigFile(configPath)
	} else {
		// 默认配置文件搜索路径
		l.viper.SetConfigName("config")
		l.viper.AddConfigPath(".")
		l.viper.AddConfigPath("./configs")
		l.viper.AddConfigPath("/etc/music-api-proxy")
	}

	// 读取基础配置
	if err := l.viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("读取配置文件失败: %w", err)
		}
		// 配置文件不存在时使用默认配置和环境变量
		l.logger.Warn("配置文件未找到，使用默认配置")
	} else {
		// 生产环境不记录敏感路径信息
		if env == "development" {
			l.logger.Info("配置文件加载成功",
				logger.String("file", l.viper.ConfigFileUsed()),
				logger.String("env", env),
			)
		} else {
			l.logger.Info("配置文件加载成功")
		}
	}

	// 如果指定了环境，加载环境特定配置
	if env != "" {
		if err := l.loadEnvironmentConfig(env); err != nil {
			l.logger.Warn("加载环境配置失败",
				logger.String("env", env),
				logger.ErrorField("error", err),
			)
		}
	}

	// 解析配置到结构体
	var config Config
	if err := l.viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("解析配置失败: %w", err)
	}

	// 设置默认值
	l.setDefaults(&config)

	// 从环境变量加载敏感配置
	l.loadFromEnv(&config)

	// 验证配置
	if err := l.Validate(&config); err != nil {
		return nil, fmt.Errorf("配置验证失败: %w", err)
	}

	return &config, nil
}

// loadEnvironmentConfig 加载环境特定配置
func (l *Loader) loadEnvironmentConfig(env string) error {
	// 尝试加载环境特定配置文件
	envConfigPaths := []string{
		fmt.Sprintf("configs/environments/%s.yaml", env),
		fmt.Sprintf("configs/%s.yaml", env),
		fmt.Sprintf("%s.yaml", env),
	}

	for _, envPath := range envConfigPaths {
		if _, err := os.Stat(envPath); err == nil {
			// 创建临时viper实例加载环境配置
			envViper := viper.New()
			envViper.SetConfigFile(envPath)

			if err := envViper.ReadInConfig(); err != nil {
				continue
			}

			// 合并环境配置
			if err := l.viper.MergeConfigMap(envViper.AllSettings()); err != nil {
				return fmt.Errorf("合并环境配置失败: %w", err)
			}

			l.logger.Info("环境配置加载成功",
				logger.String("env", env),
				logger.String("file", envPath),
			)
			return nil
		}
	}

	return fmt.Errorf("未找到环境配置文件: %s", env)
}

// setDefaults 设置默认值
func (l *Loader) setDefaults(config *Config) {
	// 应用程序默认值
	if config.App.Name == "" {
		config.App.Name = "music-api-proxy"
	}
	if config.App.Version == "" {
		config.App.Version = "dev"
	}
	if config.App.Mode == "" {
		config.App.Mode = "development"
	}

	// 服务器默认值
	if config.Server.Host == "" {
		config.Server.Host = "0.0.0.0"
	}
	if config.Server.Port == 0 {
		config.Server.Port = 5678
	}
	if config.Server.ReadTimeout == 0 {
		config.Server.ReadTimeout = 30 * time.Second
	}
	if config.Server.WriteTimeout == 0 {
		config.Server.WriteTimeout = 30 * time.Second
	}
}

// loadFromEnv 从环境变量加载敏感配置
func (l *Loader) loadFromEnv(config *Config) {
	// 服务器配置
	if port := os.Getenv("PORT"); port != "" {
		l.viper.Set("server.port", port)
	}
	if domain := os.Getenv("ALLOWED_DOMAIN"); domain != "" {
		config.Server.AllowedDomain = domain
	}
	if proxyURL := os.Getenv("PROXY_URL"); proxyURL != "" {
		config.Server.ProxyURL = proxyURL
	}
	if enableFlac := os.Getenv("ENABLE_FLAC"); enableFlac != "" {
		config.Server.EnableFlac = enableFlac == "true"
	}
	
	// 安全配置
	if jwtSecret := os.Getenv("JWT_SECRET"); jwtSecret != "" {
		config.Security.JWTSecret = jwtSecret
	}
	if apiKey := os.Getenv("API_KEY"); apiKey != "" {
		config.Security.APIKey = apiKey
	}
	
	// 性能配置 - 限流配置
	if rateLimitEnabled := os.Getenv("RATE_LIMIT_ENABLED"); rateLimitEnabled != "" {
		l.viper.Set("performance.rate_limit.enabled", rateLimitEnabled == "true")
	}
	if rateLimitRPM := os.Getenv("RATE_LIMIT_REQUESTS_PER_MINUTE"); rateLimitRPM != "" {
		l.viper.Set("performance.rate_limit.requests_per_minute", rateLimitRPM)
	}
	if rateLimitBurst := os.Getenv("RATE_LIMIT_BURST"); rateLimitBurst != "" {
		l.viper.Set("performance.rate_limit.burst", rateLimitBurst)
	}
	if requestTimeout := os.Getenv("REQUEST_TIMEOUT"); requestTimeout != "" {
		l.viper.Set("performance.request_timeout", requestTimeout)
	}
	if cacheTTL := os.Getenv("CACHE_TTL"); cacheTTL != "" {
		l.viper.Set("cache.ttl", cacheTTL)
	}
	
	// 监控配置
	if metricsEnabled := os.Getenv("METRICS_ENABLED"); metricsEnabled != "" {
		l.viper.Set("monitoring.metrics.enabled", metricsEnabled == "true")
	}
	if metricsPort := os.Getenv("METRICS_PORT"); metricsPort != "" {
		l.viper.Set("monitoring.metrics.port", metricsPort)
	}
	if healthCheckEnabled := os.Getenv("HEALTH_CHECK_ENABLED"); healthCheckEnabled != "" {
		l.viper.Set("monitoring.health_check.enabled", healthCheckEnabled == "true")
	}
	
	// 第三方API配置
	if unmBaseURL := os.Getenv("UNM_SERVER_BASE_URL"); unmBaseURL != "" {
		config.Sources.UNMServer.BaseURL = unmBaseURL
	}
	if unmAPIKey := os.Getenv("UNM_SERVER_API_KEY"); unmAPIKey != "" {
		config.Sources.UNMServer.APIKey = unmAPIKey
	}
	if gdstudioBaseURL := os.Getenv("GDSTUDIO_BASE_URL"); gdstudioBaseURL != "" {
		config.Sources.GDStudio.BaseURL = gdstudioBaseURL
	}
	if gdstudioAPIKey := os.Getenv("GDSTUDIO_API_KEY"); gdstudioAPIKey != "" {
		config.Sources.GDStudio.APIKey = gdstudioAPIKey
	}
	
	// 数据库配置已移除 - 项目不再使用数据库
	
	// Redis配置已移除 - 项目不再使用Redis
	
	// 环境标识
	if goEnv := os.Getenv("GO_ENV"); goEnv != "" {
		// 根据环境调整配置
		switch goEnv {
		case "development":
			l.viper.Set("logging.level", "debug")
		case "production":
			l.viper.Set("logging.level", "info")
		}
	}
}

// Reload 重新加载配置
func (l *Loader) Reload() (*Config, error) {
	if l.configPath == "" {
		return nil, fmt.Errorf("配置路径未设置")
	}
	return l.LoadWithEnv(l.configPath, l.env)
}

// Watch 监听配置变化
func (l *Loader) Watch(callback func(*Config)) error {
	l.viper.WatchConfig()
	l.viper.OnConfigChange(func(e fsnotify.Event) {
		l.logger.Info("配置文件变化", logger.String("file", e.Name))

		if config, err := l.Reload(); err != nil {
			l.logger.Error("重新加载配置失败", logger.ErrorField("error", err))
		} else {
			callback(config)
		}
	})
	return nil
}

// Validate 验证配置
func (l *Loader) Validate(config *Config) error {
	return l.validator.Validate(config)
}

// GetConfigPath 获取配置文件路径
func (l *Loader) GetConfigPath() string {
	return l.viper.ConfigFileUsed()
}

// GetEnv 获取当前环境
func (l *Loader) GetEnv() string {
	return l.env
}

// LoadConfig 便捷函数：加载配置（保持向后兼容）
func LoadConfig() (*Config, error) {
	// 创建默认logger配置
	loggerConfig := &logger.Config{
		Level:       logger.InfoLevel,
		Format:      "text",
		OutputPaths: []string{"stdout"},
	}

	// 创建logger实例
	zapLogger, err := logger.NewZapLogger(loggerConfig)
	if err != nil {
		return nil, fmt.Errorf("创建logger失败: %w", err)
	}

	loader := NewLoader(zapLogger)
	return loader.Load("")
}
