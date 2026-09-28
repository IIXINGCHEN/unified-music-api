// Package repository HTTP客户端实现
package repository

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// DefaultHTTPClient 默认HTTP客户端实现
type DefaultHTTPClient struct {
	client    *http.Client      // HTTP客户端
	timeout   time.Duration     // 超时时间
	userAgent string            // User-Agent
	cookie    string            // Cookie
	logger    logger.Logger     // 日志器
}

// HTTPClientConfig HTTP客户端配置
type HTTPClientConfig struct {
	UserAgent           string
	Timeout             time.Duration
	MaxIdleConns        int
	MaxIdleConnsPerHost int
	IdleConnTimeout     time.Duration
	DisableCompression  bool
}

// NewDefaultHTTPClient 创建默认HTTP客户端
func NewDefaultHTTPClient(config *HTTPClientConfig, log logger.Logger) *DefaultHTTPClient {
	if config == nil {
		config = &HTTPClientConfig{
			UserAgent:           "Music-API-Proxy-HTTPClient/dev (Linux; X86_64; go1.21)",
			Timeout:             30 * time.Second,
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 10,
			IdleConnTimeout:     90 * time.Second,
			DisableCompression:  false,
		}
	}

	client := &http.Client{
		Timeout: config.Timeout,
		Transport: &http.Transport{
			MaxIdleConns:        config.MaxIdleConns,
			MaxIdleConnsPerHost: config.MaxIdleConnsPerHost,
			IdleConnTimeout:     config.IdleConnTimeout,
			DisableCompression:  config.DisableCompression,
		},
	}

	return &DefaultHTTPClient{
		client:    client,
		timeout:   config.Timeout,
		userAgent: config.UserAgent,
		logger:    log,
	}
}

// Get 发送GET请求
func (c *DefaultHTTPClient) Get(ctx context.Context, url string, headers map[string]string) ([]byte, error) {
	return c.doRequest(ctx, "GET", url, nil, headers)
}

// Post 发送POST请求
func (c *DefaultHTTPClient) Post(ctx context.Context, url string, data []byte, headers map[string]string) ([]byte, error) {
	return c.doRequest(ctx, "POST", url, data, headers)
}

// Put 发送PUT请求
func (c *DefaultHTTPClient) Put(ctx context.Context, url string, data []byte, headers map[string]string) ([]byte, error) {
	return c.doRequest(ctx, "PUT", url, data, headers)
}

// Delete 发送DELETE请求
func (c *DefaultHTTPClient) Delete(ctx context.Context, url string, headers map[string]string) ([]byte, error) {
	return c.doRequest(ctx, "DELETE", url, nil, headers)
}

// SetTimeout 设置超时时间
func (c *DefaultHTTPClient) SetTimeout(timeout time.Duration) {
	c.timeout = timeout
	c.client.Timeout = timeout
}

// SetProxy 设置代理
func (c *DefaultHTTPClient) SetProxy(proxyURL string) error {
	if proxyURL == "" {
		// 清除代理
		transport := c.client.Transport.(*http.Transport)
		transport.Proxy = nil
		return nil
	}
	
	proxy, err := url.Parse(proxyURL)
	if err != nil {
		return fmt.Errorf("无效的代理URL: %w", err)
	}
	
	transport := c.client.Transport.(*http.Transport)
	transport.Proxy = http.ProxyURL(proxy)
	
	c.logger.Info("设置HTTP代理", logger.String("proxy", proxyURL))
	return nil
}

// SetUserAgent 设置User-Agent
func (c *DefaultHTTPClient) SetUserAgent(userAgent string) {
	c.userAgent = userAgent
}

// SetCookie 设置Cookie
func (c *DefaultHTTPClient) SetCookie(cookie string) {
	c.cookie = cookie
}

