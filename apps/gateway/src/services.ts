/**
 * Gateway services.
 *
 * Ports Go `internal/service` + `internal/repository` (memory cache, sliding
 * rate limiter, gdstudio/unm_server HTTP sources using the same api.php
 * protocol, music/system/config services) without the plugin framework.
 */
import { randomUUID } from "node:crypto";
import type { GatewayConfig } from "./config.js";
import { parseConfigSection } from "./config.js";

/* ------------------------------------------------------------------ */
/* In-memory TTL cache (Go cache_repository memory backend port)        */
/* ------------------------------------------------------------------ */

interface CacheEntry {
	value: string;
	expiresAt: number;
}

export class MemoryCache {
	private store = new Map<string, CacheEntry>();
	private hits = 0;
	private misses = 0;

	get(key: string): string | null {
		const e = this.store.get(key);
		if (!e) {
			this.misses++;
			return null;
		}
		if (Date.now() > e.expiresAt) {
			this.store.delete(key);
			this.misses++;
			return null;
		}
		this.hits++;
		return e.value;
	}

	set(key: string, value: string, ttlMs: number): void {
		this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
	}

	delete(key: string): void {
		this.store.delete(key);
	}

	clear(): void {
		this.store.clear();
		this.hits = 0;
		this.misses = 0;
	}

	stats(): Record<string, unknown> {
		let expired = 0;
		const now = Date.now();
		for (const [, e] of this.store) {
			if (now > e.expiresAt) expired++;
		}
		return {
			enabled: true,
			type: "memory",
			size: this.store.size,
			hits: this.hits,
			misses: this.misses,
			expired: expired,
		};
	}
}

/* ------------------------------------------------------------------ */
/* Music models + quality table (Go internal/model/music_model.go)      */
/* ------------------------------------------------------------------ */

export interface MusicInfo {
	id: string;
	name: string;
	artist: string;
	album: string;
	duration: number;
	pic_url: string;
}

export interface MusicURL {
	url: string;
	proxy_url?: string;
	quality?: string;
	size?: number;
	format?: string;
	source: string;
	info?: MusicInfo;
}

export interface MatchResponse {
	id: string;
	url: string;
	proxy_url?: string;
	quality?: string;
	source: string;
	info?: MusicInfo;
}

export interface NCMGetResponse {
	id: string;
	br: string;
	url: string;
	proxy_url?: string;
	quality?: string;
	info?: MusicInfo;
}

export interface OtherGetResponse {
	name: string;
	url: string;
	source: string;
	quality?: string;
	info?: MusicInfo;
}

export interface SearchResult {
	id: string;
	name: string;
	artist: string;
	album: string;
	duration: number;
	source: string;
	score: number;
}

const SUPPORTED_QUALITIES = [
	{ br: "128", bitrate: 128, format: "mp3", quality: "标准" },
	{ br: "192", bitrate: 192, format: "mp3", quality: "较高" },
	{ br: "320", bitrate: 320, format: "mp3", quality: "极高" },
	{ br: "740", bitrate: 740, format: "m4a", quality: "无损" },
	{ br: "999", bitrate: 999, format: "flac", quality: "Hi-Res" },
];

export function isValidQuality(br: string): boolean {
	return SUPPORTED_QUALITIES.some((q) => q.br === br);
}

export function validQualities(): string[] {
	return SUPPORTED_QUALITIES.map((q) => q.br);
}

/* ------------------------------------------------------------------ */
/* Sanitizer (Go internal/utils/sanitizer.go port)                      */
/* ------------------------------------------------------------------ */

const SENSITIVE_PATTERNS = [
	"key",
	"secret",
	"password",
	"token",
	"auth",
	"cert",
	"credential",
	"private",
	"confidential",
];

function isSensitiveField(name: string): boolean {
	const lower = name.toLowerCase();
	return SENSITIVE_PATTERNS.some((p) => lower.includes(p));
}

export function maskSensitive(value: string): string {
	if (value === "") return "";
	if (value.length <= 8) return "****";
	return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

/** Recursively mask sensitive fields by name pattern (Go SanitizeForProduction). */
export function sanitizeConfig<T>(value: T): T {
	if (value === null || value === undefined) return value;
	if (typeof value === "string") return value as T;
	if (Array.isArray(value))
		return value.map((v) => sanitizeConfig(v)) as unknown as T;
	if (typeof value === "object") {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			if (isSensitiveField(k)) {
				out[k] =
					typeof v === "string" ? maskSensitive(v) : v === "" ? "" : "****";
			} else {
				out[k] = sanitizeConfig(v);
			}
		}
		return out as T;
	}
	return value;
}

