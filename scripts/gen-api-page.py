#!/usr/bin/env python3
"""生成独立 API 文档页面（docs/api-reference.html）。

单文件、零外部依赖、file:// 可直接打开：
- 搜索（路径/说明/参数名）
- 按服务筛选
- 700+ 接口全部内嵌为 JSON，前端渲染
数据源复用 scripts/gen-api-docs.py 的提取逻辑。
"""
import html
import importlib.util
import json
import os
import sys


def _load(modname, filename):
    spec = importlib.util.spec_from_file_location(
        modname, os.path.join(os.path.dirname(os.path.abspath(__file__)), filename))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_gen_docs = _load("gen_api_docs", "gen-api-docs.py")
app_routes = _gen_docs.app_routes
kugou_modules = _gen_docs.kugou_modules
netease_modules = _gen_docs.netease_modules
zod_schemas = _gen_docs.zod_schemas

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "api-reference.html")


def build_data():
    services = []
    netease = netease_modules()
    kugou = kugou_modules()
    services.append({
        "id": "netease", "name": "网易云音乐", "port": 3001,
        "base": "http://localhost:3001", "gateway": "/api/v1/platform/netease",
        "count": len(netease),
        "endpoints": [
            {"route": m["route"], "desc": m["desc"], "params": [
                {"name": n, "required": p["required"], "default": p["default"]}
                for n, p in sorted(m["params"].items())]} for m in netease],
    })
    services.append({
        "id": "kugou", "name": "酷狗音乐", "port": 3002,
        "base": "http://localhost:3002", "gateway": "/api/v1/platform/kugou",
        "count": len(kugou),
        "endpoints": [
            {"route": m["route"], "desc": m["desc"], "params": [
                {"name": n, "required": p["required"], "default": p["default"]}
                for n, p in sorted(m["params"].items())]} for m in kugou],
    })
    # UNM（含 zod 参数）
    unm_schemas = {}
    for f in ["routeMusic", "routeResource"]:
        p = os.path.join(ROOT, "apps", "unm", "src", "routes", f + ".ts")
        if os.path.isfile(p):
            unm_schemas.update(zod_schemas(p))
    schema_map = {"match": "matchSchema", "ncmget": "ncmgetSchema",
                  "otherget": "othergetSchema", "search": "searchSchema",
                  "pic": "picSchema", "picture": "picSchema",
                  "lyric": "lyricSchema", "relay": "relaySchema"}
    unm_eps = []
    for r in app_routes("unm"):
        key = r["route"].strip("/").split("/")[0]
        sname = schema_map.get(key)
        params = []
        if sname and sname in unm_schemas:
            params = [{"name": fl, "required": False, "default": "-"}
                      for fl in unm_schemas[sname]]
        unm_eps.append({"route": r["route"], "method": r["method"],
                        "desc": "", "params": params})
    services.append({
        "id": "unm", "name": "UNM 解灰", "port": 3003,
        "base": "http://localhost:3003", "gateway": "/api/v1/platform/unm",
        "count": len(unm_eps), "endpoints": unm_eps,
    })
    for sid, sname, port in [("lyric", "Lyric 歌词", 3004),
                             ("meting", "Meting", 3005),
                             ("gateway", "统一网关", 8080)]:
        eps = [{"route": r["route"], "method": r["method"], "desc": "", "params": []}
               for r in app_routes(sid)]
        services.append({
            "id": sid, "name": sname, "port": port,
            "base": f"http://localhost:{port}",
            "gateway": f"/api/v1/platform/{sid}" if sid != "gateway" else "",
            "count": len(eps), "endpoints": eps,
        })
    return services


