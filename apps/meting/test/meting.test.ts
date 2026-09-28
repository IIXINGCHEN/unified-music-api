/**
 * Meting service tests — app.request() against the TS port.
 * Upstream fetch is stubbed; no real network is used.
 */

import { Hono } from "hono";
import { afterEach, describe, expect, test } from "vitest";
import { createApp } from "../src/app.js";
import { Providers } from "../src/providers/index.js";
import type { ProviderHandle } from "../src/providers/types.js";
import { createApiHandler, type ProviderSource } from "../src/service/api.js";
import { format } from "../src/util.js";

const app = createApp();

/**
 * 测试用桩上游地址：fetch 已被 stub，不产生真实网络请求，
 * 但 provider 需要非空 base 才会走到 fetch 调用。
 */
process.env.SPOTIFY_API ??= "http://stub.test/";
process.env.YT_API ??= "http://stub.test/";

/**
 * Branch tests inject a fake provider whose support_type covers url/pic/lrc.
 * (With the real registry those types 400 for spotify/ytmusic — identical to
 * the original, where the branches were only reachable via the dropped
 * tencent/netease providers.)
 */
function branchApp(canned: unknown): Hono {
	const fake: ProviderHandle = {
		handle: async () => canned,
		support_type: ["url", "pic", "lrc", "song", "playlist"],
	};
	const source: ProviderSource = {
		get_provider_list: () => ["fake"],
		get: (name: string) => (name === "fake" ? fake : undefined),
	};
	const branch = new Hono();
	branch.get("/api", createApiHandler(source));
	return branch;
}

const realFetch = globalThis.fetch;

function stubFetch(impl: (url: string) => Response | Promise<Response>): void {
	globalThis.fetch = (async (input: unknown) =>
		impl(String(input))) as typeof fetch;
}

afterEach(() => {
	globalThis.fetch = realFetch;
});

const jsonResponse = (data: unknown): Response =>
	new Response(JSON.stringify(data), {
		headers: { "content-type": "application/json" },
	});

describe("provider registry", () => {
	test("lists exactly spotify + ytmusic", () => {
		const p = new Providers();
		expect(p.get_provider_list().sort()).toEqual(["spotify", "ytmusic"]);
	});

	test("each provider supports song and playlist", () => {
		const p = new Providers();
		for (const name of p.get_provider_list()) {
			const provider = p.get(name);
			expect(provider?.support_type).toContain("song");
			expect(provider?.support_type).toContain("playlist");
		}
	});

	test("unsupported type returns -1", async () => {
		const p = new Providers();
		stubFetch(() => jsonResponse({}));
		expect(await p.get("spotify")?.handle("url", "x")).toBe(-1);
		expect(await p.get("ytmusic")?.handle("lrc", "x")).toBe(-1);
	});
});

describe("GET /api parameter validation", () => {
	test("invalid server → 400", async () => {
		const res = await app.request("/api?server=tencent&type=song&id=1");
		expect(res.status).toBe(400);
		const body = (await res.json()) as { message: string };
		expect(body.message).toBe("server 参数不合法");
	});

	test("invalid type → 400", async () => {
		const res = await app.request("/api?server=spotify&type=nope&id=1");
		expect(res.status).toBe(400);
	});

	test("default server is spotify", async () => {
		let seenUrl = "";
		stubFetch((url) => {
			seenUrl = url;
			return jsonResponse([]);
		});
		const res = await app.request("/api?type=song&id=abc");
		expect(res.status).toBe(200);
		expect(seenUrl).toContain("server=spotify");
		expect(seenUrl).toContain("type=song");
		expect(seenUrl).toContain("id=abc");
	});
});

describe("GET /api type branches", () => {
	test("url: empty upstream → 403 {error:'no url'}", async () => {
		const res = await branchApp("").request("/api?server=fake&type=url&id=1");
		expect(res.status).toBe(403);
		expect(await res.json()).toEqual({ error: "no url" });
	});

	test("url: @-prefixed → text body", async () => {
		const res = await branchApp("@https://cdn.example/x.mp3").request(
			"/api?server=fake&type=url&id=1",
		);
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("@https://cdn.example/x.mp3");
	});

	test("url: http url → 302 redirect", async () => {
		const res = await branchApp("https://cdn.example/x.mp3").request(
			"/api?server=fake&type=url&id=1",
		);
		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toBe("https://cdn.example/x.mp3");
	});

	test("pic → 302 redirect", async () => {
		const res = await branchApp("https://cdn.example/x.jpg").request(
			"/api?server=fake&type=pic&id=1",
		);
		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toBe("https://cdn.example/x.jpg");
	});

	test("lrc → formatted text", async () => {
		const res = await branchApp({
			lyric: "[00:01.00]hello",
			tlyric: "[00:01.00]你好",
		}).request("/api?server=fake&type=lrc&id=1");
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("[00:01.000]hello (你好)");
	});

	test("url/pic/lrc via spotify → 400 (faithful to original)", async () => {
		stubFetch(() => jsonResponse("https://cdn.example/x.mp3"));
		for (const type of ["url", "pic", "lrc"]) {
			const res = await app.request(`/api?server=spotify&type=${type}&id=1`);
			expect(res.status).toBe(400);
		}
	});

	test("song list: url/pic/lrc ids filled as full api urls", async () => {
		stubFetch(() =>
			jsonResponse([
				{
					name: "t",
					url: "abc123",
					pic: "https://cdn.example/x.jpg",
					lrc: "@raw",
				},
			]),
		);
		const res = await app.request("/api?server=spotify&type=song&id=1");
		expect(res.status).toBe(200);
		const list = (await res.json()) as Array<{
			url: string;
			pic: string;
			lrc: string;
		}>;
		expect(list[0].url).toBe(
			"http://localhost/api?server=spotify&type=url&id=abc123",
		);
		// already-absolute and @-prefixed values are left untouched
		expect(list[0].pic).toBe("https://cdn.example/x.jpg");
		expect(list[0].lrc).toBe("@raw");
	});
});

describe("pages", () => {
	test("GET /test → demo html", async () => {
		const res = await app.request("/test");
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("meting-js");
		expect(html).toContain('server="spotify"');
	});

	test("GET / → status page", async () => {
		const res = await app.request("/");
		expect(res.status).toBe(200);
		expect(await res.text()).toContain("Meting API");
	});

	test("GET /health → ok", async () => {
		const res = await app.request("/health");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ status: "ok", service: "meting" });
	});
});

describe("lyric format util", () => {
	test("merges translation by timestamp", () => {
		expect(format("[00:01.00]hello", "[00:01.00]你好")).toBe(
			"[00:01.000]hello (你好)",
		);
	});

	test("no translation → original returned as-is", () => {
		expect(format("[00:01.00]hello", "")).toBe("[00:01.00]hello");
	});
});
