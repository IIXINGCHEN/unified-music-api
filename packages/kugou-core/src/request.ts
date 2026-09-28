// @music-api/kugou-core — request.ts
// 手写移植自 KuGouMusicApi/util/request.js（410 行）。
// 关键变更：axios → global fetch（无代理时）；KUGOU_API_PROXY 配置时走 proxy.ts 的
// CONNECT 隧道。签名/加密全部调用 @music-api/kugou-crypto。
//
// 偏差声明（行为层面保持一致，实现细节差异）：
// 1. 原实现用 `new Promise(async () => ...)`，同步抛错会导致外层 Promise 永远挂起；
//    此处改为 async 函数，抛错会正常 reject（严格更优）。
// 2. 不再原地修改传入的 options 对象（原实现会写回 options.params/baseURL/headers）。
// 3. GET 查询串用 URLSearchParams 构建（与 axios 默认序列化在常规字符下一致）。
// 4. ssa-code 的 edt/sid 仅在 body 为普通对象时附加（原实现会对 Buffer 加不可见属性）。
// 5. 对象类型 data 自动补 Content-Type: application/json（对齐 axios 默认行为）。

import { createCipheriv, createDecipheriv } from "node:crypto";
import {
	appid,
	clientver,
	cryptoMd5,
	liteAppid,
	liteClientver,
	parseCookieString,
	rsaEncrypt2,
	signatureAndroidParams,
	signatureRegisterParams,
	signatureWebParams,
	signKey,
} from "@music-api/kugou-crypto";
import { fetchViaProxy } from "./proxy.js";
import { isLitePlatform, resolveProxy } from "./runtime.js";
import { generateSimulate } from "./simulate.js";
import type {
	KgCloudRequestOptions,
	KgRequestOptions,
	KgResponse,
} from "./types.js";

const DEFAULT_BASE_URL = "https://gateway.kugou.com";
const DEFAULT_UA = "Android15-1070-11083-46-0-DiscoveryDRADProtocol-wifi";

/** 云歌单（cloudlist）协议配置：标准版 / 概念版 lite */
const CLOUDLIST_CONF = {
	lite: {
		appid: liteAppid,
		clientver: liteClientver,
		appkey: "LnT6xpN3khm36zse0QzvmgTZ3waWdRSA",
	},
	default: {
		appid,
		clientver,
		appkey: "OIlwieks28dk2k092lksi2UIkp",
	},
} as const;

/** 扁平参数序列化为查询串（null/undefined 跳过，对象 JSON 化） */
function toQueryString(params: Record<string, unknown>): string {
	const usp = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) {
		if (v === null || v === undefined) continue;
		usp.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
	}
	return usp.toString();
}

function hasHeader(
	headers: Record<string, string | number | undefined>,
	name: string,
): boolean {
	const lower = name.toLowerCase();
	return Object.keys(headers).some((k) => k.toLowerCase() === lower);
}

/**
 * 创建并发送 API 请求。
 * 成功 resolve(200)，上游 status=0 / error_code!=0 或网络异常时 reject(502)。
 */