/* ------------------------------------------------------------------ */
/* Music sources (Go internal/repository/sources port)                  */
/* ------------------------------------------------------------------ */

export interface Source {
	name(): string;
	enabled(): boolean;
	searchMusic(keyword: string, limit: number): Promise<SearchResult[]>;
	getMusic(id: string, quality: string): Promise<MusicURL>;
	getMusicInfo(id: string): Promise<MusicInfo>;
	getPicture?(picID: string, size: string): Promise<string>;
	getLyric?(lyricID: string): Promise<{ lyric: string; tlyric: string }>;
	healthCheck(): Promise<void>;
}

interface SourceHttpOptions {
	baseURL: string;
	apiKey: string;
	userAgent: string;
	timeoutMs: number;
}

async function fetchJson(
	url: string,
	opts: SourceHttpOptions,
): Promise<unknown> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
	try {
		const res = await fetch(url, {
			signal: controller.signal,
			headers: {
				"User-Agent": opts.userAgent || "music-api-gateway/2.0.0",
				...(opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}),
			},
		});
		if (!res.ok) throw new Error(`请求失败，状态码: ${res.status}`);
		return (await res.json()) as unknown;
	} finally {
		clearTimeout(timer);
	}
}

/** Shared api.php protocol client used by both gdstudio and unm_server. */
class ApiPhpSource implements Source {
	constructor(
		private readonly sourceName: string,
		private readonly isEnabled: boolean,
		private readonly opts: SourceHttpOptions,
	) {}

	name(): string {
		return this.sourceName;
	}

	enabled(): boolean {
		return this.isEnabled;
	}

	private buildUrl(params: Record<string, string>): string {
		const qs = new URLSearchParams(params);
		const sep = this.opts.baseURL.includes("?") ? "&" : "?";
		return `${this.opts.baseURL}${sep}${qs.toString()}`;
	}

	async searchMusic(keyword: string, limit: number): Promise<SearchResult[]> {
		if (!this.isEnabled) throw new Error(`${this.sourceName}音源已禁用`);
		if (!keyword) throw new Error("搜索关键词不能为空");
		const url = this.buildUrl({
			types: "search",
			source: "netease",
			name: keyword,
			count: String(limit > 0 ? limit : 20),
			pages: "1",
		});
		const raw = (await fetchJson(url, this.opts)) as Array<{
			id: number | string;
			name: string;
			artist: string[] | string;
			album: string;
		}>;
		return (Array.isArray(raw) ? raw : []).map((item) => ({
			id: String(item.id),
			name: item.name ?? "",
			artist: Array.isArray(item.artist)
				? item.artist.join(", ")
				: (item.artist ?? ""),
			album: item.album ?? "",
			duration: 0,
			source: this.sourceName,
			score: 0,
		}));
	}

	async getMusic(id: string, quality: string): Promise<MusicURL> {
		if (!this.isEnabled) throw new Error(`${this.sourceName}音源已禁用`);
		if (!id) throw new Error("音乐ID不能为空");
		const url = this.buildUrl({
			types: "url",
			source: "netease",
			id,
			br: quality || "320",
		});
		const raw = (await fetchJson(url, this.opts)) as {
			url?: string;
			br?: number | string;
			size?: number;
			from?: string;
		};
		if (!raw?.url) throw new Error("未获取到有效播放链接");
		return {
			url: raw.url,
			quality: raw.br !== undefined ? String(raw.br) : undefined,
			size: typeof raw.size === "number" ? raw.size : undefined,
			source: this.sourceName,
		};
	}

	async getMusicInfo(id: string): Promise<MusicInfo> {
		if (!this.isEnabled) throw new Error(`${this.sourceName}音源已禁用`);
		const results = await this.searchMusic(id, 1);
		if (results.length === 0) throw new Error(`未找到音乐信息: ${id}`);
		const r = results[0]!;
		return {
			id: r.id,
			name: r.name,
			artist: r.artist,
			album: r.album,
			duration: r.duration,
			pic_url: "",
		};
	}

