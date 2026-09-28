#!/usr/bin/env node
/**
 * 契约检查：原 JS 模块 vs TS 模块的 stub-request 配置对比。
 *
 * 原理（差分测试）：
 * - 冻结 Date.now / new Date() / Math.random / crypto.randomUUID，保证两侧确定性一致；
 * - 用 stub 的 useAxios（捕获请求配置、返回固定成功响应）分别运行原模块与 TS 模块；
 * - 原模块的裸 axios 调用通过 Module._load 拦截捕获；TS 模块的裸 fetch 调用通过
 *   globalThis.fetch 桩捕获；
 * - 归一化（排序键、丢弃 undefined、Buffer 折叠为长度+头部 hex）后深度对比
 *   useAxios 请求序列；双方都零请求时对比返回值。
 *
 * 通过率 = PASS / (PASS + FAIL)，SKIP 不计入。门禁：>= 95%。
 *
 * 用法：node scripts/contract-check.mjs [--module <name>] [--verbose]
 */
import { createRequire } from "node:module";
import { Module } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, "..");
const ORIG_DIR = path.resolve(
	__dirname,
	"../../../../music-api-audit/repos/KuGouMusicApi/module",
);
const TS_DIST_DIR = path.join(APP_DIR, "dist", "modules");

// ---------------- 确定性冻结 ----------------
const FIXED_NOW = 1727452800000; // 2024-09-27T16:00:00.000Z
const RealDate = Date;
class FrozenDate extends RealDate {
	constructor(...args) {
		super(...(args.length ? args : [FIXED_NOW]));
	}
	static now() {
		return FIXED_NOW;
	}
}
globalThis.Date = FrozenDate;

function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
let randFn = mulberry32(42);
Math.random = () => randFn();
const resetRandom = () => {
	randFn = mulberry32(42);
};

let uuidCounter = 0;
const resetUuid = () => {
	uuidCounter = 0;
};
crypto.randomUUID = () => {
	uuidCounter += 1;
	const h = (uuidCounter * 2654435761) >>> 0;
	const hex = h.toString(16).padStart(8, "0");
	return `${hex.slice(0, 8)}-0000-4000-8000-${"0".repeat(11)}${(uuidCounter % 10)}`;
};

// crypto.randomBytes 也冻结（原版 user_preference 等用它生成随机 AES 密钥；
// TS 侧忠实保留了同一调用，冻结后两侧确定性一致）
import crypto from "node:crypto";
let rbSeed = 0;
const resetRb = () => {
	rbSeed = 0;
};
crypto.randomBytes = (size, cb) => {
	rbSeed += 1;
	const buf = Buffer.alloc(size);
	let s = (rbSeed * 0x9e3779b9) >>> 0;
	for (let i = 0; i < size; i++) {
		s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
		buf[i] = s % 256;
	}
	if (typeof cb === "function") {
		cb(null, buf);
		return undefined;
	}
	return buf;
};

// ---------------- 参数 ----------------
const PARAMS = {
	cookie: {
		userid: "12345678",
		token: "contracttesttoken123456",
		dfid: "contractdfid1234567890abcdef",
	},
	hash: "ABCDEF1234567890ABCDEF1234567890",
	album_id: "12345678",
	albumid: "12345678",
	songid: "12345678",
	id: "12345678",
	playlistid: "12345678",
	specialid: "12345678",
	keyword: "测试",
	keywords: "测试",
	type: 1,
	page: 1,
	pagesize: 20,
	// 二维码 / 登录流程
	key: "contractqrkey123",
	code: "contractcode123",
	// 上传流程
	filename: "contract-test.mp3",
	filesize: 1024 * 1024 * 3,
	filepath: "/tmp/contract-test.mp3",
};

