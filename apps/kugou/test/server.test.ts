/**
 * P3 kugou server tests — Hono port of KuGouMusicApi/server.js.
 * All modules are stubbed (no real network); route registration is verified
 * against the real module directory.
 */

import type { KgQuery, KgRequestFn, KgResponse } from "@music-api/kugou-core";
import { describe, expect, it } from "vitest";
import {
	constructServer,
	getModuleDefinitions,
	type LoadedModuleDef,
} from "../src/server.js";

const okModule = (
	seen: KgQuery[],
	respond: (q: KgQuery) => KgResponse = (q) => ({
		status: 200,
		body: { ok: true, keys: Object.keys(q).sort() },
		cookie: [],
	}),
) => {
	const fn = async (query: KgQuery, _request: KgRequestFn) => {
		seen.push(query);
		return respond(query);
	};
	return fn;
};

const def = (
	route: string,
	module: LoadedModuleDef["module"],
	identifier = route.replace(/\//g, "_").replace(/^_/, ""),
): LoadedModuleDef => ({ identifier, route, file: `<stub>${route}`, module });

/** Fixed platform cookies → deterministic apicache keys (the injected
 *  KUGOU_API_WEBGL is random per request in both the original and the port). */
const PLATFORM_COOKIES =
	"KUGOU_API_PLATFORM=x; KUGOU_API_MID=m1; KUGOU_API_GUID=g1; " +
	"KUGOU_API_DEV=d1; KUGOU_API_MAC=02:00:00:00:00:00; KUGOU_API_WEBGL=w1";

describe("getModuleDefinitions", () => {
	it("registers 226 public routes and skips _ helpers", async () => {
		const defs = await getModuleDefinitions();
		expect(defs).toHaveLength(226);
		expect(defs.some((d) => d.identifier.startsWith("_"))).toBe(false);
		expect(defs.some((d) => d.route === "/search")).toBe(true);
		expect(defs.some((d) => d.route === "/login/qr/create")).toBe(true);
	});
});

describe("platform cookie injection", () => {
	it("injects KUGOU_API_* cookies and writes them back via Set-Cookie", async () => {
		const seen: KgQuery[] = [];
		const app = await constructServer([def("/t/ping", okModule(seen))]);
		const res = await app.request("/t/ping");
		expect(res.status).toBe(200);
		const setCookies = res.headers.getSetCookie();
		for (const key of [
			"KUGOU_API_PLATFORM",
			"KUGOU_API_MID",
			"KUGOU_API_GUID",
			"KUGOU_API_DEV",
			"KUGOU_API_MAC",
			"KUGOU_API_WEBGL",
		]) {
			expect(setCookies.some((c) => c.startsWith(`${key}=`))).toBe(true);
		}
		const cookie = seen[0].cookie as Record<string, string>;
		expect(cookie.KUGOU_API_MID).toBeTruthy();
		expect(cookie.KUGOU_API_DEV).toMatch(/^[0-9A-Z]{10}$/);
		expect(cookie.KUGOU_API_MAC).toBe("02:00:00:00:00:00");
	});

	it("does not override client-provided cookies", async () => {
		const seen: KgQuery[] = [];
		const app = await constructServer([def("/t/ping", okModule(seen))]);
		const res = await app.request("/t/ping", {
			headers: { Cookie: "KUGOU_API_MAC=11:22:33:44:55:66" },
		});
		const setCookies = res.headers.getSetCookie();
		expect(setCookies.some((c) => c.startsWith("KUGOU_API_MAC="))).toBe(false);
		expect((seen[0].cookie as Record<string, string>).KUGOU_API_MAC).toBe(
			"11:22:33:44:55:66",
		);
	});
});

describe("query / body merging", () => {
	it("merges query params and converts cookie strings", async () => {
		const seen: KgQuery[] = [];
		const app = await constructServer([def("/t/ping", okModule(seen))]);
		await app.request("/t/ping?a=1&cookie=a%3D1%3Bb%3D2", {
			headers: { Cookie: PLATFORM_COOKIES },
		});
		expect(seen[0].a).toBe("1");
		const cookie = seen[0].cookie as Record<string, unknown>;
		expect(cookie.a).toBe("1");
		expect(cookie.b).toBe("2");
		expect(cookie.KUGOU_API_MID).toBe("m1");
	});

	it("merges JSON bodies", async () => {
		const seen: KgQuery[] = [];
		const app = await constructServer([def("/t/ping", okModule(seen))]);
		await app.request("/t/ping", {
			method: "POST",
			headers: { "Content-Type": "application/json", Cookie: PLATFORM_COOKIES },
			body: JSON.stringify({ foo: "bar" }),
		});
		expect(seen[0].foo).toBe("bar");
	});

	it("merges urlencoded bodies", async () => {
		const seen: KgQuery[] = [];
		const app = await constructServer([def("/t/ping", okModule(seen))]);
		await app.request("/t/ping", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Cookie: PLATFORM_COOKIES,
			},
			body: "x=9&y=10",
		});
		expect(seen[0].x).toBe("9");
		expect(seen[0].y).toBe("10");
	});

	it("wraps octet-stream bodies as { data: Buffer }", async () => {
		const seen: KgQuery[] = [];
		const app = await constructServer([def("/t/ping", okModule(seen))]);
		const payload = Buffer.from([1, 2, 3, 4]);
		await app.request("/t/ping", {
			method: "POST",
			headers: {
				"Content-Type": "application/octet-stream",
				Cookie: PLATFORM_COOKIES,
			},
			body: payload,
		});
		const data = (seen[0] as Record<string, unknown>).data;
		expect(Buffer.isBuffer(data)).toBe(true);
		expect([...(data as Buffer)]).toEqual([1, 2, 3, 4]);
	});

	it("merges the Authorization header into cookies", async () => {
		const seen: KgQuery[] = [];
		const app = await constructServer([def("/t/ping", okModule(seen))]);
		await app.request("/t/ping", {
			headers: {
				Authorization: "token=abc;userid=123",
				Cookie: PLATFORM_COOKIES,
			},
		});
		const cookie = seen[0].cookie as Record<string, string>;
		expect(cookie.token).toBe("abc");
		expect(cookie.userid).toBe("123");
	});

	it("keeps app.use prefix-matching semantics", async () => {
		const seen: KgQuery[] = [];
		const app = await constructServer([def("/t/ping", okModule(seen))]);
		const res = await app.request("/t/ping/extra", {
			headers: { Cookie: PLATFORM_COOKIES },
		});
		expect(res.status).toBe(200);
		expect(seen).toHaveLength(1);
	});
});

