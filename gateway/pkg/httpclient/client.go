// Package httpclient 提供HTTP客户端功能
package httpclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// Client HTTP客户端接口
type Client interface {
	Get(ctx context.Context, url string, headers map[string]string) (*Response, error)
	Post(ctx context.Context, url string, body interface{}, headers map[string]string) (*Response, error)
	Put(ctx context.Context, url string, body interface{}, headers map[string]string) (*Response, error)
	Delete(ctx context.Context, url string, headers map[string]string) (*Response, error)
	Do(ctx context.Context, req *Request) (*Response, error)
}

// HTTPClient HTTP客户端实现
type HTTPClient struct {
	client  *http.Client
	logger  logger.Logger
	baseURL string
	headers map[string]string
}

// Config HTTP客户端配置
type Config struct {
	Timeout         time.Duration     `json:"timeout" yaml:"timeout"`
	MaxIdleConns    int               `json:"max_idle_conns" yaml:"max_idle_conns"`
	MaxConnsPerHost int               `json:"max_conns_per_host" yaml:"max_conns_per_host"`
	BaseURL         string            `json:"base_url" yaml:"base_url"`
	DefaultHeaders  map[string]string `json:"default_headers" yaml:"default_headers"`
	ProxyURL        string            `json:"proxy_url" yaml:"proxy_url"`
	InsecureSkipVerify bool           `json:"insecure_skip_verify" yaml:"insecure_skip_verify"`
}

// Request HTTP请求结构体
type Request struct {
	Method  string            `json:"method"`
	URL     string            `json:"url"`
	Headers map[string]string `json:"headers"`
	Body    interface{}       `json:"body"`
	Timeout time.Duration     `json:"timeout"`
}

// Response HTTP响应结构体
type Response struct {
	StatusCode int               `json:"status_code"`
	Headers    map[string]string `json:"headers"`
	Body       []byte            `json:"body"`
	Duration   time.Duration     `json:"duration"`
}

// NewHTTPClient 创建HTTP客户端
func NewHTTPClient(config *Config, log logger.Logger) *HTTPClient {
	if config == nil {
		panic("HTTP客户端配置不能为空，必须从配置文件加载")
	}

	// 创建HTTP传输
	transport := &http.Transport{
		MaxIdleConns:        config.MaxIdleConns,
		MaxIdleConnsPerHost: config.MaxConnsPerHost,
		IdleConnTimeout:     30 * time.Second,
		DisableCompression:  false,
	}

	// 设置代理
	if config.ProxyURL != "" {
		if proxyURL, err := url.Parse(config.ProxyURL); err == nil {
			transport.Proxy = http.ProxyURL(proxyURL)
		}
	}

	// 创建HTTP客户端
	client := &http.Client{
		Transport: transport,
		Timeout:   config.Timeout,
	}

	return &HTTPClient{
		client:  client,
		logger:  log,
		baseURL: config.BaseURL,
		headers: config.DefaultHeaders,
	}
}



// Get 发送GET请求
func (c *HTTPClient) Get(ctx context.Context, url string, headers map[string]string) (*Response, error) {
	req := &Request{
		Method:  "GET",
		URL:     url,
		Headers: headers,
	}
	return c.Do(ctx, req)
}

// Post 发送POST请求
func (c *HTTPClient) Post(ctx context.Context, url string, body interface{}, headers map[string]string) (*Response, error) {
	req := &Request{
		Method:  "POST",
		URL:     url,
		Headers: headers,
		Body:    body,
	}
	return c.Do(ctx, req)
}

// Put 发送PUT请求
func (c *HTTPClient) Put(ctx context.Context, url string, body interface{}, headers map[string]string) (*Response, error) {
	req := &Request{
		Method:  "PUT",
		URL:     url,
		Headers: headers,
		Body:    body,
	}
	return c.Do(ctx, req)
}

// Delete 发送DELETE请求
func (c *HTTPClient) Delete(ctx context.Context, url string, headers map[string]string) (*Response, error) {
	req := &Request{
		Method:  "DELETE",
		URL:     url,
		Headers: headers,
	}
	return c.Do(ctx, req)
}

