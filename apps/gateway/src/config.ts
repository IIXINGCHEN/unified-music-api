/**
 * Gateway configuration.
 *
 * Mirrors Go `internal/config` (config.go / loader.go / validator.go):
 * - loads `config.yaml` with the `yaml` package (same structure / snake_case keys),
 * - applies defaults,
 * - applies environment-variable overrides,
 * - validates with zod.
 *
 * Deliberate deviations from Go are documented in docs/parity-p3-gateway.md.
 */
import { existsSync, readFileSync } from "node:fs";
import YAML from "yaml";
import { z } from "zod";

/** Parse Go-style durations ("300ms", "30s", "5m", "2h") into milliseconds. */
export function parseDuration(value: unknown, fallbackMs: number): number {
	if (value === undefined || value === null || value === "") return fallbackMs;
	if (typeof value === "number") return value;
	if (typeof value !== "string") return fallbackMs;
	const m = /^\s*(\d+(?:\.\d+)?)\s*(ns|us|µs|ms|s|m|h)?\s*$/.exec(value);
	if (!m) return fallbackMs;
	const n = Number(m[1]);
	const unit = m[2] ?? "s";
	const mult: Record<string, number> = {
		ns: 1 / 1e6,
		us: 1 / 1e3,
		µs: 1 / 1e3,
		ms: 1,
		s: 1000,
		m: 60_000,
		h: 3_600_000,
	};
	return n * (mult[unit] ?? 1000);
}

const durationMs = (fallbackMs: number) =>
	z.preprocess((v) => parseDuration(v, fallbackMs), z.number().nonnegative());

const apiAuthSchema = z.object({
	enabled: z.boolean().default(false),
	api_key: z.string().default(""),
	admin_key: z.string().default(""),
	require_https: z.boolean().default(false),
	enable_rate_limit: z.boolean().default(false),
	rate_limit_per_min: z.number().int().default(60),
	enable_audit_log: z.boolean().default(false),
	white_list: z.array(z.string()).default([]),
	allowed_user_agent: z.array(z.string()).default([]),
});

const corsSchema = z.object({
	enabled: z.boolean().default(true),
	allowed_origins: z.array(z.string()).default(["*"]),
	allowed_methods: z
		.array(z.string())
		.default(["GET", "POST", "PUT", "DELETE", "OPTIONS"]),
	allowed_headers: z.array(z.string()).default(["*"]),
	expose_headers: z.array(z.string()).default([]),
	allow_credentials: z.boolean().default(false),
	max_age: z.string().default("12h"),
});

const configSchema = z.object({
	app: z
		.object({
			name: z.string().default("music-api-proxy"),
			version: z.string().default("v2.1.0"),
			mode: z.string().default("development"),
			description: z.string().default(""),
			debug: z.boolean().default(false),
		})
		.default({}),
	server: z
		.object({
			host: z.string().default("0.0.0.0"),
			port: z.number().int().default(5678),
			allowed_domain: z.string().default(""),
			proxy_url: z.string().default(""),
			enable_flac: z.boolean().default(false),
			enable_https: z.boolean().default(false),
			cert_file: z.string().default(""),
			key_file: z.string().default(""),
			read_timeout: durationMs(30_000),
			write_timeout: durationMs(30_000),
			idle_timeout: durationMs(60_000),
		})
		.default({}),
	logging: z
		.object({
			level: z.string().default("info"),
			format: z.string().default("json"),
			output: z.string().default("stdout"),
			file: z.string().default(""),
			enable_caller: z.boolean().default(false),
			enable_stacktrace: z.boolean().default(false),
		})
		.default({}),
	security: z
		.object({
			enable_auth: z.boolean().default(false),
			jwt_secret: z.string().default(""),
			api_key: z.string().default(""),
			cors_origins: z.array(z.string()).default([]),
			tls_enabled: z.boolean().default(false),
			tls_cert_file: z.string().default(""),
			tls_key_file: z.string().default(""),
			api_auth: apiAuthSchema.nullish().default(null),
			cors: corsSchema.default({}),
			allowed_ips: z.array(z.string()).default([]),
			blocked_user_agents: z.array(z.string()).default([]),
			max_request_size: z.number().int().default(0),
		})
		.default({}),
	performance: z
		.object({
			max_concurrent_requests: z.number().int().default(100),
			request_timeout: durationMs(30_000),
			rate_limit: z
				.object({
					enabled: z.boolean().default(false),
					requests_per_minute: z.number().int().default(100),
					burst: z.number().int().default(10),
				})
				.default({}),
		})
		.default({}),
	cache: z
		.object({
			enabled: z.boolean().default(true),
			type: z.string().default("memory"),
			ttl: durationMs(5 * 60_000),
			max_size: z.string().default("10MB"),
			cleanup_interval: durationMs(60_000),
		})
		.default({}),
	monitoring: z
		.object({
			enabled: z.boolean().default(true),
			metrics: z
				.object({
					enabled: z.boolean().default(true),
					path: z.string().default("/metrics"),
					port: z.number().int().default(9090),
				})
				.default({}),
			health_check: z
				.object({
					enabled: z.boolean().default(true),
					path: z.string().default("/health"),
					interval: durationMs(30_000),
				})
				.default({}),
		})
		.default({}),
	sources: z
		.object({
			default_sources: z.array(z.string()).default(["gdstudio", "unm_server"]),
			enabled_sources: z.array(z.string()).default(["gdstudio", "unm_server"]),
			test_sources: z.array(z.string()).default(["gdstudio"]),
			timeout: durationMs(30_000),
			retry_count: z.number().int().default(3),
			unm_server: z
				.object({
					enabled: z.boolean().default(true),
					base_url: z.string().default("https://api-unm.imixc.top"),
					api_key: z.string().default(""),
					timeout: durationMs(30_000),
					retry_count: z.number().int().default(3),
					user_agent: z.string().default(""),
				})
				.default({}),
			gdstudio: z
				.object({
					enabled: z.boolean().default(true),
					base_url: z
						.string()
						.default("https://music-api.gdstudio.xyz/api.php"),
					api_key: z.string().default(""),
					timeout: durationMs(30_000),
					retry_count: z.number().int().default(3),
					user_agent: z.string().default(""),
				})
				.default({}),
		})
		.default({}),
	middleware: z
		.object({
			logging: z
				.object({
					skip_paths: z
						.array(z.string())
						.default(["/health", "/ready", "/metrics"]),
				})
				.default({}),
		})
		.default({}),
});

