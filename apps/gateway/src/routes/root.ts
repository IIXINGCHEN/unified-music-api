/**
 * Root routes + static files + 404/405.
 *
 * Ports Go controller_manager registerRootRoutes, `r.Static("/public", "./public")`,
 * NoRoute ("接口不存在") and NoMethod ("方法不允许").
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Context } from "hono";
import { Hono } from "hono";
import { fail, ok } from "../response.js";

/** Registered path patterns (":param" = one segment, trailing "/*" = rest). */
export const ROUTE_PATTERNS: string[] = [
	"/",
	"/api",
	"/api/v1",
	"/health",
	"/ready",
	"/metrics",
	"/healthz",
	"/readyz",
	"/startupz",
	"/api/v1/match",
	"/api/v1/ncmget",
	"/api/v1/other",
	"/api/v1/search",
	"/api/v1/info",
	"/api/v1/picture",
	"/api/v1/lyric",
	"/api/v1/system/info",
	"/api/v1/system/health",
	"/api/v1/system/metrics",
	"/api/v1/system/sources",
	"/api/v1/system/sources/refresh",
	"/api/v1/system/cache/stats",
	"/api/v1/system/cache/clear",
	"/api/v1/config",
	"/api/v1/config/:section",
	"/api/v1/config/validate",
	"/api/v1/config/reload",
	"/api/v1/config/backup",
	"/api/v1/config/backups",
	"/api/v1/config/backup/:backup_id/restore",
	"/api/v1/config/backup/:backup_id",
	"/api/v1/version",
	"/api/v1/ping",
	"/api/v1/platform/:name",
	"/api/v1/platform/:name/*",
	"/public/*",
];

function patternMatches(pattern: string, path: string): boolean {
	if (pattern.endsWith("/*")) {
		const prefix = pattern.slice(0, -1); // keep trailing slash
		return path.startsWith(prefix) || path === prefix.slice(0, -1);
	}
	const pSeg = pattern.split("/").filter(Boolean);
	const sSeg = path.split("/").filter(Boolean);
	if (pSeg.length !== sSeg.length) return false;
	return pSeg.every((p, i) => p.startsWith(":") || p === sSeg[i]);
}

/** True when the path matches a known route pattern (used for 405 detection). */
export function matchesKnownRoute(path: string): boolean {
	if (path === "/") return true;
	return ROUTE_PATTERNS.some((p) => patternMatches(p, path));
}

const CONTENT_TYPES: Record<string, string> = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".txt": "text/plain; charset=utf-8",
	".map": "application/json; charset=utf-8",
};

function serveFile(c: Context, filePath: string) {
	const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
	const body = readFileSync(filePath);
	return new Response(body, {
		status: 200,
		headers: {
			"content-type": CONTENT_TYPES[ext] ?? "application/octet-stream",
		},
	});
}

export interface RootOptions {
	version: string;
	securityEnabled: boolean;
	rateLimitEnabled: boolean;
	publicDir: string;
}

export function rootRoutes(opts: RootOptions): Hono {
	const app = new Hono();

	app.get("/", (c) => {
		const indexFile = join(opts.publicDir, "index.html");
		if (existsSync(indexFile)) return serveFile(c, indexFile);
		// fall through to the 404 handler registered by the app assembler
		return c.notFound();
	});

	app.get("/api", (c) =>
		c.json({
			name: "music-api-proxy",
			version: opts.version,
			description: "解锁网易云音乐灰色歌曲的Go语言实现",
			endpoints: {
				health: "/health",
				ping: "/ping",
				version: "/version",
				api_v1: "/api/v1",
			},
			documentation: "/docs",
		}),
	);

	app.get("/api/v1", (c) => {
		const endpoints: Record<string, unknown> = {
			music: {
				match: "GET /api/v1/match",
				ncmget: "GET /api/v1/ncmget",
				other: "GET /api/v1/other",
				search: "GET /api/v1/search",
				info: "GET /api/v1/info",
				picture: "GET /api/v1/picture",
				lyric: "GET /api/v1/lyric",
			},
			platform: {
				proxy: "GET/POST /api/v1/platform/{name}/{path}",
			},
		};
		if (opts.securityEnabled) {
			endpoints.system = {
				info: "GET /api/v1/system/info",
				ping: "GET /api/v1/ping",
			};
		} else {
			endpoints.system = {
				info: "GET /api/v1/system/info",
				health: "GET /api/v1/system/health",
				metrics: "GET /api/v1/system/metrics",
				sources: "GET /api/v1/system/sources",
				cache: "GET /api/v1/system/cache/stats",
			};
			endpoints.config = {
				get: "GET /api/v1/config",
				update: "PUT /api/v1/config",
				validate: "POST /api/v1/config/validate",
				reload: "POST /api/v1/config/reload",
				backup: "POST /api/v1/config/backup",
			};
		}
		const body: Record<string, unknown> = { version: "v1", endpoints };
		if (opts.securityEnabled) {
			body.security = {
				authentication_required: true,
				rate_limiting_enabled: opts.rateLimitEnabled,
			};
		}
		return c.json(body);
	});

	// Static files under /public (Go: r.Static("/public", "./public"))
	app.get("/public/*", (c) => {
		const path = new URL(c.req.url).pathname;
		const rel = decodeURIComponent(path.slice("/public/".length));
		if (rel.includes("..")) return c.notFound();
		let filePath = join(opts.publicDir, rel);
		if (existsSync(filePath) && statSync(filePath).isDirectory()) {
			filePath = join(filePath, "index.html");
		}
		if (!existsSync(filePath) || !statSync(filePath).isFile())
			return c.notFound();
		return serveFile(c, filePath);
	});

	return app;
}

/** Not-found handler: 405 when the path matches a known route, else 404. */
export function notFoundHandler(c: Context): Response {
	const path = new URL(c.req.url).pathname;
	if (matchesKnownRoute(path)) {
		return fail(c, 405, 405, "方法不允许");
	}
	return fail(c, 404, 404, "接口不存在");
}

export { ok };
