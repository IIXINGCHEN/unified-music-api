// Package repository 限流器实现
package repository

import (
	"context"
	"sync"
	"time"

	"github.com/IIXINGCHEN/unified-music-api/gateway/pkg/logger"
)

// TokenBucket 令牌桶
type TokenBucket struct {
	capacity     int64     // 桶容量
	tokens       int64     // 当前令牌数
	refillRate   int64     // 每秒补充令牌数
	lastRefill   time.Time // 上次补充时间
	mu           sync.Mutex // 互斥锁
}

// NewTokenBucket 创建令牌桶
func NewTokenBucket(capacity, refillRate int64) *TokenBucket {
	return &TokenBucket{
		capacity:   capacity,
		tokens:     capacity,
		refillRate: refillRate,
		lastRefill: time.Now(),
	}
}

// Allow 检查是否允许请求
func (tb *TokenBucket) Allow() bool {
	tb.mu.Lock()
	defer tb.mu.Unlock()
	
	tb.refill()
	
	if tb.tokens > 0 {
		tb.tokens--
		return true
	}
	
	return false
}

// Wait 等待直到有可用令牌
func (tb *TokenBucket) Wait(ctx context.Context) error {
	for {
		if tb.Allow() {
			return nil
		}
		
		// 计算等待时间
		waitTime := time.Second / time.Duration(tb.refillRate)
		
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(waitTime):
			continue
		}
	}
}

// GetRemaining 获取剩余令牌数
func (tb *TokenBucket) GetRemaining() int64 {
	tb.mu.Lock()
	defer tb.mu.Unlock()
	
	tb.refill()
	return tb.tokens
}

// GetResetTime 获取下次重置时间
func (tb *TokenBucket) GetResetTime() time.Time {
	tb.mu.Lock()
	defer tb.mu.Unlock()
	
	if tb.tokens >= tb.capacity {
		return time.Now()
	}
	
	tokensNeeded := tb.capacity - tb.tokens
	resetDuration := time.Duration(tokensNeeded) * time.Second / time.Duration(tb.refillRate)
	return time.Now().Add(resetDuration)
}

// refill 补充令牌
func (tb *TokenBucket) refill() {
	now := time.Now()
	elapsed := now.Sub(tb.lastRefill)
	
	tokensToAdd := int64(elapsed.Seconds()) * tb.refillRate
	if tokensToAdd > 0 {
		tb.tokens = min(tb.capacity, tb.tokens+tokensToAdd)
		tb.lastRefill = now
	}
}

// min 返回两个数的最小值
func min(a, b int64) int64 {
	if a < b {
		return a
	}
	return b
}

// MemoryRateLimiter 内存限流器实现
type MemoryRateLimiter struct {
	buckets map[string]*TokenBucket // 令牌桶映射
	mu      sync.RWMutex            // 读写锁
	logger  logger.Logger           // 日志器
	
	// 默认配置
	defaultCapacity   int64 // 默认桶容量
	defaultRefillRate int64 // 默认补充速率
}

// NewMemoryRateLimiter 创建内存限流器
func NewMemoryRateLimiter(defaultCapacity, defaultRefillRate int64, log logger.Logger) *MemoryRateLimiter {
	limiter := &MemoryRateLimiter{
		buckets:           make(map[string]*TokenBucket),
		logger:            log,
		defaultCapacity:   defaultCapacity,
		defaultRefillRate: defaultRefillRate,
	}
	
	// 启动清理协程
	go limiter.startCleanup()
	
	return limiter
}

// Allow 检查是否允许请求
func (rl *MemoryRateLimiter) Allow(ctx context.Context, key string) (bool, error) {
	bucket := rl.getBucket(key)
	allowed := bucket.Allow()
	
	if !allowed {
		rl.logger.Debug("请求被限流",
			logger.String("key", key),
			logger.Int64("remaining", bucket.GetRemaining()),
		)
	}
	
	return allowed, nil
}

