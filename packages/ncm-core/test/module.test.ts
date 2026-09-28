import { describe, expect, it } from "vitest";
import { defineModule, type NcmModuleFn } from "../src/module.js";
import { createRequest } from "../src/request.js";

describe("defineModule", () => {
	it("is an identity helper preserving the function", async () => {
		const fn: NcmModuleFn = async (query, _request) =>
			request("/api/x", {}, { crypto: "api" });
		expect(defineModule(fn)).toBe(fn);
	});

	it("supports a typed result via the generic", async () => {
		const mod = defineModule<{ code: number }>(async (_query) => ({
			code: 200,
		}));
		const res = await mod({ ids: "1" }, createRequest);
		expect(res.code).toBe(200);
	});

	it("modules keep the original (query, request) calling shape", async () => {
		let seenQuery: unknown;
		const mod = defineModule(async (query, _request) => {
			seenQuery = query;
			return { status: 200, body: {}, cookie: [] };
		});
		await mod({ crypto: "weapi" }, createRequest);
		expect(seenQuery).toEqual({ crypto: "weapi" });
	});
});
