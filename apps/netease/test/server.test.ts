/**
 * P3 服务端行为测试：Hono 版 constructServer() 对 api-enhanced/server.js 的复刻。
 *
 * 全部使用注入的 stub 模块（不经过真实模块、不发网络请求），通过
 * app.request() 验证：路由注册、CORS、cookie、缓存、错误信封、重定向、
 * noCookie、multipart 上传。
 */
import { existsSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
	constructServer,
	getModuleDefinitions,
	type NcmModuleDef,
} from "../src/server.js";

// biome-ignore lint/suspicious/noExplicitAny: stub modules are intentionally loose
type AnyFn = (...args: any[]) => Promise<any>;

const def = (route: string, module: AnyFn): NcmModuleDef => ({
	identifier: route,
	route,
	module: module as NcmModuleDef["module"],
});

const ok =
	(body: unknown = { code: 200 }) =>
	async () => ({ status: 200, body, cookie: [] });

describe("route registration", () => {
	it("registers injected moduleDefs on their routes", async () => {
		const app = await constructServer([
			def("/album/new", ok({ code: 200, ok: true })),
		]);
		const res = await app.request("/album/new");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ code: 200, ok: true });
	});

	it("handles all HTTP methods like app.all()", async () => {
		const app = await constructServer([def("/ping", ok())]);
		for (const method of ["GET", "POST", "PUT", "DELETE"]) {
			const res = await app.request("/ping", { method });
			expect(res.status).toBe(200);
		}
	});

	it("keeps /health", async () => {
		const app = await constructServer([]);
		const res = await app.request("/health");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ status: "ok", service: "netease" });
	});
});

describe("getModuleDefinitions()", () => {
	it("scans all 440 modules with _ → / mapping and special routes", async () => {
		const defs = await getModuleDefinitions();
		expect(defs.length).toBe(440);
		const byRoute = new Map(defs.map((d) => [d.route, d]));
		// special routes keep their underscores
		expect(byRoute.has("/daily_signin")).toBe(true);
		expect(byRoute.has("/fm_trash")).toBe(true);
		expect(byRoute.has("/personal_fm")).toBe(true);
		// default mapping: _ → /
		expect(byRoute.has("/album/new")).toBe(true);
		expect(byRoute.has("/login/qr/check")).toBe(true);
		for (const d of defs) expect(typeof d.module).toBe("function");
	});
});

describe("CORS", () => {
	it("reflects the request origin when CORS_ALLOW_ORIGIN is unset", async () => {
		const app = await constructServer([def("/ping", ok())]);
		const res = await app.request("/ping", {
			headers: { origin: "https://example.com" },
		});
		expect(res.headers.get("access-control-allow-origin")).toBe(
			"https://example.com",
		);
		expect(res.headers.get("access-control-allow-credentials")).toBe("true");
		expect(res.headers.get("vary")).toBeNull();
	});

	it("reflects a listed origin with Vary, omits unlisted ones", async () => {
		process.env.CORS_ALLOW_ORIGIN = "https://a.com, https://b.com";
		try {
			const app = await constructServer([def("/ping", ok())]);
			const listed = await app.request("/ping", {
				headers: { origin: "https://a.com" },
			});
			expect(listed.headers.get("access-control-allow-origin")).toBe(
				"https://a.com",
			);
			expect(listed.headers.get("vary")).toBe("Origin");
			// NOTE: a different URL avoids the 2-minute cache, whose key (like
			// the original apicache's) does not include the Origin header.
			const unlisted = await app.request("/ping?probe=evil", {
				headers: { origin: "https://evil.com" },
			});
			expect(unlisted.headers.get("access-control-allow-origin")).toBeNull();
		} finally {
			delete process.env.CORS_ALLOW_ORIGIN;
		}
	});

	it("answers OPTIONS preflight with 204", async () => {
		const app = await constructServer([def("/ping", ok())]);
		const res = await app.request("/ping", { method: "OPTIONS" });
		expect(res.status).toBe(204);
	});

	it("skips CORS headers on the root path", async () => {
		const app = await constructServer([]);
		const res = await app.request("/");
		expect(res.headers.get("access-control-allow-origin")).toBeNull();
	});
});

describe("cookie handling", () => {
	it("parses the Cookie header into query.cookie", async () => {
		let seen: unknown;
		const app = await constructServer([
			def("/ping", async (query: Record<string, unknown>) => {
				seen = query.cookie;
				return { status: 200, body: {}, cookie: [] };
			}),
		]);
		await app.request("/ping", { headers: { cookie: "MUSIC_A=abc; test=1" } });
		expect(seen).toEqual({ MUSIC_A: "abc", test: "1" });
	});

	it("converts a cookie string in query params via cookieToJson", async () => {
		let seen: unknown;
		const app = await constructServer([
			def("/ping", async (query: Record<string, unknown>) => {
				seen = query.cookie;
				return { status: 200, body: {}, cookie: [] };
			}),
		]);
		const encoded = encodeURIComponent("a=b; c=d");
		await app.request(`/ping?cookie=${encoded}`);
		// query.cookie overwrites the header-derived cookie object
		expect(seen).toEqual({ a: "b", c: "d" });
	});
});

