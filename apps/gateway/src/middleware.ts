/**
 * Gateway middleware.
 *
 * Ports Go `internal/middleware/auth.go` (APIKeyAuth / AdminAuth, sliding-window
 * RateLimiter, IP whitelist incl. CIDR/range, constant-time key compare,
 * audit logging) and the CORS / recovery / logging plugin middlewares.
 */

import { timingSafeEqual } from "node:crypto";
import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context, Next } from "hono";
import { cors as honoCors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import type { GatewayConfig } from "./config.js";
import { fail } from "./response.js";

/** Client IP: X-Forwarded-For (first) -> conn info -> 127.0.0.1 (tests). */
export function clientIP(c: Context): string {
	const xff = c.req.header("x-forwarded-for");
	if (xff) {
		const first = xff.split(",")[0]?.trim();
		if (first) return first;
	}
	const xri = c.req.header("x-real-ip");
	if (xri?.trim()) return xri.trim();
	try {
		const info = getConnInfo(c);
		if (info.remote.address) return info.remote.address;
	} catch {
		// not running on the node server (e.g. app.request() in tests)
	}
	return "127.0.0.1";
}

function isIPv4(s: string): boolean {
	return /^\d{1,3}(\.\d{1,3}){3}$/.test(s);
}

function ipv4ToInt(ip: string): number | null {
	const parts = ip.split(".").map(Number);
	if (
		parts.length !== 4 ||
		parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)
	)
		return null;
	return ((parts[0]! * 256 + parts[1]!) * 256 + parts[2]!) * 256 + parts[3]!;
}

/** Expand an IPv6 address to 8 hextets. Returns null on invalid input. */
function expandIPv6(ip: string): number[] | null {
	const halves = ip.split("::");
	if (halves.length > 2) return null;
	const parse = (s: string): number[] | null => {
		if (s === "") return [];
		const out: number[] = [];
		for (const g of s.split(":")) {
			if (g === "") return null;
			// embedded IPv4
			if (g.includes(".")) {
				const n = ipv4ToInt(g);
				if (n === null) return null;
				out.push((n >>> 16) & 0xffff, n & 0xffff);
			} else {
				const n = Number.parseInt(g, 16);
				if (Number.isNaN(n) || n < 0 || n > 0xffff) return null;
				out.push(n);
			}
		}
		return out;
	};
	if (halves.length === 1) {
		const g = parse(halves[0]!);
		return g && g.length === 8 ? g : null;
	}
	const left = parse(halves[0]!);
	const right = parse(halves[1]!);
	if (!left || !right || left.length + right.length > 7) return null;
	return [
		...left,
		...new Array(8 - left.length - right.length).fill(0),
		...right,
	];
}

/** Check whether `ip` belongs to CIDR `cidr` (v4 and v6). */
function cidrContains(cidr: string, ip: string): boolean {
	const [base, bitsStr] = cidr.split("/");
	const bits = Number(bitsStr);
	if (!base || Number.isNaN(bits)) return false;
	if (isIPv4(base) && isIPv4(ip) && bits >= 0 && bits <= 32) {
		const b = ipv4ToInt(base);
		const a = ipv4ToInt(ip);
		if (b === null || a === null) return false;
		const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
		return (a & mask) >>> 0 === (b & mask) >>> 0;
	}
	const bg = expandIPv6(base);
	const ag = expandIPv6(ip);
	if (!bg || !ag || bits < 0 || bits > 128) return false;
	let remaining = bits;
	for (let i = 0; i < 8; i++) {
		const take = Math.min(16, remaining);
		remaining -= take;
		if (take === 0) break;
		const mask = take === 16 ? 0xffff : (~0 << (16 - take)) & 0xffff;
		if ((ag[i]! & mask) !== (bg[i]! & mask)) return false;
	}
	return true;
}

/** Mirror of Go isInWhiteList: "*", exact, CIDR, "start-end" ranges. */
export function isInWhiteList(ip: string, whiteList: string[]): boolean {
	if (whiteList.length === 0) return false;
	const v4 = isIPv4(ip);
	for (const allowed of whiteList) {
		if (allowed === "*") return true;
		if (allowed === ip) return true;
		if (allowed.includes("/")) {
			if (cidrContains(allowed, ip)) return true;
			continue;
		}
		if (allowed.includes("-")) {
			const [s, e] = allowed.split("-").map((x) => x.trim());
			if (s && e && v4 && isIPv4(s) && isIPv4(e)) {
				const a = ipv4ToInt(ip);
				const lo = ipv4ToInt(s);
				const hi = ipv4ToInt(e);
				if (a !== null && lo !== null && hi !== null && a >= lo && a <= hi)
					return true;
			}
		}
	}
	return false;
}

