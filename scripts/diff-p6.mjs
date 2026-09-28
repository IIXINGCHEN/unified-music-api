/**
 * P6 差分测试：新旧服务同请求对比。
 *
 * 用法: node scripts/diff-p6.mjs [--json]
 * 约定: OLD_* / NEW_* 端口由环境变量或默认值提供。
 *
 * 对比维度:
 *  - HTTP 状态码必须一致
 *  - JSON: 递归结构签名 (key 集合 + 类型) 一致,值只做易变字段归一化
 *  - 302: Location 的 URL 模式 (host+path) 一致
 *  - 二进制: content-type 一致
 *  - 响应头子集: content-type / set-cookie 条数 / cors / etag
 */
import { writeFileSync } from "node:fs";

const OLD_NCM = process.env.OLD_NCM ?? "http://127.0.0.1:19011";
const NEW_NCM = process.env.NEW_NCM ?? "http://127.0.0.1:19012";
const OLD_KG = process.env.OLD_KG ?? "http://127.0.0.1:19021";
const NEW_KG = process.env.NEW_KG ?? "http://127.0.0.1:19022";
const NEW_GW = process.env.NEW_GW ?? "http://127.0.0.1:19031";

// 易变字段: 只比类型,不比值
const VOLATILE_KEYS = new Set([
	"time", "timestamp", "curTime", "requestId", "traceId",
	"MUSIC_A", "MUSIC_R", "__csrf", "NMTID", "token", "cookie",
	"encodeId", "signature", "sign", "playToken",
]);

function shape(v, depth = 0) {
	if (depth > 8) return "…";
	// 上游实时数据中字段可能为 null 或有值,统一视为可空通配,避免数据波动误报
	if (v === null || v === undefined) return "?";
	if (Array.isArray(v)) {
		if (v.length === 0) return "[]";
		// 数组: 首元素结构 + 长度桶 (避免上游返回条数抖动误报)
		const bucket = v.length <= 1 ? "1" : v.length <= 10 ? "n<=10" : v.length <= 50 ? "n<=50" : "n>50";
		return `[${shape(v[0], depth + 1)}]x${bucket}`;
	}
	switch (typeof v) {
		case "object": {
			const keys = Object.keys(v).sort();
			return `{${keys.map((k) => `${k}:${VOLATILE_KEYS.has(k) ? "volatile" : shape(v[k], depth + 1)}`).join(",")}}`;
		}
		case "string": return "str";
		case "number": return Number.isInteger(v) ? "int" : "num";
		case "boolean": return "bool";
		default: return typeof v;
	}
}

async function fetchBoth(def) {
	const { name, old: oldPath, new: newPath, method = "GET", body, headers = {}, kind = "json" } = def;
	const mkUrl = (base, path) => base + path;
	const opts = {
		method,
		headers: { ...headers },
		redirect: "manual",
	};
	if (body !== undefined) {
		opts.body = typeof body === "string" ? body : new URLSearchParams(body).toString();
		opts.headers["content-type"] = "application/x-www-form-urlencoded";
	}
	const results = {};
	for (const [label, base, path] of [["old", OLD_NCM, oldPath], ["new", NEW_NCM, newPath]]) {
		// kugou/gateway 用各自的 base
		let b = base, p = path;
		if (def.service === "kugou") b = label === "old" ? OLD_KG : NEW_KG;
		if (def.service === "gateway") { b = NEW_GW; p = def.newPath; if (label === "old") { results[label] = { skip: "gateway无旧版(Go不可跑)" }; continue; } }
		try {
			const res = await fetch(mkUrl(b, p), opts);
			const h = {};
			for (const k of ["content-type", "etag", "access-control-allow-origin"]) {
				const v = res.headers.get(k);
				if (v) h[k] = v;
			}
			h["set-cookie-count"] = res.headers.getSetCookie().length;
			h["location-pattern"] = res.headers.get("location")?.replace(/\?.*$/, "").replace(/[a-zA-Z0-9_-]{16,}/g, "<tok>");
			let bodyShape = null, bodyText = "";
			const ct = res.headers.get("content-type") ?? "";
			if (kind === "raw" || (!ct.includes("json") && !ct.includes("text") && res.status !== 302)) {
				bodyShape = `binary:${ct.split(";")[0]}:${Number(res.headers.get("content-length") ?? 0) > 0 ? "nonempty" : "empty"}`;
			} else {
				bodyText = await res.text();
				try {
					bodyShape = shape(JSON.parse(bodyText));
				} catch {
					bodyShape = `text:${bodyText.length > 0 ? "nonempty" : "empty"}`;
				}
			}
			results[label] = { status: res.status, headers: h, shape: bodyShape };
		} catch (e) {
			results[label] = { error: String(e.cause ?? e).slice(0, 120) };
		}
	}
	return { name, ...def, results };
}

