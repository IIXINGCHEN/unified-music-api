// @music-api/kugou-core — runtime.test.ts

import { afterEach, describe, expect, it, vi } from "vitest";
import { isLitePlatform, resolveProxy } from "./runtime.js";

const savedProxy = process.env.KUGOU_API_PROXY;
const savedPlatform = process.env.platform;

afterEach(() => {
	if (savedProxy === undefined) delete process.env.KUGOU_API_PROXY;
	else process.env.KUGOU_API_PROXY = savedProxy;
	if (savedPlatform === undefined) delete process.env.platform;
	else process.env.platform = savedPlatform;
	vi.restoreAllMocks();
});

describe("resolveProxy", () => {
	it("未配置返回 null", () => {
		delete process.env.KUGOU_API_PROXY;
		expect(resolveProxy()).toBeNull();
	});

	it("解析 http 代理", () => {
		process.env.KUGOU_API_PROXY = "http://127.0.0.1:8080";
		expect(resolveProxy()).toEqual({
			protocol: "http",
			host: "127.0.0.1",
			port: 8080,
		});
	});

	it("解析带认证的代理", () => {
		process.env.KUGOU_API_PROXY = "http://user:pass@proxy.example.com:3128";
		expect(resolveProxy()).toEqual({
			protocol: "http",
			host: "proxy.example.com",
			port: 3128,
			auth: { username: "user", password: "pass" },
		});
	});

	it("https 代理默认端口 443", () => {
		process.env.KUGOU_API_PROXY = "https://proxy.example.com";
		expect(resolveProxy()).toMatchObject({ protocol: "https", port: 443 });
	});

	it("不支持的协议返回 null", () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		process.env.KUGOU_API_PROXY = "socks5://127.0.0.1:1080";
		expect(resolveProxy()).toBeNull();
	});

	it("非法地址返回 null", () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		process.env.KUGOU_API_PROXY = "http://[::1";
		expect(resolveProxy()).toBeNull();
	});

	it("环境变量不变时返回缓存对象", () => {
		process.env.KUGOU_API_PROXY = "http://127.0.0.1:8080";
		const a = resolveProxy();
		const b = resolveProxy();
		expect(a).toBe(b);
	});

	it("环境变量变化时重新解析", () => {
		process.env.KUGOU_API_PROXY = "http://127.0.0.1:8080";
		const a = resolveProxy();
		process.env.KUGOU_API_PROXY = "http://127.0.0.1:9090";
		const b = resolveProxy();
		expect(a).not.toBe(b);
		expect(b).toMatchObject({ port: 9090 });
	});
});

describe("isLitePlatform", () => {
	it("platform=lite 时为 true", () => {
		process.env.platform = "lite";
		expect(isLitePlatform()).toBe(true);
	});

	it("未设置时为 false", () => {
		delete process.env.platform;
		expect(isLitePlatform()).toBe(false);
	});
});