/** Mirror of Go isValidUserAgent: empty list allows all; substring match. */
export function isValidUserAgent(ua: string, allowed: string[]): boolean {
	if (allowed.length === 0) return true;
	return allowed.some((a) => a === "*" || ua.includes(a));
}

function constantTimeEqual(a: string, b: string): boolean {
	const ab = Buffer.from(a);
	const bb = Buffer.from(b);
	if (ab.length !== bb.length) return false;
	return timingSafeEqual(ab, bb);
}

/**
 * Extract the API key. Priority (Go getAPIKey):
 * X-API-Key > Authorization: Bearer/ApiKey > X-Auth-Token > query api_key.
 */
export function getAPIKey(c: Context): string {
	const h = (n: string) => c.req.header(n) ?? "";
	const xApiKey = h("x-api-key").trim();
	if (xApiKey) return xApiKey;
	const auth = h("authorization").trim();
	if (auth.startsWith("Bearer ")) return auth.slice("Bearer ".length).trim();
	if (auth.startsWith("ApiKey ")) return auth.slice("ApiKey ".length).trim();
	const token = h("x-auth-token").trim();
	if (token) return token;
	const q = c.req.query("api_key") ?? "";
	return q.trim();
}

/** Sliding-window per-key rate limiter (Go middleware.RateLimiter port). */
export class RateLimiter {
	private requests = new Map<string, number[]>();
	private timer: NodeJS.Timeout;

	constructor(
		private readonly limit: number,
		private readonly windowMs: number,
	) {
		this.timer = setInterval(() => this.cleanup(), 60_000);
		this.timer.unref?.();
	}

	allow(key: string): boolean {
		const now = Date.now();
		const cutoff = now - this.windowMs;
		const valid = (this.requests.get(key) ?? []).filter((t) => t > cutoff);
		if (valid.length >= this.limit) {
			this.requests.set(key, valid);
			return false;
		}
		valid.push(now);
		this.requests.set(key, valid);
		return true;
	}

	private cleanup(): void {
		const cutoff = Date.now() - this.windowMs;
		for (const [k, v] of this.requests) {
			const valid = v.filter((t) => t > cutoff);
			if (valid.length === 0) this.requests.delete(k);
			else this.requests.set(k, valid);
		}
	}

	stop(): void {
		clearInterval(this.timer);
	}
}

export interface AuthOptions {
	admin: boolean;
	apiKey: string;
	adminKey: string;
	whiteList: string[];
	enableRateLimit: boolean;
	rateLimitPerMin: number;
	requireHTTPS: boolean;
	allowedUserAgent: string[];
	enableAuditLog: boolean;
	logger?: (msg: string, fields?: Record<string, unknown>) => void;
}

function audit(
	opts: AuthOptions,
	action: string,
	c: Context,
	message: string,
): void {
	if (!opts.enableAuditLog) return;
	opts.logger?.("安全审计", {
		action,
		client_ip: clientIP(c),
		user_agent: c.req.header("user-agent") ?? "",
		path: new URL(c.req.url).pathname,
		message,
		timestamp: new Date().toISOString(),
	});
}

function isHTTPS(c: Context): boolean {
	return (
		c.req.header("x-forwarded-proto") === "https" ||
		new URL(c.req.url).protocol === "https:"
	);
}

/**
 * API-key / admin-key auth middleware.
 * Order mirrors Go: HTTPS -> User-Agent -> whitelist -> rate limit -> key check.
 */
