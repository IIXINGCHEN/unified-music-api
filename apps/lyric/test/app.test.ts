/**
 * P4 lyric 服务测试：Hono Node 版 app（src/index.ts）对
 * Lyric-Atlas-API/api/index.ts 的复刻。
 *
 * 全部使用 stub 的全局 fetch（不发真实网络请求），通过 app.request()
 * 验证：根端点、搜索（参数校验/配置校验/仓库命中/外部命中/缓存命中/
 * 未找到）、元数据端点、CORS、health。
 */
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import app from "../src/index.js";
import { lyricsCache, metadataCache } from "../src/cache.js";

const EXTERNAL_BASE = "https://ncm-stub.test/lyric";
const REPO_BASE =
	"https://raw.githubusercontent.com/Steve-XMH/amll-ttml-db/main/ncm-lyrics/";

// ---- stub state ----
const repoHeadOk = new Set<string>(); // "id.format" -> HEAD 200
const repoGetContent = new Map<string, string>(); // "id.format" -> GET body
let externalPayload: Record<string, unknown> = {};
let fetchCalls = 0;

function stubResponse(body: string, status: number) {
	return {
		ok: status >= 200 && status < 300,
		status,
		text: async () => body,
		json: async () => JSON.parse(body),
	};
}

async function mockFetch(
	input: string | URL,
	init?: { method?: string },
): Promise<unknown> {
	fetchCalls++;
	const url = String(input);
	const method = (init?.method || "GET").toUpperCase();
	if (url.startsWith(REPO_BASE)) {
		const rest = url.slice(REPO_BASE.length); // e.g. "111.ttml"
		if (method === "HEAD") {
			return stubResponse("", repoHeadOk.has(rest) ? 200 : 404);
		}
		const content = repoGetContent.get(rest);
		return content !== undefined
			? stubResponse(content, 200)
			: stubResponse("not found", 404);
	}
	if (url.startsWith(EXTERNAL_BASE)) {
		return stubResponse(JSON.stringify(externalPayload), 200);
	}
	return stubResponse("not found", 404);
}

beforeAll(() => {
	vi.stubGlobal("fetch", mockFetch as typeof fetch);
	process.env.EXTERNAL_NCM_API_URL = EXTERNAL_BASE;
});

afterEach(() => {
	lyricsCache.clear();
	metadataCache.clear();
	repoHeadOk.clear();
	repoGetContent.clear();
	externalPayload = {};
	fetchCalls = 0;
	process.env.EXTERNAL_NCM_API_URL = EXTERNAL_BASE;
	vi.restoreAllMocks();
});

describe("basic endpoints", () => {
	it("GET /health returns ok", async () => {
		const res = await app.request("/health");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ status: "ok", service: "lyric" });
	});

	it("GET /api returns running message", async () => {
		const res = await app.request("/api");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			message: "Lyric Atlas API is running.",
		});
	});

	it("OPTIONS /api/search answers CORS preflight", async () => {
		const res = await app.request("/api/search", {
			method: "OPTIONS",
			headers: { Origin: "https://example.com" },
		});
		expect(res.status).toBe(204);
		expect(res.headers.get("access-control-allow-origin")).toBe("*");
	});
});

describe("GET /api/search", () => {
	it("400 when id is missing", async () => {
		const res = await app.request("/api/search");
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.found).toBe(false);
		expect(body.error).toBe("Missing id parameter");
	});

	it("500 when EXTERNAL_NCM_API_URL is not configured", async () => {
		delete process.env.EXTERNAL_NCM_API_URL;
		const res = await app.request("/api/search?id=111");
		expect(res.status).toBe(500);
		const body = await res.json();
		expect(body.found).toBe(false);
		expect(body.error).toBe("Server configuration error.");
	});

	it("finds TTML in repository with highest priority", async () => {
		repoHeadOk.add("111.ttml");
		repoGetContent.set("111.ttml", "<ttml>lyrics</ttml>");
		// 外部 API 也有歌词，但仓库 TTML 优先级更高
		externalPayload = { lrc: { lyric: "[00:01.00]hi" } };

		const res = await app.request("/api/search?id=111");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.found).toBe(true);
		expect(body.id).toBe("111");
		expect(body.format).toBe("ttml");
		expect(body.source).toBe("repository");
		expect(body.content).toBe("<ttml>lyrics</ttml>");
	});

	it("second identical search is served from cache (no new fetch)", async () => {
		repoHeadOk.add("112.ttml");
		repoGetContent.set("112.ttml", "<ttml>cached</ttml>");
		externalPayload = {};

		const first = await app.request("/api/search?id=112");
		expect(first.status).toBe(200);
		const callsAfterFirst = fetchCalls;
		expect(callsAfterFirst).toBeGreaterThan(0);

		const second = await app.request("/api/search?id=112");
		expect(second.status).toBe(200);
		expect(await second.json()).toEqual(await first.json());
		expect(fetchCalls).toBe(callsAfterFirst);
	});

	it("fixedVersion=yrc falls back to external API with translation", async () => {
		externalPayload = {
			yrc: { lyric: "[00:01.00]hello" },
			tlyric: { lyric: "[00:01.00]你好" },
			romalrc: { lyric: "[00:01.00]ni hao" },
		};

		const res = await app.request("/api/search?id=222&fixedVersion=yrc");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.found).toBe(true);
		expect(body.format).toBe("yrc");
		expect(body.source).toBe("external");
		expect(body.content).toBe("[00:01.00]hello");
		expect(body.translation).toBe("[00:01.00]你好");
		expect(body.romaji).toBe("[00:01.00]ni hao");
	});

	it("404 when nothing is found anywhere", async () => {
		externalPayload = {};
		const res = await app.request("/api/search?id=999");
		expect(res.status).toBe(404);
		const body = await res.json();
		expect(body.found).toBe(false);
		expect(body.id).toBe("999");
		expect(typeof body.error).toBe("string");
	});
});

describe("GET /api/lyrics/meta", () => {
	it("400 when id is missing", async () => {
		const res = await app.request("/api/lyrics/meta");
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.found).toBe(false);
		expect(body.error).toBe("Missing id parameter");
	});

	it("reports available formats from repository HEAD checks", async () => {
		repoHeadOk.add("333.ttml");
		repoHeadOk.add("333.lrc");
		externalPayload = {};

		const res = await app.request("/api/lyrics/meta?id=333");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.found).toBe(true);
		expect(body.id).toBe("333");
		expect(body.availableFormats).toContain("ttml");
		expect(body.availableFormats).toContain("lrc");
		expect(body.hasTranslation).toBe(false);
		expect(body.hasRomaji).toBe(false);
	});

	it("reports external translation/romaji availability", async () => {
		externalPayload = {
			lrc: { lyric: "[00:01.00]x" },
			tlyric: { lyric: "[00:01.00]译" },
			romalrc: { lyric: "[00:01.00]roma" },
		};

		const res = await app.request("/api/lyrics/meta?id=444");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.found).toBe(true);
		expect(body.availableFormats).toContain("lrc");
		expect(body.hasTranslation).toBe(true);
		expect(body.hasRomaji).toBe(true);
	});
});
