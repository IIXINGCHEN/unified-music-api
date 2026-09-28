// @music-api/kugou-core — types.ts
// 共享类型：请求选项 / 响应 / 模块签名。移植自 KuGouMusicApi util/request.js 的 JSDoc。

/** createRequest 的统一响应格式 */
export interface KgResponse {
	/** 200=成功，502=失败（上游判定或网络异常） */
	status: number;
	/** 响应体：JSON 对象或原始 Buffer */
	body: unknown;
	/** 响应 Set-Cookie（已用 parseCookieString 格式化） */
	cookie: string[];
	/** 响应头（当前仅 ssa-code） */
	headers?: Record<string, string>;
}

export type KgEncryptType = "android" | "web" | "register";

/** createRequest 请求配置（字段与原 options 一致；method/encryptType 保持原版的动态字符串语义） */
export interface KgRequestOptions {
	method: string;
	url: string;
	baseURL?: string;
	params?: Record<string, unknown>;
	data?: unknown;
	headers?: Record<string, string | number>;
	encryptType?: string;
	/** 原版 request.js 中 `options?.cookie ?? {}`：模块可省略 */
	cookie?: Record<string, unknown>;
	encryptKey?: boolean;
	clearDefaultParams?: boolean;
	clearDefaultHeaders?: boolean;
	notSignature?: boolean;
	ip?: string;
	realIP?: string;
	responseType?: string;
}

/** createCloudRequest 请求配置 */
export interface KgCloudRequestOptions {
	url: string;
	data?: unknown;
	baseURL?: string;
	cookie?: Record<string, unknown>;
	ip?: string;
	realIP?: string;
}

/**
 * 模块 query：cookie/query/body/files 的混合体（与原 server.js 的
 * Object.assign 合并语义一致），保留字段显式声明，不逐个推导业务类型。
 */
export type KgQuery = Record<string, unknown> & {
	/** 模块间直接调用时可省略（原版同样允许无 cookie 调用） */
	cookie?: Record<string, unknown>;
	encryptType?: KgEncryptType;
	encryptKey?: boolean;
	clearDefaultParams?: boolean;
	clearDefaultHeaders?: boolean;
	notSignature?: boolean;
	ip?: string;
	realIP?: string;
	responseType?: string;
	noCookie?: unknown;
};