describe("cookies on success", () => {
	it("appends module cookies with PATH=/ on http", async () => {
		const app = await constructServer([
			def(
				"/t/ping",
				okModule([], () => ({ status: 200, body: {}, cookie: ["sid=xyz"] })),
			),
		]);
		const res = await app.request("http://localhost/t/ping", {
			headers: { Cookie: PLATFORM_COOKIES },
		});
		expect(res.headers.getSetCookie()).toContain("sid=xyz; PATH=/");
	});

	it("adds SameSite=None; Secure on https", async () => {
		const app = await constructServer([
			def(
				"/t/ping",
				okModule([], () => ({ status: 200, body: {}, cookie: ["sid=xyz"] })),
			),
		]);
		const res = await app.request("https://localhost/t/ping", {
			headers: { Cookie: PLATFORM_COOKIES },
		});
		expect(res.headers.getSetCookie()).toContain(
			"sid=xyz; PATH=/; SameSite=None; Secure",
		);
	});

	it("suppresses module cookies when noCookie is set", async () => {
		const app = await constructServer([
			def(
				"/t/ping",
				okModule([], () => ({ status: 200, body: {}, cookie: ["sid=xyz"] })),
			),
		]);
		const res = await app.request("/t/ping?noCookie=1", {
			headers: { Cookie: PLATFORM_COOKIES },
		});
		expect(res.headers.getSetCookie().some((c) => c.startsWith("sid="))).toBe(
			false,
		);
	});

	it("passes upstream headers through", async () => {
		const app = await constructServer([
			def(
				"/t/ping",
				okModule([], () => ({
					status: 200,
					body: { ok: true },
					cookie: [],
					headers: { "ssa-code": "abc123" },
				})),
			),
		]);
		const res = await app.request("/t/ping", {
			headers: { Cookie: PLATFORM_COOKIES },
		});
		expect(res.headers.get("ssa-code")).toBe("abc123");
	});
});