export type GatewayConfig = z.infer<typeof configSchema>;

/** Default upstream bases for the 5 platform microservices (matches docker-compose). */
export const PLATFORM_DEFAULTS: Record<string, string> = {
	netease: "http://netease:3001",
	kugou: "http://kugou:3002",
	unm: "http://unm:3003",
	lyric: "http://lyric:3004",
	meting: "http://meting:3005",
};

export const PLATFORM_ENV_NAMES: Record<string, string> = {
	netease: "PLATFORM_NETEASE_URL",
	kugou: "PLATFORM_KUGOU_URL",
	unm: "PLATFORM_UNM_URL",
	lyric: "PLATFORM_LYRIC_URL",
	meting: "PLATFORM_METING_URL",
};

export const PLATFORM_NAMES = Object.keys(PLATFORM_DEFAULTS);

/** Resolve upstream base URL for a platform name (env override wins). */
export function platformUpstream(name: string): string | null {
	const def = PLATFORM_DEFAULTS[name];
	if (!def) return null;
	const envName = PLATFORM_ENV_NAMES[name];
	const override = envName ? (process.env[envName] ?? "").trim() : "";
	return override !== "" ? override : def;
}

function applyEnvOverrides(cfg: GatewayConfig): GatewayConfig {
	const env = process.env;
	const bool = (v: string | undefined) => v === "true";

	if (env.PORT) cfg.server.port = Number(env.PORT) || cfg.server.port;
	if (env.HOST) cfg.server.host = env.HOST;
	if (env.ALLOWED_DOMAIN) cfg.server.allowed_domain = env.ALLOWED_DOMAIN;
	if (env.PROXY_URL) cfg.server.proxy_url = env.PROXY_URL;
	if (env.ENABLE_FLAC) cfg.server.enable_flac = bool(env.ENABLE_FLAC);
	if (env.JWT_SECRET) cfg.security.jwt_secret = env.JWT_SECRET;
	if (env.API_KEY) cfg.security.api_key = env.API_KEY;
	if (env.RATE_LIMIT_ENABLED)
		cfg.performance.rate_limit.enabled = bool(env.RATE_LIMIT_ENABLED);
	if (env.RATE_LIMIT_REQUESTS_PER_MINUTE)
		cfg.performance.rate_limit.requests_per_minute =
			Number(env.RATE_LIMIT_REQUESTS_PER_MINUTE) ||
			cfg.performance.rate_limit.requests_per_minute;
	if (env.RATE_LIMIT_BURST)
		cfg.performance.rate_limit.burst =
			Number(env.RATE_LIMIT_BURST) || cfg.performance.rate_limit.burst;
	if (env.REQUEST_TIMEOUT)
		cfg.performance.request_timeout = parseDuration(
			env.REQUEST_TIMEOUT,
			cfg.performance.request_timeout,
		);
	if (env.CACHE_TTL)
		cfg.cache.ttl = parseDuration(env.CACHE_TTL, cfg.cache.ttl);
	if (env.METRICS_ENABLED)
		cfg.monitoring.metrics.enabled = bool(env.METRICS_ENABLED);
	if (env.METRICS_PORT)
		cfg.monitoring.metrics.port =
			Number(env.METRICS_PORT) || cfg.monitoring.metrics.port;
	if (env.HEALTH_CHECK_ENABLED)
		cfg.monitoring.health_check.enabled = bool(env.HEALTH_CHECK_ENABLED);
	if (env.UNM_SERVER_BASE_URL)
		cfg.sources.unm_server.base_url = env.UNM_SERVER_BASE_URL;
	if (env.UNM_SERVER_API_KEY)
		cfg.sources.unm_server.api_key = env.UNM_SERVER_API_KEY;
	if (env.GDSTUDIO_BASE_URL)
		cfg.sources.gdstudio.base_url = env.GDSTUDIO_BASE_URL;
	if (env.GDSTUDIO_API_KEY) cfg.sources.gdstudio.api_key = env.GDSTUDIO_API_KEY;

	// GO_ENV/NODE_ENV adjusts log level like the Go loader does.
	const goEnv = env.GO_ENV ?? env.NODE_ENV;
	if (goEnv === "development") cfg.logging.level = "debug";
	else if (goEnv === "production") cfg.logging.level = "info";

	return cfg;
}

