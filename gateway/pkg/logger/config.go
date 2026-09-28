// Package logger 日志配置
package logger

import (
	"os"
	"strings"
)

// Config 日志配置结构体
type Config struct {
	Level            Level    `json:"level" yaml:"level"`                         // 日志级别
	Format           string   `json:"format" yaml:"format"`                       // 日志格式 (json/console)
	OutputPaths      []string `json:"output_paths" yaml:"output_paths"`           // 输出路径
	ErrorOutputPaths []string `json:"error_output_paths" yaml:"error_output_paths"` // 错误输出路径
	MaxSize          int      `json:"max_size" yaml:"max_size"`                   // 单个日志文件最大大小(MB)
	MaxAge           int      `json:"max_age" yaml:"max_age"`                     // 日志文件保留天数
	MaxBackups       int      `json:"max_backups" yaml:"max_backups"`             // 保留的日志文件数量
	Compress         bool     `json:"compress" yaml:"compress"`                   // 是否压缩日志文件
	EnableCaller     bool     `json:"enable_caller" yaml:"enable_caller"`         // 是否记录调用者信息
	EnableStacktrace bool     `json:"enable_stacktrace" yaml:"enable_stacktrace"` // 是否记录堆栈信息
}

// DefaultConfig 默认日志配置
func DefaultConfig() *Config {
	return &Config{
		Level:            InfoLevel,
		Format:           "json",
		OutputPaths:      []string{"stdout"},
		ErrorOutputPaths: []string{"stderr"},
		MaxSize:          100,  // 100MB
		MaxAge:           30,   // 30天
		MaxBackups:       10,   // 10个文件
		Compress:         true,
		EnableCaller:     true,
		EnableStacktrace: true,
	}
}

// DevelopmentConfig 开发环境日志配置
func DevelopmentConfig() *Config {
	return &Config{
		Level:            DebugLevel,
		Format:           "console",
		OutputPaths:      []string{"stdout"},
		ErrorOutputPaths: []string{"stderr"},
		MaxSize:          10,   // 10MB
		MaxAge:           7,    // 7天
		MaxBackups:       3,    // 3个文件
		Compress:         false,
		EnableCaller:     true,
		EnableStacktrace: true,
	}
}

// ProductionConfig 生产环境日志配置
func ProductionConfig() *Config {
	return &Config{
		Level:            InfoLevel,
		Format:           "json",
		OutputPaths:      []string{"logs/app.log"},
		ErrorOutputPaths: []string{"logs/error.log"},
		MaxSize:          100,  // 100MB
		MaxAge:           30,   // 30天
		MaxBackups:       10,   // 10个文件
		Compress:         true,
		EnableCaller:     false,
		EnableStacktrace: false,
	}
}

// LoadFromEnv 从环境变量加载配置
func (c *Config) LoadFromEnv() {
	// 日志级别
	if level := os.Getenv("LOG_LEVEL"); level != "" {
		c.Level = ParseLevel(level)
	}
	
	// 日志格式
	if format := os.Getenv("LOG_FORMAT"); format != "" {
		c.Format = format
	}
	
	// 输出路径
	if paths := os.Getenv("LOG_OUTPUT_PATHS"); paths != "" {
		c.OutputPaths = strings.Split(paths, ",")
	}
	
	// 错误输出路径
	if paths := os.Getenv("LOG_ERROR_OUTPUT_PATHS"); paths != "" {
		c.ErrorOutputPaths = strings.Split(paths, ",")
	}
}

// ParseLevel 解析日志级别字符串
func ParseLevel(level string) Level {
	switch strings.ToLower(level) {
	case "debug":
		return DebugLevel
	case "info":
		return InfoLevel
	case "warn", "warning":
		return WarnLevel
	case "error":
		return ErrorLevel
	case "fatal":
		return FatalLevel
	default:
		return InfoLevel
	}
}

// Validate 验证配置
func (c *Config) Validate() error {
	// 验证日志格式
	if c.Format != "json" && c.Format != "console" {
		c.Format = "json"
	}
	
	// 验证输出路径
	if len(c.OutputPaths) == 0 {
		c.OutputPaths = []string{"stdout"}
	}
	
	// 验证错误输出路径
	if len(c.ErrorOutputPaths) == 0 {
		c.ErrorOutputPaths = []string{"stderr"}
	}
	
	// 验证文件大小
	if c.MaxSize <= 0 {
		c.MaxSize = 100
	}
	
	// 验证保留天数
	if c.MaxAge <= 0 {
		c.MaxAge = 30
	}
	
	// 验证备份数量
	if c.MaxBackups <= 0 {
		c.MaxBackups = 10
	}
	
	return nil
}

// NewLogger 根据配置创建日志器
func NewLogger(config *Config) (Logger, error) {
	if config == nil {
		config = DefaultConfig()
	}
	
	// 验证配置
	if err := config.Validate(); err != nil {
		return nil, err
	}
	
	// 从环境变量加载配置
	config.LoadFromEnv()
	
	// 创建Zap日志器
	return NewZapLogger(config)
}

// InitDefault 初始化默认日志器
func InitDefault(config *Config) error {
	logger, err := NewLogger(config)
	if err != nil {
		return err
	}
	
	SetDefault(logger)
	return nil
}

// InitDevelopment 初始化开发环境日志器
func InitDevelopment() error {
	return InitDefault(DevelopmentConfig())
}

// InitProduction 初始化生产环境日志器
func InitProduction() error {
	return InitDefault(ProductionConfig())
}
