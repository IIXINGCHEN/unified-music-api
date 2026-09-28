/**
 * Hono port of api-enhanced/server.js (Express).
 *
 * Replicates, in order: static (skipped — no public/ dir, see parity doc),
 * CORS, cookie parsing, body parsing (json / urlencoded / multipart 500mb),
 * 2-minute apicache, then per-module `app.all(route)` registration with the
 * exact query-merge / IP-injection / cookie / redirect / error semantics.
 */

import { exec } from "node:child_process";
// NOTE: package.json is outside src/; tsconfig rootDir=src so import it via
// createRequire instead of a relative import (keeps `tsc -p` happy).
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { serve } from "@hono/node-server";
import {
	cookieMiddleware,
	corsMiddleware,
	getClientIp,
	parseCorsAllowOrigins,
	parseMultipart,
	responseCache,
	safeDecode,
	scanModuleFiles,
} from "@music-api/http-kit";
import {
	APP_CONF,
	cookieToJson,
	createRequest,
	getCnIp,
	initNcmCore,
	type NcmModuleFn,
	type NcmQuery,
	type NcmRequestFn,
	type NcmResponse,
} from "@music-api/ncm-core";
import { Hono } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import { logger } from "./logger.js";
import { getToken as getCheckTokenV2 } from "./modules/register_checktoken_v2.js";
import { getToken as getCheckTokenV3 } from "./modules/register_checktoken_v3.js";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJSON = require("../package.json") as { version: string };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Port of server.js ModuleDefinition. */
export interface NcmModuleDef {
	identifier?: string;
	route: string;
	module: NcmModuleFn;
}

/** Port of server.js NcmApiOptions. */
export interface NcmApiOptions {
	port?: number;
	host?: string;
	checkVersion?: boolean;
	moduleDefs?: NcmModuleDef[];
}

interface VersionCheckResult {
	status: number;
	ourVersion?: string;
	npmVersion?: string;
}

const VERSION_CHECK_RESULT = {
	FAILED: -1,
	NOT_LATEST: 0,
	LATEST: 1,
} as const;

// ---------------------------------------------------------------------------
// Module scanning
// ---------------------------------------------------------------------------

/**
 * Port of getModulesDefinitions(). Scans src/modules (dev/tsx) or
 * dist/modules (compiled), mapping `_` → `/` with the three special routes.
 */
export async function getModuleDefinitions(): Promise<NcmModuleDef[]> {
	const here = dirname(fileURLToPath(import.meta.url));
	const isDist = /(^|[\\/])dist$/.test(here);
	const ext = isDist ? ".js" : ".ts";
	const special: Record<string, string> = {
		[`daily_signin${ext}`]: "/daily_signin",
		[`fm_trash${ext}`]: "/fm_trash",
		[`personal_fm${ext}`]: "/personal_fm",
	};
	const scanned = scanModuleFiles(join(here, "modules"), { special, ext });
	return Promise.all(
		scanned.map(async (d) => ({
			identifier: d.identifier,
			route: d.route,
			module: (await import(pathToFileURL(d.file).href)).default as NcmModuleFn,
		})),
	);
}

// ---------------------------------------------------------------------------
// Version check (opt-in; original ran it when options.checkVersion was set)
// ---------------------------------------------------------------------------

async function checkVersion(): Promise<VersionCheckResult> {
	return new Promise((resolve) => {
		exec("npm info NeteaseCloudMusicApiEnhanced version", (err, stdout) => {
			if (!err) {
				const version = stdout.trim();
				resolve({
					status:
						packageJSON.version < version
							? VERSION_CHECK_RESULT.NOT_LATEST
							: VERSION_CHECK_RESULT.LATEST,
					ourVersion: packageJSON.version,
					npmVersion: version,
				});
			} else {
				resolve({ status: VERSION_CHECK_RESULT.FAILED });
			}
		});
	});
}

function createConsoleSpinner(message = "启动中"): { stop(): void } {
	if (!process.stdout.isTTY) {
		return { stop() {} };
	}
	const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
	let index = 0;
	process.stdout.write(`${frames[index]} ${message}...`);
	const timer = setInterval(() => {
		index = (index + 1) % frames.length;
		process.stdout.write(`\r${frames[index]} ${message}...`);
	}, 80);
	return {
		stop() {
			clearInterval(timer);
			process.stdout.write(`\r✔ ${message} 完成。\n`);
		},
	};
}

