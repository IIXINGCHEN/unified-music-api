#!/usr/bin/env node
/**
 * contract-check.mjs — P2 网易云 440 模块迁移契约检查。
 *
 * 对每个标准模块：用相同的 query 和 stubbed request 分别运行
 *   - 旧实现：music-api-audit/repos/api-enhanced/module/<name>.js (CJS)
 *   - 新实现：apps/netease/dist/modules/<name>.js (TS 编译产物)
 * 比对每次 request(path, data, options) 调用的序列；若模块未调用 request，
 * 则比对返回值。任一侧抛错时比对错误信息。
 *
 * 确定性措施：
 *   - 每次调用前用 mulberry32 重置 Math.random 种子（deviceId/IP 生成一致）
 *   - crypto-js 用 /tmp/contract-harness/stubs 下的最小 stub（MD5/Utf8/Base64，
 *     已验证与 node:crypto 字节一致），通过 NODE_PATH 注入
 *   - query 每次深拷贝，互不污染
 *
 * 排除名单见 SKIP（真实网络 / 缺失可选依赖 / 已知有意分歧 / 3 个例外另有 vitest）。
 * 通过率门禁：pass / (pass + migration-fail) >= 95%。
 *
 * 用法：
 *   NODE_PATH=/tmp/contract-harness/stubs/node_modules node scripts/contract-check.mjs [--only a,b,c] [--json]
 */
import { readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(SCRIPT_DIR, "..");
const OLD_DIR = "/home/hatch/workspace/music-api-audit/repos/api-enhanced/module";
const NEW_DIR = path.join(APP_DIR, "dist/modules");

// ---------------------------------------------------------------- 跳过名单
/** name -> reason */
const SKIP = new Map([
	// --- 3 个明确例外（另有 vitest 覆盖，不在此比对）
	["login_qr_create", "exception: needs qrcode package (covered by vitest)"],
	["register_checktoken_v2", "exception: needs jsdom+watchman (covered by vitest)"],
	["register_checktoken_v3", "exception: uses global fetch (covered by vitest)"],
	// --- 真实网络（任一侧发起外部 HTTP，结果不可复现）
	["related_playlist", "real network: fetches music.163.com HTML page"],
	["voice_upload", "real network: multipart upload via fetch"],
	["audio_match", "real network: audio fingerprint fetch"],
	["cloud_upload_token", "real network: wanproxy.127.net lbs fetch"],
	["register_xeapikey", "real network: xeapi public-key fetch"],
	// --- 缺失可选依赖
	["cloud", "missing optional dep: music-metadata not in v2 workspace"],
	["verify_getQr", "missing optional dep: qrcode not in v2 workspace"],
	// --- 有意分歧：新实现无 unblock 依赖时优雅降级，旧实现硬 require 直接抛错
	["song_url_v1", "intentional divergence: graceful degradation without unblock dep"],
	["song_url_match", "intentional divergence: graceful degradation without unblock dep"],
	// --- 旧实现依赖 crypto-js + node-forge（审计仓库无 node_modules）；
	//     加密原语已由 P1 golden vectors 覆盖，模块层只是薄分发
	["decrypt", "old needs crypto-js+node-forge (absent); crypto covered by P1 golden vectors"],
	["eapi_decrypt", "old needs crypto-js+node-forge (absent); crypto covered by P1 golden vectors"],
	// --- 旧实现需要 axios（审计仓库无 node_modules），且均为真实网络上传
	["avatar_upload", "real network: multipart upload (old plugins/upload.js needs axios)"],
	["playlist_cover_update", "real network: multipart upload (old plugins/upload.js needs axios)"],
	["scrobble_v1", "real network: NCBL PLV/PLD upload (old util/ncbl.js needs axios); NCBL crypto covered by ncm-core ncbl.test.ts"],
]);

// ---------------------------------------------------------------- 确定性时间
// 冻结 Date.now()/new Date()，消除 exposureTime/signDayTime 等时间戳造成的 1ms 抖动
const FIXED_NOW = 1727654321000;
const _RealDate = Date;
class _FixedDate extends _RealDate {
	constructor(...args) {
		super(...(args.length ? args : [FIXED_NOW]));
	}
	static now() {
		return FIXED_NOW;
	}
}
globalThis.Date = _FixedDate;

// ---------------------------------------------------------------- 确定性随机
let _seed = 0xC0FFEE;
function resetRandom() {
	_seed = 0xC0FFEE;
	Math.random = () => {
		_seed |= 0;
		_seed = (_seed + 0x6d2b79f5) | 0;
		let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// ---------------------------------------------------------------- 序列化
function serialize(v) {
	return JSON.parse(
		JSON.stringify(v, (_k, val) => {
			if (typeof val === "bigint") return `__bigint__${val}`;
			if (typeof val === "function") return "__function__";
			if (val && val.type === "Buffer" && Array.isArray(val.data)) {
				return `__buffer__${Buffer.from(val.data).toString("hex")}`;
			}
			return val;
		}) ?? "null",
	);
}

/** 归一化已知无害差异：版本号（inner_version 返回各自 package.json 的版本） */
function normalize(s) {
	return s.replace(/\b\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?\b/g, "<ver>");
}

// ---------------------------------------------------------------- stub request
const CANNED = {
	status: 200,
	body: {
		code: 200,
		data: [{ code: 200, id: 123456 }],
		songs: [],
		tracks: [],
		result: {},
		playlist: {},
		profile: {},
		account: {},
	},
	cookie: ["MUSIC_U=canned"],
};

function makeStub(calls) {
	return async (p, data, options) => {
		calls.push({
			path: p,
			data: serialize(data),
			options: serialize(options),
		});
		return structuredClone(CANNED);
	};
}

// ---------------------------------------------------------------- query
const BASE_QUERY = {
	id: "123456",
	ids: "1,2,3",
	type: "1",
	t: "1",
	limit: 30,
	offset: 0,
	cookie: "MUSIC_U=contract_test_cookie",
	keywords: "contract",
	phone: "13800000000",
	password: "contract_password",
	username: "contract_user",
	captcha: "1234",
	nickname: "contract_nick",
	msg: "contract_msg",
	content: "contract_content",
	cid: "999",
	rid: "888",
	pid: "777",
	uid: "666",
	sid: "555",
	br: "320000",
	level: "standard",
};

/** 少数模块需要特定字段才不会在 stub 响应上崩溃 */
const QUERY_OVERRIDES = {
	playlist_track_all: { op: "add", tracks: "[123456]", tracksJson: "" },
	playlist_tracks: { op: "add", tracks: "123456" },
	comment: { threadId: "R_SO_4_123456" },
	share_resource: { type: "song", msg: "hi" },
};

/** 超时保护 */
function withTimeout(promise, ms, label) {
	return Promise.race([
		promise,
		new Promise((_, reject) =>
			setTimeout(() => reject(new Error(`timeout:${label}`)), ms),
		),
	]);
}

async function runOne(modFn, query, calls) {
	resetRandom();
	const q = structuredClone(query);
	try {
		const ret = await withTimeout(
			Promise.resolve().then(() => modFn(q, makeStub(calls))),
			15000,
			"module",
		);
		return { ok: true, calls, ret: normalize(JSON.stringify(serialize(ret))) };
	} catch (e) {
		return {
			ok: false,
			calls,
			err: normalize(String((e && e.message) || e)),
		};
	}
}

function verdict(oldR, newR) {
	// 任一侧抛错：错误信息一致才算通过
	if (!oldR.ok || !newR.ok) {
		if (!oldR.ok && !newR.ok && oldR.err === newR.err) {
			return { pass: true, kind: "both-throw-identical" };
		}
		return {
			pass: false,
			kind: "harness-error",
			detail: `old: ${oldR.ok ? "ok" : oldR.err}\nnew: ${newR.ok ? "ok" : newR.err}`,
		};
	}
	const oldCalls = JSON.stringify(oldR.calls);
	const newCalls = JSON.stringify(newR.calls);
	if (oldR.calls.length > 0 || newR.calls.length > 0) {
		if (oldCalls === newCalls) return { pass: true, kind: "request-calls" };
		return {
			pass: false,
			kind: "migration-fail",
			detail: `request calls differ:\n--- old ---\n${oldCalls}\n--- new ---\n${newCalls}`,
		};
	}
	if (oldR.ret === newR.ret) return { pass: true, kind: "return-value" };
	return {
		pass: false,
		kind: "migration-fail",
		detail: `return values differ:\n--- old ---\n${oldR.ret}\n--- new ---\n${newR.ret}`,
	};
}

// ---------------------------------------------------------------- 主流程
const args = process.argv.slice(2);
const onlyIdx = args.indexOf("--only");
const onlySet = onlyIdx >= 0 ? new Set(args[onlyIdx + 1].split(",")) : null;
const asJson = args.includes("--json");

const names = readdirSync(OLD_DIR)
	.filter((f) => f.endsWith(".js"))
	.map((f) => f.slice(0, -3))
	.filter((n) => !SKIP.has(n) && (!onlySet || onlySet.has(n)))
	.sort();

const results = [];
for (const name of names) {
	const oldCalls = [];
	const newCalls = [];
	let status = "pass";
	let kind = "";
	let detail = "";
	try {
		const oldMod = (await import(pathToFileURL(path.join(OLD_DIR, `${name}.js`)).href)).default;
		const newMod = (
			await import(pathToFileURL(path.join(NEW_DIR, `${name}.js`)).href)
		).default;
		if (typeof oldMod !== "function" || typeof newMod !== "function") {
			throw new Error("default export is not a function");
		}
		const query = { ...BASE_QUERY, ...(QUERY_OVERRIDES[name] || {}) };
		const oldR = await runOne(oldMod, query, oldCalls);
		const newR = await runOne(newMod, query, newCalls);
		const v = verdict(oldR, newR);
		status = v.pass ? "pass" : "fail";
		kind = v.kind;
		detail = v.detail || "";
	} catch (e) {
		status = "fail";
		kind = "harness-error";
		detail = `load/runner error: ${String((e && e.message) || e)}`;
	}
	results.push({ name, status, kind, detail });
	if (!asJson && status === "fail") {
		console.log(`FAIL ${name} [${kind}]\n${detail.split("\n").slice(0, 12).join("\n")}\n`);
	}
}

const pass = results.filter((r) => r.status === "pass").length;
const fails = results.filter((r) => r.status === "fail");
const migFails = fails.filter((r) => r.kind === "migration-fail");
const harnessErrs = fails.filter((r) => r.kind !== "migration-fail");
const denom = pass + migFails.length;
const rate = denom ? ((pass / denom) * 100).toFixed(2) : "n/a";

const summary = {
	runnable: names.length,
	skipped: SKIP.size,
	pass,
	migrationFail: migFails.length,
	harnessError: harnessErrs.length,
	passRateExclHarness: `${rate}%`,
	gate: denom > 0 && pass / denom >= 0.95 ? "PASS" : "FAIL",
	failedModules: fails.map((r) => ({ name: r.name, kind: r.kind })),
	skippedModules: [...SKIP.entries()].map(([name, reason]) => ({ name, reason })),
};

if (asJson) {
	const { writeFileSync } = await import("node:fs");
	const outIdx = args.indexOf("--json-file");
	const outPath = outIdx >= 0 ? args[outIdx + 1] : "/tmp/contract-harness/result.json";
	writeFileSync(outPath, JSON.stringify({ summary, results }, null, 2));
	console.error(`json written to ${outPath}`);
} else {
	console.log("================ contract-check ================");
	console.log(`runnable: ${summary.runnable}, skipped: ${summary.skipped}`);
	console.log(`pass: ${pass}, migration-fail: ${migFails.length}, harness-error: ${harnessErrs.length}`);
	console.log(`pass rate (excl. harness): ${summary.passRateExclHarness}  gate(>=95%): ${summary.gate}`);
	if (harnessErrs.length) {
		console.log(`harness-errors: ${harnessErrs.map((r) => r.name).join(", ")}`);
	}
}

process.exit(summary.gate === "PASS" && harnessErrs.length === 0 ? 0 : 1);