// Wait 等待直到允许请求
func (rl *MemoryRateLimiter) Wait(ctx context.Context, key string) error {
	bucket := rl.getBucket(key)
	return bucket.Wait(ctx)
}

// Reset 重置限流计数
func (rl *MemoryRateLimiter) Reset(ctx context.Context, key string) error {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	
	if bucket, exists := rl.buckets[key]; exists {
		bucket.mu.Lock()
		bucket.tokens = bucket.capacity
		bucket.lastRefill = time.Now()
		bucket.mu.Unlock()
		
		rl.logger.Debug("重置限流计数", logger.String("key", key))
	}
	
	return nil
}

// GetRemaining 获取剩余请求数
func (rl *MemoryRateLimiter) GetRemaining(ctx context.Context, key string) (int, error) {
	bucket := rl.getBucket(key)
	return int(bucket.GetRemaining()), nil
}

// GetResetTime 获取重置时间
func (rl *MemoryRateLimiter) GetResetTime(ctx context.Context, key string) (time.Time, error) {
	bucket := rl.getBucket(key)
	return bucket.GetResetTime(), nil
}

// getBucket 获取或创建令牌桶
func (rl *MemoryRateLimiter) getBucket(key string) *TokenBucket {
	rl.mu.RLock()
	bucket, exists := rl.buckets[key]
	rl.mu.RUnlock()
	
	if exists {
		return bucket
	}
	
	rl.mu.Lock()
	defer rl.mu.Unlock()
	
	// 双重检查
	if bucket, exists := rl.buckets[key]; exists {
		return bucket
	}
	
	// 创建新的令牌桶
	bucket = NewTokenBucket(rl.defaultCapacity, rl.defaultRefillRate)
	rl.buckets[key] = bucket
	
	rl.logger.Debug("创建新的限流桶",
		logger.String("key", key),
		logger.Int64("capacity", rl.defaultCapacity),
		logger.Int64("refill_rate", rl.defaultRefillRate),
	)
	
	return bucket
}

// startCleanup 启动清理协程
func (rl *MemoryRateLimiter) startCleanup() {
	ticker := time.NewTicker(10 * time.Minute) // 每10分钟清理一次
	defer ticker.Stop()
	
	for range ticker.C {
		rl.cleanup()
	}
}

// cleanup 清理不活跃的令牌桶
func (rl *MemoryRateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	
	now := time.Now()
	inactiveKeys := make([]string, 0)
	
	for key, bucket := range rl.buckets {
		bucket.mu.Lock()
		// 如果令牌桶已满且超过1小时未使用，则删除
		if bucket.tokens >= bucket.capacity && now.Sub(bucket.lastRefill) > time.Hour {
			inactiveKeys = append(inactiveKeys, key)
		}
		bucket.mu.Unlock()
	}
	
	for _, key := range inactiveKeys {
		delete(rl.buckets, key)
	}
	
	if len(inactiveKeys) > 0 {
		rl.logger.Debug("清理不活跃的限流桶",
			logger.Int("cleaned_count", len(inactiveKeys)),
			logger.Int("remaining_count", len(rl.buckets)),
		)
	}
}

// SlidingWindowRateLimiter 滑动窗口限流器
type SlidingWindowRateLimiter struct {
	windows map[string]*SlidingWindow // 滑动窗口映射
	mu      sync.RWMutex              // 读写锁
	logger  logger.Logger             // 日志器
	
	windowSize time.Duration // 窗口大小
	maxRequests int64        // 最大请求数
}

// SlidingWindow 滑动窗口
type SlidingWindow struct {
	requests  []time.Time   // 请求时间戳
	mu        sync.Mutex    // 互斥锁
	windowSize time.Duration // 窗口大小
	maxRequests int64        // 最大请求数
}

