// 易盾反作弊 Token 注册端点
// 调用后获取实时 token 并存入共享存储，供后续带 checkToken 的请求使用
//
// GET  /register/checktoken/v3        → 实时获取新 token（不缓存）
// POST /register/checktoken/v3        → 实时获取新 token
//
// 注意：每次获取都不缓存，模拟真实客户端每次请求使用新鲜 token，
// 避免反作弊 token 复用触发风控。
//
// 移植说明：axios.get 改为 global fetch（10s 超时语义保留）。

import { APP_CONF } from "@music-api/ncm-core";

const URL = `${APP_CONF.dunDomainV3}/v3/b?pn=YD00000558929251`;

async function fetchV3Token(): Promise<string> {
	const res = await fetch(URL, { signal: AbortSignal.timeout(10000) });
	if (!res.ok) {
		throw new Error(`Request failed with status code ${res.status}`);
	}
	const body = String(await res.text());
	const m = body.match(/null\(\[(\d+),\d+,"([^"]+)"\]\)/);
	if (m && m[1] === "200") return m[2];
	throw new Error(`易盾返回异常: ${body.substring(0, 100)}`);
}

// 端点处理：每次实时获取新 token
// biome-ignore lint/suspicious/noExplicitAny: 端点签名与原实现一致
export default async function checktokenV3(): Promise<any> {
	let token = "";
	try {
		token = await fetchV3Token();
	} catch {
		// token 获取失败时返回空，由调用方决定是否重试
	}
	return {
		status: 200,
		body: { code: 200, token, registered: !!token },
	};
}

// 给 request.js 读取用：每次调用实时获取新 token，不缓存
export const getToken = async (): Promise<string> => {
	try {
		return await fetchV3Token();
	} catch {
		return "";
	}
};