export async function createRequest(
	options: KgRequestOptions,
): Promise<KgResponse> {
	const isLite = isLitePlatform();
	const cookie = options?.cookie ?? {};

	// ========== 从 Cookie 中提取设备标识 ==========
	const dfid = (cookie.dfid as string) || "-";
	// 原样保留模板字符串语义：缺失时 mid 为 "undefined" 字符串
	const mid = `${cookie.KUGOU_API_MID}`;
	const uuid = "-";
	const token = (cookie.token as string) || "";
	const userid = (cookie.userid as number) || 0;
	const clienttime = Math.floor(Date.now() / 1000);
	const ip = options?.realIP || options?.ip || "";
	const webglHash = cookie.KUGOU_API_WEBGL as string | undefined;

	// ========== 默认请求参数 ==========
	const defaultParams: Record<string, unknown> = {
		dfid,
		mid,
		uuid,
		appid: isLite ? liteAppid : appid,
		clientver: isLite ? liteClientver : clientver,
		clienttime,
	};
	if (token) defaultParams.token = token;
	if (userid && userid !== 0) defaultParams.userid = userid;

	const params: Record<string, unknown> = options?.clearDefaultParams
		? { ...(options?.params ?? {}) }
		: {
				...defaultParams,
				...((options?.params ?? {}) as Record<string, unknown>),
			};

	// ========== signKey（可选） ==========
	if (options?.encryptKey) {
		params.key = signKey(
			params.hash as string,
			params.mid as string,
			params.userid as string | number | undefined,
			params.appid as string | number | undefined,
		);
	}

	// ========== 请求体序列化（原三段式语义照搬；null → "null"） ==========
	const rawData: unknown = options?.data;
	const sigData: string | Buffer = Buffer.isBuffer(rawData)
		? rawData
		: typeof rawData === "object"
			? JSON.stringify(rawData)
			: ((rawData as string | undefined) ?? "") || "";

	// ========== 生成请求签名 ==========
	if (!params.signature && !options?.notSignature) {
		switch (options?.encryptType) {
			case "register":
				params.signature = signatureRegisterParams(params);
				break;
			case "web":
				// web 签名经模板字符串拼接，Buffer 按 utf8 转字符串（与原 `${data}` 一致）
				params.signature = signatureWebParams(
					params,
					Buffer.isBuffer(sigData) ? sigData.toString("utf8") : sigData,
				);
				break;
			case "android":
			default:
				params.signature = signatureAndroidParams(params, sigData);
				break;
		}
	}

	// ========== 请求头（合并顺序与原 assign 链一致） ==========
	// 原逻辑：assign({'User-Agent': UA}, explicit, {dfid, clienttime, mid})
	//       再 assign({}, 上一步结果, {dfid, clienttime, mid, kg-*, ip头})
	// 即：显式头可覆盖默认 UA；dfid/clienttime/mid/kg-*/IP 头强制覆盖。
	const explicitHeaders: Record<string, string | number> =
		options?.headers ?? {};
	const headers: Record<string, string> = {};
	if (!options?.clearDefaultHeaders) {
		headers["User-Agent"] = DEFAULT_UA;
	}
	for (const [k, v] of Object.entries(explicitHeaders)) headers[k] = String(v);
	if (!options?.clearDefaultHeaders) {
		headers.dfid = String(dfid);
		headers.clienttime = String(params.clienttime);
		headers.mid = String(mid);
		headers["kg-rc"] = "1";
		headers["kg-thash"] = "5d816a0";
		headers["kg-rec"] = "1";
		headers["kg-rf"] = "B9EDA08A64250DEFFBCADDEE00F8F25F";
		if (ip) {
			headers["X-Real-IP"] = ip;
			headers["X-Forwarded-For"] = ip;
		}
	}

	// ========== URL 与查询串 ==========
	const baseURL = options?.baseURL || DEFAULT_BASE_URL;
	const urlObj = new URL(options.url, baseURL);
	let finalUrl: string;
	if (baseURL.includes("openapicdn")) {
		// openapicdn 域名：参数拼进 URL（原实现不做 encode，此处保持一致）
		const qs = Object.keys(params)
			.map((k) => `${k}=${params[k]}`)
			.join("&");
		finalUrl = `${urlObj.toString()}?${qs}`;
	} else {
		urlObj.search = toQueryString(params);
		finalUrl = urlObj.toString();
	}

	// ========== 请求体（fetch 载荷） ==========
	const hasBody = rawData !== undefined && rawData !== null && rawData !== "";
	let fetchBody: Buffer | string | undefined;
	if (hasBody && !/^(GET|HEAD)$/i.test(options.method)) {
		if (Buffer.isBuffer(rawData)) {
			fetchBody = rawData;
		} else if (typeof rawData === "object") {
			fetchBody = JSON.stringify(rawData);
			if (!hasHeader(explicitHeaders, "content-type")) {
				headers["Content-Type"] = "application/json";
			}
		} else {
			fetchBody = String(rawData);
		}
	}

	const answer: KgResponse = { status: 500, body: {}, cookie: [], headers: {} };
	try {
		const proxy = resolveProxy();
		let res: Response;
		if (proxy) {
			res = await fetchViaProxy(
				finalUrl,
				{
					method: options.method,
					headers,
					body: fetchBody ? Buffer.from(fetchBody) : undefined,
				},
				proxy,
			);
		} else {
			res = await globalThis.fetch(finalUrl, {
				method: options.method,
				headers,
				// undici 运行时接受 Buffer；@types/node 的 BodyInit 泛型与
				// Buffer<ArrayBufferLike> 不兼容，此处断言（行为无差异）。
				body: fetchBody as unknown as BodyInit,
				credentials: "include",
			});
		}

		const raw = Buffer.from(await res.arrayBuffer());
		answer.cookie = res.headers.getSetCookie().map((c) => parseCookieString(c));

		const ssaCode = res.headers.get("ssa-code") ?? "";
		if (ssaCode) answer.headers = { "ssa-code": ssaCode };

		let body: unknown;
		try {
			body = JSON.parse(raw.toString("utf8"));
		} catch {
			body = raw;
		}
		answer.body = body;

		const bv = body as { status?: unknown; error_code?: unknown } | null;
		const failed =
			!!bv &&
			typeof bv === "object" &&
			(bv.status === 0 || !!(bv.error_code && bv.error_code !== 0));

		if (failed) {
			answer.status = 502;
			if (ssaCode)
				attachSimulate(answer, body, ssaCode, mid, userid, dfid, webglHash);
			throw answer;
		}
		answer.status = 200;
		if (ssaCode)
			attachSimulate(answer, body, ssaCode, mid, userid, dfid, webglHash);
		return answer;
	} catch (e) {
		if (e && typeof e === "object" && "status" in e && "body" in e) throw e;
		answer.status = 502;
		answer.body = { status: 0, msg: e };
		throw answer;
	}
}