// Do 执行HTTP请求
func (c *HTTPClient) Do(ctx context.Context, req *Request) (*Response, error) {
	start := time.Now()

	// 构建完整URL
	fullURL := c.buildURL(req.URL)

	// 准备请求体
	var bodyReader io.Reader
	if req.Body != nil {
		bodyBytes, err := c.marshalBody(req.Body)
		if err != nil {
			return nil, fmt.Errorf("序列化请求体失败: %w", err)
		}
		bodyReader = bytes.NewReader(bodyBytes)
	}

	// 创建HTTP请求
	httpReq, err := http.NewRequestWithContext(ctx, req.Method, fullURL, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("创建HTTP请求失败: %w", err)
	}

	// 设置请求头
	c.setHeaders(httpReq, req.Headers)

	// 记录请求日志
	c.logger.Debug("发送HTTP请求",
		logger.String("method", req.Method),
		logger.String("url", fullURL),
		logger.Any("headers", httpReq.Header),
	)

	// 发送请求
	httpResp, err := c.client.Do(httpReq)
	if err != nil {
		duration := time.Since(start)
		c.logger.Error("HTTP请求失败",
			logger.String("method", req.Method),
			logger.String("url", fullURL),
			logger.String("error", err.Error()),
			logger.String("duration", duration.String()),
		)
		return nil, fmt.Errorf("HTTP请求失败: %w", err)
	}
	defer httpResp.Body.Close()

	// 读取响应体
	respBody, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应体失败: %w", err)
	}

	duration := time.Since(start)

	// 构建响应
	response := &Response{
		StatusCode: httpResp.StatusCode,
		Headers:    c.extractHeaders(httpResp.Header),
		Body:       respBody,
		Duration:   duration,
	}

	// 记录响应日志
	c.logger.Debug("收到HTTP响应",
		logger.String("method", req.Method),
		logger.String("url", fullURL),
		logger.Int("status_code", httpResp.StatusCode),
		logger.String("duration", duration.String()),
		logger.Int("body_size", len(respBody)),
	)

	return response, nil
}

// buildURL 构建完整URL
func (c *HTTPClient) buildURL(path string) string {
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") {
		return path
	}

	if c.baseURL == "" {
		return path
	}

	baseURL := strings.TrimRight(c.baseURL, "/")
	path = strings.TrimLeft(path, "/")
	return fmt.Sprintf("%s/%s", baseURL, path)
}

// marshalBody 序列化请求体
func (c *HTTPClient) marshalBody(body interface{}) ([]byte, error) {
	switch v := body.(type) {
	case []byte:
		return v, nil
	case string:
		return []byte(v), nil
	case io.Reader:
		return io.ReadAll(v)
	default:
		return json.Marshal(v)
	}
}

// setHeaders 设置请求头
func (c *HTTPClient) setHeaders(req *http.Request, headers map[string]string) {
	// 设置默认头
	for key, value := range c.headers {
		req.Header.Set(key, value)
	}

	// 设置请求特定头
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	// 如果有请求体且没有设置Content-Type，设置默认值
	if req.Body != nil && req.Header.Get("Content-Type") == "" {
		req.Header.Set("Content-Type", "application/json")
	}
}

// extractHeaders 提取响应头
func (c *HTTPClient) extractHeaders(headers http.Header) map[string]string {
	result := make(map[string]string)
	for key, values := range headers {
		if len(values) > 0 {
			result[key] = values[0]
		}
	}
	return result
}

// JSON 解析JSON响应
func (r *Response) JSON(v interface{}) error {
	return json.Unmarshal(r.Body, v)
}

// String 获取响应体字符串
func (r *Response) String() string {
	return string(r.Body)
}

// IsSuccess 检查是否成功响应
func (r *Response) IsSuccess() bool {
	return r.StatusCode >= 200 && r.StatusCode < 300
}

// IsClientError 检查是否客户端错误
func (r *Response) IsClientError() bool {
	return r.StatusCode >= 400 && r.StatusCode < 500
}

// IsServerError 检查是否服务器错误
func (r *Response) IsServerError() bool {
	return r.StatusCode >= 500
}