describe("response cache", () => {
	it("serves the second identical GET from cache without calling the module", async () => {
		const handler = vi.fn(ok({ code: 200, n: 1 }));
		const app = await constructServer([def("/cached", handler)]);
		const first = await app.request("/cached");
		expect(first.status).toBe(200);
		const second = await app.request("/cached");
		expect(second.status).toBe(200);
		expect(await second.json()).toEqual({ code: 200, n: 1 });
		expect(handler).toHaveBeenCalledTimes(1);
		expect(second.headers.get("cache-control")).toMatch(/^max-age=\d+$/);
	});

	it("cache hits replay the first response's headers (CORS included)", async () => {
		// Parity with the original apicache: the cache key is URL + cookies,
		// NOT the Origin header, so a hit replays the first response's headers.
		const app = await constructServer([def("/cached-cors", ok())]);
		await app.request("/cached-cors", {
			headers: { origin: "https://first.com" },
		});
		const hit = await app.request("/cached-cors", {
			headers: { origin: "https://second.com" },
		});
		expect(hit.headers.get("access-control-allow-origin")).toBe(
			"https://first.com",
		);
	});

	it("keys the cache by cookies (different cookie → miss)", async () => {
		const handler = vi.fn(ok());
		const app = await constructServer([def("/cached", handler)]);
		await app.request("/cached", { headers: { cookie: "u=1" } });
		await app.request("/cached", { headers: { cookie: "u=2" } });
		expect(handler).toHaveBeenCalledTimes(2);
	});

	it("bypasses the cache with x-apicache-bypass", async () => {
		const handler = vi.fn(ok());
		const app = await constructServer([def("/cached", handler)]);
		await app.request("/cached");
		await app.request("/cached", {
			headers: { "x-apicache-bypass": "1" },
		});
		expect(handler).toHaveBeenCalledTimes(2);
	});
});

describe("set-cookie / noCookie", () => {
	const withCookies = async () => ({
		status: 200,
		body: { code: 200 },
		cookie: ["MUSIC_A=tok1; Path=/", "MUSIC_R=tok2; Path=/"],
	});

	it("appends Set-Cookie values on success", async () => {
		const app = await constructServer([def("/login", withCookies)]);
		const res = await app.request("/login");
		expect(res.headers.getSetCookie()).toEqual([
			"MUSIC_A=tok1; Path=/",
			"MUSIC_R=tok2; Path=/",
		]);
	});

	it("suppresses Set-Cookie when noCookie is set", async () => {
		const app = await constructServer([def("/login", withCookies)]);
		const res = await app.request("/login?noCookie=1");
		expect(res.headers.getSetCookie()).toEqual([]);
	});
});

describe("redirect", () => {
	it("returns redirectUrl with the module status", async () => {
		const app = await constructServer([
			def("/go", async () => ({
				status: 302,
				body: {},
				cookie: [],
				redirectUrl: "https://music.example/x",
			})),
		]);
		const res = await app.request("/go");
		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toBe("https://music.example/x");
	});
});

describe("error envelope", () => {
	it("returns the 404 envelope when the error has no body", async () => {
		const app = await constructServer([
			def("/boom", async () => {
				throw { status: 500 };
			}),
		]);
		const res = await app.request("/boom");
		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({ code: 404, data: null, msg: "Not Found" });
	});

	it("rewrites 301 code to 需要登录", async () => {
		const app = await constructServer([
			def("/need-login", async () => {
				throw { status: 301, body: { code: 301 }, cookie: [] };
			}),
		]);
		const res = await app.request("/need-login");
		expect(res.status).toBe(301);
		expect(await res.json()).toEqual({ code: 301, msg: "需要登录" });
	});

	it("passes module error bodies through with their status", async () => {
		const app = await constructServer([
			def("/bad", async () => {
				throw { status: 400, body: { code: 400, msg: "oops" }, cookie: [] };
			}),
		]);
		const res = await app.request("/bad");
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ code: 400, msg: "oops" });
	});
});

describe("request body parsing", () => {
	it("merges JSON bodies into the query", async () => {
		let seen: unknown;
		const app = await constructServer([
			def("/ping", async (query: Record<string, unknown>) => {
				seen = { id: query.id };
				return { status: 200, body: {}, cookie: [] };
			}),
		]);
		await app.request("/ping", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ id: 42 }),
		});
		expect(seen).toEqual({ id: 42 });
	});

	it("parses urlencoded bodies flatly", async () => {
		let seen: unknown;
		const app = await constructServer([
			def("/ping", async (query: Record<string, unknown>) => {
				seen = { a: query.a };
				return { status: 200, body: {}, cookie: [] };
			}),
		]);
		await app.request("/ping", {
			method: "POST",
			headers: { "content-type": "application/x-www-form-urlencoded" },
			body: "a=hello+world",
		});
		expect(seen).toEqual({ a: "hello world" });
	});
});

describe("multipart upload", () => {
	it("exposes files with Buffer data and a real temp file", async () => {
		let seen: unknown;
		const app = await constructServer([
			def("/upload", async (query: Record<string, unknown>) => {
				seen = query.songFile;
				return { status: 200, body: {}, cookie: [] };
			}),
		]);
		const form = new FormData();
		form.append(
			"songFile",
			new File([Buffer.from("fake-audio-bytes")], "song.mp3", {
				type: "audio/mpeg",
			}),
		);
		form.append("name", "mysong");
		const res = await app.request("/upload", { method: "POST", body: form });
		expect(res.status).toBe(200);
		const file = seen as {
			name: string;
			mimetype: string;
			data: Buffer;
			tempFilePath: string;
		};
		expect(file.name).toBe("song.mp3");
		expect(file.mimetype).toBe("audio/mpeg");
		expect(Buffer.isBuffer(file.data)).toBe(true);
		expect(file.data.toString()).toBe("fake-audio-bytes");
		expect(existsSync(file.tempFilePath)).toBe(true);
		await unlink(file.tempFilePath);
	});
});
