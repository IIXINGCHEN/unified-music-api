/**
 * Cookie parsing — verbatim port of the Express middleware in
 * api-enhanced/server.js and KuGouMusicApi/server.js.
 *
 * Original regex splits on semicolon-followed-by-whitespace (the older
 * whitespace-tolerant variant was replaced upstream with this one).
 * Skip rule: no '=' OR '=' is the last char → drop the pair.
 * Both key and value go through safe-decode-uri-component, then trim().
 */
import type { MiddlewareHandler } from "hono";

/** Port of the `safe-decode-uri-component` npm package (try/catch wrapper). */
export function safeDecode(s: string): string {
	try {
		return decodeURIComponent(s);
	} catch {
		return s;
	}
}

export function parseCookieHeader(
	header: string | null | undefined,
): Record<string, string> {
	const out: Record<string, string> = {};
	(header || "").split(/;\s+|(?<!\s)\s+$/g).forEach((pair) => {
		const crack = pair.indexOf("=");
		if (crack < 1 || crack === pair.length - 1) return;
		out[safeDecode(pair.slice(0, crack)).trim()] = safeDecode(
			pair.slice(crack + 1),
		).trim();
	});
	return out;
}

/**
 * Hono middleware: parses the Cookie header into `c.get("cookies")`.
 * Replaces the Express `req.cookies = {}` assignment.
 */
export function cookieMiddleware(): MiddlewareHandler {
	return async (c, next) => {
		c.set("cookies", parseCookieHeader(c.req.header("cookie")));
		await next();
	};
}