export function authMiddleware(opts: AuthOptions) {
	const adminLimiter = opts.admin
		? new RateLimiter(Math.max(1, Math.floor(opts.rateLimitPerMin / 4)), 60_000)
		: null;
	const limiter = opts.enableRateLimit
		? new RateLimiter(opts.rateLimitPerMin, 60_000)
		: null;

	return createMiddleware(async (c: Context, next: Next) => {
		const ip = clientIP(c);
		const ua = c.req.header("user-agent") ?? "";
		const path = new URL(c.req.url).pathname;

		if (opts.requireHTTPS || opts.admin) {
			if (!isHTTPS(c)) {
				audit(
					opts,
					opts.admin ? "ADMIN_HTTPS_REQUIRED" : "HTTPS_REQUIRED",
					c,
					"管理员操作要求HTTPS",
				);
				return fail(
					c,
					426,
					426,
					opts.admin ? "管理员操作要求使用HTTPS连接" : "要求使用HTTPS连接",
				);
			}
		}

		if (
			!opts.admin &&
			opts.allowedUserAgent.length > 0 &&
			!isValidUserAgent(ua, opts.allowedUserAgent)
		) {
			audit(opts, "INVALID_USER_AGENT", c, "无效的User-Agent");
			return fail(c, 403, 403, "无效的客户端");
		}

		if (isInWhiteList(ip, opts.whiteList)) {
			audit(
				opts,
				opts.admin ? "ADMIN_WHITELIST_ACCESS" : "WHITELIST_ACCESS",
				c,
				"白名单访问",
			);
			await next();
			return;
		}

		if (opts.admin) {
			if (adminLimiter && !adminLimiter.allow(ip)) {
				audit(opts, "ADMIN_RATE_LIMIT_EXCEEDED", c, "管理员接口速率限制");
				return fail(c, 429, 429, "管理员接口访问过于频繁");
			}
			const key = getAPIKey(c);
			if (!key) {
				audit(opts, "ADMIN_MISSING_KEY", c, "缺少管理员密钥");
				return fail(c, 401, 401, "缺少管理员密钥");
			}
			if (!constantTimeEqual(key, opts.adminKey)) {
				audit(opts, "ADMIN_INVALID_KEY", c, "无效的管理员密钥");
				return fail(c, 401, 401, "无效的管理员密钥");
			}
			audit(opts, "ADMIN_ACCESS_SUCCESS", c, "管理员访问成功");
			await next();
			return;
		}

		if (limiter && !limiter.allow(ip)) {
			audit(opts, "RATE_LIMIT_EXCEEDED", c, "超过速率限制");
			return fail(c, 429, 429, "请求过于频繁，请稍后再试");
		}

		const key = getAPIKey(c);
		if (!key) {
			audit(opts, "MISSING_API_KEY", c, "缺少API密钥");
			return fail(c, 401, 401, "缺少API密钥");
		}
		if (!constantTimeEqual(key, opts.apiKey)) {
			audit(opts, "INVALID_API_KEY", c, "无效的API密钥");
			return fail(c, 401, 401, "无效的API密钥");
		}
		audit(opts, "API_ACCESS_SUCCESS", c, "API访问成功");
		await next();
		void path;
	});
}

/** CORS middleware driven by `security.cors` config (Go CORS plugin port). */
export function corsMiddleware(cfg: GatewayConfig["security"]["cors"]) {
	if (!cfg.enabled)
		return createMiddleware(async (_c: Context, next: Next) => next());
	return honoCors({
		origin: (origin) => {
			if (cfg.allowed_origins.includes("*")) return "*";
			return cfg.allowed_origins.includes(origin) ? origin : "";
		},
		allowMethods: cfg.allowed_methods,
		allowHeaders: cfg.allowed_headers.includes("*")
			? undefined
			: cfg.allowed_headers,
		exposeHeaders: cfg.expose_headers,
		credentials: cfg.allow_credentials,
		maxAge: 43200,
	});
}

/** Recovery middleware: panic -> 500 envelope (Go recovery plugin port). */
export function recoveryMiddleware() {
	return createMiddleware(async (c: Context, next: Next) => {
		try {
			await next();
		} catch (err) {
			console.error("panic recovered:", err);
			return fail(c, 500, 500, "内部服务器错误");
		}
	});
}

/** Request logger with skip paths (Go logging plugin port). */
export function requestLogger(skipPaths: string[]) {
	return createMiddleware(async (c: Context, next: Next) => {
		const path = new URL(c.req.url).pathname;
		if (skipPaths.some((p) => path === p || path.startsWith(`${p}/`))) {
			await next();
			return;
		}
		const start = Date.now();
		await next();
		const ms = Date.now() - start;
		console.log(`${c.req.method} ${path} -> ${c.res.status} ${ms}ms`);
	});
}
