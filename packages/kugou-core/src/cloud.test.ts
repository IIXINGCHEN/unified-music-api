// @music-api/kugou-core — cloud.test.ts
// createCloudRequest 形状测试（global fetch 全 mock，不 golden：会话密钥随机）。

import { afterEach, describe, expect, it } from "vitest";
import { createCloudRequest } from "./request.js";

let calls: Array<{
	url: string;
	init: { method?: string; headers?: Record<string, string>; body?: unknown };
}> = [];
const realFetch = globalThis.fetch;

function mockFetch(
	handler: (
		url: string,
		init: { method?: string; headers?: Record<string, string>; body?: unknown },
	) => Response,
): void {
	calls = [];
	globalThis.fetch = (async (url: unknown, init: unknown) => {
		const c = {
			url: String(url),
			init: (init ?? {}) as {
				method?: string;
				headers?: Record<string, string>;
				body?: unknown;
			},
		};
		calls.push(c);
		return handler(c.url, c.init);
	}) as typeof fetch;
}

afterEach(() => {
	globalThis.fetch = realFetch;
});

/** 明文 JSON 响应：AES 解密必定失败（长度非 16 倍数）→ 走原文分支 */
const plainJson = (obj: unknown) =>
	new Response(JSON.stringify(obj), {
		headers: { "content-type": "text/plain" },
	});

const baseCookie = {
	KUGOU_API_MID: "MID456",
	dfid: "DFID1",
	userid: 99,
	token: "T",
};

describe("createCloudRequest", () => {
	it("请求形状：加密参数/头/Buffer 体", async () => {
		mockFetch(() => plainJson({ status: 1, data: {} }));
		const res = await createCloudRequest({
			url: "/v1/modify_list_sort",
			data: { list: [1, 2] },
			cookie: baseCookie,
		});

		expect(res.status).toBe(200);
		expect(res.body).toEqual({ status: 1, data: {} });
		expect(calls).toHaveLength(1);

		const q = new URL(calls[0].url).searchParams;
		expect(q.get("appid")).toBe("1005");
		expect(q.get("clientver")).toBe("20489");
		expect(q.get("mid")).toBe("MID456");
		expect(q.get("dfid")).toBe("DFID1");
		expect(q.get("key")).toMatch(/^[0-9a-f]{32}$/);
		expect(q.get("p")).toMatch(/^[0-9A-F]+$/);
		expect((q.get("p") as string).length).toBeGreaterThan(100);
		expect(Number(q.get("clienttime"))).toBeGreaterThan(0);

		const h = calls[0].init.headers as Record<string, string>;
		expect(h["x-router"]).toBe("cloudlist.service.kugou.com");
		expect(h["Content-Type"]).toBe("application/json;charset=utf-8");
		expect(h["kg-rc"]).toBe("1");

		expect(Buffer.isBuffer(calls[0].init.body)).toBe(true);
		expect((calls[0].init.body as Buffer).length % 16).toBe(0);
	});

	it("上游 status=0 → reject(502)", async () => {
		mockFetch(() => plainJson({ status: 0, msg: "bad" }));
		await expect(
			createCloudRequest({ url: "/x", cookie: baseCookie }),
		).rejects.toMatchObject({ status: 502, body: { status: 0, msg: "bad" } });
	});

	it("响应非 JSON → reject(500)（原实现 quirk：status 保持 500）", async () => {
		// 22 字节（非 16 倍数）→ AES 解密必定抛错 → 走原文分支 → JSON.parse 失败
		mockFetch(() => new Response("{{invalid json}}...."));
		await expect(
			createCloudRequest({ url: "/x", cookie: baseCookie }),
		).rejects.toMatchObject({ status: 500, body: { status: 0 } });
	});

	it("网络异常 → reject(502)", async () => {
		mockFetch(() => {
			throw new Error("down");
		});
		await expect(
			createCloudRequest({ url: "/x", cookie: baseCookie }),
		).rejects.toMatchObject({ status: 502 });
	});

	it("ip 透传头", async () => {
		mockFetch(() => plainJson({ status: 1 }));
		await createCloudRequest({ url: "/x", cookie: baseCookie, ip: "9.9.9.9" });
		const h = calls[0].init.headers as Record<string, string>;
		expect(h["X-Real-IP"]).toBe("9.9.9.9");
		expect(h["X-Forwarded-For"]).toBe("9.9.9.9");
	});
});