// NewSlidingWindowRateLimiter 创建滑动窗口限流器
func NewSlidingWindowRateLimiter(windowSize time.Duration, maxRequests int64, log logger.Logger) *SlidingWindowRateLimiter {
	return &SlidingWindowRateLimiter{
		windows:     make(map[string]*SlidingWindow),
		logger:      log,
		windowSize:  windowSize,
		maxRequests: maxRequests,
	}
}

// Allow 检查是否允许请求
func (rl *SlidingWindowRateLimiter) Allow(ctx context.Context, key string) (bool, error) {
	window := rl.getWindow(key)
	return window.Allow(), nil
}

// Wait 等待直到允许请求
func (rl *SlidingWindowRateLimiter) Wait(ctx context.Context, key string) error {
	for {
		if allowed, _ := rl.Allow(ctx, key); allowed {
			return nil
		}
		
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(100 * time.Millisecond):
			continue
		}
	}
}

// Reset 重置限流计数
func (rl *SlidingWindowRateLimiter) Reset(ctx context.Context, key string) error {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	
	if window, exists := rl.windows[key]; exists {
		window.mu.Lock()
		window.requests = window.requests[:0]
		window.mu.Unlock()
		
		rl.logger.Debug("重置滑动窗口", logger.String("key", key))
	}
	
	return nil
}

// GetRemaining 获取剩余请求数
func (rl *SlidingWindowRateLimiter) GetRemaining(ctx context.Context, key string) (int, error) {
	window := rl.getWindow(key)
	return int(window.GetRemaining()), nil
}

// GetResetTime 获取重置时间
func (rl *SlidingWindowRateLimiter) GetResetTime(ctx context.Context, key string) (time.Time, error) {
	window := rl.getWindow(key)
	return window.GetResetTime(), nil
}

// getWindow 获取或创建滑动窗口
func (rl *SlidingWindowRateLimiter) getWindow(key string) *SlidingWindow {
	rl.mu.RLock()
	window, exists := rl.windows[key]
	rl.mu.RUnlock()
	
	if exists {
		return window
	}
	
	rl.mu.Lock()
	defer rl.mu.Unlock()
	
	// 双重检查
	if window, exists := rl.windows[key]; exists {
		return window
	}
	
	// 创建新的滑动窗口
	window = &SlidingWindow{
		requests:    make([]time.Time, 0),
		windowSize:  rl.windowSize,
		maxRequests: rl.maxRequests,
	}
	rl.windows[key] = window
	
	return window
}

// Allow 检查是否允许请求
func (sw *SlidingWindow) Allow() bool {
	sw.mu.Lock()
	defer sw.mu.Unlock()
	
	now := time.Now()
	
	// 清理过期请求
	sw.cleanup(now)
	
	// 检查是否超过限制
	if int64(len(sw.requests)) >= sw.maxRequests {
		return false
	}
	
	// 添加当前请求
	sw.requests = append(sw.requests, now)
	return true
}

// GetRemaining 获取剩余请求数
func (sw *SlidingWindow) GetRemaining() int64 {
	sw.mu.Lock()
	defer sw.mu.Unlock()
	
	sw.cleanup(time.Now())
	return sw.maxRequests - int64(len(sw.requests))
}

// GetResetTime 获取重置时间
func (sw *SlidingWindow) GetResetTime() time.Time {
	sw.mu.Lock()
	defer sw.mu.Unlock()
	
	if len(sw.requests) == 0 {
		return time.Now()
	}
	
	return sw.requests[0].Add(sw.windowSize)
}

// cleanup 清理过期请求
func (sw *SlidingWindow) cleanup(now time.Time) {
	cutoff := now.Add(-sw.windowSize)
	
	// 找到第一个未过期的请求
	i := 0
	for i < len(sw.requests) && sw.requests[i].Before(cutoff) {
		i++
	}
	
	// 移除过期请求
	if i > 0 {
		sw.requests = sw.requests[i:]
	}
}