// doRequest 执行HTTP请求
func (c *DefaultHTTPClient) doRequest(ctx context.Context, method, url string, data []byte, headers map[string]string) ([]byte, error) {
	// 创建请求
	var body io.Reader
	if data != nil {
		body = bytes.NewReader(data)
	}
	
	req, err := http.NewRequestWithContext(ctx, method, url, body)
	if err != nil {
		return nil, fmt.Errorf("创建HTTP请求失败: %w", err)
	}
	
	// 设置默认请求头
	req.Header.Set("User-Agent", c.userAgent)
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
	req.Header.Set("Accept-Encoding", "gzip, deflate, br")
	req.Header.Set("Connection", "keep-alive")
	
	// 设置Cookie
	if c.cookie != "" {
		req.Header.Set("Cookie", c.cookie)
	}
	
	// 设置自定义请求头
	for key, value := range headers {
		req.Header.Set(key, value)
	}
	
	// 记录请求日志
	c.logger.Debug("发送HTTP请求",
		logger.String("method", method),
		logger.String("url", url),
		logger.Int("body_size", len(data)),
	)
	
	start := time.Now()
	
	// 发送请求
	resp, err := c.client.Do(req)
	if err != nil {
		c.logger.Error("HTTP请求失败",
			logger.String("method", method),
			logger.String("url", url),
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		return nil, fmt.Errorf("HTTP请求失败: %w", err)
	}
	defer resp.Body.Close()
	
	// 读取响应体
	responseData, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("读取HTTP响应失败",
			logger.String("method", method),
			logger.String("url", url),
			logger.Int("status_code", resp.StatusCode),
			logger.String("duration", time.Since(start).String()),
			logger.ErrorField("error", err),
		)
		return nil, fmt.Errorf("读取HTTP响应失败: %w", err)
	}
	
	// 检查HTTP状态码
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		c.logger.Warn("HTTP请求返回错误状态码",
			logger.String("method", method),
			logger.String("url", url),
			logger.Int("status_code", resp.StatusCode),
			logger.String("status", resp.Status),
			logger.String("duration", time.Since(start).String()),
			logger.Int("response_size", len(responseData)),
		)
		return nil, fmt.Errorf("HTTP请求失败，状态码: %d, 响应: %s", resp.StatusCode, string(responseData))
	}
	
	// 记录成功日志
	c.logger.Debug("HTTP请求成功",
		logger.String("method", method),
		logger.String("url", url),
		logger.Int("status_code", resp.StatusCode),
		logger.String("duration", time.Since(start).String()),
		logger.Int("response_size", len(responseData)),
	)
	
	return responseData, nil
}

// RetryHTTPClient 带重试功能的HTTP客户端
type RetryHTTPClient struct {
	*DefaultHTTPClient
	maxRetries int           // 最大重试次数
	retryDelay time.Duration // 重试延迟
}

// NewRetryHTTPClient 创建带重试功能的HTTP客户端
func NewRetryHTTPClient(config *HTTPClientConfig, maxRetries int, retryDelay time.Duration, log logger.Logger) *RetryHTTPClient {
	return &RetryHTTPClient{
		DefaultHTTPClient: NewDefaultHTTPClient(config, log),
		maxRetries:        maxRetries,
		retryDelay:        retryDelay,
	}
}

// Get 发送GET请求（带重试）
func (c *RetryHTTPClient) Get(ctx context.Context, url string, headers map[string]string) ([]byte, error) {
	return c.doRequestWithRetry(ctx, "GET", url, nil, headers)
}

// Post 发送POST请求（带重试）
func (c *RetryHTTPClient) Post(ctx context.Context, url string, data []byte, headers map[string]string) ([]byte, error) {
	return c.doRequestWithRetry(ctx, "POST", url, data, headers)
}

// Put 发送PUT请求（带重试）
func (c *RetryHTTPClient) Put(ctx context.Context, url string, data []byte, headers map[string]string) ([]byte, error) {
	return c.doRequestWithRetry(ctx, "PUT", url, data, headers)
}

// Delete 发送DELETE请求（带重试）
func (c *RetryHTTPClient) Delete(ctx context.Context, url string, headers map[string]string) ([]byte, error) {
	return c.doRequestWithRetry(ctx, "DELETE", url, nil, headers)
}

// doRequestWithRetry 执行带重试的HTTP请求
func (c *RetryHTTPClient) doRequestWithRetry(ctx context.Context, method, url string, data []byte, headers map[string]string) ([]byte, error) {
	var lastErr error
	
	for attempt := 0; attempt <= c.maxRetries; attempt++ {
		if attempt > 0 {
			// 等待重试延迟
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(c.retryDelay * time.Duration(attempt)):
			}
			
			c.logger.Debug("HTTP请求重试",
				logger.String("method", method),
				logger.String("url", url),
				logger.Int("attempt", attempt),
				logger.Int("max_retries", c.maxRetries),
			)
		}
		
		response, err := c.DefaultHTTPClient.doRequest(ctx, method, url, data, headers)
		if err == nil {
			return response, nil
		}
		
		lastErr = err
		
		// 检查是否应该重试
		if !c.shouldRetry(err) {
			break
		}
		
		// 检查上下文是否已取消
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}
	}
	
	return nil, fmt.Errorf("HTTP请求重试 %d 次后仍然失败: %w", c.maxRetries, lastErr)
}

// shouldRetry 判断是否应该重试
func (c *RetryHTTPClient) shouldRetry(err error) bool {
	if err == nil {
		return false
	}
	
	errStr := err.Error()
	
	// 网络相关错误应该重试
	if strings.Contains(errStr, "timeout") ||
		strings.Contains(errStr, "connection refused") ||
		strings.Contains(errStr, "connection reset") ||
		strings.Contains(errStr, "no such host") ||
		strings.Contains(errStr, "temporary failure") {
		return true
	}
	
	// HTTP 5xx 错误应该重试
	if strings.Contains(errStr, "状态码: 5") {
		return true
	}
	
	// HTTP 429 (Too Many Requests) 应该重试
	if strings.Contains(errStr, "状态码: 429") {
		return true
	}
	
	return false
}


