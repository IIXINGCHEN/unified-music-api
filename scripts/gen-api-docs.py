#!/usr/bin/env python3
"""生成 unified-music-api 完整 API 调用文档（docs/API.md）。

从各服务源码提取：路由路径、请求参数（含默认值）、中文说明。
网易云 440 / 酷狗 226 模块的参数来自 query./params. 引用分析。
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "API.md")

# ---------- 通用提取 ----------

def first_comment(path):
    """文件首行中文注释作为接口说明。"""
    with open(path, encoding="utf-8", errors="ignore") as f:
        for line in f:
            s = line.strip()
            if s.startswith("//"):
                t = s[2:].strip()
                if t and not t.startswith("Ported from") and not t.startswith("biome-ignore"):
                    return t
            elif s:
                break
    return ""


def extract_params(src, var):
    """提取 var.xxx 参数：默认值、是否必填（启发式：无默认值视为必填）。"""
    params = {}
    # var.x || default / var.x ?? default
    for m in re.finditer(rf"{var}\.([A-Za-z_$][\w$]*)\s*(?:\|\||\?\?)\s*([^,;)\n]+)", src):
        name, default = m.group(1), m.group(2).strip().strip("'\"")
        if name not in params:
            params[name] = {"default": default, "required": False}
    # parseInt(var.x || default, 10)
    for m in re.finditer(rf"parseInt\(\s*{var}\.([A-Za-z_$][\w$]*)\s*(?:\|\|\s*([^,)]+))?", src):
        name = m.group(1)
        default = (m.group(2) or "").strip().strip("'\"")
        if name not in params:
            params[name] = {"default": default or "-", "required": not default}
    # 裸引用 var.x（无默认值）
    for m in re.finditer(rf"{var}\.([A-Za-z_$][\w$]*)", src):
        name = m.group(1)
        if name in ("cookie",):
            continue
        if name not in params:
            params[name] = {"default": "-", "required": True}
    return params


def route_of(modname, special):
    if modname in special:
        return special[modname]
    return "/" + modname.replace("_", "/")


# ---------- 网易云 ----------

def netease_modules():
    d = os.path.join(ROOT, "apps", "netease", "src", "modules")
    special = {"daily_signin": "/daily_signin", "fm_trash": "/fm_trash",
               "personal_fm": "/personal_fm"}
    out = []
    for f in sorted(os.listdir(d)):
        if not f.endswith(".ts") or f.startswith("_"):
            continue
        name = f[:-3]
        path = os.path.join(d, f)
        src = open(path, encoding="utf-8", errors="ignore").read()
        out.append({
            "id": name,
            "route": route_of(name, special),
            "desc": first_comment(path),
            "params": extract_params(src, "query"),
        })
    return out


# ---------- 酷狗 ----------

def kugou_modules():
    d = os.path.join(ROOT, "apps", "kugou", "src", "modules")
    out = []
    for f in sorted(os.listdir(d)):
        if not f.endswith(".ts") or f.startswith("_"):
            continue
        name = f[:-3]
        path = os.path.join(d, f)
        src = open(path, encoding="utf-8", errors="ignore").read()
        if "defineKgModule" not in src:
            continue  # 辅助文件，非路由模块
        out.append({
            "id": name,
            "route": "/" + name.replace("_", "/"),
            "desc": first_comment(path),
            "params": extract_params(src, "params"),
        })
    return out


# ---------- UNM / Lyric / Meting / Gateway（路由 + zod schema） ----------

def zod_schemas(route_file):
    """提取文件中所有 z.object schema 的字段名。"""
    src = open(route_file, encoding="utf-8", errors="ignore").read()
    schemas = {}
    for m in re.finditer(r"const\s+(\w+)\s*=\s*z\.object\(\{([^}]*)\}", src, re.S):
        name, body = m.group(1), m.group(2)
        fields = re.findall(r"^\s*([A-Za-z_$][\w$]*)\s*:", body, re.M)
        schemas[name] = fields
    return schemas


def app_routes(app):
    """从路由文件提取 app.get/post 路径。"""
    routes = []
    rd = os.path.join(ROOT, "apps", app, "src", "routes")
    ad = os.path.join(ROOT, "apps", app, "src")
    files = []
    if os.path.isdir(rd):
        files += [os.path.join(rd, f) for f in os.listdir(rd) if f.endswith(".ts")]
    for f in ["app.ts", "server.ts", "main.ts"]:
        p = os.path.join(ad, f)
        if os.path.isfile(p):
            files.append(p)
    seen = set()
    for path in files:
        src = open(path, encoding="utf-8", errors="ignore").read()
        for m in re.finditer(r"(?:app|musicRoute|infoRoute|monitorRoute|resourceRoute)\.(get|post)\(\s*\"([^\"]+)\"", src):
            method, route = m.group(1).upper(), m.group(2)
            if route not in seen:
                seen.add(route)
                routes.append({"method": method, "route": route})
    return sorted(routes, key=lambda r: r["route"])


# ---------- Markdown 生成 ----------

def param_table(params):
    if not params:
        return "无参数。\n"
    lines = ["| 参数 | 必填 | 默认值 |", "|------|------|--------|"]
    for name in sorted(params):
        p = params[name]
        lines.append(f"| `{name}` | {'是' if p['required'] else '否'} | `{p['default']}` |")
    return "\n".join(lines) + "\n"


def module_section(mods, base_url):
    parts = []
    for m in mods:
        parts.append(f"### `{m['route']}`\n")
        if m["desc"]:
            parts.append(f"{m['desc']}\n")
        parts.append(f"方法：`GET` / `POST`（参数可经 query 或 body 传递）\n")
        parts.append(param_table(m["params"]))
        # 示例
        ex_params = []
        for name in sorted(m["params"])[:3]:
            p = m["params"][name]
            ex_params.append(f"{name}={p['default'] if p['default'] != '-' else 'xxx'}")
        ex = f"{base_url}{m['route']}"
        if ex_params:
            ex += "?" + "&".join(ex_params)
        parts.append(f"示例：`GET {ex}`\n")
    return "\n".join(parts)


def main():
    netease = netease_modules()
    kugou = kugou_modules()
    print(f"网易云: {len(netease)}, 酷狗: {len(kugou)}")

    L = []
    L.append("# unified-music-api API 调用文档\n")
    L.append("统一音乐 API（TypeScript + Hono 重构版）完整接口清单。\n")
    L.append("## 服务总览\n")
    L.append("| 服务 | 端口 | 说明 |")
    L.append("|------|------|------|")
    L.append("| gateway | 8080 | 统一网关：鉴权、限流、平台聚合反代 |")
    L.append("| netease | 3001 | 网易云音乐全接口（440） |")
    L.append("| kugou | 3002 | 酷狗音乐全接口（226） |")
    L.append("| unm | 3003 | 解灰 / 多源匹配 |")
    L.append("| lyric | 3004 | TTML 逐字歌词 |")
    L.append("| meting | 3005 | Meting（spotify / ytmusic） |")
    L.append("")
    L.append("## 统一路由（经网关）\n")
    L.append("```\nGET/POST /api/v1/platform/{name}/{path}?query...\n```\n")
    L.append("`{name}` 取值：`netease` `kugou` `unm` `lyric` `meting`。")
    L.append("路径与 query 原样透传给对应平台服务。未知平台返回 404，上游不可用返回 502。\n")
    L.append("网关原生聚合接口：`/api/v1/search`、`/api/v1/lyric`、`/api/v1/match`。\n")

    # 网易云
    L.append(f"## 网易云音乐 API（{len(netease)} 个接口）\n")
    L.append("直连基地址：`http://localhost:3001`；经网关：`/api/v1/platform/netease/...`\n")
    L.append(module_section(netease, "http://localhost:3001"))

    # 酷狗
    L.append(f"## 酷狗音乐 API（{len(kugou)} 个接口）\n")
    L.append("直连基地址：`http://localhost:3002`；经网关：`/api/v1/platform/kugou/...`\n")
    L.append(module_section(kugou, "http://localhost:3002"))

    # UNM
    L.append("## UNM 解灰 API\n")
    L.append("直连基地址：`http://localhost:3003`；经网关：`/api/v1/platform/unm/...`\n")
    unm_schemas = {}
    for f in ["routeMusic", "routeResource"]:
        p = os.path.join(ROOT, "apps", "unm", "src", "routes", f + ".ts")
        if os.path.isfile(p):
            unm_schemas.update(zod_schemas(p))
    # 路由名 -> schema 名的映射
    schema_map = {"match": "matchSchema", "ncmget": "ncmgetSchema",
                  "otherget": "othergetSchema", "search": "searchSchema",
                  "pic": "picSchema", "picture": "picSchema",
                  "lyric": "lyricSchema", "relay": "relaySchema"}
    for r in app_routes("unm"):
        L.append(f"### `{r['method']} {r['route']}`\n")
        key = r["route"].strip("/").split("/")[0]
        sname = schema_map.get(key)
        if sname and sname in unm_schemas:
            fields = unm_schemas[sname]
            L.append("| 参数 |")
            L.append("|------|")
            for fl in fields:
                L.append(f"| `{fl}` |")
            L.append("")
    # Lyric
    L.append("## Lyric 歌词 API\n")
    L.append("直连基地址：`http://localhost:3004`；经网关：`/api/v1/platform/lyric/...`\n")
    for r in app_routes("lyric"):
        L.append(f"### `{r['method']} {r['route']}`\n")
    # Meting
    L.append("## Meting API\n")
    L.append("直连基地址：`http://localhost:3005`；经网关：`/api/v1/platform/meting/...`")
    L.append("仅支持 `spotify` / `ytmusic` 两个 provider，需配置 `SPOTIFY_API` / `YT_API`。\n")
    for r in app_routes("meting"):
        L.append(f"### `{r['method']} {r['route']}`\n")

    # Gateway
    L.append("## 网关 API\n")
    L.append("基地址：`http://localhost:8080`\n")
    for r in app_routes("gateway"):
        L.append(f"### `{r['method']} {r['route']}`\n")

    L.append("---\n*本文档由 `scripts/gen-api-docs.py` 从源码自动生成。*\n")

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(L))
    print(f"已生成 {OUT} ({os.path.getsize(OUT)//1024} KB)")


if __name__ == "__main__":
    main()
