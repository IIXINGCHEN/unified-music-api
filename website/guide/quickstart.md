# 快速开始

> 更新时间：2026-09-28

## 1. 环境要求

- Node.js 22 LTS
- pnpm 10+

## 2. 安装

```bash
git clone https://github.com/IIXINGCHEN/unified-music-api
cd unified-music-api
pnpm install
```

## 3. 启动

```bash
# 全部服务（网关 8080 / 网易云 3001 / 酷狗 3002 / UNM 3003 / Lyric 3004 / Meting 3005）
pnpm dev
```

## 4. 验证

```bash
# 网关健康检查
curl http://localhost:8080/health

# 经网关调用网易云搜索
curl "http://localhost:8080/api/v1/platform/netease/search?keywords=周杰伦&limit=5"

# 直连网易云服务
curl "http://localhost:3001/search?keywords=周杰伦&limit=5"
```

## 5. 下一步

- [统一路由](/guide/routing)：经网关调用各平台的方式
- [API 文档](/api/)：全部接口参数表
