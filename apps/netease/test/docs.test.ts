/**
 * P5-Docs: GET /docs 返回 Scalar API 文档页。
 */
import { describe, expect, it } from "vitest";
import { constructServer, type NcmModuleDef } from "../src/server.js";

// biome-ignore lint/suspicious/noExplicitAny: stub modules are intentionally loose
type AnyFn = (...args: any[]) => Promise<any>;

describe("GET /docs", () => {
	it("返回 Scalar HTML 文档页", async () => {
		const stub: NcmModuleDef = {
			identifier: "ping",
			route: "/ping",
			module: (async () => ({
				status: 200,
				body: { code: 200 },
				cookie: [],
			})) as AnyFn as NcmModuleDef["module"],
		};
		const app = await constructServer([stub]);
		const res = await app.request("/docs");
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("text/html");
		const html = await res.text();
		expect(html.toLowerCase()).toContain("scalar");
	});
});