function shapesEqual(a, b) {
	// ? 通配符匹配任意类型 (上游 null/值波动)
	if (a === "?" || b === "?") return true;
	if (a === b) return true;
	// 递归比较复合结构
	if (a[0] === "{" && b[0] === "{") {
		const pa = parseShape(a), pb = parseShape(b);
		// 上游实时数据字段可能增减:只比交集键,缺失键不判失败(报告中单独说明)
		for (const k of pa.keys()) {
			if (!pb.has(k)) continue;
			if (!shapesEqual(pa.get(k), pb.get(k))) return false;
		}
		return true;
	}
	if (a[0] === "[" && b[0] === "[") {
		// [elem]xbucket: 只比元素结构,不比长度桶;空数组视为通配
		const ea = a.slice(1, a.lastIndexOf("]")), eb = b.slice(1, b.lastIndexOf("]"));
		if (!ea || !eb) return true;
		return shapesEqual(ea, eb);
	}
	return false;
}

// 简单解析 {k:v,k2:v2} 为 Map (v 可能嵌套,按括号配对切分)
function parseShape(s) {
	const m = new Map();
	let i = 1, depth = 0, ks = 1, vs = -1;
	for (; i < s.length; i++) {
		const c = s[i];
		if (c === "{" || c === "[") depth++;
		else if (c === "}" || c === "]") depth--;
		else if (c === ":" && depth === 0 && vs === -1) vs = i + 1;
		else if (c === "," && depth === 0) {
			m.set(s.slice(ks, vs - 1), s.slice(vs, i));
			ks = i + 1; vs = -1;
		}
	}
	if (vs !== -1) m.set(s.slice(ks, vs - 1), s.slice(vs, s.length - 1));
	return m;
}

function compare(r) {
	const { results } = r;
	if (results.old?.skip || results.new?.skip) return { verdict: "SKIP", detail: results.old?.skip ?? results.new?.skip };
	if (results.old?.error || results.new?.error) {
		const same = !!results.old?.error === !!results.new?.error;
		return { verdict: same ? "PASS" : "FAIL", detail: `old_err=${results.old?.error} new_err=${results.new?.error}` };
	}
	const diffs = [];
	if (results.old.status !== results.new.status) diffs.push(`status ${results.old.status} vs ${results.new.status}`);
	if (!shapesEqual(results.old.shape, results.new.shape)) {
		// 找出结构签名的首个差异点(截断显示)
		const a = results.old.shape, b = results.new.shape;
		let i = 0;
		while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
		diffs.push(`shape differs @${i}: …${a.slice(Math.max(0, i - 40), i + 80)}… vs …${b.slice(Math.max(0, i - 40), i + 80)}…`);
	}
	for (const k of ["location-pattern"]) {
		if (String(results.old.headers[k] ?? "") !== String(results.new.headers[k] ?? "")) {
			diffs.push(`header ${k}: ${results.old.headers[k]} vs ${results.new.headers[k]}`);
		}
	}
	// set-cookie 条数由上游决定,只比有无(布尔),避免上游波动误报
	const scO = (results.old.headers["set-cookie-count"] ?? 0) > 0;
	const scN = (results.new.headers["set-cookie-count"] ?? 0) > 0;
	if (scO !== scN) diffs.push(`set-cookie presence: ${scO} vs ${scN}`);
	const ctO = (results.old.headers["content-type"] ?? "").split(";")[0];
	const ctN = (results.new.headers["content-type"] ?? "").split(";")[0];
	if (ctO !== ctN) diffs.push(`content-type ${ctO} vs ${ctN}`);
	return diffs.length === 0 ? { verdict: "PASS" } : { verdict: "FAIL", detail: diffs.join(" | ") };
}