	async getPicture(picID: string, size: string): Promise<string> {
		if (!this.isEnabled) throw new Error(`${this.sourceName}音源已禁用`);
		const url = this.buildUrl({
			types: "pic",
			source: "netease",
			id: picID,
			size: size || "300",
		});
		const raw = (await fetchJson(url, this.opts)) as { url?: string };
		if (!raw?.url) throw new Error("未获取到专辑图链接");
		return raw.url;
	}

	async getLyric(lyricID: string): Promise<{ lyric: string; tlyric: string }> {
		if (!this.isEnabled) throw new Error(`${this.sourceName}音源已禁用`);
		const url = this.buildUrl({
			types: "lyric",
			source: "netease",
			id: lyricID,
		});
		const raw = (await fetchJson(url, this.opts)) as {
			lyric?: string;
			tlyric?: string;
		};
		return { lyric: raw?.lyric ?? "", tlyric: raw?.tlyric ?? "" };
	}

	async healthCheck(): Promise<void> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 5000);
		try {
			const res = await fetch(this.opts.baseURL, {
				signal: controller.signal,
				method: "HEAD",
			});
			if (!res.ok && res.status >= 500)
				throw new Error(`健康检查失败: ${res.status}`);
		} finally {
			clearTimeout(timer);
		}
	}
}

/* ------------------------------------------------------------------ */
/* Source manager (Go repository.SourceManager / source_config.go)       */
/* ------------------------------------------------------------------ */

export class SourceManager {
	private sources = new Map<string, Source>();

	constructor(cfg: GatewayConfig) {
		this.sources.set(
			"unm_server",
			new ApiPhpSource("unm_server", cfg.sources.unm_server.enabled, {
				baseURL: cfg.sources.unm_server.base_url,
				apiKey: cfg.sources.unm_server.api_key,
				userAgent: cfg.sources.unm_server.user_agent,
				timeoutMs: cfg.sources.unm_server.timeout,
			}),
		);
		this.sources.set(
			"gdstudio",
			new ApiPhpSource("gdstudio", cfg.sources.gdstudio.enabled, {
				baseURL: cfg.sources.gdstudio.base_url,
				apiKey: cfg.sources.gdstudio.api_key,
				userAgent: cfg.sources.gdstudio.user_agent,
				timeoutMs: cfg.sources.gdstudio.timeout,
			}),
		);
	}

	/** For tests: replace/extend sources. */
	register(source: Source): void {
		this.sources.set(source.name(), source);
	}

	getSource(name: string): Source {
		const s = this.sources.get(name);
		if (!s?.enabled()) throw new Error(`音源不可用: ${name}`);
		return s;
	}

	availableSources(): string[] {
		return [...this.sources.values()]
			.filter((s) => s.enabled())
			.map((s) => s.name());
	}

	defaultSources(cfg: GatewayConfig): string[] {
		const avail = this.availableSources();
		const configured = cfg.sources.default_sources.filter((s) =>
			avail.includes(s),
		);
		return configured.length > 0 ? configured : avail;
	}

	/** Parse the `server` query param (Go SourceConfigManager.ParseSources). */
	parseSources(serverParam: string, cfg: GatewayConfig): string[] {
		const defaults = this.defaultSources(cfg);
		if (!serverParam) return defaults;
		const avail = new Set(this.availableSources());
		const parsed = serverParam
			.split(",")
			.map((s) => s.trim())
			.filter((s) => s !== "" && avail.has(s));
		return parsed.length > 0 ? parsed : defaults;
	}

	/** Try each source in order; first success wins (Go sourceManager.MatchMusic). */
	async matchMusic(
		id: string,
		sources: string[],
		quality: string,
	): Promise<MusicURL & { info?: MusicInfo }> {
		let lastErr: unknown = new Error("没有可用的音源");
		for (const name of sources) {
			try {
				const source = this.getSource(name);
				const music = await source.getMusic(id, quality);
				let info: MusicInfo | undefined;
				try {
					info = await source.getMusicInfo(id);
				} catch {
					info = undefined;
				}
				return { ...music, info };
			} catch (err) {
				lastErr = err;
			}
		}
		throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
	}

	async searchMusic(
		keyword: string,
		sources: string[],
	): Promise<SearchResult[]> {
		const names = sources.length > 0 ? sources : this.availableSources();
		const results: SearchResult[] = [];
		for (const name of names) {
			try {
				const source = this.getSource(name);
				results.push(...(await source.searchMusic(keyword, 20)));
			} catch {
				// one bad source must not fail the whole search
			}
		}
		return results;
	}

