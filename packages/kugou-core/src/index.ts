// @music-api/kugou-core
// 手写移植自 KuGouMusicApi util/request.js + util/runtime.js +
// util/generate_simulate.js + server.js（设备标识中间件）。
// 签名/加密原语全部复用 @music-api/kugou-crypto，本包只做 HTTP 编排。

export type { DeviceIdOptions, DeviceIds } from "./device.js";
export { createDeviceIds, ensureDeviceCookies } from "./device.js";
export type { KgModule, KgRequestFn } from "./module.js";
export { defineKgModule } from "./module.js";
export type { ProxyRequestInit } from "./proxy.js";
export { fetchViaProxy } from "./proxy.js";
export { createCloudRequest, createRequest } from "./request.js";
export type { ProxyConfig } from "./runtime.js";
export { isLitePlatform, resolveProxy } from "./runtime.js";
export type { SimulateResult } from "./simulate.js";
export { generateSimulate } from "./simulate.js";
export type {
	KgCloudRequestOptions,
	KgEncryptType,
	KgQuery,
	KgRequestOptions,
	KgResponse,
} from "./types.js";
