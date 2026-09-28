# Music API Proxy Dockerfile
# 多阶段构建，优化镜像大小和安全性

# 构建阶段
FROM golang:1.24-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装必要的工具
RUN apk add --no-cache git ca-certificates tzdata

# 复制go mod文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o music-api-proxy \
    ./cmd/music-api-proxy

# 运行阶段
FROM alpine:3.18

# 安装运行时依赖
RUN apk --no-cache add ca-certificates tzdata curl

# 创建非root用户
RUN addgroup -g 1001 -S musicproxy && \
    adduser -u 1001 -S musicproxy -G musicproxy

# 设置工作目录
WORKDIR /app

# 从构建阶段复制二进制文件
COPY --from=builder /app/music-api-proxy .

# 复制配置文件
COPY --from=builder /app/config.yaml ./config/

# 创建必要的目录
RUN mkdir -p logs data cache && \
    chown -R musicproxy:musicproxy /app

# 切换到非root用户
USER musicproxy

# 暴露端口
EXPOSE 5678

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5678/health || exit 1

# 设置环境变量
ENV MUSIC_PROXY_ENV=production
ENV MUSIC_PROXY_CONFIG_FILE=/app/config/config.yaml

# 启动命令
CMD ["./music-api-proxy"]