	async sourcesStatus(): Promise<
		Array<{
			name: string;
			enabled: boolean;
			available: boolean;
			last_check: string;
			response_time_ms: number;
			error: string;
		}>
	> {
		const out: Array<{
			name: string;
			enabled: boolean;
			available: boolean;
			last_check: string;
			response_time_ms: number;
			error: string;
		}> = [];
		for (const source of this.sources.values()) {
			const start = Date.now();
			let available = false;
			let error = "";
			if (source.enabled()) {
				try {
					await source.healthCheck();
					available = true;
				} catch (err) {
					error = err instanceof Error ? err.message : String(err);
				}
			}
			out.push({
				name: source.name(),
				enabled: source.enabled(),
				available,
				last_check: new Date().toISOString(),
				response_time_ms: Date.now() - start,
				error,
			});
		}
		return out;
	}
}

/* ------------------------------------------------------------------ */
/* Music service (Go internal/service/music_service.go port)            */
/* ------------------------------------------------------------------ */

export class MusicService {
	constructor(
		private readonly sources: SourceManager,
		private readonly cache: MemoryCache | null,
		private readonly cfg: GatewayConfig,
	) {}

	private cacheGet<T>(key: string): T | null {
		if (!this.cache || !this.cfg.cache.enabled) return null;
		const raw = this.cache.get(key);
		if (!raw) return null;
		try {
			return JSON.parse(raw) as T;
		} catch {
			this.cache.delete(key);
			return null;
		}
	}

	private cacheSet(key: string, value: unknown, ttlMs: number): void {
		if (!this.cache || !this.cfg.cache.enabled) return;
		try {
			this.cache.set(key, JSON.stringify(value), ttlMs);
		} catch {
			// cache failures never fail the request
		}
	}

	async matchMusic(id: string, serverParam: string): Promise<MatchResponse> {
		if (!id) throw new Error("音乐ID不能为空");
		const sources = this.sources.parseSources(serverParam, this.cfg);
		const key = `unm:match:${id}:320`;
		const cached = this.cacheGet<MatchResponse>(key);
		if (cached) return cached;
		const result = await this.sources.matchMusic(id, sources, "320");
		const resp: MatchResponse = {
			id,
			url: result.url,
			proxy_url: result.proxy_url,
			quality: result.quality,
			source: result.source,
			info: result.info,
		};
		this.cacheSet(key, resp, 5 * 60_000);
		return resp;
	}

	async getNCMMusic(id: string, br: string): Promise<NCMGetResponse> {
		if (!id) throw new Error("音乐ID不能为空");
		const quality = br || "320";
		if (!isValidQuality(quality)) {
			throw new Error(
				`不支持的音质: ${quality}，支持的音质: ${validQualities().join(",")}`,
			);
		}
		const key = `unm:ncm:${id}:${quality}`;
		const cached = this.cacheGet<NCMGetResponse>(key);
		if (cached) return cached;
		const sources = this.sources.availableSources();
		const result = await this.sources.matchMusic(id, sources, quality);
		const resp: NCMGetResponse = {
			id,
			br: quality,
			url: result.url,
			proxy_url: result.proxy_url,
			quality: result.quality,
			info: result.info,
		};
		this.cacheSet(key, resp, 5 * 60_000);
		return resp;
	}

	async getOtherMusic(name: string): Promise<OtherGetResponse> {
		if (!name) throw new Error("歌曲名称不能为空");
		const key = `unm:search:other:${name}`;
		const cached = this.cacheGet<OtherGetResponse>(key);
		if (cached) return cached;
		const results = await this.sources.searchMusic(name, []);
		if (results.length === 0) throw new Error(`未找到歌曲: ${name}`);
		const best = results[0]!;
		const source = this.sources.getSource(best.source);
		const music = await source.getMusic(best.id, "320");
		const resp: OtherGetResponse = {
			name,
			url: music.url,
			source: best.source,
			quality: music.quality,
			info: {
				id: best.id,
				name: best.name,
				artist: best.artist,
				album: best.album,
				duration: best.duration,
				pic_url: "",
			},
		};
		this.cacheSet(key, resp, 5 * 60_000);
		return resp;
	}

