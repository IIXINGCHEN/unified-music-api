/**
 * P2 例外模块测试：3 个无法进入 contract-check 的模块。
 *
 * - login_qr_create: 动态 import('qrcode')，缺包即抛错（与原顶层 require 语义一致）
 * - register_checktoken_v2: 动态 import('jsdom')，缺包时优雅降级为空 token
 * - register_checktoken_v3: 端点函数（非标准模块签名），走 global fetch
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NcmRequestFn } from "@music-api/ncm-core";

vi.mock("qrcode", () => ({
	default: {
		toDataURL: vi.fn(async (url: string) => `data:image/png;base64,QR(${url})`),
	},
}));

import qrCreate from "../src/modules/login_qr_create.js";
import checktokenV3, { getToken as getV3Token } from "../src/modules/register_checktoken_v3.js";
import checktokenV2, { getToken as getV2Token } from "../src/modules/register_checktoken_v2.js";
import QRCode from "qrcode";

const stubRequest = ((_p: string, _d: unknown, _o: unknown) =>
	Promise.resolve({ status: 200, body: {}, cookie: [] })) as unknown as NcmRequestFn;

describe("login_qr_create", () => {
	beforeEach(() => vi.clearAllMocks());

	it("pc 平台：生成基础登录 URL，无 qrimg 时不调用 qrcode", async () => {
		const res = (await qrCreate({ key: "KEY123" }, stubRequest)) as {
			body: { data: { qrurl: string; qrimg: string } };
		};
		expect(res.body.data.qrurl).toBe("https://music.163.com/login?codekey=KEY123");
		expect(res.body.data.qrimg).toBe("");
		expect(QRCode.toDataURL).not.toHaveBeenCalled();
	});

	it("web 平台：URL 追加与 cookie 绑定的 chainId", async () => {
		const cookie = "MUSIC_U=abc";
		const res = (await qrCreate({ key: "K", platform: "web", cookie }, stubRequest)) as {
			body: { data: { qrurl: string } };
		};
		// chainId 含随机成分，只断言结构：v1_unknown-<rand>_web_login_<ts>
		expect(res.body.data.qrurl).toMatch(
			/^https:\/\/music\.163\.com\/login\?codekey=K&chainId=v1_unknown-\d+_web_login_\d+$/,
		);
		// 同一 cookie 两次调用 chainId 不同（随机部分）
		const res2 = (await qrCreate({ key: "K", platform: "web", cookie }, stubRequest)) as {
			body: { data: { qrurl: string } };
		};
		expect(res2.body.data.qrurl).not.toBe(res.body.data.qrurl);
	});

	it("qrimg=true：调用 qrcode.toDataURL 生成二维码", async () => {
		const res = (await qrCreate({ key: "K", qrimg: true }, stubRequest)) as {
			body: { data: { qrurl: string; qrimg: string } };
		};
		expect(QRCode.toDataURL).toHaveBeenCalledWith(res.body.data.qrurl);
		expect(res.body.data.qrimg).toBe(`data:image/png;base64,QR(${res.body.data.qrurl})`);
	});
});

describe("register_checktoken_v3", () => {
	beforeEach(() => vi.unstubAllGlobals());

	it("正常响应：解析 null([200,…,\"token\"]) 并返回 token", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => ({
				ok: true,
				text: async () => 'null([200,987654,"V3TOKEN123"])',
			})),
		);
		const res = (await checktokenV3()) as { body: { token: string; registered: boolean } };
		expect(res.body.token).toBe("V3TOKEN123");
		expect(res.body.registered).toBe(true);
		expect(await getV3Token()).toBe("V3TOKEN123");
	});

	it("易盾返回异常格式：token 为空，registered=false", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => ({ ok: true, text: async () => "garbage-response" })),
		);
		const res = (await checktokenV3()) as { body: { token: string; registered: boolean } };
		expect(res.body.token).toBe("");
		expect(res.body.registered).toBe(false);
		expect(await getV3Token()).toBe("");
	});

	it("网络失败：不抛错，返回空 token", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new Error("network down");
			}),
		);
		const res = (await checktokenV3()) as { status: number; body: { token: string } };
		expect(res.status).toBe(200);
		expect(res.body.token).toBe("");
		expect(await getV3Token()).toBe("");
	});
});

describe("register_checktoken_v2", () => {
	beforeEach(() => vi.unstubAllGlobals());

	it("jsdom 未安装：优雅降级，返回空 token 而非抛错", async () => {
		// tool.min.js 下载成功，但 import('jsdom') 必抛 MODULE_NOT_FOUND
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => ({ ok: true, text: async () => "/* tool.min.js */" })),
		);
		const res = (await checktokenV2()) as { body: { token: string; registered: boolean } };
		expect(res.body.token).toBe("");
		expect(res.body.registered).toBe(false);
		expect(await getV2Token()).toBe("");
	});

	it("初始化失败不污染后续调用：第二次调用同样干净返回", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => ({ ok: true, text: async () => "/* tool.min.js */" })),
		);
		await checktokenV2();
		const res2 = (await checktokenV2()) as { body: { token: string } };
		expect(res2.body.token).toBe("");
	});
});