// ---------------------------------------------------------------------------
// Body parsing (express.json / express.urlencoded extended:false /
// express-fileupload subset), 500mb limits like the original.
// ---------------------------------------------------------------------------

const MAX_UPLOAD_SIZE_MB = 500;
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

/** Flat form parsing — mirrors express.urlencoded({ extended: false }). */
function parseFlatForm(text: string): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [k, v] of new URLSearchParams(text)) {
		if (k in out) {
			const prev = out[k];
			out[k] = Array.isArray(prev) ? [...prev, v] : [prev, v];
		} else {
			out[k] = v;
		}
	}
	return out;
}

/** Collapse c.req.queries() single-element arrays (Express simple parser). */
function collapseQueries(
	queries: Record<string, string[]>,
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(queries)) {
		out[k] = v.length === 1 ? v[0] : v;
	}
	return out;
}

interface ParsedBody {
	fields: Record<string, unknown>;
	files: Record<string, unknown>;
}

/** Context variables set by the cookie/body middlewares. */
export interface NcmAppVariables {
	cookies: Record<string, string>;
	parsedBody: ParsedBody;
}

// ---------------------------------------------------------------------------
// Server construction
// ---------------------------------------------------------------------------

/**
 * Port of constructServer(). Middleware order mirrors the original:
 * CORS → cookie → body → cache → routes.
 */
