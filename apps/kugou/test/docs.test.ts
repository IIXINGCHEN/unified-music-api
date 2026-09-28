/**
 * P5-Docs: GET /docs 返回 Scalar API 文档页。
 */
import type { KgResponse } from "@music-api/kugou-core";
import { describe, expect, it } from "vitest";
import { constructServer, type LoadedModuleDef } from "../src/server.js";

describe("GET /docs", () => {
	it("返回 Scalar HTML 文档页", async () => {
		const stub: LoadedModuleDef = {
			identifier: "ping",
			route: "/ping",
			file: "<stub>/ping",
			module: async (): Promise<KgResponse> => ({
				status: 200,
				body: { ok: true },
				cookie: [],
			}),
		};
		const app = await constructServer([stub]);
		const res = await app.request("/docs");
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("text/html");
		const html = await res.text();
		expect(html.toLowerCase()).toContain("scalar");
	});
});