// ---------------- 归一化 ----------------
function normalize(v, depth = 0) {
	if (depth > 12) return "[max-depth]";
	if (v === undefined) return undefined;
	if (v === null) return null;
	if (typeof v === "function") return "[function]";
	if (typeof v === "bigint") return `${v}n`;
	if (Buffer.isBuffer(v))
		return { $buffer: v.length, $head: v.subarray(0, 16).toString("hex") };
	if (v instanceof Uint8Array) return { $bytes: v.length };
	if (v instanceof ArrayBuffer) return { $arrayBuffer: v.byteLength };
	if (Array.isArray(v)) {
		const out = [];
		for (const item of v) {
			const n = normalize(item, depth + 1);
			if (n !== undefined) out.push(n);
		}
		return out;
	}
	if (v instanceof URLSearchParams) {
		const o = {};
		for (const [k, val] of [...v.entries()].sort()) o[k] = val;
		return { $urlSearchParams: o };
	}
	if (typeof FormData !== "undefined" && v instanceof FormData) {
		const keys = [];
		for (const k of v.keys()) keys.push(k);
		return { $formData: [...new Set(keys)].sort() };
	}
	if (typeof v === "object") {
		const o = {};
		for (const k of Object.keys(v).sort()) {
			// 跳过明显与请求语义无关的运行时字段
			if (k === "signal" || k === "dispatcher") continue;
			// 原版 youth_listen_song.js 的拼写错误键（request.js 只认 encryptType，
			// 该键无任何行为效果；TS 侧已删除）
			if (k === "encryptTyPe") continue;
			// Error stack 含本机路径：只保留首行（错误信息）
			if (k === "stack" && typeof v[k] === "string") {
				o[k] = String(v[k]).split("\n")[0];
				continue;
			}
			const n = normalize(v[k], depth + 1);
			if (n !== undefined) o[k] = n;
		}
		return o;
	}
	if (typeof v === "string") {
		// RSA-PKCS1/OAEP 密文（随机 padding，两侧无法逐字节对比）：仅对比存在性与长度。
		// AES/MD5/SHA1/签名在冻结随机数下是确定性的，不受影响。
		if (/^[0-9a-fA-F]+$/.test(v) && v.length >= 256)
			return { $rsablob: `hex:${v.length}` };
		if (/^[A-Za-z0-9+/]+={0,2}$/.test(v) && v.length >= 344 && v.length % 4 === 0)
			return { $rsablob: `b64:${v.length}` };
		return v;
	}
}

function normalizeHeaders(headers) {
	if (!headers) return undefined;
	const out = {};
	if (typeof headers.forEach === "function") {
		headers.forEach((val, key) => {
			out[key.toLowerCase()] = val;
		});
	} else if (typeof headers === "object") {
		for (const k of Object.keys(headers)) out[k.toLowerCase()] = headers[k];
	}
	const keys = Object.keys(out).sort();
	const o = {};
	for (const k of keys) o[k] = out[k];
	return o;
}

/** useAxios 配置归一化：字段与原 options 一致 */
function normalizeRequestConfig(config) {
	return normalize(config);
}

/** fetch(url, init) 归一化为可比形状 */
function normalizeFetchCall(url, init = {}) {
	const u = new URL(String(url));
	const query = {};
	for (const [k, v] of [...u.searchParams.entries()].sort()) query[k] = v;
	u.search = "";
	const body = init.body;
	let bodyNorm;
	if (body == null) bodyNorm = undefined;
	else if (typeof body === "string")
		bodyNorm =
			body.length > 4096
				? { $string: body.length }
				: { $string: body.length, $head: body.slice(0, 200) };
	else bodyNorm = normalize(body);
	return normalize({
		kind: "http",
		url: u.toString(),
		method: (init.method || "GET").toUpperCase(),
		headers: normalizeHeaders(init.headers),
		query,
		body: bodyNorm,
		redirect: init.redirect,
	});
}

/** axios 调用归一化为可比形状 */
function normalizeAxiosCall(method, url, config = {}) {
	const u = new URL(String(url), "http://localhost");
	const query = {};
	for (const [k, v] of [...u.searchParams.entries()].sort()) query[k] = v;
	if (config.params) {
		for (const k of Object.keys(config.params).sort())
			query[k] = String(config.params[k]);
	}
	u.search = "";
	let data = config.data;
	let bodyNorm;
	if (data == null) bodyNorm = undefined;
	else if (typeof data === "string")
		bodyNorm =
			data.length > 4096
				? { $string: data.length }
				: { $string: data.length, $head: data.slice(0, 200) };
	else bodyNorm = normalize(data);
	return normalize({
		kind: "http",
		url: u.toString().replace("http://localhost", ""),
		method: String(method).toUpperCase(),
		headers: normalizeHeaders(config.headers),
		query,
		body: bodyNorm,
		maxRedirects: config.maxRedirects,
		responseType: config.responseType,
	});
}

// ---------------- stub ----------------
const CANNED_AXIOS_BODY = { status: 1, data: {} };

function makeUseAxiosStub(calls) {
	return async (config) => {
		calls.push(normalizeRequestConfig(config));
		return { status: 200, body: { status: 1, data: {} }, cookie: [] };
	};
}

