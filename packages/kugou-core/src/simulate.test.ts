// @music-api/kugou-core — simulate.test.ts
// generateSimulate 形状测试（RSA-OAEP 自带随机，不做 golden 比对）。

import { describe, expect, it } from "vitest";
import { generateSimulate } from "./simulate.js";

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

describe("generateSimulate", () => {
	it("返回 edt/sid（Base64 非空字符串）", () => {
		const { edt, sid } = generateSimulate("MID1", 123, "DFID1", "webgl1");
		expect(typeof edt).toBe("string");
		expect(typeof sid).toBe("string");
		expect(edt.length).toBeGreaterThan(100);
		expect(sid.length).toBeGreaterThan(100);
		expect(edt).toMatch(BASE64);
		expect(sid).toMatch(BASE64);
	});

	it("每次调用结果不同（随机密钥 + 随机行为数据）", () => {
		const a = generateSimulate("MID1", 123, "DFID1", "webgl1");
		const b = generateSimulate("MID1", 123, "DFID1", "webgl1");
		expect(a.edt).not.toBe(b.edt);
		expect(a.sid).not.toBe(b.sid);
	});

	it("缺省参数不抛错（mid/userid/dfid → 0，webgl 自动生成）", () => {
		const { edt, sid } = generateSimulate("" as unknown as string, 0, 0);
		expect(edt.length).toBeGreaterThan(0);
		expect(sid.length).toBeGreaterThan(0);
	});
});
