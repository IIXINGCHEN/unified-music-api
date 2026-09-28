// @music-api/kugou-core — request.test.ts
// createRequest 行为测试（global fetch 全 mock，不触网）。

import {
	signatureAndroidParams,
	signatureWebParams,
	signKey,
} from "@music-api/kugou-crypto";
import { afterEach, describe, expect, it } from "vitest";
import { createRequest } from "./request.js";
import type { KgRequestOptions } from "./types.js";

interface Call {
	url: string;
	init: { method?: string; headers?: Record<string, string>; body?: unknown };
}

let calls: Call[] = [];
const realFetch = globalThis.fetch;

function mockFetch(
	handler: (url: string, init: Call["init"]) => Response | Promise<Response>,
): void {
	calls = [];
	globalThis.fetch = (async (url: unknown, init: unknown) => {
		const c = { url: String(url), init: (init ?? {}) as Call["init"] };
		calls.push(c);
		return handler(c.url, c.init);
	}) as typeof fetch;
}

afterEach(() => {
	globalThis.fetch = realFetch;
});

const okJson = (obj: unknown, headers: Record<string, string> = {}) =>
	new Response(JSON.stringify(obj), {
		headers: { "content-type": "application/json", ...headers },
	});

const baseOptions = (): KgRequestOptions => ({
	method: "GET",
	url: "/v1/search",
	cookie: {
		dfid: "DFID123",
		KUGOU_API_MID: "MID456",
		token: "TOK",
		userid: 789,
	},
	params: { keyword: "hello" },
});

function queryOf(url: string): URLSearchParams {
	return new URL(url).searchParams;
}