	async searchMusic(
		keyword: string,
		sources: string[],
	): Promise<SearchResult[]> {
		if (!keyword) throw new Error("搜索关键词不能为空");
		const key = `unm:search:all:${keyword}`;
		const cached = this.cacheGet<SearchResult[]>(key);
		if (cached) return cached;
		const results = await this.sources.searchMusic(keyword, sources);
		this.cacheSet(key, results, 10 * 60_000);
		return results;
	}

	async getMusicInfo(sourceName: string, id: string): Promise<MusicInfo> {
		if (!sourceName) throw new Error("音源名称不能为空");
		if (!id) throw new Error("音乐ID不能为空");
		const key = `unm:info:${sourceName}:${id}`;
		const cached = this.cacheGet<MusicInfo>(key);
		if (cached) return cached;
		const source = this.sources.getSource(sourceName);
		const info = await source.getMusicInfo(id);
		this.cacheSet(key, info, 30 * 60_000);
		return info;
	}

	async getPicture(
		sourceName: string,
		picID: string,
		size: string,
	): Promise<string> {
		if (!sourceName) throw new Error("音源名称不能为空");
		if (!picID) throw new Error("专辑图ID不能为空");
		const source = this.sources.getSource(sourceName);
		if (!source.getPicture)
			throw new Error(`音源 ${sourceName} 不支持获取专辑图`);
		return source.getPicture(picID, size);
	}

	async getLyric(
		sourceName: string,
		lyricID: string,
	): Promise<{ lyric: string; tlyric: string }> {
		if (!sourceName) throw new Error("音源名称不能为空");
		if (!lyricID) throw new Error("歌词ID不能为空");
		const source = this.sources.getSource(sourceName);
		if (!source.getLyric) throw new Error(`音源 ${sourceName} 不支持获取歌词`);
		return source.getLyric(lyricID);
	}
}

/* ------------------------------------------------------------------ */
/* Metrics collector (Go internal/health/metrics.go port)               */
/* ------------------------------------------------------------------ */

export class MetricsCollector {
	private startTime = new Date();
	private totalRequests = 0;
	private successRequests = 0;
	private errorRequests = 0;
	private totalLatencyMs = 0;
	private totalErrors = 0;
	private errorsByType = new Map<string, number>();
	private errorsByCode = new Map<number, number>();
	private lastError = "";
	private lastErrorTime: Date | null = null;

	recordRequest(success: boolean, latencyMs: number): void {
		this.totalRequests++;
		this.totalLatencyMs += latencyMs;
		if (success) this.successRequests++;
		else this.errorRequests++;
	}

	recordError(errorType: string, statusCode: number, message: string): void {
		this.totalErrors++;
		this.errorsByType.set(
			errorType,
			(this.errorsByType.get(errorType) ?? 0) + 1,
		);
		this.errorsByCode.set(
			statusCode,
			(this.errorsByCode.get(statusCode) ?? 0) + 1,
		);
		this.lastError = message;
		this.lastErrorTime = new Date();
	}

	snapshot() {
		const uptimeMs = Date.now() - this.startTime.getTime();
		const mem = process.memoryUsage();
		return {
			start_time: this.startTime.toISOString(),
			uptime: formatGoDuration(uptimeMs),
			node_version: process.version,
			num_cpu:
				(globalThis as { navigator?: { hardwareConcurrency?: number } })
					.navigator?.hardwareConcurrency ?? 1,
			memory_stats: {
				alloc: mem.heapUsed,
				total_alloc: mem.heapTotal,
				sys: mem.rss,
				heap_alloc: mem.heapUsed,
				heap_sys: mem.heapTotal,
				heap_objects: 0,
				stack_inuse: 0,
				gc_sys: 0,
				num_gc: 0,
			},
			request_stats: {
				total_requests: this.totalRequests,
				success_requests: this.successRequests,
				error_requests: this.errorRequests,
				average_latency:
					this.totalRequests > 0 ? this.totalLatencyMs / this.totalRequests : 0,
				requests_per_second:
					uptimeMs > 0 ? (this.totalRequests / uptimeMs) * 1000 : 0,
			},
			error_stats: {
				total_errors: this.totalErrors,
				errors_by_type: Object.fromEntries(this.errorsByType),
				errors_by_code: Object.fromEntries(this.errorsByCode),
				last_error: this.lastError,
				last_error_time: this.lastErrorTime?.toISOString() ?? null,
			},
		};
	}
}

