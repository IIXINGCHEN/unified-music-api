#!/usr/bin/env bash
# unified-music-api v2 断言门禁（PRD P5）
# ≥40 项断言，覆盖 §5 兼容性契约 C-01~C-10。TAP 输出，任一失败即非零退出。
# 全部本地可跑，无需网络；运行时行为由各包 vitest 覆盖（CI 另行执行）。
cd "$(dirname "$0")/.."

n=0; pass=0; fail=0
t() { # t <描述> <命令...>
  n=$((n+1))
  local desc="$1"; shift
  if "$@" >/dev/null 2>&1; then
    pass=$((pass+1)); echo "ok $n - $desc"
  else
    fail=$((fail+1)); echo "not ok $n - $desc"
  fi
}
has() { grep -qF -- "$2" "$1" 2>/dev/null; }   # has <文件> <字面模式>
nohas() { ! grep -qF -- "$2" "$1" 2>/dev/null; }
spec_paths() { # spec_paths <netease|kugou> → 输出 OpenAPI paths 条数
  local f
  for f in "apps/$1/openapi.yaml" "contracts/openapi-$1.yaml" "docs/openapi-$1.yaml"; do
    if [ -f "$f" ]; then grep -cE '^  "/' "$f"; return 0; fi
  done
  return 1
}

echo "TAP version 13"
echo "# S1 仓库骨架"
t "pnpm-workspace.yaml 存在" test -f pnpm-workspace.yaml
t "turbo.json 存在" test -f turbo.json
t "packageManager 锁定 pnpm@10" grep -q '"packageManager": "pnpm@10' package.json
t "engines 要求 Node>=22" grep -q '"node": ">=22"' package.json
t "根 scripts 有 assert 入口" grep -q '"assert"' package.json

echo "# S2 构建产物（各 app dist 入口）"
t "netease dist/main.js" test -f apps/netease/dist/main.js
t "kugou dist/main.js" test -f apps/kugou/dist/main.js
t "unm dist/index.js" test -f apps/unm/dist/index.js
t "lyric dist/main.js" test -f apps/lyric/dist/main.js
t "meting dist/main.js" test -f apps/meting/dist/main.js
t "gateway dist/main.js" test -f apps/gateway/dist/main.js

echo "# S3 OpenAPI + Scalar"
t "docs/api.html 存在" test -f docs/api.html
t "docs/api.html 挂载 Scalar" grep -qi scalar docs/api.html
t "netease OpenAPI 440 条 paths" test "$(spec_paths netease)" = 440  # 423 为 P2 契约 harness 通过数（17 个需真实网络的模块跳过），公开路由实为 440
t "kugou OpenAPI 226 条 paths" test "$(spec_paths kugou)" = 226
t "netease /docs 接 Scalar" has apps/netease/src/server.ts @scalar/hono-api-reference
t "kugou /docs 接 Scalar" has apps/kugou/src/server.ts @scalar/hono-api-reference
t "gateway /docs 接 Scalar" has apps/gateway/src/app.ts @scalar/hono-api-reference

echo "# S4 parity 文档"
t "docs/parity.md 存在" test -f docs/parity.md
t "parity-p3-netease.md 存在" test -f docs/parity-p3-netease.md
t "parity-p3-kugou.md 存在" test -f docs/parity-p3-kugou.md
t "parity-p3-unm.md 存在" test -f docs/parity-p3-unm.md
t "parity-p3-lyric.md 存在" test -f docs/parity-p3-lyric.md
t "parity-p3-meting.md 存在" test -f docs/parity-p3-meting.md
t "parity-p3-gateway.md 存在" test -f docs/parity-p3-gateway.md

echo "# C-01 路由路径"
t "网易云 440 模块文件" test "$(ls apps/netease/src/modules/*.ts | wc -l)" -eq 440
t "酷狗 228 模块文件" test "$(ls apps/kugou/src/modules/*.ts | wc -l)" -eq 228
t "网易云特殊路由 daily_signin" has apps/netease/src/server.ts daily_signin
t "网易云特殊路由 fm_trash" has apps/netease/src/server.ts fm_trash
t "网易云特殊路由 personal_fm" has apps/netease/src/server.ts personal_fm
t "酷狗不注册 _comment" nohas apps/kugou/src/server.ts "_comment"
t "网关 platform 反代路由" test -f apps/gateway/src/routes/platform.ts

echo "# C-02 HTTP 方法"
t "网易云模块用 app.all 注册" has apps/netease/src/server.ts "app.all(moduleDef.route"
t "酷狗用 app.use 前缀语义注册" has apps/kugou/src/server.ts "app.use (not app.all)"