describe("createRequest", () => {
	it("注入默认参数并生成 android 签名", async () => {
		mockFetch(() => okJson({ status: 1, data: [] }));
		const res = await createRequest(baseOptions());

		expect(res.status).toBe(200);
		expect(calls).toHaveLength(1);
		const q = queryOf(calls[0].url);
		expect(q.get("dfid")).toBe("DFID123");
		expect(q.get("mid")).toBe("MID456");
		expect(q.get("uuid")).toBe("-");
		expect(q.get("appid")).toBe("1005");
		expect(q.get("clientver")).toBe("20489");
		expect(q.get("token")).toBe("TOK");
		expect(q.get("userid")).toBe("789");
		expect(q.get("keyword")).toBe("hello");
		expect(Number(q.get("clienttime"))).toBeGreaterThan(0);

		// 签名输入 == 实际发送的参数（去掉 signature 本身），GET 下 data 为 ""
		const sent: Record<string, string> = {};
		q.forEach((v, k) => {
			if (k !== "signature") sent[k] = v;
		});
		expect(q.get("signature")).toBe(signatureAndroidParams(sent, ""));
	});

	it("默认请求头 + UA 可被显式头覆盖", async () => {
		mockFetch(() => okJson({ status: 1 }));
		await createRequest({
			...baseOptions(),
			headers: { "User-Agent": "CustomUA/1.0", "X-Custom": "yes" },
		});
		const h = calls[0].init.headers as Record<string, string>;
		expect(h["User-Agent"]).toBe("CustomUA/1.0");
		expect(h["X-Custom"]).toBe("yes");
		expect(h["kg-rc"]).toBe("1");
		expect(h["kg-thash"]).toBe("5d816a0");
		expect(h["kg-rec"]).toBe("1");
		expect(h["kg-rf"]).toBe("B9EDA08A64250DEFFBCADDEE00F8F25F");
		expect(h.dfid).toBe("DFID123");
		expect(h.mid).toBe("MID456");
	});

	it("realIP 优先于 ip 透传", async () => {
		mockFetch(() => okJson({ status: 1 }));
		await createRequest({ ...baseOptions(), ip: "1.1.1.1", realIP: "2.2.2.2" });
		const h = calls[0].init.headers as Record<string, string>;
		expect(h["X-Real-IP"]).toBe("2.2.2.2");
		expect(h["X-Forwarded-For"]).toBe("2.2.2.2");
	});

	it("web 签名分支", async () => {
		mockFetch(() => okJson({ status: 1 }));
		await createRequest({ ...baseOptions(), encryptType: "web" });
		const q = queryOf(calls[0].url);
		const sent: Record<string, string> = {};
		q.forEach((v, k) => {
			if (k !== "signature") sent[k] = v;
		});
		expect(q.get("signature")).toBe(signatureWebParams(sent, ""));
		// web 与 android 算法不同，同一输入签名不同
		expect(q.get("signature")).not.toBe(signatureAndroidParams(sent, ""));
	});

	it("register 签名分支", async () => {
		mockFetch(() => okJson({ status: 1 }));
		await createRequest({ ...baseOptions(), encryptType: "register" });
		expect(queryOf(calls[0].url).get("signature")).toMatch(/^[0-9a-f]{32}$/);
	});

	it("notSignature 跳过签名", async () => {
		mockFetch(() => okJson({ status: 1 }));
		await createRequest({ ...baseOptions(), notSignature: true });
		expect(queryOf(calls[0].url).get("signature")).toBeNull();
	});

	it("clearDefaultParams 只发自定义参数", async () => {
		mockFetch(() => okJson({ status: 1 }));
		await createRequest({
			...baseOptions(),
			clearDefaultParams: true,
			notSignature: true,
		});
		const q = queryOf(calls[0].url);
		expect(q.get("keyword")).toBe("hello");
		expect(q.get("dfid")).toBeNull();
		expect(q.get("appid")).toBeNull();
	});

	it("clearDefaultHeaders 只用显式头", async () => {
		mockFetch(() => okJson({ status: 1 }));
		await createRequest({
			...baseOptions(),
			clearDefaultHeaders: true,
			headers: { "X-Only": "1" },
		});
		const h = calls[0].init.headers as Record<string, string>;
		expect(h).toEqual({ "X-Only": "1" });
	});

	it("encryptKey 生成 key 参数", async () => {
		mockFetch(() => okJson({ status: 1 }));
		await createRequest({
			...baseOptions(),
			encryptKey: true,
			params: { hash: "ABCDEF", keyword: "x" },
			notSignature: true,
		});
		const q = queryOf(calls[0].url);
		expect(q.get("key")).toBe(signKey("ABCDEF", "MID456", "789", "1005"));
	});

	it("status=0 判失败 reject(502)", async () => {
		mockFetch(() => okJson({ status: 0, msg: "bad" }));
		await expect(createRequest(baseOptions())).rejects.toMatchObject({
			status: 502,
			body: { status: 0, msg: "bad" },
		});
	});

	it("error_code 非 0 判失败 reject(502)", async () => {
		mockFetch(() => okJson({ error_code: 50001, error_msg: "nope" }));
		await expect(createRequest(baseOptions())).rejects.toMatchObject({
			status: 502,
		});
	});

	it("网络异常 reject(502) 且 body 为 {status:0}", async () => {
		mockFetch(() => {
			throw new Error("boom");
		});
		await expect(createRequest(baseOptions())).rejects.toMatchObject({
			status: 502,
			body: { status: 0 },
		});
	});

	it("ssa-code 响应附加 edt/sid/ssaCode", async () => {
		mockFetch(() => okJson({ status: 1 }, { "ssa-code": "SSACODE9" }));
		const res = await createRequest(baseOptions());
		expect(res.status).toBe(200);
		expect(res.headers).toEqual({ "ssa-code": "SSACODE9" });
		const body = res.body as Record<string, unknown>;
		expect(body.ssaCode).toBe("SSACODE9");
		expect(typeof body.edt).toBe("string");
		expect((body.edt as string).length).toBeGreaterThan(100);
		expect(typeof body.sid).toBe("string");
		expect((body.sid as string).length).toBeGreaterThan(100);
	});

	it("ssa-code + 失败分支同样附加指纹", async () => {
		mockFetch(() => okJson({ status: 0 }, { "ssa-code": "SSACODE9" }));
		await expect(createRequest(baseOptions())).rejects.toMatchObject({
			status: 502,
			headers: { "ssa-code": "SSACODE9" },
		});
	});

	it("POST 对象 data 序列化为 JSON 并补 Content-Type", async () => {
		mockFetch(() => okJson({ status: 1 }));
		await createRequest({
			...baseOptions(),
			method: "POST",
			data: { a: 1, b: "x" },
		});
		expect(calls[0].init.body).toBe(JSON.stringify({ a: 1, b: "x" }));
		const h = calls[0].init.headers as Record<string, string>;
		expect(h["Content-Type"]).toBe("application/json");
	});

	it("Buffer body 按 100mb 约定透传", async () => {
		mockFetch(() => okJson({ status: 1 }));
		const buf = Buffer.from([1, 2, 3, 250]);
		await createRequest({ ...baseOptions(), method: "POST", data: buf });
		expect(Buffer.isBuffer(calls[0].init.body)).toBe(true);
		expect(calls[0].init.body).toEqual(buf);
	});

	it("openapicdn 域名参数拼 URL", async () => {
		mockFetch(() => okJson({ status: 1 }));
		await createRequest({
			...baseOptions(),
			baseURL: "https://openapicdn.kugou.com",
			params: { q: "a b" },
			notSignature: true,
		});
		const url = calls[0].url;
		// 原实现不做 encode：保留 "a b" 原样（且默认参数在前）
		expect(url).toContain("q=a b");
		expect(url).not.toContain("q=a%20b");
		expect(url).toContain("dfid=DFID123");
		// 查询串拼在 URL 上，不再单独发 params
		expect(url).toMatch(/^https:\/\/openapicdn\.kugou\.com\/v1\/search\?/);
	});

	it("responseType=arraybuffer 时非 JSON 响应体返回 Buffer", async () => {
		mockFetch(() => new Response(Buffer.from([0x89, 0x50, 0x4e, 0x47])));
		const res = await createRequest({
			...baseOptions(),
			responseType: "arraybuffer",
		});
		expect(res.status).toBe(200);
		expect(Buffer.isBuffer(res.body)).toBe(true);
	});

	it("set-cookie 被 parseCookieString 格式化", async () => {
		mockFetch(
			() =>
				new Response("{}", {
					headers: { "set-cookie": "kugou_id=abc;Domain=.kugou.com" },
				}),
		);
		const res = await createRequest(baseOptions());
		// Domain= 字段被移除（与原 util.js 正则行为一致）
		expect(res.cookie).toEqual(["kugou_id=abc;"]);
	});
});