/** ssa-code 二次验证：生成 edt/sid 并附加到响应体 */
function attachSimulate(
	answer: KgResponse,
	body: unknown,
	ssaCode: string,
	mid: string,
	userid: string | number,
	dfid: string,
	webglHash: string | undefined,
): void {
	const { edt, sid } = generateSimulate(mid, userid, dfid, webglHash);
	if (body && typeof body === "object" && !Buffer.isBuffer(body)) {
		const b = body as Record<string, unknown>;
		if (edt) b.edt = edt;
		if (sid) b.sid = sid;
		b.ssaCode = ssaCode;
	}
	answer.headers = { "ssa-code": ssaCode };
}

/**
 * 云歌单服务（cloudlist）加密协议请求。
 * 协议：key=MD5(appid+appkey+clientver+clienttime)；p=RSA-PKCS1 会话串（Hex 大写）；
 * 请求/响应体 AES-128-CBC（key/iv 由 MD5(随机6字符) 推导）。
 * 成功 resolve(200)，失败 reject(502)；响应非 JSON 时 reject(500)（原实现 quirk）。
 */
export async function createCloudRequest(
	options: KgCloudRequestOptions,
): Promise<KgResponse> {
	const isLite = isLitePlatform();
	const conf = CLOUDLIST_CONF[isLite ? "lite" : "default"];
	const cookie = options?.cookie ?? {};
	const mid = `${cookie.KUGOU_API_MID ?? cookie.mid ?? ""}`;
	const dfid = (cookie.dfid as string) || "-";
	const userid = (cookie.userid as number) || 0;
	const token = (cookie.token as string) || "";
	const ip = options?.realIP || options?.ip || "";

	// 随机 6 字符会话串（62 字符池，与原 request.js 一致）→ MD5 推导 AES key/iv
	const aesAlphabet =
		"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	const aes = Array.from(
		{ length: 6 },
		() => aesAlphabet[Math.floor(Math.random() * 62)],
	).join("");
	const md5 = cryptoMd5(aes);
	const aesKey = md5.substring(0, 16);
	const aesIv = md5.substring(16, 32);

	const clienttime = Math.floor(Date.now() / 1000);
	const key = cryptoMd5(
		`${conf.appid}${conf.appkey}${conf.clientver}${clienttime}`,
	).toLowerCase();

	// p = Hex(RSA-PKCS1 加密会话串).toUpperCase()（原实现即用标准/概念版公钥，未用 conf.publicKey）
	const portraitPlain = JSON.stringify({ aes, uid: userid, token });
	const portrait = rsaEncrypt2(portraitPlain).toUpperCase();

	const params: Record<string, unknown> = {
		appid: conf.appid,
		clientver: conf.clientver,
		mid,
		clienttime,
		key,
		dfid,
		p: portrait,
	};

	const rawData: unknown = options?.data;
	const dataStr =
		typeof rawData === "object"
			? JSON.stringify(rawData)
			: ((rawData as string) ?? "");
	const cipher = createCipheriv(
		"aes-128-cbc",
		Buffer.from(aesKey, "utf8"),
		Buffer.from(aesIv, "utf8"),
	);
	const bodyBuf = Buffer.concat([
		cipher.update(dataStr, "utf8"),
		cipher.final(),
	]);

	const headers: Record<string, string> = {
		"Content-Type": "application/json;charset=utf-8",
		"x-router": "cloudlist.service.kugou.com",
		dfid: String(dfid),
		clienttime: String(clienttime),
		mid: String(mid),
		"kg-rc": "1",
		"kg-thash": "5d816a0",
		"kg-rec": "1",
		"kg-rf": "B9EDA08A64250DEFFBCADDEE00F8F25F",
	};
	if (ip) {
		headers["X-Real-IP"] = ip;
		headers["X-Forwarded-For"] = ip;
	}

	const baseURL = options?.baseURL || DEFAULT_BASE_URL;
	const urlObj = new URL(options.url, baseURL);
	urlObj.search = toQueryString(params);
	const finalUrl = urlObj.toString();

	const answer: KgResponse = { status: 500, body: {}, cookie: [], headers: {} };
	try {
		const proxy = resolveProxy();
		const res = proxy
			? await fetchViaProxy(
					finalUrl,
					{ method: "POST", headers, body: bodyBuf },
					proxy,
				)
			: await globalThis.fetch(finalUrl, {
					method: "POST",
					headers,
					// 同上：运行时接受 Buffer，类型断言绕过泛型不兼容。
					body: bodyBuf as unknown as BodyInit,
					credentials: "include",
				});

		const raw = Buffer.from(await res.arrayBuffer());

		let text = "";
		try {
			const decipher = createDecipheriv(
				"aes-128-cbc",
				Buffer.from(aesKey, "utf8"),
				Buffer.from(aesIv, "utf8"),
			);
			text = Buffer.concat([decipher.update(raw), decipher.final()]).toString(
				"utf8",
			);
		} catch {
			text = "";
		}
		// 服务端未加密时直接使用原始响应
		if (!text) text = raw.toString("utf8");

		try {
			answer.body = JSON.parse(text);
		} catch {
			// 原实现 quirk：此时 answer.status 保持 500
			answer.body = { status: 0, msg: text };
			throw answer;
		}

		const bv = answer.body as { status?: unknown; error_code?: unknown } | null;
		const failed =
			!!bv &&
			typeof bv === "object" &&
			(bv.status === 0 || !!(bv.error_code && bv.error_code !== 0));
		if (failed) {
			answer.status = 502;
			throw answer;
		}
		answer.status = 200;
		return answer;
	} catch (e) {
		if (e && typeof e === "object" && "status" in e && "body" in e) throw e;
		answer.status = 502;
		answer.body = { status: 0, msg: e };
		throw answer;
	}
}