PAGE = """<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>unified-music-api · API 文档</title>
<style>
/* VitePress 默认主题视觉语言（对标 dujiao-next.com） */
:root {
  --vp-c-brand-1: #3451b2; --vp-c-brand-2: #3a5ccc; --vp-c-brand-3: #5672cd;
  --vp-c-brand-soft: rgba(100,108,255,.14);
  --vp-c-bg: #ffffff; --vp-c-bg-soft: #f6f6f7; --vp-c-bg-mute: #f6f6f7;
  --vp-c-divider: rgba(60,60,67,.12); --vp-c-divider-light: rgba(60,60,67,.08);
  --vp-c-text-1: rgba(60,60,67); --vp-c-text-2: rgba(60,60,67,.78); --vp-c-text-3: rgba(60,60,67,.56);
  --vp-c-code-bg: rgba(60,60,67,.08);
  --vp-shadow: 0 1px 2px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06);
}
html.dark {
  --vp-c-brand-1: #a8b1ff; --vp-c-brand-2: #5c73e7; --vp-c-brand-3: #3e63dd;
  --vp-c-brand-soft: rgba(100,108,255,.16);
  --vp-c-bg: #1b1b1f; --vp-c-bg-soft: #202127; --vp-c-bg-mute: #202127;
  --vp-c-divider: rgba(82,82,89,.32); --vp-c-divider-light: rgba(82,82,89,.24);
  --vp-c-text-1: rgba(255,255,245,.86); --vp-c-text-2: rgba(235,235,245,.6); --vp-c-text-3: rgba(235,235,245,.38);
  --vp-c-code-bg: rgba(235,235,245,.08);
}
* { box-sizing: border-box; }
body { margin: 0; color: var(--vp-c-text-1); background: var(--vp-c-bg);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
    "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  font-size: 16px; line-height: 1.7; -webkit-font-smoothing: antialiased; }
/* 顶栏：VitePress VPNav 风格 */
header { position: sticky; top: 0; z-index: 10; background: color-mix(in srgb, var(--vp-c-bg) 78%, transparent);
  -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--vp-c-divider); padding: 12px 24px; }
.nav-row { max-width: 1152px; margin: 0 auto; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.brand { font-weight: 700; font-size: 16px; letter-spacing: -.01em; white-space: nowrap; }
.brand span { color: var(--vp-c-text-3); font-weight: 400; font-size: 13px; margin-left: 8px; }
#search { flex: 1; min-width: 180px; max-width: 420px; padding: 8px 12px 8px 36px; border-radius: 8px;
  border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E") no-repeat 12px center;
  color: var(--vp-c-text-1); font-size: 14px; outline: none; }
#search:focus { border-color: var(--vp-c-brand-1); }
#search::placeholder { color: var(--vp-c-text-3); }
.theme-btn { margin-left: auto; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft);
  border-radius: 8px; width: 36px; height: 36px; cursor: pointer; font-size: 16px; color: var(--vp-c-text-2); }
/* 服务 tabs：VitePress 按钮风格 */
.tabs { max-width: 1152px; margin: 0 auto; padding: 16px 24px 0; display: flex; gap: 8px; flex-wrap: wrap; }
.tabs button { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft); color: var(--vp-c-text-2); font-size: 14px; cursor: pointer; transition: all .15s; }
.tabs button:hover { color: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); }
.tabs button.active { background: var(--vp-c-brand-soft); border-color: transparent;
  color: var(--vp-c-brand-1); font-weight: 600; }
/* 内容区：VitePress vp-doc 排版 */
main { max-width: 1152px; margin: 0 auto; padding: 8px 24px 64px; }
.count { color: var(--vp-c-text-3); font-size: 14px; margin: 12px 0 20px; }
/* 接口卡片：VitePress 自定义容器风格 */
.ep { background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider-light); border-radius: 8px;
  margin-bottom: 12px; overflow: hidden; transition: border-color .15s; }
.ep:hover { border-color: var(--vp-c-divider); }
.ep-head { padding: 12px 16px; cursor: pointer; display: flex; gap: 12px; align-items: baseline; }
.method { font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 6px; flex-shrink: 0;
  background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); }
.route { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px;
  word-break: break-all; font-weight: 600; }
.ep-desc { color: var(--vp-c-text-2); font-size: 14px; margin-left: auto; flex-shrink: 0; }
.svc-tag { font-size: 12px; color: var(--vp-c-text-3); border: 1px solid var(--vp-c-divider);
  border-radius: 12px; padding: 1px 10px; flex-shrink: 0; }
.ep-body { display: none; border-top: 1px solid var(--vp-c-divider-light); padding: 4px 16px 16px; }
.ep.open .ep-body { display: block; }
/* 表格：VitePress vp-doc table */
table { width: 100%; border-collapse: collapse; font-size: 14px; margin: 16px 0; display: table; }
tr { border-top: 1px solid var(--vp-c-divider); }
tr:nth-child(2n) { background: var(--vp-c-bg-soft); }
th, td { border: 1px solid var(--vp-c-divider); padding: 8px 16px; text-align: left; }
th { font-weight: 600; background: var(--vp-c-bg-soft); }
td code { background: var(--vp-c-code-bg); padding: 2px 6px; border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .875em; }
.req { color: #e5484d; font-weight: 600; } .opt { color: var(--vp-c-text-3); }
/* 示例：VitePress 代码块 */
.example { background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider-light); border-radius: 8px;
  padding: 12px 16px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px;
  word-break: break-all; color: var(--vp-c-brand-1); margin: 12px 0 4px; overflow-x: auto; }
.noparams { color: var(--vp-c-text-3); font-size: 14px; padding: 8px 0; }
h3.sec { font-size: 20px; font-weight: 600; letter-spacing: -.02em; margin: 32px 0 12px;
  padding-top: 24px; border-top: 1px solid var(--vp-c-divider); }
@media (max-width: 768px) { header { padding: 10px 16px; } .tabs, main { padding-left: 16px; padding-right: 16px; } }
</style>
</head>
<body>
<header>
  <div class="nav-row">
    <div class="brand">🎵 unified-music-api <span id="total"></span></div>
    <input id="search" type="search" placeholder="搜索接口…" autocomplete="off" />
    <button class="theme-btn" id="themeBtn" title="切换主题">🌙</button>
  </div>
</header>
<div class="tabs" id="tabs"></div>
<main>
  <div class="count" id="count"></div>
  <div id="list"></div>
</main>
<script>
const DATA = __DATA__;
let curSvc = "all", query = "";
const $ = (id) => document.getElementById(id);

function renderTabs() {
  const tabs = $("tabs");
  let h = `<button data-svc="all" class="active">全部</button>`;
  for (const s of DATA) h += `<button data-svc="${s.id}">${s.name} ${s.count}</button>`;
  tabs.innerHTML = h;
  tabs.querySelectorAll("button").forEach(b => b.onclick = () => {
    curSvc = b.dataset.svc;
    tabs.querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b));
    render();
  });
}

function match(ep, svc) {
  if (curSvc !== "all" && svc.id !== curSvc) return false;
  if (!query) return true;
  const q = query.toLowerCase();
  if (ep.route.toLowerCase().includes(q)) return true;
  if ((ep.desc || "").toLowerCase().includes(q)) return true;
  return ep.params.some(p => p.name.toLowerCase().includes(q));
}

function paramRows(params) {
  if (!params.length) return `<div class="noparams">无参数</div>`;
  let h = `<table><tr><th>参数</th><th>必填</th><th>默认值</th></tr>`;
  for (const p of params) {
    h += `<tr><td><code>${p.name}</code></td>` +
      `<td class="${p.required ? "req" : "opt"}">${p.required ? "是" : "否"}</td>` +
      `<td><code>${p.default}</code></td></tr>`;
  }
  return h + `</table>`;
}

function example(svc, ep) {
  const qs = ep.params.slice(0, 3).map(p =>
    `${p.name}=${p.default !== "-" ? p.default : "xxx"}`).join("&");
  const url = svc.base + ep.route + (qs ? "?" + qs : "");
  return `<div class="example">GET ${url}</div>`;
}

function render() {
  const list = $("list");
  let total = 0, h = "";
  for (const svc of DATA) {
    const eps = svc.endpoints.filter(ep => match(ep, svc));
    if (!eps.length) continue;
    total += eps.length;
    for (const ep of eps) {
      const eid = "ep" + Math.random().toString(36).slice(2);
      h += `<div class="ep" id="${eid}">` +
        `<div class="ep-head" onclick="document.getElementById('${eid}').classList.toggle('open')">` +
        `<span class="method">${ep.method || "GET/POST"}</span>` +
        `<span class="route">${ep.route}</span>` +
        (ep.desc ? `<span class="ep-desc">${ep.desc}</span>` : ``) +
        `<span class="svc-tag">${svc.name}</span></div>` +
        `<div class="ep-body">${paramRows(ep.params)}${example(svc, ep)}</div></div>`;
    }
  }
  list.innerHTML = h || `<div class="noparams">没有匹配的接口</div>`;
  $("count").textContent = `共 ${total} 个接口`;
}

$("search").addEventListener("input", (e) => {
  query = e.target.value.trim();
  render();
});

(function init() {
  const saved = localStorage.getItem("vp-theme");
  const dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", dark);
  const btn = document.getElementById("themeBtn");
  const paint = () => btn.textContent = document.documentElement.classList.contains("dark") ? "☀️" : "🌙";
  paint();
  btn.onclick = () => {
    const d = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", d);
    localStorage.setItem("vp-theme", d ? "dark" : "light");
    paint();
  };
  renderTabs();
  const n = DATA.reduce((a, s) => a + s.count, 0);
  $("total").textContent = `${DATA.length} 个服务 · ${n} 个接口`;
  render();
})();
</script>
</body>
</html>
"""


def main():
    services = build_data()
    total = sum(s["count"] for s in services)
    print(f"服务: {len(services)}, 接口总数: {total}")
    data_json = json.dumps(services, ensure_ascii=False, separators=(",", ":"))
    page = PAGE.replace("__DATA__", data_json)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(page)
    print(f"已生成 {OUT} ({os.path.getsize(OUT)//1024} KB)")


if __name__ == "__main__":
    main()