/** Cross-field validation mirroring Go validator.go (message text kept in Chinese). */
export function validateConfig(cfg: GatewayConfig): string[] {
	const errors: string[] = [];
	if (cfg.server.port < 1 || cfg.server.port > 65535) {
		errors.push(`端口号必须在1-65535之间，当前值: ${cfg.server.port}`);
	}
	if (cfg.server.proxy_url) {
		try {
			new URL(cfg.server.proxy_url);
		} catch {
			errors.push(`代理URL格式无效: ${cfg.server.proxy_url}`);
		}
	}
	const isProd = cfg.app.mode === "production";
	if (
		isProd &&
		(cfg.security.jwt_secret === "" ||
			cfg.security.jwt_secret === "your-jwt-secret-key-here")
	) {
		errors.push("生产环境不能使用默认JWT密钥");
	}
	if (cfg.security.jwt_secret !== "" && cfg.security.jwt_secret.length < 32) {
		errors.push("JWT密钥长度不能少于32个字符");
	}
	if (cfg.security.tls_enabled && !cfg.security.tls_cert_file) {
		errors.push("启用TLS时必须指定证书文件");
	}
	if (cfg.security.tls_enabled && !cfg.security.tls_key_file) {
		errors.push("启用TLS时必须指定私钥文件");
	}
	if (cfg.performance.max_concurrent_requests <= 0)
		errors.push("最大并发请求数必须大于0");
	if (cfg.performance.max_concurrent_requests > 10_000)
		errors.push(
			`最大并发请求数不能超过10000，当前值: ${cfg.performance.max_concurrent_requests}`,
		);
	if (cfg.performance.request_timeout <= 0)
		errors.push("请求超时时间必须大于0");
	if (cfg.performance.request_timeout > 5 * 60_000)
		errors.push(
			`请求超时时间不能超过5分钟，当前值: ${cfg.performance.request_timeout}ms`,
		);
	if (cfg.performance.rate_limit.enabled) {
		if (cfg.performance.rate_limit.requests_per_minute <= 0)
			errors.push("限流每分钟请求数必须大于0");
		if (cfg.performance.rate_limit.burst <= 0)
			errors.push("限流突发请求数必须大于0");
	}
	const available = [
		cfg.sources.unm_server.enabled ? "unm_server" : "",
		cfg.sources.gdstudio.enabled ? "gdstudio" : "",
	].filter(Boolean);
	if (available.length === 0) errors.push("没有可用的音源");
	return errors;
}

const SEARCH_PATHS = [
	"./config.yaml",
	"./configs/config.yaml",
	"/etc/music-api-proxy/config.yaml",
];

/** Find a config.yaml like the Go viper search (".", "./configs", "/etc/music-api-proxy"). */
export function findConfigFile(): string | null {
	for (const p of SEARCH_PATHS) {
		if (existsSync(p)) return p;
	}
	return null;
}

/**
 * Validate a single config section against the matching Zod section schema.
 * Returns the parsed section (defaults applied); throws on validation failure.
 */
export function parseConfigSection(section: string, data: unknown): unknown {
	const shape = configSchema.shape as Record<string, z.ZodTypeAny | undefined>;
	const schema = shape[section];
	if (!schema) throw new Error(`配置节不存在: ${section}`);
	return schema.parse(data);
}

/**
 * Load gateway config: yaml file -> defaults -> env overrides -> validation.
 * Missing file is fine (defaults + env), a file that fails validation throws.
 */
export function loadConfig(configPath?: string): GatewayConfig {
	const file =
		configPath ?? process.env.CONFIG_PATH ?? findConfigFile() ?? null;
	let raw: unknown = {};
	if (file) {
		raw = YAML.parse(readFileSync(file, "utf-8")) ?? {};
	}
	const parsed = configSchema.parse(raw);
	const cfg = applyEnvOverrides(parsed);
	const errors = validateConfig(cfg);
	if (errors.length > 0) {
		throw new Error(`配置验证失败: ${errors.join("; ")}`);
	}
	return cfg;
}
