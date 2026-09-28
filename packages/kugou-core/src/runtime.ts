// @music-api/kugou-core — runtime.ts
// 手写移植自 KuGouMusicApi/util/runtime.js 的代理解析部分。
// 偏差声明：CLI 参数解析（parseCliArgs / applyCliOverrides）已 drop；
// 环境变量（KUGOU_API_PROXY / platform / KUGOU_API_GUID / KUGOU_API_DEV /
// KUGOU_API_MAC / KUGOU_API_WEBGL / PORT）仍是唯一配置来源。

/** 归一化后的代理配置（原 AxiosProxyConfig 的等价结构） */
export interface ProxyConfig {
	protocol: "http" | "https";
	host: string;
	port: number;
	auth?: { username: string; password: string };
}

let cachedProxyRaw: string | undefined;
let cachedProxy: ProxyConfig | null = null;

/**
 * 解析代理配置。
 * 从 KUGOU_API_PROXY 读取，支持 http/https（含 user:pass@ 认证）。
 * 结果缓存：环境变量未变化时直接返回缓存。
 * 无配置 / 协议不支持 / 解析失败 → null（原行为）。
 */
export function resolveProxy(): ProxyConfig | null {
	const rawEnv =
		typeof process.env.KUGOU_API_PROXY === "string"
			? process.env.KUGOU_API_PROXY.trim()
			: undefined;
	const rawProxy = rawEnv && rawEnv.length > 0 ? rawEnv : undefined;

	if (!rawProxy) {
		cachedProxyRaw = undefined;
		cachedProxy = null;
		return null;
	}

	if (cachedProxyRaw === rawProxy) {
		return cachedProxy;
	}

	cachedProxyRaw = rawProxy;
	try {
		const parsed = new URL(rawProxy);

		if (!/^https?:$/.test(parsed.protocol)) {
			console.warn(`[proxy] Unsupported proxy protocol: ${parsed.protocol}`);
			cachedProxy = null;
			return null;
		}

		const proxyConfig: ProxyConfig = {
			protocol: parsed.protocol.replace(":", "") as "http" | "https",
			host: parsed.hostname,
			port: parsed.port
				? Number(parsed.port)
				: parsed.protocol === "https:"
					? 443
					: 80,
		};

		if (parsed.username || parsed.password) {
			// 注意：原实现直接透传 URL 解析后的原始值（不做 decode），此处保持一致。
			proxyConfig.auth = {
				username: parsed.username,
				password: parsed.password,
			};
		}

		cachedProxy = proxyConfig;
		console.info(`[proxy] Using proxy ${parsed.protocol}//${parsed.host}`);
	} catch (error) {
		console.warn(
			`[proxy] Failed to parse proxy address "${rawProxy}": ${(error as Error).message}`,
		);
		cachedProxy = null;
	}

	return cachedProxy;
}

/** 当前是否为概念版（lite）平台 */
export function isLitePlatform(): boolean {
	return process.env.platform === "lite";
}