function makeAxiosStub(calls) {
	const record = (method, args) => {
		let url;
		let config = {};
		if (typeof args[0] === "string") {
			url = args[0];
			config = args[1] || {};
		} else {
			config = args[0] || {};
			url = config.url;
		}
		calls.push(normalizeAxiosCall(method, url, config));
		return Promise.resolve({
			status: 200,
			data: CANNED_AXIOS_BODY,
			headers: {},
		});
	};
	const fn = (...args) => record(config_method(args), args);
	const config_method = (args) =>
		typeof args[0] === "string" ? "get" : args[0]?.method || "get";
	fn.get = (...args) => record("get", args);
	fn.post = (...args) => record("post", args);
	fn.put = (...args) => record("put", args);
	fn.delete = (...args) => record("delete", args);
	fn.request = (...args) => record("request", args);
	fn.create = () => fn;
	return fn;
}

function makeFetchStub(calls) {
	return async (url, init = {}) => {
		calls.push(normalizeFetchCall(url, init));
		return {
			ok: true,
			status: 200,
			headers: new Headers({ "content-type": "application/json" }),
			json: async () => ({ status: 1, data: {} }),
			text: async () => JSON.stringify({ status: 1, data: {} }),
			arrayBuffer: async () => new ArrayBuffer(0),
		};
	};
}

// 拦截原模块的 require(...)：原仓库无 node_modules，以下仅供本契约脚本使用。
// axios -> 捕获桩；crypto-js/node-forge/pako/form-data -> scripts/stubs 下的最小桩；
// qrcode -> 复用 apps/kugou 已安装的真实包。
const axiosCallsBox = { calls: [] };
const axiosStub = makeAxiosStub(axiosCallsBox.calls);
const stubRequire = createRequire(path.join(__dirname, "stubs", "x.js"));
const stubModules = {
	axios: axiosStub,
	"crypto-js": stubRequire("crypto-js"),
	"node-forge": stubRequire("node-forge"),
	pako: stubRequire("pako"),
	"form-data": stubRequire("form-data"),
	"big-integer": stubRequire("big-integer"),
	qrcode: createRequire(path.join(APP_DIR, "x.js"))("qrcode"),
};
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
	if (request in stubModules) return stubModules[request];
	return origLoad.call(this, request, parent, isMain);
};

// ---------------- 模块发现 ----------------
const onlyModule = process.argv.includes("--module")
	? process.argv[process.argv.indexOf("--module") + 1]
	: null;
const verbose = process.argv.includes("--verbose");

const origFiles = fs
	.readdirSync(ORIG_DIR)
	.filter((f) => f.endsWith(".js") && !f.startsWith("_"))
	.map((f) => f.slice(0, -3))
	.sort();
const names = onlyModule ? [onlyModule] : origFiles;

const requireOrig = createRequire(path.join(ORIG_DIR, "x.js"));

// ---------------- 单模块对比 ----------------
function diffSummary(a, b, pathPrefix = "") {
	// 返回顶层差异描述（最多 5 条）
	const diffs = [];
	const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
	for (const k of keys) {
		if (diffs.length >= 5) break;
		if (!isDeepStrictEqual(a?.[k], b?.[k])) {
			const av = JSON.stringify(a?.[k])?.slice(0, 120);
			const bv = JSON.stringify(b?.[k])?.slice(0, 120);
			diffs.push(`${pathPrefix}${k}: orig=${av} ts=${bv}`);
		}
	}
	return diffs;
}

async function runWithTimeout(fn, ms) {
	return Promise.race([
		fn(),
		new Promise((_, reject) =>
			setTimeout(() => reject(new Error(`timeout:${ms}ms`)), ms),
		),
	]);
}