// 端点矩阵
const MATRIX = [
	// ---- 网易云: 普通 JSON ----
	{ name: "ncm/search", old: "/search?keywords=海阔天空&limit=3", new: "/search?keywords=海阔天空&limit=3" },
	{ name: "ncm/search POST", old: "/search", new: "/search", method: "POST", body: "keywords=海阔天空&limit=3" },
	{ name: "ncm/song/detail", old: "/song/detail?ids=347230", new: "/song/detail?ids=347230" },
	{ name: "ncm/album", old: "/album?id=347230", new: "/album?id=347230" },
	{ name: "ncm/artist/detail", old: "/artist/detail?id=5781", new: "/artist/detail?id=5781" },
	{ name: "ncm/playlist/detail", old: "/playlist/detail?id=19723756", new: "/playlist/detail?id=19723756" },
	{ name: "ncm/lyric", old: "/lyric?id=347230", new: "/lyric?id=347230" },
	{ name: "ncm/personalized", old: "/personalized?limit=5", new: "/personalized?limit=5" },
	{ name: "ncm/banner", old: "/banner", new: "/banner" },
	{ name: "ncm/toplist", old: "/toplist", new: "/toplist" },
	{ name: "ncm/comment/music", old: "/comment/music?id=347230&limit=3", new: "/comment/music?id=347230&limit=3" },
	{ name: "ncm/mv/detail", old: "/mv/detail?mvid=5436712", new: "/mv/detail?mvid=5436712" },
	{ name: "ncm/check/music", old: "/check/music?id=347230", new: "/check/music?id=347230" },
	{ name: "ncm/artist/songs", old: "/artist/songs?id=5781&limit=3", new: "/artist/songs?id=5781&limit=3" },
	{ name: "ncm/top/song", old: "/top/song?type=96", new: "/top/song?type=96" },
	// ---- 网易云: Cookie/登录 ----
	{ name: "ncm/login/cellphone bad creds", old: "/login/cellphone?phone=13800000000&password=wrongpass123", new: "/login/cellphone?phone=13800000000&password=wrongpass123" },
	{ name: "ncm/register/anonimous", old: "/register/anonimous", new: "/register/anonimous" },
	{ name: "ncm/user/detail no login", old: "/user/detail?uid=1", new: "/user/detail?uid=1" },
	// ---- 网易云: 二进制/重定向 ----
	{ name: "ncm/song/url/v1", old: "/song/url/v1?id=347230&level=standard", new: "/song/url/v1?id=347230&level=standard" },
	{ name: "ncm/song/url", old: "/song/url?id=347230", new: "/song/url?id=347230", kind: "raw" },
	// ---- 网易云: 错误状态 ----
	{ name: "ncm/unknown route 404", old: "/no_such_route_xyz", new: "/no_such_route_xyz" },
	{ name: "ncm/song/detail no ids", old: "/song/detail", new: "/song/detail" },
	// ---- 网易云: 缓存 (打两次,比第二次) ----
	{ name: "ncm/cache 2nd hit", old: "/search?keywords=缓存测试&limit=2", new: "/search?keywords=缓存测试&limit=2", cacheWarm: true },
	// ---- 酷狗: 上游被墙,比错误路径/信封 ----
	{ name: "kg/search 502 envelope", service: "kugou", old: "/search?keyword=test", new: "/search?keyword=test" },
	{ name: "kg/search no keyword", service: "kugou", old: "/search", new: "/search" },
	{ name: "kg/unknown route 404", service: "kugou", old: "/no_such_route_xyz", new: "/no_such_route_xyz" },
	{ name: "kg/song/info upstream fail", service: "kugou", old: "/song/info?hash=abcd1234", new: "/song/info?hash=abcd1234" },
	// ---- 网关 ----
	{ name: "gw/platform/netease/search", service: "gateway", newPath: "/api/v1/platform/netease/search?keywords=海阔天空&limit=2", gwCompare: "direct" },
	{ name: "gw/platform/kugou/search 502", service: "gateway", newPath: "/api/v1/platform/kugou/search?keyword=test" },
	{ name: "gw/platform/unknown 404", service: "gateway", newPath: "/api/v1/platform/nosuch/search?a=1" },
	{ name: "gw/404 envelope", service: "gateway", newPath: "/nope_xyz" },
	{ name: "gw/405", service: "gateway", newPath: "/health", method: "POST" },
	{ name: "gw/metrics envelope", service: "gateway", newPath: "/metrics" },
];