export async function constructServer(
	moduleDefs?: NcmModuleDef[],
): Promise<Hono<{ Variables: NcmAppVariables }>> {
	// Wire ncm-core side effects (original: util/request.js require-time reads
	// + generateConfig() at startup). Idempotent; safe to call per server.
	initNcmCore({
		getCheckToken: async (version: "v2" | "v3") =>
			version === "v3" ? getCheckTokenV3() : getCheckTokenV2(),
	});

	const app = new Hono<{ Variables: NcmAppVariables }>();

	// NOTE: original served express.static(public/) first; apps/netease has no
	// public/ directory (see docs/parity-p3-netease.md), so it is skipped.

	// CORS & preflight
	app.use(
		corsMiddleware({
			mode: "reflect-list",
			allowOrigins: parseCorsAllowOrigins(process.env.CORS_ALLOW_ORIGIN),
			allowHeaders: "X-Requested-With,Content-Type",
		}),
	);

	// Cookie parser
	app.use(cookieMiddleware());

	// Body parser + file upload
	app.use(async (c, next) => {
		const contentType = c.req.header("content-type") || "";
		const contentLength = Number(c.req.header("content-length") || "0");
		if (contentLength > MAX_UPLOAD_SIZE_BYTES) {
			return c.body("Payload Too Large", 413);
		}
		const parsed: ParsedBody = { fields: {}, files: {} };
		try {
			if (contentType.includes("application/json")) {
				const text = await c.req.text();
				if (text.trim()) {
					parsed.fields = JSON.parse(text) as Record<string, unknown>;
				}
			} else if (contentType.includes("application/x-www-form-urlencoded")) {
				parsed.fields = parseFlatForm(await c.req.text());
			} else if (contentType.includes("multipart/form-data")) {
				const { fields, files } = await parseMultipart(c, {
					maxFileSize: MAX_UPLOAD_SIZE_BYTES,
				});
				parsed.fields = fields;
				parsed.files = files as Record<string, unknown>;
			}
		} catch (err) {
			const status =
				typeof (err as { status?: unknown }).status === "number"
					? (err as { status: number }).status
					: 400;
			return c.body(
				status === 413 ? "Payload Too Large" : "Bad Request",
				status as 400 | 413,
			);
		}
		c.set("parsedBody", parsed);
		await next();
	});

	// 2-minute response cache (200 only), keyed by host+url+cookies
	app.use(responseCache({ ttlMs: 2 * 60 * 1000 }));

	app.get("/health", (c) => c.json({ status: "ok", service: "netease" }));

	const moduleDefinitions = moduleDefs ?? (await getModuleDefinitions());

	for (const moduleDef of moduleDefinitions) {
		// Register the route (original: app.all).
		app.all(moduleDef.route, async (c) => {
			const reqCookies = c.get("cookies");
			const queryParams = collapseQueries(c.req.queries());
			const parsed = c.get("parsedBody") ?? {
				fields: {},
				files: {},
			};

			for (const item of [queryParams, parsed.fields] as Array<
				Record<string, unknown>
			>) {
				// Guard: body may be missing in some environments.
				if (item && typeof item.cookie === "string") {
					item.cookie = cookieToJson(safeDecode(item.cookie));
				}
			}

			const query: NcmQuery = Object.assign(
				{},
				{ cookie: reqCookies },
				queryParams,
				parsed.fields,
				parsed.files,
			);

			// NOTE: c.newResponse() (not `new Response`) so headers set by
			// upstream middleware via c.header() (CORS, cache) are merged in.
			// Headers are passed as a plain record: Header values given as an
			// array are appended (needed for multi Set-Cookie), and explicit
			// values win over prepared ones. A Headers instance would be
			// silently ignored by Hono's Object.entries() merge.
			const buildResponse = (
				status: StatusCode,
				body: unknown,
				setCookies: string[],
			): Response => {
				const headers: Record<string, string | string[]> = {};
				if (setCookies.length > 0) headers["set-cookie"] = setCookies;
				if (Buffer.isBuffer(body)) {
					headers["content-type"] = "application/octet-stream";
					// Slice to a standalone ArrayBuffer (Hono's Data wants
					// Uint8Array<ArrayBuffer>, not Buffer<ArrayBufferLike>).
					const ab = body.buffer.slice(
						body.byteOffset,
						body.byteOffset + body.byteLength,
					) as ArrayBuffer;
					return c.newResponse(ab, status, headers);
				}
				// The CORS middleware forces application/json on API paths;
				// Express res.send(string) likewise kept the preset header.
				headers["content-type"] = "application/json; charset=utf-8";
				return c.newResponse(
					typeof body === "string"
						? body
						: body === undefined
							? ""
							: JSON.stringify(body),
					status,
					headers,
				);
			};

			try {
				let usedCrypto = "";
				const requestFn: NcmRequestFn = (async (uri, data, options) => {
					type ReqOpts = NonNullable<Parameters<NcmRequestFn>[2]>;
					const opts = (options ?? {}) as ReqOpts as ReqOpts & {
						crypto?: string;
					};
					usedCrypto = opts.crypto || "";
					let ip: string;
					if (opts.randomCNIP) {
						ip = getCnIp();
					} else {
						ip = getClientIp(c);
						if (ip.substring(0, 7) === "::ffff:") {
							ip = ip.substring(7);
						}
						if (ip === "" || ip === "::1") {
							ip = getCnIp();
						}
					}
					return createRequest(uri, data, { ...opts, ip });
				}) as NcmRequestFn;

				const moduleResponse = (await moduleDef.module(
					query,
					requestFn,
					// song_url_v1_302 returns redirectUrl (untyped in NcmResponse)
				)) as NcmResponse & { redirectUrl?: string };
				const displayCrypto = usedCrypto || (APP_CONF.encrypt ? "eapi" : "api");
				logger.info(
					`Request Success: [${displayCrypto}] ${safeDecode(c.req.url)}`,
				);

				// 夹带私货部分：如果开启了通用解锁，并且是获取歌曲URL的接口，则尝试解锁（如果需要的话）
				if (
					moduleDef.route === "/song/url/v1" &&
					process.env.ENABLE_GENERAL_UNBLOCK === "true"
				) {
					const song = moduleResponse.body.data[0];
					if (
						song.freeTrialInfo !== null ||
						!song.url ||
						[1, 4].includes(song.fee)
					) {
						const { matchID } = await import(
							"@neteasecloudmusicapienhanced/unblockmusic-utils"
						);
						logger.info(
							"Starting unblock(uses general unblock):",
							queryParams.id,
						);
						const result = await matchID(queryParams.id);
						song.url = result.data.url;
						song.freeTrialInfo = null;
						logger.info("Unblock success! url:", song.url);
					}
					if (song.url?.includes("kuwo")) {
						const proxy = process.env.PROXY_URL;
						const useProxy = process.env.ENABLE_PROXY || "false";
						if (useProxy === "true" && proxy) {
							song.proxyUrl = proxy + song.url;
						}
					}
				}

				// Express trust-proxy semantics: X-Forwarded-Proto wins over the
				// local URL scheme when behind a TLS-terminating proxy.
				const forwardedProto = c.req
					.header("x-forwarded-proto")
					?.split(",")[0]
					?.trim()
					.toLowerCase();
				const https =
					forwardedProto === "https" ||
					new URL(c.req.url).protocol === "https:";
				const cookies = moduleResponse.cookie;
				let setCookies: string[] = [];
				if (!query.noCookie) {
					if (Array.isArray(cookies) && cookies.length > 0) {
						setCookies = (cookies as string[]).map((cookie) =>
							https ? `${cookie}; SameSite=None; Secure` : cookie,
						);
					}
				}
				if (moduleResponse.redirectUrl) {
					const headers: Record<string, string | string[]> = {
						location: moduleResponse.redirectUrl,
					};
					if (setCookies.length > 0) headers["set-cookie"] = setCookies;
					return c.newResponse(
						null,
						(moduleResponse.status || 302) as StatusCode,
						headers,
					);
				}

				return buildResponse(
					moduleResponse.status as StatusCode,
					moduleResponse.body,
					setCookies,
				);
			} catch (e) {
				const moduleResponse = e as {
					status?: number;
					body?: { code?: unknown; msg?: string };
					cookie?: unknown;
				};
				logger.error(`${safeDecode(c.req.url)}`, {
					status: moduleResponse.status,
					body: moduleResponse.body,
				});
				if (!moduleResponse.body) {
					return buildResponse(
						404,
						{ code: 404, data: null, msg: "Not Found" },
						[],
					);
				}
				// biome-ignore lint/suspicious/noDoubleEquals: original used == '301'
				if (moduleResponse.body.code == "301")
					moduleResponse.body.msg = "需要登录";
				let setCookies: string[] = [];
				if (!query.noCookie && moduleResponse.cookie) {
					setCookies = Array.isArray(moduleResponse.cookie)
						? (moduleResponse.cookie as string[])
						: [String(moduleResponse.cookie)];
				}
				return buildResponse(
					(moduleResponse.status || 500) as StatusCode,
					moduleResponse.body,
					setCookies,
				);
			}
		});
	}

	return app;
}

