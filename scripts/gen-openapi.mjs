#!/usr/bin/env node
/**
 * gen-openapi.mjs — 生成 6 个服务的 OpenAPI 3.1 spec。
 *
 * - netease/kugou：扫描模块目录，按 C-01 规则推导公开路由（与
 *   packages/http-kit 的 scanModuleFiles/routeForFile 语义一致），并对每个
 *   模块做 query 参数名的尽力静态提取（`query.xxx` / `params.xxx` /
 *   `params?.xxx` / `query["xxx"]` / 解构），类型一律 string、required=false。
 *   传输层保留字段（randomCNIP/e_r/domain/checkToken/headers/timeout）不列出；
 *   其余 createOption 保留字段（crypto/cookie/ua/proxy/realIP）属于用户可调
 *   行为，予以保留。
 * - unm/lyric/meting/gateway：scripts/openapi-static.mjs 的手写精确 spec。
 *
 * 输出：apps/<app>/openapi.{yaml,json}（幂等；重复运行 diff 为空）。
 *
 * 用法：node scripts/gen-openapi.mjs
 *   或：pnpm gen:openapi
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { jsonOk, makeSpec, op, qp, writeSpec } from "./openapi-emit.mjs";
import { STATIC_SPECS } from "./openapi-static.mjs";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");

// 与 http-kit routeForFile 语义一致
function routeForFile(fileName, special, ext) {
	if (special[fileName]) return special[fileName];
	const base = fileName.endsWith(ext)
		? fileName.slice(0, -ext.length)
		: fileName;
	return `/${base.replace(/_/g, "/")}`;
}

// ---------------------------------------------------------------- 参数提取
const IDENT = "[A-Za-z_$][A-Za-z0-9_$]*";

/** 去掉字符串字面量与注释，降低误提取。 */
function stripNoise(src) {
	return src
		.replace(/\/\*[\s\S]*?\*\//g, " ")
		.replace(/(^|[^\S])\/\/[^\n]*/g, "$1 ")
		.replace(/`(?:\\.|[^`\\])*`/g, "``")
		.replace(/'(?:\\.|[^'\\])*'/g, "''")
		.replace(/"(?:\\.|[^"\\])*"/g, '""');
}

function extractParams(source) {
	const found = new Set();
	const stripped = stripNoise(source);
	// query.xxx / params.xxx（含可选链）
	for (const m of stripped.matchAll(
		/\b(?:query|params)\?\.([A-Za-z_$][A-Za-z0-9_$]*)|\b(?:query|params)\.([A-Za-z_$][A-Za-z0-9_$]*)/g,
	)) {
		found.add(m[1] ?? m[2]);
	}
	// 解构：const { a, b: c, d = 1, ...rest } = query|params
	for (const m of stripped.matchAll(
		/\b(?:const|let|var)\s*\{([^{}]{1,800})\}\s*=\s*(?:query|params)\b/g,
	)) {
		for (const part of m[1].split(",")) {
			const prop = part
				.trim()
				.replace(/^\.\.\./, "")
				.split(/[:=]/)[0]
				.trim();
			if (new RegExp(`^${IDENT}$`).test(prop)) found.add(prop);
		}
	}
	// 方括号：query["xxx"]（在去噪前提取，保留字符串字面量）
	for (const m of source.matchAll(
		/\b(?:query|params)\[\s*['"]([A-Za-z_$][A-Za-z0-9_$]*)['"]\s*\]/g,
	)) {
		found.add(m[1]);
	}
	return found;
}

/** 文件首行注释作 summary（如 `// 搜索`）。 */
function extractSummary(source) {
	const lines = source.split("\n").slice(0, 6);
	for (const line of lines) {
		const mm = line.match(/^\s*\/\/(.*)$/);
		if (mm) {
			const s = mm[1].trim();
			if (s) return s.slice(0, 80);
		}
	}
	return "";
}

// ---------------------------------------------------------------- 服务配置
const SERVICES = {
	netease: {
		dir: "apps/netease/src/modules",
		ext: ".ts",
		skipUnderscore: false,
		special: {
			"daily_signin.ts": "/daily_signin",
			"fm_trash.ts": "/fm_trash",
			"personal_fm.ts": "/personal_fm",
		},
		internalParams: new Set([
			"randomCNIP",
			"e_r",
			"domain",
			"checkToken",
			"headers",
			"timeout",
		]),
		title: "网易云音乐 API (v2 · Hono)",
		version: "2.0.0",
		serverUrl: "http://localhost:3001",
		description:
			"api-enhanced 440 模块的 Hono 移植版。全部路由接受 GET/POST（原 app.all）；参数合并顺序 cookie→query→body→files（后者覆盖前者）；响应 2 分钟缓存（仅 200）。query 参数名为静态提取（尽力而为），类型均为 string；crypto/cookie/ua/proxy/realIP 为传输层可调字段一并列出。",
	},
	kugou: {
		dir: "apps/kugou/src/modules",
		ext: ".ts",
		skipUnderscore: true,
		special: {},
		internalParams: new Set(),
		title: "酷狗音乐 API (v2 · Hono)",
		version: "2.0.0",
		serverUrl: "http://localhost:3002",
		description:
			"KuGouMusicApi 226 模块的 Hono 移植版。`_` 开头文件为内部模块不注册；query 参数名为静态提取（尽力而为），类型均为 string；cookie/noCookie 为显式行为字段一并列出。",
	},
};

function scanService(cfg) {
	const dir = join(ROOT, cfg.dir);
	const files = readdirSync(dir)
		.reverse() // 与服务端 scanModuleFiles 一致的注册顺序
		.filter(
			(f) => f.endsWith(cfg.ext) && (!cfg.skipUnderscore || !f.startsWith("_")),
		);
	const paths = {};
	for (const f of files) {
		const route = routeForFile(f, cfg.special, cfg.ext);
		const identifier = f.slice(0, -cfg.ext.length);
		const source = readFileSync(join(dir, f), "utf-8");
		const summary = extractSummary(source) || identifier;
		const params = [...extractParams(source)]
			.filter((p) => !cfg.internalParams.has(p))
			.sort()
			.map((p) => qp(p));
		const getOp = op(summary, params);
		// POST：参数同样可经 query 传递，body 为表单/JSON（与服务端合并语义一致）
		const postOp = op(summary, params, {
			description: "参数可经 query 或 body 传递（body 覆盖 query）。",
			responses: { 200: jsonOk() },
		});
		paths[route] = { get: getOp, post: postOp };
	}
	return makeSpec({
		title: cfg.title,
		version: cfg.version,
		description: cfg.description,
		serverUrl: cfg.serverUrl,
		paths,
	});
}

// ---------------------------------------------------------------- 主流程
let totalPaths = 0;
for (const [name, cfg] of Object.entries(SERVICES)) {
	const spec = scanService(cfg);
	const n = Object.keys(spec.paths).length;
	totalPaths += n;
	writeSpec(join(ROOT, `apps/${name}`), spec);
	console.log(`${name}: ${n} paths -> apps/${name}/openapi.{yaml,json}`);
}
for (const [name, build] of Object.entries(STATIC_SPECS)) {
	const spec = build();
	const n = Object.keys(spec.paths).length;
	totalPaths += n;
	writeSpec(join(ROOT, `apps/${name}`), spec);
	console.log(`${name}: ${n} paths -> apps/${name}/openapi.{yaml,json}`);
}
console.log(`total: ${totalPaths} paths across 6 services`);
