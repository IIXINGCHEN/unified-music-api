/**
 * KuGou API Hono server — port of KuGouMusicApi/server.js (Express).
 *
 * Behavior preserved (see docs/parity-p3-kugou.md for the full inventory):
 * - module auto-registration: `module/<name>.js` → `/<name with _ → />`,
 *   files starting with '_' are internal helpers and never registered
 *   (Express `app.use(route)` prefix-matching semantics kept via Hono app.use)
 * - CORS (simple mode), custom cookie parser, platform-cookie injection
 * - body limits: json 16mb / urlencoded 5mb / octet-stream 100mb
 * - static public/ + /docs (when the directories exist)
 * - 2-minute response cache on status 200 (key = host + url + cookies)
 * - route handler: query merge order, Authorization→cookie, IP injection,
 *   Set-Cookie rules, upstream header passthrough, error envelope
 */

import { existsSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import {
	cookieMiddleware,
	corsMiddleware,
	getClientIp,
	type ModuleDef,
	responseCache,
	safeDecode,
	scanModuleFiles,
} from "@music-api/http-kit";
import {
	createRequest,
	type KgModule,
	type KgQuery,
	type KgRequestOptions,
	type KgResponse,
} from "@music-api/kugou-core";
import {
	calculateMid,
	cookieToJson,
	cryptoMd5,
	generateWebGLHash,
	getGuid,
	isUUIDv4,
	randomString,
} from "@music-api/kugou-crypto";
import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";
import qs from "qs";

export interface KugouVariables {
	cookies: Record<string, string>;
	pendingSetCookies: string[];
	parsedBody: unknown;
	rawBody?: Buffer;
}

export interface LoadedModuleDef extends ModuleDef {
	module: KgModule;
}

type KgHono = Hono<{ Variables: KugouVariables }>;
type KgMiddleware = MiddlewareHandler<{ Variables: KugouVariables }>;

/** Server startup device GUID (MD5 of a random GUID), generated once. */
const guid = cryptoMd5(getGuid());
/** Server startup dev-device id, 10 uppercase chars, generated once. */
const serverDev = randomString(10).toUpperCase();

const JSON_LIMIT = 16 * 1024 * 1024;
const URLENCODED_LIMIT = 5 * 1024 * 1024;
const RAW_LIMIT = 100 * 1024 * 1024;
const CACHE_TTL_MS = 2 * 60 * 1000;

/**
 * Scan src/modules (dev) or dist/modules (prod) and dynamic-import every
 * public module, mirroring getModulesDefinitions() in the original.
 */
export async function getModuleDefinitions(): Promise<LoadedModuleDef[]> {
	const here = fileURLToPath(import.meta.url);
	const dir = join(dirname(here), "modules");
	const ext = here.includes(`${sep}dist${sep}`) ? ".js" : ".ts";
	const defs = scanModuleFiles(dir, { skipUnderscore: true, ext });
	const out: LoadedModuleDef[] = [];
	for (const d of defs) {
		const mod = (await import(pathToFileURL(d.file).href)) as {
			default: KgModule;
		};
		out.push({ ...d, module: mod.default });
	}
	return out;
}

/**
 * Platform identification cookie injection — port of the Express middleware
 * in the original server.js. Injects KUGOU_API_* cookies when the client did
 * not provide them and stages Set-Cookie write-backs (applied to the final
 * response by the route handler, like the original res.append did).
 */
function platformMiddleware(): KgMiddleware {
	return async (c, next) => {
		const cookies = c.get("cookies");
		const isHttps = new URL(c.req.url).protocol === "https:";
		const cookieSuffix = isHttps
			? "; PATH=/; SameSite=None; Secure"
			: "; PATH=/";
		const pending = c.get("pendingSetCookies");

		const ensureCookie = (key: string, value: string | undefined) => {
			if (Object.hasOwn(cookies, key)) return;
			cookies[key] = String(value);
			pending.push(`${key}=${cookies[key]}${cookieSuffix}`);
		};

		const envGuid = process.env.KUGOU_API_GUID;
		const resolvedGuid =
			envGuid !== undefined && isUUIDv4(envGuid) ? cryptoMd5(envGuid) : envGuid;
		const mid = calculateMid(resolvedGuid ?? guid);

		ensureCookie("KUGOU_API_PLATFORM", process.env.platform);
		ensureCookie("KUGOU_API_MID", mid);
		ensureCookie("KUGOU_API_GUID", resolvedGuid ?? guid);
		ensureCookie(
			"KUGOU_API_DEV",
			(process.env.KUGOU_API_DEV ?? serverDev).toUpperCase(),
		);
		ensureCookie(
			"KUGOU_API_MAC",
			(process.env.KUGOU_API_MAC ?? "02:00:00:00:00:00").toUpperCase(),
		);
		ensureCookie(
			"KUGOU_API_WEBGL",
			process.env.KUGOU_API_WEBGL ?? generateWebGLHash(),
		);

		c.set("cookies", cookies);
		await next();
	};
}

/**
 * Body parsing — port of express.json (16mb) + express.urlencoded
 * ({ extended: false }, 5mb) + express.raw (octet-stream, 100mb).
 * Oversize → 413 (the original had no explicit limit handler on these;
 * limits are new but fail-open would be worse — see parity doc).
 */
function bodyParser(): KgMiddleware {
	return async (c, next) => {
		const contentType = c.req.header("content-type") || "";
		const contentLength = Number(c.req.header("content-length") || "0");
		const tooLarge = () =>
			c.json({ code: 413, data: null, msg: "Payload Too Large" }, 413);

		if (contentType.includes("application/json")) {
			if (contentLength > JSON_LIMIT) return tooLarge();
			const text = await c.req.text();
			if (text.length > JSON_LIMIT) return tooLarge();
			if (!text.trim()) {
				c.set("parsedBody", {});
			} else {
				try {
					c.set("parsedBody", JSON.parse(text));
				} catch {
					return c.json({ code: 400, data: null, msg: "Invalid JSON" }, 400);
				}
			}
		} else if (contentType.includes("application/x-www-form-urlencoded")) {
			if (contentLength > URLENCODED_LIMIT) return tooLarge();
			const text = await c.req.text();
			// extended: false → flat querystring semantics (repeated keys → array)
			const params = new URLSearchParams(text);
			const out: Record<string, unknown> = {};
			for (const key of new Set(params.keys())) {
				const values = params.getAll(key);
				out[key] = values.length > 1 ? values : values[0];
			}
			c.set("parsedBody", out);
		} else if (contentType.includes("application/octet-stream")) {
			if (contentLength > RAW_LIMIT) return tooLarge();
			const buf = Buffer.from(await c.req.arrayBuffer());
			if (buf.byteLength > RAW_LIMIT) return tooLarge();
			c.set("rawBody", buf);
		}
		await next();
	};
}

/** Assemble the final Response: CORS content-type, upstream headers, cookies, body. */
function buildResponse(
	c: Parameters<KgMiddleware>[0],
	url: URL,
	moduleResponse: KgResponse,
	moduleSetCookies: string[],
): Response {
	const headers = new Headers();
	const path = url.pathname;
	if (path !== "/" && !path.includes(".")) {
		headers.set("Content-Type", "application/json; charset=utf-8");
	}
	if (moduleResponse.headers) {
		for (const [k, v] of Object.entries(moduleResponse.headers)) {
			headers.set(k, v);
		}
	}
	// Platform injection cookies first (original appended them in middleware,
	// i.e. before the route handler's own Set-Cookie appends).
	for (const sc of c.get("pendingSetCookies")) headers.append("set-cookie", sc);
	for (const sc of moduleSetCookies) headers.append("set-cookie", sc);

	const body = moduleResponse.body;
	let bodyInit: BodyInit | null = null;
	if (Buffer.isBuffer(body)) {
		bodyInit = body as unknown as BodyInit;
		if (path.includes(".") && !headers.has("content-type")) {
			headers.set("content-type", "application/octet-stream");
		}
	} else if (typeof body === "string") {
		bodyInit = body;
	} else if (body !== null && body !== undefined) {
		bodyInit = JSON.stringify(body);
		headers.set("content-type", "application/json; charset=utf-8");
	}
	const res = new Response(bodyInit, {
		status: moduleResponse.status,
		headers,
	});
	// Pull c.res once so middleware-set headers (c.header(), e.g. CORS) exist
	// on the context response; assigning then merges them into ours with
	// Hono's own semantics (content-type exempt, set-cookie appended).
	void c.res;
	c.res = res;
	return c.res;
}

/** Per-module route handler — port of the app.use(moduleDef.route, …) block. */
function createRouteHandler(def: LoadedModuleDef): KgMiddleware {
	return async (c) => {
		const url = new URL(c.req.url);
		const logUrl = safeDecode(url.pathname + url.search);
		const isHttps = url.protocol === "https:";

		// Step 1: cookie strings inside query/body → JSON objects.
		// qs with Express-4 "extended" defaults (the original query parser).
		const rawQuery = qs.parse(url.search, {
			ignoreQueryPrefix: true,
		}) as Record<string, unknown>;
		const bodyObj: Record<string, unknown> = {
			...((c.get("parsedBody") as Record<string, unknown> | undefined) ?? {}),
		};
		for (const item of [rawQuery, bodyObj]) {
			if (typeof item.cookie === "string") {
				item.cookie = cookieToJson(safeDecode(item.cookie));
			}
		}

		// Step 2/3: merge cookies + params + body.
		const { cookie, ...params } = rawQuery;
		const rawBody = c.get("rawBody");
		const body = rawBody !== undefined ? { data: rawBody } : bodyObj;
		const query = Object.assign(
			{},
			{ cookie: Object.assign({}, c.get("cookies"), cookie) },
			params,
			body,
		) as KgQuery;

		// Step 4: Authorization header → cookie merge.
		const authHeader = c.req.header("authorization");
		if (authHeader) {
			query.cookie = {
				...((query.cookie as Record<string, unknown> | undefined) ?? {}),
				...cookieToJson(authHeader),
			};
		}

		const useAxios = (config: KgRequestOptions) => {
			config.ip = getClientIp(c);
			return createRequest(config);
		};

		try {
			// Step 5: invoke the module.
			const moduleResponse = await def.module(query, useAxios);
			console.log("[OK]", logUrl);

			// Step 6: module Set-Cookie write-back.
			const moduleSetCookies: string[] = [];
			const cookies = moduleResponse.cookie;
			if (!query.noCookie) {
				if (Array.isArray(cookies) && cookies.length > 0) {
					const suffix = isHttps
						? "; PATH=/; SameSite=None; Secure"
						: "; PATH=/";
					for (const ck of cookies) moduleSetCookies.push(`${ck}${suffix}`);
				}
			}

			// Step 7: respond with upstream headers + status + body.
			return buildResponse(c, url, moduleResponse, moduleSetCookies);
		} catch (e) {
			const moduleResponse = e as KgResponse;
			console.log("[ERR]", logUrl, {
				status: moduleResponse?.status,
				body: moduleResponse?.body,
			});
			if (!moduleResponse?.body) {
				return c.json({ code: 404, data: null, msg: "Not Found" }, 404);
			}
			return buildResponse(c, url, moduleResponse, []);
		}
	};
}

/**
 * Build the Hono app — port of consturctServer() (name typo fixed).
 * Middleware order mirrors the original: CORS → cookie → platform →
 * body → static → cache → routes.
 */
export async function constructServer(
	moduleDefs?: LoadedModuleDef[],
): Promise<KgHono> {
	const app = new Hono<{ Variables: KugouVariables }>();

	app.use("*", async (c, next) => {
		c.set("pendingSetCookies", []);
		await next();
	});
	app.use(
		"*",
		corsMiddleware({
			mode: "simple",
			allowHeaders: "Authorization,X-Requested-With,Content-Type,Cache-Control",
		}),
	);
	app.use("*", cookieMiddleware());
	app.use("*", platformMiddleware());
	app.use("*", bodyParser());

	// Static files (original served public/ and docs/ when present).
	if (existsSync(join(process.cwd(), "public"))) {
		app.use("/*", serveStatic({ root: "./public" }));
	}
	if (existsSync(join(process.cwd(), "docs"))) {
		app.use("/docs/*", serveStatic({ root: "./" }));
	}

	app.use(
		"*",
		responseCache({ ttlMs: CACHE_TTL_MS, shouldCache: (s) => s === 200 }),
	);

	app.get("/health", (c) => c.json({ status: "ok", service: "kugou" }));

	const defs = moduleDefs ?? (await getModuleDefinitions());
	for (const def of defs) {
		// app.use (not app.all): prefix matching, exactly like the original.
		// Hono needs the /* variant for subpaths; Express matched both.
		const handler = createRouteHandler(def);
		app.use(def.route, handler);
		app.use(`${def.route}/*`, handler);
	}

	return app;
}

export interface KugouServerExtension {
	service?: ReturnType<typeof serve>;
}

/**
 * Start the KuGouMusic API service — port of startService().
 * PORT env (default 3000), HOST env (default "" = all interfaces).
 */
export async function startService(): Promise<KgHono & KugouServerExtension> {
	const port = Number(process.env.PORT || "3000");
	const host = process.env.HOST || "";

	const app = await constructServer();
	const server = host
		? serve({ fetch: app.fetch, port, hostname: host })
		: serve({ fetch: app.fetch, port });
	console.log(`server running @ http://${host || "localhost"}:${port}`);

	return Object.assign(app, { service: server });
}
