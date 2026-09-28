/**
 * http-kit unit tests: cookie / CORS / cache / module-scan behaviors
 * against the original Express semantics.
 */
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import {
	corsMiddleware,
	cookieMiddleware,
	parseCookieHeader,
	parseCorsAllowOrigins,
	responseCache,
	routeForFile,
	safeDecode,
	scanModuleFiles,
} from "../src/index.js";

describe("safeDecode", () => {
	it("decodes valid sequences, passes through invalid ones", () => {
		expect(safeDecode("a%20b")).toBe("a b");
		expect(safeDecode("%E4%B8%AD")).toBe("中");
		expect(safeDecode("%zz")).toBe("%zz");
	});
});

describe("parseCookieHeader", () => {
	it("parses pairs split by '; '", () => {
		expect(parseCookieHeader("a=1; b=2")).toEqual({ a: "1", b: "2" });
	});
	it("skips pairs without '=' or with trailing '='", () => {
		expect(parseCookieHeader("a=1; bad; c=")).toEqual({ a: "1" });
	});
	it("decodes and trims keys/values", () => {
		expect(parseCookieHeader("a%20b=%20x%20")).toEqual({ "a b": "x" });
	});
	it("handles empty header", () => {
		expect(parseCookieHeader("")).toEqual({});
		expect(parseCookieHeader(undefined)).toEqual({});
	});
});

describe("parseCorsAllowOrigins", () => {
	it("splits comma list", () => {
		expect(parseCorsAllowOrigins("https://a.com, https://b.com")).toEqual([
			"https://a.com",
			"https://b.com",
		]);
	});
	it("returns null for empty", () => {
		expect(parseCorsAllowOrigins("")).toBeNull();
		expect(parseCorsAllowOrigins(undefined)).toBeNull();
	});
});

function corsApp(cfg: Parameters<typeof corsMiddleware>[0]) {
	const app = new Hono();
	app.use(corsMiddleware(cfg));
	app.all("/x", (c) => c.json({ ok: true }));
	return app;
}

describe("corsMiddleware (reflect-list / netease)", () => {
	const cfg = {
		mode: "reflect-list" as const,
		allowOrigins: ["https://a.com"],
		allowHeaders: "X-Requested-With,Content-Type",
	};
	it("reflects listed origin with Vary", async () => {
		const res = await corsApp(cfg).request("/x", {
			headers: { origin: "https://a.com" },
		});
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://a.com");
		expect(res.headers.get("Vary")).toBe("Origin");
	});
	it("omits origin header for unlisted origin", async () => {
		const res = await corsApp(cfg).request("/x", {
			headers: { origin: "https://evil.com" },
		});
		expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
	});
	it("wildcard list returns '*'", async () => {
		const res = await corsApp({ ...cfg, allowOrigins: ["*"] }).request("/x", {
			headers: { origin: "https://any.com" },
		});
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
	});
	it("OPTIONS short-circuits with 204", async () => {
		const res = await corsApp(cfg).request("/x", { method: "OPTIONS" });
		expect(res.status).toBe(204);
	});
	it("skips CORS on root and dotted paths", async () => {
		const app = corsApp(cfg);
		app.get("/", (c) => c.text("index"));
		const res = await app.request("/");
		expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
	});
});

describe("corsMiddleware (simple / kugou)", () => {
	const cfg = {
		mode: "simple" as const,
		allowHeaders: "Authorization,X-Requested-With,Content-Type,Cache-Control",
	};
	it("reflects request origin when no env set", async () => {
		const res = await corsApp(cfg).request("/x", {
			headers: { origin: "https://b.com" },
		});
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://b.com");
		expect(res.headers.get("Vary")).toBeNull();
	});
});

describe("responseCache", () => {
	function cacheApp() {
		const app = new Hono();
		let calls = 0;
		app.use(cookieMiddleware());
		app.use(responseCache({ ttlMs: 120000 }));
		app.all("/data", (c) => {
			calls++;
			return c.json({ n: calls, cookie: c.get("cookies") });
		});
		app.get("/err", (c) => c.json({ e: 1 }, 500));
		return { app, calls: () => calls };
	}

	it("caches 200 responses for identical URL+cookies", async () => {
		const { app } = cacheApp();
		const r1 = await app.request("/data?a=1", {
			headers: { cookie: "u=1" },
		});
		const r2 = await app.request("/data?a=1", {
			headers: { cookie: "u=1" },
		});
		expect(await r1.json()).toEqual(await r2.json());
		expect(r2.headers.get("cache-control")).toMatch(/^max-age=\d+$/);
	});

	it("misses when cookies differ (key includes cookies)", async () => {
		const { app } = cacheApp();
		await app.request("/data?a=1", { headers: { cookie: "u=1" } });
		const r = await app.request("/data?a=1", { headers: { cookie: "u=2" } });
		expect((await r.json()).n).toBe(2);
	});

	it("does not cache non-200 and sets no-cache header", async () => {
		const { app } = cacheApp();
		const r = await app.request("/err");
		expect(r.status).toBe(500);
		expect(r.headers.get("cache-control")).toBe(
			"no-cache, no-store, must-revalidate",
		);
	});

	it("bypass header skips cache", async () => {
		const { app } = cacheApp();
		await app.request("/data");
		const r = await app.request("/data", {
			headers: { "x-apicache-bypass": "1" },
		});
		expect((await r.json()).n).toBe(2);
	});

	it("304 on matching If-None-Match", async () => {
		const app = new Hono();
		app.use(responseCache({ ttlMs: 120000 }));
		app.get("/e", (c) => c.text("body", 200, { etag: '"abc"' }));
		await app.request("/e");
		const r = await app.request("/e", { headers: { "if-none-match": '"abc"' } });
		expect(r.status).toBe(304);
	});
});

describe("routeForFile / scanModuleFiles", () => {
	it("maps _ to /", () => {
		expect(routeForFile("login_qr_check.ts", undefined, ".ts")).toBe(
			"/login/qr/check",
		);
	});
	it("special map wins", () => {
		expect(
			routeForFile("daily_signin.js", { "daily_signin.js": "/daily_signin" }, ".js"),
		).toBe("/daily_signin");
	});
	it("scans a temp dir in reverse order, skipping _ files when asked", async () => {
		const { mkdtempSync, writeFileSync } = await import("node:fs");
		const { tmpdir } = await import("node:os");
		const { join } = await import("node:path");
		const dir = mkdtempSync(join(tmpdir(), "scan-"));
		for (const f of ["a_b.ts", "_hidden.ts", "c.ts"]) {
			writeFileSync(join(dir, f), "export default 1");
		}
		const defs = scanModuleFiles(dir, { skipUnderscore: true });
		expect(defs.map((d) => d.identifier)).toEqual(["c", "a_b"]);
		expect(defs.find((d) => d.identifier === "a_b")?.route).toBe("/a/b");
	});
});