/** Format ms as Go time.Duration string ("1h2m3s"). */
export function formatGoDuration(ms: number): string {
	if (ms < 1000) return `${Math.round(ms)}ms`;
	const s = Math.floor(ms / 1000);
	const parts: string[] = [];
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = s % 60;
	if (h) parts.push(`${h}h`);
	if (m) parts.push(`${m}m`);
	if (sec || parts.length === 0) parts.push(`${sec}s`);
	return parts.join("");
}

/* ------------------------------------------------------------------ */
/* Health checker (Go internal/health/checker.go port)                  */
/* ------------------------------------------------------------------ */

export interface HealthCheckResult {
	name: string;
	status: "healthy" | "unhealthy" | "degraded";
	message: string;
	timestamp: string;
}

export class HealthChecker {
	private startTime = new Date();

	check(): Record<string, HealthCheckResult> {
		const mem = process.memoryUsage();
		const heapMB = mem.heapUsed / 1024 / 1024;
		return {
			basic: {
				name: "basic",
				status: "healthy",
				message: "服务运行正常",
				timestamp: new Date().toISOString(),
			},
			memory: {
				name: "memory",
				status: heapMB > 512 ? "degraded" : "healthy",
				message: `堆内存使用: ${heapMB.toFixed(1)}MB`,
				timestamp: new Date().toISOString(),
			},
		};
	}

	isHealthy(): boolean {
		return Object.values(this.check()).every((c) => c.status === "healthy");
	}

	uptime(): string {
		return formatGoDuration(Date.now() - this.startTime.getTime());
	}
}

/* ------------------------------------------------------------------ */
/* System service (Go internal/service/system_service.go port)          */
/* ------------------------------------------------------------------ */

export class SystemService {
	constructor(
		private readonly sources: SourceManager,
		private readonly cache: MemoryCache | null,
		private readonly health: HealthChecker,
		private readonly metrics: MetricsCollector,
		private readonly cfg: GatewayConfig,
		private readonly version: {
			version: string;
			buildTime: string;
			gitCommit: string;
		},
	) {}

	getSystemInfo() {
		return {
			version: this.version.version,
			enable_flac: this.cfg.server.enable_flac,
			build_time: this.version.buildTime,
			git_commit: this.version.gitCommit,
			node_version: process.version,
			uptime: this.health.uptime(),
		};
	}

	getHealthStatus() {
		const checks = this.health.check();
		const healthy = this.health.isHealthy();
		return {
			status: healthy ? "healthy" : "unhealthy",
			timestamp: Math.floor(Date.now() / 1000),
			uptime: this.health.uptime(),
			checks,
			healthy,
		};
	}

	getMetrics() {
		return this.metrics.snapshot();
	}

	getSourcesStatus() {
		return this.sources.sourcesStatus();
	}

	async refreshSources(): Promise<void> {
		// no hot reload in the TS port: re-resolves from current config (no-op)
	}

	clearCache(): void {
		this.cache?.clear();
	}

	getCacheStats(): Record<string, unknown> {
		if (!this.cache) return { enabled: false };
		return this.cache.stats();
	}

	isHealthy(): boolean {
		return this.health.isHealthy();
	}

	getVersion(): string {
		return this.version.version;
	}
}

/* ------------------------------------------------------------------ */
/* Config service (Go internal/service/config_service.go port)          */
/* ------------------------------------------------------------------ */

export const CONFIG_SECTIONS = [
	"server",
	"security",
	"performance",
	"monitoring",
	"sources",
] as const;
export type ConfigSection = (typeof CONFIG_SECTIONS)[number];

export interface ConfigBackup {
	id: string;
	name: string;
	description: string;
	config: GatewayConfig;
	created_at: string;
	created_by: string;
}

export class ConfigService {
	private current: GatewayConfig;
	private backups = new Map<string, ConfigBackup>();

	constructor(
		cfg: GatewayConfig,
		private readonly configPath: string | null,
	) {
		this.current = structuredClone(cfg);
	}

	getConfig(): GatewayConfig {
		return structuredClone(this.current);
	}

	getSanitizedConfig(): unknown {
		return sanitizeConfig(this.getConfig());
	}

