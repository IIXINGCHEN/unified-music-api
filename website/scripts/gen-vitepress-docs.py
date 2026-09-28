#!/usr/bin/env python3
"""为 VitePress 站点生成 API 文档 Markdown（website/api/*.md）。

复用 scripts/gen-api-docs.py 的源码提取逻辑，输出 VitePress 风格 Markdown：
- 每个接口为 ## 章节，参数为标准 Markdown 表格
- 由 VitePress 内置本地搜索索引
"""
import importlib.util
import os

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # website/
ROOT = os.path.dirname(SITE)  # repo root


def _load(modname, filename):
    spec = importlib.util.spec_from_file_location(
        modname, os.path.join(ROOT, "scripts", filename))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_gen = _load("gen_api_docs", "gen-api-docs.py")


def endpoint_md(route, desc, params, method="GET/POST", base=""):
    L = [f"## `{route}`\n"]
    if desc:
        L.append(f"{desc}\n")
    L.append(f"**方法**：`{method}`（参数可经 query 或 body 传递）\n")
    if params:
        L.append("| 参数 | 必填 | 默认值 |")
        L.append("|------|------|--------|")
        for name in sorted(params):
            p = params[name]
            req = "是" if p["required"] else "否"
            L.append(f"| `{name}` | {req} | `{p['default']}` |")
        L.append("")
        ex = [f"{n}={params[n]['default'] if params[n]['default'] != '-' else 'xxx'}"
              for n in sorted(params)[:3]]
        L.append("**示例**：")
        L.append("")
        L.append(f"```\nGET {base}{route}" + ("?" + "&".join(ex) if ex else "") + "\n```")
        L.append("")
    else:
        L.append("无参数。\n")
    return "\n".join(L)


def write_module_page(filename, title, desc_line, modules, base):
    api_dir = os.path.join(SITE, "api")
    os.makedirs(api_dir, exist_ok=True)
    L = [f"# {title}\n", desc_line, ""]
    for m in modules:
        L.append(endpoint_md(m["route"], m["desc"], m["params"], base=base))
    path = os.path.join(api_dir, filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(L))
    print(f"{filename}: {len(modules)} 个接口")


def main():
    netease = _gen.netease_modules()
    kugou = _gen.kugou_modules()
    write_module_page(
        "netease.md", "网易云音乐 API",
        f"共 {len(netease)} 个接口。直连 `http://localhost:3001`，经网关 `/api/v1/platform/netease/...`。",
        netease, "http://localhost:3001")
    write_module_page(
        "kugou.md", "酷狗音乐 API",
        f"共 {len(kugou)} 个接口。直连 `http://localhost:3002`，经网关 `/api/v1/platform/kugou/...`。",
        kugou, "http://localhost:3002")

    # UNM（含 zod 参数）
    unm_schemas = {}
    for f in ["routeMusic", "routeResource"]:
        p = os.path.join(ROOT, "apps", "unm", "src", "routes", f + ".ts")
        if os.path.isfile(p):
            unm_schemas.update(_gen.zod_schemas(p))
    schema_map = {"match": "matchSchema", "ncmget": "ncmgetSchema",
                  "otherget": "othergetSchema", "search": "searchSchema",
                  "pic": "picSchema", "picture": "picSchema",
                  "lyric": "lyricSchema", "relay": "relaySchema"}
    L = ["# UNM 解灰 API\n",
         "直连 `http://localhost:3003`，经网关 `/api/v1/platform/unm/...`。\n"]
    for r in _gen.app_routes("unm"):
        key = r["route"].strip("/").split("/")[0]
        sname = schema_map.get(key)
        params = {}
        if sname and sname in unm_schemas:
            params = {fl: {"required": False, "default": "-"}
                      for fl in unm_schemas[sname]}
        L.append(endpoint_md(r["route"], "", params, method=r["method"],
                             base="http://localhost:3003"))
    with open(os.path.join(SITE, "api", "unm.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(L))
    print(f"unm.md: {len(_gen.app_routes('unm'))} 个路由")

    for sid, title, port in [("lyric", "Lyric 歌词 API", 3004),
                            ("meting", "Meting API", 3005),
                            ("gateway", "网关 API", 8080)]:
        routes = _gen.app_routes(sid)
        L = [f"# {title}\n", f"基地址 `http://localhost:{port}`。\n"]
        for r in routes:
            L.append(endpoint_md(r["route"], "", {}, method=r["method"],
                                 base=f"http://localhost:{port}"))
        with open(os.path.join(SITE, "api", f"{sid}.md"), "w", encoding="utf-8") as f:
            f.write("\n".join(L))
        print(f"{sid}.md: {len(routes)} 个路由")


if __name__ == "__main__":
    main()
