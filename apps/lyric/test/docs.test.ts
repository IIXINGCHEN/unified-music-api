/**
 * P5-Docs: GET /docs 返回 Scalar API 文档页。
 */
import { describe, expect, it } from "vitest";
import app from "../src/index.js";

describe("GET /docs", () => {
	it("返回 Scalar HTML 文档页", async () => {
		const res = await app.request("/docs");
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("text/html");
		const html = await res.text();
		expect(html.toLowerCase()).toContain("scalar");
	});
});
