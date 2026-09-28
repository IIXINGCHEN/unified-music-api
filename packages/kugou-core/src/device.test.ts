// @music-api/kugou-core — device.test.ts

import { cryptoMd5 } from "@music-api/kugou-crypto";
import { afterEach, describe, expect, it } from "vitest";
import { createDeviceIds, ensureDeviceCookies } from "./device.js";

const ENV_KEYS = [
	"KUGOU_API_GUID",
	"KUGOU_API_DEV",
	"KUGOU_API_MAC",
	"KUGOU_API_WEBGL",
	"platform",
] as const;

const saved: Record<string, string | undefined> = {};
for (const k of ENV_KEYS) saved[k] = process.env[k];

afterEach(() => {
	for (const k of ENV_KEYS) {
		if (saved[k] === undefined) delete process.env[k];
		else process.env[k] = saved[k];
	}
});

describe("createDeviceIds", () => {
	it("注入式 DEV 生成器保证确定性", () => {
		const d = createDeviceIds({
			devGenerator: () => "Abc123Xyz9",
			webglGenerator: () => "WEBGL1",
		});
		expect(d.dev).toBe("ABC123XYZ9");
		expect(d.webgl).toBe("WEBGL1");
		expect(d.mac).toBe("02:00:00:00:00:00");
		expect(d.guid).toMatch(/^[0-9a-f]{32}$/);
		expect(d.mid).toMatch(/^\d+$/);
	});

	it("默认 DEV 为 10 位大写随机串", () => {
		const d = createDeviceIds({ webglGenerator: () => "w" });
		expect(d.dev).toMatch(/^[0-9A-Z]{10}$/);
	});

	it("环境变量覆盖 DEV/MAC（统一大写）", () => {
		process.env.KUGOU_API_DEV = "mydev";
		process.env.KUGOU_API_MAC = "aa:bb:cc:dd:ee:ff";
		const d = createDeviceIds({ webglGenerator: () => "w" });
		expect(d.dev).toBe("MYDEV");
		expect(d.mac).toBe("AA:BB:CC:DD:EE:FF");
	});

	it("环境变量 KUGOU_API_WEBGL 覆盖自动生成", () => {
		process.env.KUGOU_API_WEBGL = "FIXED";
		const d = createDeviceIds({ webglGenerator: () => "RANDOM" });
		expect(d.webgl).toBe("FIXED");
	});

	it("合法 UUIDv4 的 GUID 环境变量取其 MD5", () => {
		const uuid = "123e4567-e89b-42d3-a456-426614174000";
		process.env.KUGOU_API_GUID = uuid;
		const d = createDeviceIds({ webglGenerator: () => "w" });
		expect(d.guid).toBe(cryptoMd5(uuid));
	});

	it("非 UUID 的 GUID 环境变量原样使用", () => {
		process.env.KUGOU_API_GUID = "raw-guid-value";
		const d = createDeviceIds({ webglGenerator: () => "w" });
		expect(d.guid).toBe("raw-guid-value");
	});
});

describe("ensureDeviceCookies", () => {
	it("只补缺失键，不覆盖已有", () => {
		const merged = ensureDeviceCookies(
			{ KUGOU_API_MID: "CLIENT_MID", other: "x" },
			{
				platform: "std",
				mid: "SERVER_MID",
				guid: "G",
				dev: "D",
				mac: "M",
				webgl: "W",
			},
		);
		expect(merged.KUGOU_API_MID).toBe("CLIENT_MID");
		expect(merged.KUGOU_API_GUID).toBe("G");
		expect(merged.other).toBe("x");
	});
});