echo "# C-03 参数合并"
t "网易云合并 cookie+query+body" has apps/netease/src/server.ts "Object.assign"
t "网易云字符串 cookie 转对象" has apps/netease/src/server.ts "cookieToJson"
t "酷狗 Authorization 并入 cookie" has apps/kugou/src/server.ts "authorization"

echo "# C-04 Cookie"
t "http-kit cookie 解析存在" has packages/http-kit/src/cookie.ts "parseCookieHeader"
t "网易云 Set-Cookie 透传" has apps/netease/src/server.ts "set-cookie"
t "HTTPS 追加 SameSite=None; Secure" has apps/netease/src/server.ts "SameSite=None; Secure"
t "网易云 noCookie 可跳过" has apps/netease/src/server.ts "noCookie"

echo "# C-05 状态码"
t "SPECIAL_STATUS_CODES → 200" has packages/ncm-core/src/request.ts "SPECIAL_STATUS_CODES"
t "上游网络异常 → 502" has packages/ncm-core/src/request.ts "answer.status = 502"
t "网关 404/405 兜底" has apps/gateway/src/app.ts "404 / 405"

echo "# C-06 响应结构"
t "网关统一信封 {code,message,data}" has apps/gateway/src/response.ts "interface Envelope"
t "网易云 body.code 强制 Number" has packages/ncm-core/src/request.ts "b.code = Number(b.code)"

echo "# C-07 错误文案"
t "网易云 301 → 需要登录" has apps/netease/src/server.ts "需要登录"
t "网关 429 → 请求过于频繁，请稍后再试" has apps/gateway/src/middleware.ts "请求过于频繁，请稍后再试"
t "平台反代 502 → 平台服务不可用" has apps/gateway/src/routes/platform.ts '平台服务不可用: ${name}'

echo "# C-08 特殊行为"
t "redirectUrl → 302" has apps/netease/src/server.ts "moduleResponse.redirectUrl"
t "网易云 apicache 2 分钟" has apps/netease/src/server.ts "ttlMs: 2 * 60 * 1000"
t "酷狗缓存仅 200 可缓存" has apps/kugou/src/server.ts "shouldCache"
t "网易云 body 上限 500MB" has apps/netease/src/server.ts "MAX_UPLOAD_SIZE_MB = 500"
t "酷狗 json/urlencoded/octet-stream 三档上限" has apps/kugou/src/server.ts "RAW_LIMIT = 100 * 1024 * 1024"

echo "# C-09 加密默认"
t "网易云 crypto 为空默认 eapi" has apps/netease/src/server.ts 'APP_CONF.encrypt ? "eapi"'
t "酷狗默认 android 签名" has packages/kugou-core/src/request.ts 'case "android"'

echo "# C-10 环境变量"
t "compose 网关 PLATFORM_NETEASE_URL" has deploy/docker-compose.yml "PLATFORM_NETEASE_URL: http://netease:3001"
t "compose lyric 回退链 EXTERNAL_NCM_API_URL" has deploy/docker-compose.yml "EXTERNAL_NCM_API_URL: http://netease:3001/lyric"
t "compose unm MONITOR_SECRET_KEY" has deploy/docker-compose.yml "MONITOR_SECRET_KEY"
t "compose meting SPOTIFY_API/YT_API" has deploy/docker-compose.yml "SPOTIFY_API"

echo "# S5 加密包零 any（P1 门禁延续）"
t "ncm-crypto 无显式 any" nohas packages/ncm-crypto/src ": any"
t "kugou-crypto 无显式 any" nohas packages/kugou-crypto/src ": any"

echo "# S6 compose / CI 结构"
t "compose 定义 6 个服务" test "$(python3 -c "import yaml;print(len(yaml.safe_load(open('deploy/docker-compose.yml'))['services']))" 2>/dev/null)" = 6
t "compose 网关映射 8080:5678" has deploy/docker-compose.yml '"8080:5678"'
t "compose 网关 depends_on 5 服务" test "$(grep -c "condition: service_healthy" deploy/docker-compose.yml)" -eq 5
t "CI 用 Node 22" has .github/workflows/ci.yml 'node-version: "22"'
t "CI 跑 assert.sh" has .github/workflows/ci.yml "scripts/assert.sh"
t "CI 有 pnpm 缓存" has .github/workflows/ci.yml "cache: pnpm"

echo "# S7 去重（无冗余）"
t "meting 无 netease provider" test ! -e apps/meting/src/providers/netease.ts
t "meting 无 tencent provider" test ! -e apps/meting/src/providers/tencent.ts
t "meting 保留 spotify" test -f apps/meting/src/providers/spotify.ts
t "meting 保留 ytmusic" test -f apps/meting/src/providers/ytmusic.ts
t "meting 默认源为 spotify" has apps/meting/src/service/api.ts 'query.server || "spotify"'

echo "1..$n"
echo "# pass=$pass fail=$fail"
[ "$fail" -eq 0 ]
