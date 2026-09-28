/**
 * P5-Docs: GET /docs 返回 Scalar API 文档页。
 */
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("GET /docs", () => {
	it("返回 Scalar HTML 文档页", async () => {
		const app = createApp();
		const res = await app.request("/docs");
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("text/html");
		const html = await res.text();
		expect(html.toLowerCase()).toContain("scalar");
	});
});
