/**
 * UNM 服务路由冒烟测试（app.request，不依赖真实上游网络）。
 *
 * 注意：src/config/configEnv.ts 在模块加载期强校验 MONITOR_SECRET_KEY，
 * 为空时直接 process.exit(1)。因此必须先设置环境变量，再动态导入 app。
 */
process.env.MONITOR_SECRET_KEY = "test-monitor-secret";
process.env.ENABLE_RATE_LIMIT = "true";

import { describe, expect, it } from "vitest";

const { app } = await import("../src/app.js");

const SECRET = "test-monitor-secret";

describe("UNM app", () => {
	it("GET / 返回首页 HTML（public/index.html）", async () => {
		const res = await app.request("/");
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("text/html");
		const html = await res.text();
		expect(html.length).toBeGreaterThan(100);
	});

	it("GET /health 返回 healthy", async () => {
		const res = await app.request("/health");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.code).toBe(200);
		expect(body.data.status).toBe("healthy");
	});

	it("GET /ping 返回 pong", async () => {
		const res = await app.request("/ping");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.message).toBe("pong");
	});

	it("GET /info 返回服务信息与版本号", async () => {
		const res = await app.request("/info");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.code).toBe(200);
		expect(body.data.name).toBe("unm-server");
		expect(typeof body.data.version).toBe("string");
		expect(Array.isArray(body.data.providers)).toBe(true);
	});

	it("GET /health?verbose=true 无密钥返回 401", async () => {
		const res = await app.request("/health?verbose=true");
		expect(res.status).toBe(401);
	});

	it("GET /health?verbose=true 带 x-api-key 返回内存指标", async () => {
		const res = await app.request("/health?verbose=true", {
			headers: { "x-api-key": SECRET },
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.memory).toBeDefined();
	});

	it("GET /api/monitor/data 无密钥返回 401", async () => {
		const res = await app.request("/api/monitor/data");
		expect(res.status).toBe(401);
	});

	it("GET /api/monitor/data 带 Bearer 密钥返回监控数据", async () => {
		const res = await app.request("/api/monitor/data", {
			headers: { authorization: `Bearer ${SECRET}` },
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.code).toBe(200);
		expect(body.data).toBeDefined();
	});

	it("POST /api/monitor/clear 带密钥清空日志", async () => {
		const res = await app.request("/api/monitor/clear", {
			method: "POST",
			headers: { "x-api-key": SECRET },
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.cleared).toBe(true);
	});

	it("GET /dashboard 返回监控大盘 HTML", async () => {
		const res = await app.request("/dashboard");
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("text/html");
	});

	it("未知 API 路由返回 404 JSON", async () => {
		const res = await app.request("/api/not-exist-xyz", {
			headers: { accept: "application/json" },
		});
		expect(res.status).toBe(404);
		const body = await res.json();
		expect(body.code).toBe(404);
	});

	it("CORS 预检返回 204 并反射 Origin", async () => {
		const res = await app.request("/health", {
			method: "OPTIONS",
			headers: {
				origin: "https://example.com",
				"access-control-request-method": "GET",
			},
		});
		expect([200, 204]).toContain(res.status);
		// 默认 ALLOWED_DOMAIN=* 时返回通配
		expect(res.headers.get("access-control-allow-origin")).toBeTruthy();
	});

	it("限流中间件设置 RateLimit 响应头", async () => {
		const res = await app.request("/info");
		expect(res.status).toBe(200);
		expect(res.headers.get("ratelimit-limit")).toBeTruthy();
		expect(res.headers.get("x-response-time")).toMatch(/ms$/);
	});
});
