/**
 * P5-Docs: GET /docs 返回 Scalar API 文档页。
 *
 * 与 app.test.ts 相同：src/config/configEnv.ts 在模块加载期强校验
 * MONITOR_SECRET_KEY，必须先设置环境变量再动态导入 app。
 */
process.env.MONITOR_SECRET_KEY = "test-monitor-secret";
process.env.ENABLE_RATE_LIMIT = "true";

import { describe, expect, it } from "vitest";

const { app } = await import("../src/app.js");

describe("GET /docs", () => {
	it("返回 Scalar HTML 文档页", async () => {
		const res = await app.request("/docs");
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("text/html");
		const html = await res.text();
		expect(html.toLowerCase()).toContain("scalar");
	});
});
