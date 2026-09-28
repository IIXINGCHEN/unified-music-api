/**
 * Response cache — behavioral port of util/apicache.js (vendored in both
 * api-enhanced and KuGouMusicApi) as used via:
 *   app.use(cache('2 minutes', (_, res) => res.statusCode === 200))
 *
 * Replicated semantics (quirks included):
 * - Cache key = hostname + originalUrl + JSON.stringify(cookies).
 *   The HTTP method is NOT part of the key (original quirk): a POST to the
 *   same URL with the same cookies serves the cached GET response.
 * - Request body is NOT part of the key either.
 * - Bypass headers: x-apicache-bypass / x-apicache-force-fetch skip the cache.
 * - Only responses passing `shouldCache(status)` are stored (default: 200).
 * - Stored responses are served with their original status + headers; the
 *   `cache-control: max-age=` value is recomputed (decremented) on each hit.
 * - If-None-Match matching the cached ETag → 304.
 * - Non-cacheable responses get `cache-control: no-cache, no-store,
 *   must-revalidate` (as the original's writeHead patch did).
 *
 * Ordering requirement: register AFTER the cookie middleware (and, for
 * kugou, after the platform-cookie injection), because the key embeds the
 * parsed cookies exactly as the original did.
 *
 * DEVIATION: the original memory-cache is unbounded; this port caps the
 * store at 1000 entries (oldest evicted) as a memory safety bound.
 */
import type { MiddlewareHandler } from "hono";
import type { StatusCode } from "hono/utils/http-status";

export interface CacheConfig {
	ttlMs: number;
	shouldCache?: (status: number) => boolean;
}

interface CacheEntry {
	status: StatusCode;
	headers: Array<[string, string]>;
	body: ArrayBuffer;
	contentType: string | null;
	storedAt: number;
}

const MAX_ENTRIES = 1000;

function getCookies(c: { get(k: string): unknown }): Record<string, string> {
	const v = c.get("cookies");
	return v && typeof v === "object" ? (v as Record<string, string>) : {};
}

export function responseCache(cfg: CacheConfig): MiddlewareHandler {
	const shouldCache = cfg.shouldCache ?? ((s) => s === 200);
	const store = new Map<string, CacheEntry>();

	const touch = (key: string) => {
		// re-insert to keep insertion order ≈ LRU
		const e = store.get(key);
		if (e) {
			store.delete(key);
			store.set(key, e);
		}
	};

	return async (c, next) => {
		const h = c.req.header.bind(c.req);
		if (h("x-apicache-bypass") || h("x-apicache-force-fetch")) {
			await next();
			return;
		}

		const url = new URL(c.req.url);
		const key =
			url.hostname + url.pathname + url.search + JSON.stringify(getCookies(c));

		const now = Date.now();
		const hit = store.get(key);
		if (hit) {
			if (now - hit.storedAt > cfg.ttlMs) {
				store.delete(key);
			} else {
				touch(key);
				const etag = hit.headers.find(([k]) => k.toLowerCase() === "etag")?.[1];
				const inm = h("if-none-match");
				if (inm && etag && inm === etag) {
					return c.body(null, 304);
				}
				const remaining = Math.max(
					0,
					Math.round(cfg.ttlMs / 1000 - (now - hit.storedAt) / 1000),
				);
				// Plain record (not Headers): Hono merges it with prepared
				// middleware headers; array values are appended (set-cookie).
				const outHeaders: Record<string, string | string[]> = {};
				for (const [k, v] of hit.headers) {
					if (k.toLowerCase() === "cache-control") continue;
					const key = k.toLowerCase();
					const prev = outHeaders[key];
					outHeaders[key] =
						prev === undefined
							? v
							: [...(Array.isArray(prev) ? prev : [prev]), v];
				}
				outHeaders["cache-control"] = `max-age=${remaining}`;
				return c.newResponse(hit.body, hit.status, outHeaders);
			}
		}

		await next();

		const res = c.res;
		if (shouldCache(res.status)) {
			const buf = await res.clone().arrayBuffer();
			const headers: Array<[string, string]> = [];
			res.headers.forEach((v, k) => {
				if (k.toLowerCase() !== "cache-control") headers.push([k, v]);
			});
			// preserve multi-value Set-Cookie exactly
			const setCookies: string[] =
				typeof (res.headers as Headers & { getSetCookie?: () => string[] })
					.getSetCookie === "function"
					? (
							res.headers as Headers & { getSetCookie: () => string[] }
						).getSetCookie()
					: [];
			for (const sc of setCookies) {
				if (
					!headers.some(
						([k, v]) => k.toLowerCase() === "set-cookie" && v === sc,
					)
				) {
					headers.push(["set-cookie", sc]);
				}
			}
			store.set(key, {
				status: res.status as StatusCode,
				headers,
				body: buf,
				contentType: res.headers.get("content-type"),
				storedAt: Date.now(),
			});
			if (store.size > MAX_ENTRIES) {
				const oldest = store.keys().next().value;
				if (oldest !== undefined) store.delete(oldest);
			}
			c.header("cache-control", `max-age=${Math.round(cfg.ttlMs / 1000)}`);
		} else {
			c.header("cache-control", "no-cache, no-store, must-revalidate");
		}
	};
}