describe("error handling", () => {
	it("returns the 404 envelope when the thrown error has no body", async () => {
		const app = await constructServer([
			def("/t/ping", async () => {
				throw { status: 500 };
			}),
		]);
		const res = await app.request("/t/ping", {
			headers: { Cookie: PLATFORM_COOKIES },
		});
		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({
			code: 404,
			data: null,
			msg: "Not Found",
		});
	});

	it("passes error status/body/headers through otherwise", async () => {
		const app = await constructServer([
			def("/t/ping", async () => {
				throw {
					status: 502,
					body: { code: 502, msg: "upstream" },
					headers: { "x-err": "1" },
					cookie: [],
				};
			}),
		]);
		const res = await app.request("/t/ping", {
			headers: { Cookie: PLATFORM_COOKIES },
		});
		expect(res.status).toBe(502);
		expect(await res.json()).toEqual({ code: 502, msg: "upstream" });
		expect(res.headers.get("x-err")).toBe("1");
	});
});

describe("CORS", () => {
	it("sets simple-mode CORS headers and answers OPTIONS with 204", async () => {
		const app = await constructServer([def("/t/ping", okModule([]))]);
		const res = await app.request("/t/ping", {
			headers: { Cookie: PLATFORM_COOKIES, Origin: "https://example.com" },
		});
		expect(res.headers.get("access-control-allow-origin")).toBe(
			"https://example.com",
		);
		expect(res.headers.get("access-control-allow-headers")).toContain(
			"Authorization",
		);
		expect(res.headers.get("content-type")).toContain("application/json");

		const preflight = await app.request("/t/ping", {
			method: "OPTIONS",
			headers: { Origin: "https://example.com" },
		});
		expect(preflight.status).toBe(204);
	});
});

describe("response cache", () => {
	it("caches 200 responses for identical URL+cookies", async () => {
		let calls = 0;
		const app = await constructServer([
			def("/t/ping", async () => {
				calls++;
				return { status: 200, body: { n: calls }, cookie: [] };
			}),
		]);
		const headers = { Cookie: PLATFORM_COOKIES };
		const r1 = await app.request("/t/ping", { headers });
		const r2 = await app.request("/t/ping", { headers });
		expect(calls).toBe(1);
		expect(await r1.json()).toEqual(await r2.json());
	});

	it("uses different cache entries for different cookies", async () => {
		let calls = 0;
		const app = await constructServer([
			def("/t/ping", async () => {
				calls++;
				return { status: 200, body: { n: calls }, cookie: [] };
			}),
		]);
		await app.request("/t/ping", { headers: { Cookie: PLATFORM_COOKIES } });
		await app.request("/t/ping", {
			headers: { Cookie: `${PLATFORM_COOKIES}; EXTRA=1` },
		});
		expect(calls).toBe(2);
	});

	it("honors x-apicache-bypass", async () => {
		let calls = 0;
		const app = await constructServer([
			def("/t/ping", async () => {
				calls++;
				return { status: 200, body: { n: calls }, cookie: [] };
			}),
		]);
		const headers = { Cookie: PLATFORM_COOKIES, "x-apicache-bypass": "1" };
		await app.request("/t/ping", { headers });
		await app.request("/t/ping", { headers });
		expect(calls).toBe(2);
	});

	it("does not cache non-200 responses", async () => {
		let calls = 0;
		const app = await constructServer([
			def("/t/ping", async () => {
				calls++;
				return { status: 201, body: { n: calls }, cookie: [] };
			}),
		]);
		const headers = { Cookie: PLATFORM_COOKIES };
		await app.request("/t/ping", { headers });
		await app.request("/t/ping", { headers });
		expect(calls).toBe(2);
	});
});

describe("misc", () => {
	it("serves /health", async () => {
		const app = await constructServer([]);
		const res = await app.request("/health");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ status: "ok", service: "kugou" });
	});

	it("extracts client IP (x-forwarded-for, ::ffff: strip)", async () => {
		const { getClientIp } = await import("@music-api/http-kit");
		const ctx = (headers: Record<string, string>) =>
			({
				req: { header: (n: string) => headers[n.toLowerCase()] },
				env: {},
			}) as unknown as Parameters<typeof getClientIp>[0];
		expect(getClientIp(ctx({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe(
			"1.2.3.4",
		);
		expect(getClientIp(ctx({ "x-forwarded-for": "::ffff:9.9.9.9" }))).toBe(
			"9.9.9.9",
		);
	});
});
