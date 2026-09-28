// @music-api/kugou-core — module.ts
// 模块框架：每个酷狗 API 模块都是 `(query, request) => Promise<KgResponse>`。
// 原实现为 `module.exports = (params, useAxios) => {...}`，此处给出手写 TS 类型。

import type { KgQuery, KgRequestOptions, KgResponse } from "./types.js";

/** 模块可调用的请求函数（createRequest / createCloudRequest 均符合） */
export type KgRequestFn = (options: KgRequestOptions) => Promise<KgResponse>;

/** 单个 API 模块签名 */
export type KgModule = (
	query: KgQuery,
	request: KgRequestFn,
) => Promise<KgResponse>;

/**
 * 定义一个酷狗 API 模块（透传函数，仅提供类型约束；与原 module.exports 赋值等价）。
 */
export function defineKgModule(mod: KgModule): KgModule {
	return mod;
}
