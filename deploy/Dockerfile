# syntax=docker/dockerfile:1
# unified-music-api v2 — 单一参数化多阶段 Dockerfile，覆盖 6 个 TS/Hono 应用。
#
# 构建示例（context 必须为仓库根）：
#   docker build -f deploy/Dockerfile \
#     --build-arg APP=netease --build-arg PKG=@music-api/netease \
#     --build-arg PORT=3001 --build-arg ENTRY=main.js \
#     -t unified-music-api/netease:2.0 .
#
# 各服务参数见 deploy/docker-compose.yml。
ARG APP=netease
ARG PKG=@music-api/netease
ARG PORT=3001
ARG ENTRY=main.js

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate

# ---- 依赖安装层（利用缓存：仅当 workspace 清单变化时重跑） ----
# 注意：Docker COPY 通配符按 basename 扁平化拷贝，多个 package.json 会冲突，
# 因此 workspace 成员清单必须逐行显式列出。
FROM base AS deps
WORKDIR /repo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/netease/package.json apps/netease/package.json
COPY apps/kugou/package.json apps/kugou/package.json
COPY apps/unm/package.json apps/unm/package.json
COPY apps/lyric/package.json apps/lyric/package.json
COPY apps/meting/package.json apps/meting/package.json
COPY apps/gateway/package.json apps/gateway/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/http-kit/package.json packages/http-kit/package.json
COPY packages/kugou-core/package.json packages/kugou-core/package.json
COPY packages/kugou-crypto/package.json packages/kugou-crypto/package.json
COPY packages/ncm-core/package.json packages/ncm-core/package.json
COPY packages/ncm-crypto/package.json packages/ncm-crypto/package.json
RUN pnpm install --frozen-lockfile

# ---- 构建层 ----
FROM deps AS build
ARG APP
ARG PKG
COPY . .
RUN pnpm --filter ${PKG} build
# pnpm deploy 生成自包含的 production 目录（含 prod node_modules + package.json）
RUN pnpm --filter ${PKG} --prod deploy /deploy
# deploy 不带 gitignored 的 dist，手动补上
RUN cp -r /repo/apps/${APP}/dist /deploy/dist

# ---- 运行层 ----
FROM node:22-slim AS runner
ARG PORT
ARG ENTRY
WORKDIR /srv
COPY --from=build /deploy/ ./
ENV NODE_ENV=production
ENV ENTRY=${ENTRY}
EXPOSE ${PORT}
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||'3001')+'/health').then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"
CMD ["sh", "-c", "exec node dist/$ENTRY"]
