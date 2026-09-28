// Package logger Zap日志实现
package logger

import (
	"context"
	"fmt"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// ZapLogger Zap日志器实现
type ZapLogger struct {
	logger *zap.Logger
	level  Level
}

// NewZapLogger 创建Zap日志器
func NewZapLogger(config *Config) (*ZapLogger, error) {
	zapConfig := zap.NewProductionConfig()
	
	// 设置日志级别
	zapConfig.Level = zap.NewAtomicLevelAt(toZapLevel(config.Level))
	
	// 设置编码器配置
	zapConfig.EncoderConfig = zapcore.EncoderConfig{
		TimeKey:        "timestamp",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		MessageKey:     "message",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.LowercaseLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}
	
	// 设置输出格式
	if config.Format == "json" {
		zapConfig.Encoding = "json"
	} else {
		zapConfig.Encoding = "console"
		zapConfig.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}
	
	// 设置输出路径
	if len(config.OutputPaths) > 0 {
		zapConfig.OutputPaths = config.OutputPaths
	}
	
	// 设置错误输出路径
	if len(config.ErrorOutputPaths) > 0 {
		zapConfig.ErrorOutputPaths = config.ErrorOutputPaths
	}
	
	// 构建日志器
	zapLogger, err := zapConfig.Build(
		zap.AddCaller(),
		zap.AddCallerSkip(1),
		zap.AddStacktrace(zapcore.ErrorLevel),
	)
	if err != nil {
		return nil, fmt.Errorf("创建zap日志器失败: %w", err)
	}
	
	return &ZapLogger{
		logger: zapLogger,
		level:  config.Level,
	}, nil
}

// toZapLevel 转换日志级别
func toZapLevel(level Level) zapcore.Level {
	switch level {
	case DebugLevel:
		return zapcore.DebugLevel
	case InfoLevel:
		return zapcore.InfoLevel
	case WarnLevel:
		return zapcore.WarnLevel
	case ErrorLevel:
		return zapcore.ErrorLevel
	case FatalLevel:
		return zapcore.FatalLevel
	default:
		return zapcore.InfoLevel
	}
}

// fieldsToZap 转换字段为zap字段
func fieldsToZap(fields []Field) []zap.Field {
	zapFields := make([]zap.Field, len(fields))
	for i, field := range fields {
		zapFields[i] = zap.Any(field.Key, field.Value)
	}
	return zapFields
}

// Debug 调试日志
func (l *ZapLogger) Debug(msg string, fields ...Field) {
	l.logger.Debug(msg, fieldsToZap(fields)...)
}

// Info 信息日志
func (l *ZapLogger) Info(msg string, fields ...Field) {
	l.logger.Info(msg, fieldsToZap(fields)...)
}

// Warn 警告日志
func (l *ZapLogger) Warn(msg string, fields ...Field) {
	l.logger.Warn(msg, fieldsToZap(fields)...)
}

// Error 错误日志
func (l *ZapLogger) Error(msg string, fields ...Field) {
	l.logger.Error(msg, fieldsToZap(fields)...)
}

// Fatal 致命错误日志
func (l *ZapLogger) Fatal(msg string, fields ...Field) {
	l.logger.Fatal(msg, fieldsToZap(fields)...)
}

// DebugContext 带上下文的调试日志
func (l *ZapLogger) DebugContext(ctx context.Context, msg string, fields ...Field) {
	l.logger.Debug(msg, fieldsToZap(fields)...)
}

// InfoContext 带上下文的信息日志
func (l *ZapLogger) InfoContext(ctx context.Context, msg string, fields ...Field) {
	l.logger.Info(msg, fieldsToZap(fields)...)
}

// WarnContext 带上下文的警告日志
func (l *ZapLogger) WarnContext(ctx context.Context, msg string, fields ...Field) {
	l.logger.Warn(msg, fieldsToZap(fields)...)
}

// ErrorContext 带上下文的错误日志
func (l *ZapLogger) ErrorContext(ctx context.Context, msg string, fields ...Field) {
	l.logger.Error(msg, fieldsToZap(fields)...)
}

// FatalContext 带上下文的致命错误日志
func (l *ZapLogger) FatalContext(ctx context.Context, msg string, fields ...Field) {
	l.logger.Fatal(msg, fieldsToZap(fields)...)
}

// Debugf 格式化调试日志
func (l *ZapLogger) Debugf(format string, args ...interface{}) {
	l.logger.Debug(fmt.Sprintf(format, args...))
}

// Infof 格式化信息日志
func (l *ZapLogger) Infof(format string, args ...interface{}) {
	l.logger.Info(fmt.Sprintf(format, args...))
}

// Warnf 格式化警告日志
func (l *ZapLogger) Warnf(format string, args ...interface{}) {
	l.logger.Warn(fmt.Sprintf(format, args...))
}

// Errorf 格式化错误日志
func (l *ZapLogger) Errorf(format string, args ...interface{}) {
	l.logger.Error(fmt.Sprintf(format, args...))
}

// Fatalf 格式化致命错误日志
func (l *ZapLogger) Fatalf(format string, args ...interface{}) {
	l.logger.Fatal(fmt.Sprintf(format, args...))
}

// SetLevel 设置日志级别
func (l *ZapLogger) SetLevel(level Level) {
	l.level = level
}

// GetLevel 获取日志级别
func (l *ZapLogger) GetLevel() Level {
	return l.level
}

// With 创建带字段的子日志器
func (l *ZapLogger) With(fields ...Field) Logger {
	return &ZapLogger{
		logger: l.logger.With(fieldsToZap(fields)...),
		level:  l.level,
	}
}

// WithContext 创建带上下文的子日志器
func (l *ZapLogger) WithContext(ctx context.Context) Logger {
	// 这里可以从context中提取trace_id等信息
	return l
}

// Sync 同步日志缓冲区
func (l *ZapLogger) Sync() error {
	return l.logger.Sync()
}
