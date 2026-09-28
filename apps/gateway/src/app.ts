/**
 * Application assembler: createApp(cfg, deps) -> Hono.
 *
 * Mirrors Go main.go createRouter + controller_manager RegisterRoutes:
 * global middleware (recovery, logging, CORS, metrics) then route groups.
 *
 * Security note: Go applied APIKeyAuth/AdminAuth to route groups that the
 * controllers never registered into, so auth was effectively a no-op. The TS
 * port applies the middleware as intended (documented in parity-p3-gateway.md).
 */

import { createRequire } from "node:module";
import { Scalar } from "@scalar/hono-api-reference";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import type { GatewayConfig } from "./config.js";
import { loadConfig } from "./config.js";
import {
	authMiddleware,
	corsMiddleware,
	recoveryMiddleware,
	requestLogger,
} from "./middleware.js";
import { fail } from "./response.js";
import { configRoutes } from "./routes/config.js";
import { healthRoutes } from "./routes/health.js";
import { musicRoutes } from "./routes/music.js";
import { platformRoutes } from "./routes/platform.js";
import { notFoundHandler, rootRoutes } from "./routes/root.js";
import { systemRoutes } from "./routes/system.js";
import {
	bindConfigLoader,
	ConfigService,
	HealthChecker,
	MemoryCache,
	MetricsCollector,
	MusicService,
	SourceManager,
	SystemService,
} from "./services.js";

bindConfigLoader({ loadConfig });

export interface VersionInfo {
	version: string;
	buildTime: string;
	gitCommit: string;
}

export interface AppDeps {
	sourceManager?: SourceManager;
	cache?: MemoryCache | null;
	publicDir?: string;
	configPath?: string | null;
	version?: VersionInfo;
	/** Skip recording metrics (tests). */
	recordMetrics?: boolean;
}

export interface BuiltApp {
	app: Hono;
	services: {
		music: MusicService;
		system: SystemService;
		config: ConfigService;
		health: HealthChecker;
		metrics: MetricsCollector;
		sources: SourceManager;
		cache: MemoryCache | null;
	};
}

export function isSecurityEnabled(cfg: GatewayConfig): boolean {
	return Boolean(cfg.security.enable_auth && cfg.security.api_auth?.enabled);
}

export function createApp(cfg: GatewayConfig, deps: AppDeps = {}): BuiltApp {
	const cache =
		deps.cache === undefined
			? cfg.cache.enabled
				? new MemoryCache()
				: null
			: deps.cache;
	const sources = deps.sourceManager ?? new SourceManager(cfg);
	const health = new HealthChecker();
	const metrics = new MetricsCollector();
	const music = new MusicService(sources, cache, cfg);
	const version = deps.version ?? {
		version: process.env.APP_VERSION ?? cfg.app.version,
		buildTime: process.env.BUILD_TIME ?? "unknown",
		gitCommit: process.env.GIT_COMMIT ?? "unknown",
	};
	const system = new SystemService(
		sources,
		cache,
		health,
		metrics,
		cfg,
		version,
	);
	const configSvc = new ConfigService(cfg, deps.configPath ?? null);

	const app = new Hono();

	// ---- global middleware (Go plugin middlewares: recovery, logging, cors) ----
	app.use(recoveryMiddleware());
	app.use(requestLogger(cfg.middleware.logging.skip_paths));
	app.use(corsMiddleware(cfg.security.cors));

	// metrics recording (Go metrics middleware port)
	if (deps.recordMetrics !== false) {
		app.use(async (c: Context, next: Next) => {
			const start = Date.now();
			await next();
			const ms = Date.now() - start;
			const okStatus = c.res.status < 400;
			metrics.recordRequest(okStatus, ms);
			if (!okStatus) {
				metrics.recordError(
					"http_error",
					c.res.status,
					`${c.req.method} ${new URL(c.req.url).pathname}`,
				);
			}
		});
	}

	// ---- routes ----
	app.route("/", healthRoutes(health, metrics));

	// API 文档（Scalar）：spec 来自 apps/gateway/openapi.json（scripts/gen-openapi.mjs 生成）
	app.get(
		"/docs",
		Scalar({
			spec: {
				content: createRequire(import.meta.url)("../openapi.json") as Record<
					string,
					unknown
				>,
			},
		}),
	);
	app.route(
		"/",
		rootRoutes({
			version: version.version,
			securityEnabled: isSecurityEnabled(cfg),
			rateLimitEnabled: Boolean(cfg.security.api_auth?.enable_rate_limit),
			publicDir: deps.publicDir ?? process.env.PUBLIC_DIR ?? "./public",
		}),
	);
	app.route("/", musicRoutes(music));
	app.route("/", platformRoutes());

	const securityEnabled = isSecurityEnabled(cfg);
	const apiAuth = cfg.security.api_auth;

	const auditLogger = (msg: string, fields?: Record<string, unknown>) =>
		console.log(msg, fields ?? {});
	if (securityEnabled && apiAuth) {
		// system APIs: API-key auth (Go controller_manager intent)
		app.use(
			"/api/v1/system/*",
			authMiddleware({
				admin: false,
				apiKey: apiAuth.api_key,
				adminKey: apiAuth.admin_key,
				whiteList: apiAuth.white_list,
				enableRateLimit: apiAuth.enable_rate_limit,
				rateLimitPerMin: apiAuth.rate_limit_per_min,
				requireHTTPS: apiAuth.require_https,
				allowedUserAgent: apiAuth.allowed_user_agent,
				enableAuditLog: apiAuth.enable_audit_log,
				logger: auditLogger,
			}),
		);
		// config APIs: admin-key auth (Go controller_manager intent)
		const adminMw = authMiddleware({
			admin: true,
			apiKey: apiAuth.api_key,
			adminKey: apiAuth.admin_key,
			whiteList: apiAuth.white_list,
			enableRateLimit: apiAuth.enable_rate_limit,
			rateLimitPerMin: apiAuth.rate_limit_per_min,
			requireHTTPS: apiAuth.require_https,
			allowedUserAgent: apiAuth.allowed_user_agent,
			enableAuditLog: apiAuth.enable_audit_log,
			logger: auditLogger,
		});
		app.use("/api/v1/config", adminMw);
		app.use("/api/v1/config/*", adminMw);
	}

	const sysApp = systemRoutes(system);
	app.route("/", sysApp);

	const cfgApp = configRoutes(configSvc);
	app.route("/", cfgApp);

	// ---- 404 / 405 / 500 ----
	app.notFound(notFoundHandler);
	app.onError((err, c) => {
		console.error("unhandled error:", err);
		return fail(c, 500, 500, "内部服务器错误");
	});

	return {
		app,
		services: {
			music,
			system,
			config: configSvc,
			health,
			metrics,
			sources,
			cache,
		},
	};
}