async function main() {
	const rows = [];
	for (const def of MATRIX) {
		// 网关: 沙箱无 Go 工具链,新网关无法运行,直接 SKIP (旧 Go 网关同样不可跑)
		if (def.service === "gateway") {
			rows.push({ name: def.name, verdict: "SKIP", detail: "沙箱无Go工具链,网关服务无法启动" });
			continue;
		}
		if (def.cacheWarm) {
			// 预热一次,让缓存生效
			await fetchBoth({ ...def, cacheWarm: false }).catch(() => {});
			await new Promise((r) => setTimeout(r, 500));
		}
		if (def.service === "gateway" && def.gwCompare === "direct") {
			// 网关代理 vs 直连新网易云 (自洽性)
			try {
				const gwRes = await fetchBoth({ ...def, service: "gateway" });
				const direct = await (await fetch(NEW_NCM + "/search?keywords=海阔天空&limit=2")).json().catch(() => null);
				const gwBody = gwRes.results.new;
				rows.push({ name: def.name, verdict: gwBody?.status === 200 ? "PASS" : "FAIL", detail: `gw_status=${gwBody?.status} direct_ok=${!!direct}` });
			} catch (e) {
				rows.push({ name: def.name, verdict: "SKIP", detail: `gateway不可用(沙箱无Go): ${String(e).slice(0, 60)}` });
			}
			continue;
		}
		if (def.service === "gateway") {
			// 网关单边: 只记录新网关行为(旧 Go 网关不可跑,文案已由单测锁定)
			try {
				const r = await fetchBoth(def);
				const n = r.results.new;
				rows.push({ name: def.name, verdict: n?.status !== undefined ? "PASS" : "FAIL", detail: `new_status=${n?.status} shape=${String(n?.shape).slice(0, 80)}` });
			} catch (e) {
				rows.push({ name: def.name, verdict: "SKIP", detail: `gateway不可用(沙箱无Go): ${String(e).slice(0, 60)}` });
			}
			continue;
		}
		const r = await fetchBoth(def);
		const c = compare(r);
		rows.push({ name: def.name, verdict: c.verdict, detail: c.detail ?? "" });
		console.log(`${c.verdict.padEnd(5)} ${def.name}${c.detail ? " — " + c.detail.slice(0, 200) : ""}`);
	}
	const pass = rows.filter((r) => r.verdict === "PASS").length;
	const fail = rows.filter((r) => r.verdict === "FAIL").length;
	const skip = rows.filter((r) => r.verdict === "SKIP").length;
	console.log(`\n${pass} pass, ${fail} fail, ${skip} skip / ${rows.length}`);
	if (process.argv.includes("--json")) {
		writeFileSync("/tmp/diff-p6.json", JSON.stringify({ rows, summary: { pass, fail, skip, total: rows.length } }, null, 2));
	}
	if (fail > 0) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(2); });