	updateConfig(cfg: GatewayConfig): void {
		const errors = validateConfigShape(cfg);
		if (errors.length > 0)
			throw Object.assign(new Error("配置验证失败"), { validation: true });
		this.current = structuredClone(cfg);
	}

	getSection(section: string): unknown {
		if (!section) throw new Error("配置节名称不能为空");
		if (!(CONFIG_SECTIONS as readonly string[]).includes(section)) {
			throw Object.assign(new Error(`配置节不存在: ${section}`), {
				notFound: true,
			});
		}
		return structuredClone(
			(this.current as unknown as Record<string, unknown>)[section],
		);
	}

	updateSection(section: string, data: unknown): void {
		if (!section) throw new Error("配置节名称不能为空");
		if (data === null || data === undefined)
			throw new Error("配置数据不能为空");
		if (!(CONFIG_SECTIONS as readonly string[]).includes(section)) {
			throw Object.assign(new Error(`配置节不存在: ${section}`), {
				notFound: true,
			});
		}
		(this.current as unknown as Record<string, unknown>)[section] =
			structuredClone(parseConfigSection(section, data));
		const shapeErrors = validateConfigShape(this.current);
		if (shapeErrors.length > 0) {
			throw Object.assign(
				new Error(`配置验证失败: ${shapeErrors.join("; ")}`),
				{
					validation: true,
				},
			);
		}
	}

	validateConfig(cfg: GatewayConfig): {
		valid: boolean;
		errors: string[];
		warnings: string[];
	} {
		const errors = validateConfigShape(cfg);
		return { valid: errors.length === 0, errors, warnings: [] };
	}

	reloadConfig(): GatewayConfig {
		if (!this.configPath) throw new Error("配置路径未设置");
		// Re-read the file through the shared loader (env overrides re-applied).
		const { loadConfig } = configLoaderRef;
		const cfg = loadConfig(this.configPath);
		this.current = structuredClone(cfg);
		return this.getConfig();
	}

	backupConfig(name: string, description: string): ConfigBackup {
		if (!name) throw new Error("备份名称不能为空");
		const backup: ConfigBackup = {
			id: randomUUID(),
			name,
			description: description ?? "",
			config: this.getConfig(),
			created_at: new Date().toISOString(),
			created_by: "admin",
		};
		this.backups.set(backup.id, backup);
		return structuredClone(backup);
	}

	getBackups(): ConfigBackup[] {
		return [...this.backups.values()].map((b) => structuredClone(b));
	}

	restoreConfig(backupID: string): void {
		if (!backupID) throw new Error("备份ID不能为空");
		const backup = this.backups.get(backupID);
		if (!backup)
			throw Object.assign(new Error(`备份不存在: ${backupID}`), {
				notFound: true,
			});
		this.current = structuredClone(backup.config);
	}

	deleteBackup(backupID: string): void {
		if (!backupID) throw new Error("备份ID不能为空");
		if (!this.backups.delete(backupID)) {
			throw Object.assign(new Error(`备份不存在: ${backupID}`), {
				notFound: true,
			});
		}
	}
}

// Late-bound to avoid a circular import (config.ts <-> services.ts).
const configLoaderRef: { loadConfig: (p: string) => GatewayConfig } = {
	loadConfig: () => {
		throw new Error("config loader not bound");
	},
};

export function bindConfigLoader(loader: {
	loadConfig: (p: string) => GatewayConfig;
}): void {
	configLoaderRef.loadConfig = loader.loadConfig;
}

/** Shape-level validation of a candidate config (Go AppConfig.Validate). */
function validateConfigShape(cfg: GatewayConfig): string[] {
	const errors: string[] = [];
	if (cfg.server.port <= 0 || cfg.server.port > 65535) {
		errors.push("服务器端口必须在1-65535之间");
	}
	if (
		!cfg.security.jwt_secret ||
		cfg.security.jwt_secret === "your-jwt-secret-key-here"
	) {
		errors.push("JWT密钥不能为空或使用默认值");
	}
	if (cfg.security.jwt_secret && cfg.security.jwt_secret.length < 32) {
		errors.push("JWT密钥长度不能少于32个字符");
	}
	if (cfg.performance.max_concurrent_requests <= 0) {
		errors.push("最大并发请求数必须大于0");
	}
	if (cfg.sources.default_sources.length === 0) {
		errors.push("未配置默认音源");
	}
	return errors;
}
