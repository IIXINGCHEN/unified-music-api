#!/usr/bin/env bash
# unified-music-api 仓库断言门禁（静态）
# 目标：功能完整性（无冗余、无缺失）+ 结构契约。全部通过才算绿。
set -euo pipefail
cd "$(dirname "$0")/.."

pass=0; fail=0
ok()   { pass=$((pass+1)); echo "  ✓ $1"; }
bad()  { fail=$((fail+1)); echo "  ✗ $1"; }

echo "== 模块结构 =="
for d in gateway services/netease services/kugou services/unm services/lyric services/meting contracts docs deploy scripts .github/workflows; do
  [ -d "$d" ] && ok "目录存在: $d" || bad "目录缺失: $d"
done

echo "== 功能完整性（接口数 / 文件数）=="
n=$(ls services/netease/module | wc -l); [ "$n" -eq 440 ] && ok "网易云 440 接口完整 ($n)" || bad "网易云接口数异常: $n（期望 440）"
n=$(ls services/kugou/module | wc -l);  [ "$n" -eq 228 ] && ok "酷狗 228 接口完整 ($n)"   || bad "酷狗接口数异常: $n（期望 228）"
[ -f services/unm/src/routes/routeMusic.ts ] && ok "解灰路由存在" || bad "解灰路由缺失"
grep -q "export { app }" services/lyric/api/index.ts && ok "lyric app 导出" || bad "lyric app 未导出"
[ -f services/lyric/server.ts ] && ok "lyric 独立入口" || bad "lyric 独立入口缺失"

echo "== 去重（无冗余）=="
[ ! -e services/meting/src/providers/netease ] && ok "meting 已移除 netease provider" || bad "meting 仍有 netease"
[ ! -e services/meting/src/providers/tencent ] && ok "meting 已移除 tencent provider" || bad "meting 仍有 tencent"
[ -d services/meting/src/providers/spotify ] && ok "meting 保留 spotify" || bad "meting 缺失 spotify"
[ -d services/meting/src/providers/ytmusic ] && ok "meting 保留 ytmusic" || bad "meting 缺失 ytmusic"
grep -q "query.server || 'spotify'" services/meting/src/service/api.js && ok "meting 默认源已切换为 spotify" || bad "meting 默认源未切换"

echo "== 网关集成 =="
grep -q "PlatformController" gateway/internal/controller/controller_manager.go && ok "网关已接线 PlatformController" || bad "网关未接线"
grep -q "platform/:name" gateway/internal/controller/platform_controller.go && ok "统一路由已注册" || bad "统一路由缺失"
grep -q "unified-music-api/gateway" gateway/go.mod && ok "go module 路径已迁移" || bad "go module 路径未迁移"
[ -z "$(grep -r 'IIXINGCHEN/music-api-proxy' --include='*.go' gateway/ || true)" ] && ok "无残留旧 import 路径" || bad "残留旧 import 路径"
grep -q "EXTERNAL_NCM_API_URL: http://netease:3001/lyric" deploy/docker-compose.yml && ok "lyric 回退链指向内部网易云" || bad "lyric 回退链未配置"

echo "== 契约与文档 =="
[ -f contracts/openapi.yaml ] && ok "OpenAPI 契约存在" || bad "OpenAPI 缺失"
grep -q "/api/v1/platform/{name}/{path}" contracts/openapi.yaml && ok "统一路由已写入契约" || bad "契约缺失统一路由"
[ -f docs/api.html ] && ok "Scalar 文档页存在" || bad "文档页缺失"

echo
echo "通过: $pass，失败: $fail"
[ "$fail" -eq 0 ]
