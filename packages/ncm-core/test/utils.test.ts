import { describe, expect, it } from "vitest";
import {
	cookieObjToString,
	cookieToJson,
	generateChainId,
	generateDeviceId,
	generateRandomChineseIP,
	getCookieValue,
	getRandom,
	toBoolean,
} from "../src/utils.js";

describe("toBoolean", () => {
	it("passes booleans and empty string through", () => {
		expect(toBoolean(true)).toBe(true);
		expect(toBoolean(false)).toBe(false);
		expect(toBoolean("")).toBe("");
	});
	it('maps "true"/"1"/1 to true', () => {
		expect(toBoolean("true")).toBe(true);
		expect(toBoolean("1")).toBe(true);
		expect(toBoolean(1)).toBe(true);
	});
	it("maps everything else to false", () => {
		expect(toBoolean("false")).toBe(false);
		expect(toBoolean("0")).toBe(false);
		expect(toBoolean(0)).toBe(false);
		expect(toBoolean(undefined)).toBe(false);
	});
});

describe("cookieToJson", () => {
	it("parses k=v pairs", () => {
		expect(cookieToJson("a=1; b=2")).toEqual({ a: "1", b: "2" });
	});
	it('ignores items without exactly one "="', () => {
		expect(cookieToJson("a=1; bad; c=3")).toEqual({ a: "1", c: "3" });
		expect(cookieToJson("x=a=b")).toEqual({});
	});
	it("returns {} for empty input", () => {
		expect(cookieToJson("")).toEqual({});
	});
});

describe("cookieObjToString", () => {
	it('joins with "; " and encodes keys/values', () => {
		const s = cookieObjToString({ a: "1", b: "x y" });
		expect(s).toBe("a=1; b=x%20y");
	});
	it("round-trips simple values", () => {
		const obj = { MUSIC_U: "abc", os: "pc" };
		expect(cookieToJson(cookieObjToString(obj))).toEqual(obj);
	});
});

describe("getRandom", () => {
	it("returns an integer with the requested digit count", () => {
		const n = getRandom(10);
		expect(Number.isInteger(n)).toBe(true);
		expect(String(n)).toHaveLength(10);
	});
});

describe("generateRandomChineseIP", () => {
	it("returns an IPv4 address", () => {
		const ip = generateRandomChineseIP();
		expect(ip).toMatch(/^\d{1,3}(\.\d{1,3}){3}$/);
		for (const part of ip.split(".")) {
			expect(Number(part)).toBeLessThanOrEqual(255);
		}
	});
	it("produces varied addresses", () => {
		const set = new Set(
			Array.from({ length: 20 }, () => generateRandomChineseIP()),
		);
		expect(set.size).toBeGreaterThan(1);
	});
});

describe("generateDeviceId", () => {
	it("returns 52 uppercase hex chars", () => {
		const id = generateDeviceId();
		expect(id).toMatch(/^[0-9A-F]{52}$/);
	});
	it("is random", () => {
		expect(generateDeviceId()).not.toBe(generateDeviceId());
	});
});

describe("getCookieValue", () => {
	it("extracts a value without decoding", () => {
		expect(getCookieValue("a=1; sDeviceId=XYZ; b=2", "sDeviceId")).toBe("XYZ");
		expect(getCookieValue("", "sDeviceId")).toBe("");
		expect(getCookieValue("a=1", "missing")).toBe("");
	});
});

describe("generateChainId", () => {
	it("follows v1_<device>_web_login_<ts>", () => {
		const id = generateChainId("sDeviceId=DEV1; a=b");
		expect(id).toMatch(/^v1_DEV1_web_login_\d+$/);
	});
	it("falls back to unknown-<rand> without sDeviceId", () => {
		const id = generateChainId("a=b");
		expect(id).toMatch(/^v1_unknown-\d+_web_login_\d+$/);
	});
});