// ---------------------------------------------------------------------------
// serveNcmApi
// ---------------------------------------------------------------------------

/**
 * Port of serveNcmApi(). Starts the Hono app with @hono/node-server.
 * Returns { app, server } (original returned the express app with .server).
 */
export async function serveNcmApi(options: NcmApiOptions = {}): Promise<{
	app: Hono<{ Variables: NcmAppVariables }>;
	server: ReturnType<typeof serve>;
}> {
	const port = Number(options.port || process.env.PORT || "3000");
	const host = options.host || process.env.HOST || "";

	const spinner = createConsoleSpinner("服务启动中");

	const checkVersionSubmission =
		options.checkVersion &&
		checkVersion().then(({ npmVersion, ourVersion, status }) => {
			if (status === VERSION_CHECK_RESULT.NOT_LATEST) {
				logger.warn(
					`最新版本: ${npmVersion}, 当前版本: ${ourVersion}, 请及时更新`,
				);
			}
		});
	const constructServerSubmission = constructServer(options.moduleDefs);

	const [, app] = await Promise.all([
		checkVersionSubmission,
		constructServerSubmission,
	]);

	spinner.stop();

	const server = serve(
		{
			fetch: app.fetch,
			port,
			hostname: host === "" ? undefined : host,
		},
		(info) => {
			console.log(`
  ╔═╗╔═╗╦    ╔═╗╔╗╔╦ ╦╔═╗╔╗╔╔═╗╔═╗╔╦╗
  ╠═╣╠═╝║    ║╣ ║║║╠═╣╠═╣║║║║  ║╣  ║║
  ╩ ╩╩  ╩    ╚═╝╝╚╝╩ ╩╩ ╩╝╚╝╚═╝╚═╝═╩╝
    `);
			logger.info(
				`Server started successfully @ http://${host ? host : "localhost"}:${info.port}`,
			);
		},
	);

	return { app, server };
}