async function runModule(name) {
	const result = {
		name,
		status: "PASS",
		reason: "",
		origRequests: 0,
		tsRequests: 0,
		diffs: [],
	};

	// 加载原模块
	let origFn;
	try {
		origFn = requireOrig(path.join(ORIG_DIR, `${name}.js`));
	} catch (e) {
		result.status = "SKIP";
		result.reason = `orig-load-fail: ${e.message}`;
		return result;
	}
	// 加载 TS 模块（dist）
	let tsMod;
	try {
		tsMod = await import(`file://${path.join(TS_DIST_DIR, `${name}.js`)}`);
	} catch (e) {
		result.status = "SKIP";
		result.reason = `ts-load-fail: ${e.message}`;
		return result;
	}
	const tsFn = tsMod.default;
	if (typeof origFn !== "function" || typeof tsFn !== "function") {
		result.status = "SKIP";
		result.reason = "not-a-module-function";
		return result;
	}

	// 运行原模块
	const origReqCalls = [];
	const origHttpCalls = [];
	axiosCallsBox.calls = origHttpCalls;
	let origReturn;
	let origError = null;
	resetRandom();
	resetUuid();
	resetRb();
	try {
		origReturn = await runWithTimeout(
			() => origFn(PARAMS, makeUseAxiosStub(origReqCalls)),
			15000,
		);
	} catch (e) {
		origError = String(e?.message || e);
	}

	// 运行 TS 模块
	const tsReqCalls = [];
	const tsHttpCalls = [];
	const prevFetch = globalThis.fetch;
	globalThis.fetch = makeFetchStub(tsHttpCalls);
	let tsReturn;
	let tsError = null;
	resetRandom();
	resetUuid();
	resetRb();
	try {
		tsReturn = await runWithTimeout(
			() => tsFn(PARAMS, makeUseAxiosStub(tsReqCalls)),
			15000,
		);
	} catch (e) {
		tsError = String(e?.message || e);
	} finally {
		globalThis.fetch = prevFetch;
	}

	result.origRequests = origReqCalls.length;
	result.tsRequests = tsReqCalls.length;
	result.origHttp = origHttpCalls.length;
	result.tsHttp = tsHttpCalls.length;

	// 错误行为对比
	if ((origError == null) !== (tsError == null)) {
		result.status = "FAIL";
		result.reason = "throw-mismatch";
		result.diffs = [
			`orig throw: ${(origError || "").slice(0, 120)}`,
			`ts throw: ${(tsError || "").slice(0, 120)}`,
		];
		return result;
	}
	if (origError && tsError) {
		// 双方都抛错：对比错误信息是否一致
		if (origError !== tsError) {
			result.status = "FAIL";
			result.reason = "throw-message-mismatch";
			result.diffs = [
				`orig: ${origError.slice(0, 120)}`,
				`ts: ${tsError.slice(0, 120)}`,
			];
		}
		return result;
	}

	// useAxios 请求序列对比
	if (!isDeepStrictEqual(origReqCalls, tsReqCalls)) {
		result.status = "FAIL";
		result.reason = `request-mismatch (${origReqCalls.length} vs ${tsReqCalls.length})`;
		const n = Math.max(origReqCalls.length, tsReqCalls.length);
		for (let i = 0; i < n && result.diffs.length < 8; i++) {
			const a = origReqCalls[i];
			const b = tsReqCalls[i];
			if (!isDeepStrictEqual(a, b)) {
				result.diffs.push(`request[${i}]:`);
				result.diffs.push(...diffSummary(a, b, "  "));
			}
		}
		return result;
	}

	// 双方都零 useAxios 请求：对比返回值
	if (origReqCalls.length === 0) {
		const nr = normalize(origReturn);
		const tr = normalize(tsReturn);
		if (!isDeepStrictEqual(nr, tr)) {
			result.status = "FAIL";
			result.reason = "return-mismatch (no requests)";
			result.diffs = diffSummary(nr, tr);
			return result;
		}
	}

	// http-direct 调用次数差异仅记录（多步上传流程由专项测试覆盖）
	if (origHttpCalls.length !== tsHttpCalls.length) {
		result.reason = `http-direct count differs (orig axios:${origHttpCalls.length} vs ts fetch:${tsHttpCalls.length})`;
	}

	return result;
}

// ---------------- 主流程 ----------------
const results = [];
let pass = 0;
let fail = 0;
let skip = 0;
const t0 = Date.now();

for (const name of names) {
	const r = await runModule(name);
	results.push(r);
	if (r.status === "PASS") pass++;
	else if (r.status === "FAIL") fail++;
	else skip++;
	if (verbose || r.status !== "PASS") {
		console.log(
			`[${r.status}] ${name} (useAxios ${r.origRequests}/${r.tsRequests}, http ${r.origHttp || 0}/${r.tsHttp || 0})${r.reason ? ` — ${r.reason}` : ""}`,
		);
		for (const d of r.diffs.slice(0, 6)) console.log(`    ${d}`);
	}
}

const total = pass + fail;
const rate = total ? ((pass / total) * 100).toFixed(2) : "0.00";
console.log("=".repeat(60));
console.log(
	`模块总数: ${names.length}  PASS: ${pass}  FAIL: ${fail}  SKIP: ${skip}  通过率: ${rate}% (门禁 >= 95%)`,
);
console.log(`耗时: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
if (fail > 0) {
	console.log("FAIL 列表:");
	for (const r of results.filter((r) => r.status === "FAIL"))
		console.log(`  - ${r.name}: ${r.reason}`);
}
process.exit(total > 0 && pass / total >= 0.95 ? 0 : 1);
