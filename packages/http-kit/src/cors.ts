/**
 * CORS middleware — ports the inline CORS blocks of both servers.
 *
 * Common behavior (both originals):
 * - Only applies when path !== '/' && !path.includes('.')
 *   (static files and the index route keep their own headers).
 * - Access-Control-Allow-Credentials: true (string "true" via set()).
 * - OPTIONS preflight → 204 with empty body, skips downstream.
 * - Content-Type forced to 'application/json; charset=utf-8' on those paths.
 *
 * Differences parameterized:
 * - netease ("reflect-list"): CORS_ALLOW_ORIGIN is a comma list; if unset →
 *   reflect request origin or '*'; if list contains '*' → '*'; if the request
 *   origin is listed → reflect it (+ `Vary: Origin`); otherwise the header is
 *   OMITTED. Allow-Headers: 'X-Requested-With,Content-Type'.
 * - kugou ("simple"): origin = CORS_ALLOW_ORIGIN || req origin || '*'
 *   (no allowlist, no Vary). Allow-Headers:
 *   'Authorization,X-Requested-With,Content-Type,Cache-Control'.
 */
import type { MiddlewareHandler } from "hono";

export interface CorsConfig {
	mode: "reflect-list" | "simple";
	/** Parsed CORS_ALLOW_ORIGIN list (reflect-list mode). */
	allowOrigins?: string[] | null;
	allowHeaders: string;
	allowMethods?: string;
}

/** Port of api-enhanced/server.js parseCorsAllowOrigins(). */
export function parseCorsAllowOrigins(
	raw: string | undefined,
): string[] | null {
	if (!raw) return null;
	const origins = raw
		.split(",")
		.map((o) => o.trim())
		.filter(Boolean);
	return origins.length > 0 ? origins : null;
}

function resolveOrigin(
	cfg: CorsConfig,
	requestOrigin: string | undefined,
): { value: string | null; vary: boolean } {
	if (cfg.mode === "simple") {
		return {
			value: process.env.CORS_ALLOW_ORIGIN || requestOrigin || "*",
			vary: false,
		};
	}
	// reflect-list (netease semantics)
	const allowOrigins = cfg.allowOrigins ?? null;
	if (!allowOrigins) return { value: requestOrigin || "*", vary: false };
	if (allowOrigins.includes("*")) return { value: "*", vary: false };
	if (requestOrigin && allowOrigins.includes(requestOrigin)) {
		return { value: requestOrigin, vary: true };
	}
	return { value: null, vary: false };
}

export function corsMiddleware(cfg: CorsConfig): MiddlewareHandler {
	const allowMethods = cfg.allowMethods ?? "PUT,POST,GET,DELETE,OPTIONS";
	return async (c, next) => {
		const path = new URL(c.req.url).pathname;
		if (path !== "/" && !path.includes(".")) {
			const { value: origin, vary } = resolveOrigin(
				cfg,
				c.req.header("origin"),
			);
			c.header("Access-Control-Allow-Credentials", "true");
			if (origin) c.header("Access-Control-Allow-Origin", origin);
			if (vary) c.header("Vary", "Origin");
			c.header("Access-Control-Allow-Headers", cfg.allowHeaders);
			c.header("Access-Control-Allow-Methods", allowMethods);
			c.header("Content-Type", "application/json; charset=utf-8");
		}
		if (c.req.method === "OPTIONS") {
			return c.body(null, 204);
		}
		await next();
	};
}
