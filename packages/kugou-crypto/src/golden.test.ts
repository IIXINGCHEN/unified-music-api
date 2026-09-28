// golden-vector 门禁：vectors.json 由原始 JS 实现（/tmp/kg-vec/gen.mjs）生成，
// 本文件逐条断言 TS 移植版输出逐字节一致。
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
	calculateMid,
	cookieToJson,
	cryptoAesDecrypt,
	cryptoAesEncrypt,
	cryptoMd5,
	cryptoRSAEncrypt,
	cryptoSha1,
	decodeLyrics,
	generateWebGLHash,
	getGuid,
	isUUIDv4,
	parseCookieString,
	playlistAesDecrypt,
	playlistAesEncrypt,
	randomNumber,
	randomString,
	rsaEncrypt2,
	signatureAndroidParams,
	signatureRegisterParams,
	signatureWebParams,
	signCloudKey,
	signKey,
	signParams,
	signParamsKey,
} from "./index.js";

interface Vector {
	name: string;
	input: Record<string, unknown>;
	expected: unknown;
	note?: string;
}

const vectors: Vector[] = JSON.parse(
	readFileSync(
		join(
			dirname(fileURLToPath(import.meta.url)),
			"..",
			"vectors",
			"vectors.json",
		),
		"utf8",
	),
);
const getVector = (name: string): Vector => {
	const v = vectors.find((x) => x.name === name);
	if (!v) throw new Error(`vector not found: ${name}`);
	return v;
};
const expectedOf = (name: string): unknown => getVector(name).expected;
const inputOf = (name: string): Record<string, unknown> =>
	getVector(name).input;
const bufOf = (name: string, field: string): Buffer =>
	Buffer.from(
		(inputOf(name)[field] as string).replace(/^base64:/, ""),
		"base64",
	);

describe("golden vectors (generated from original JS)", () => {
	it("md5", () => {
		expect(cryptoMd5(inputOf("md5.ascii").data)).toBe(expectedOf("md5.ascii"));
		expect(cryptoMd5(inputOf("md5.empty").data)).toBe(expectedOf("md5.empty"));
		expect(cryptoMd5(inputOf("md5.unicode").data)).toBe(
			expectedOf("md5.unicode"),
		);
		expect(cryptoMd5({ a: 1, b: "x" })).toBe(expectedOf("md5.object"));
		expect(cryptoMd5(bufOf("md5.buffer", "data"))).toBe(
			expectedOf("md5.buffer"),
		);
	});

	it("sha1", () => {
		expect(cryptoSha1(inputOf("sha1.ascii").data)).toBe(
			expectedOf("sha1.ascii"),
		);
		expect(cryptoSha1(inputOf("sha1.unicode").data)).toBe(
			expectedOf("sha1.unicode"),
		);
	});

	it("aes fixed key/iv round-trip", () => {
		const i = inputOf("aes.encrypt.fixed");
		expect(
			cryptoAesEncrypt(i.data, { key: i.key as string, iv: i.iv as string }),
		).toBe(expectedOf("aes.encrypt.fixed"));
		const d = inputOf("aes.decrypt.fixed");
		expect(
			cryptoAesDecrypt(d.cipher as string, d.key as string, d.iv as string),
		).toBe(expectedOf("aes.decrypt.fixed"));
	});

	it("aes object payload (returns parsed JSON)", () => {
		const i = inputOf("aes.encrypt.object");
		expect(
			cryptoAesEncrypt(i.data, { key: i.key as string, iv: i.iv as string }),
		).toBe(expectedOf("aes.encrypt.object"));
		const d = inputOf("aes.decrypt.object");
		expect(
			cryptoAesDecrypt(d.cipher as string, d.key as string, d.iv as string),
		).toEqual(expectedOf("aes.decrypt.object"));
	});

	it("aes derived-key mode", () => {
		const i = inputOf("aes.encrypt.derived");
		expect(cryptoAesEncrypt(i.data, { key: i.key as string })).toBe(
			expectedOf("aes.encrypt.derived"),
		);
		const d = inputOf("aes.decrypt.derived");
		expect(cryptoAesDecrypt(d.cipher as string, d.key as string)).toBe(
			expectedOf("aes.decrypt.derived"),
		);
	});

	it("aes random-key decrypt (recorded run)", () => {
		const d = inputOf("aes.decrypt.randomKey");
		expect(cryptoAesDecrypt(d.cipher as string, d.key as string)).toBe(
			expectedOf("aes.decrypt.randomKey"),
		);
	});

	it("aes random-key round-trip (property)", () => {
		const plain = "property-round-trip-plain";
		const enc = cryptoAesEncrypt(plain) as { str: string; key: string };
		expect(typeof enc.str).toBe("string");
		expect(typeof enc.key).toBe("string");
		expect(cryptoAesDecrypt(enc.str, enc.key)).toBe(plain);
	});

	it("playlist aes decrypt (recorded run) + round-trip", () => {
		const d = inputOf("playlist.decrypt") as { key: string; str: string };
		expect(playlistAesDecrypt({ key: d.key, str: d.str })).toBe(
			expectedOf("playlist.decrypt"),
		);
		const enc = playlistAesEncrypt("round-trip-playlist");
		expect(playlistAesDecrypt(enc)).toBe("round-trip-playlist");
	});

	it("rsa raw (deterministic)", () => {
		expect(cryptoRSAEncrypt(inputOf("rsa.raw").data)).toBe(
			expectedOf("rsa.raw"),
		);
	});

	it("rsa pkcs1 v1.5 format (random padding: shape only)", () => {
		const out = rsaEncrypt2(inputOf("rsa.pkcs1.format").data);
		expect(out).toMatch(/^[0-9a-f]{256}$/);
	});

	it("signers", () => {
		// web
		let i = inputOf("sign.web.basic");
		expect(signatureWebParams(i.params as Record<string, unknown>)).toBe(
			expectedOf("sign.web.basic"),
		);
		i = inputOf("sign.web.sortTrap");
		expect(signatureWebParams(i.params as Record<string, unknown>)).toBe(
			expectedOf("sign.web.sortTrap"),
		);
		i = inputOf("sign.web.withData");
		expect(
			signatureWebParams(i.params as Record<string, unknown>, i.data as string),
		).toBe(expectedOf("sign.web.withData"));
		// android
		i = inputOf("sign.android.basic");
		expect(signatureAndroidParams(i.params as Record<string, unknown>)).toBe(
			expectedOf("sign.android.basic"),
		);
		i = inputOf("sign.android.objectValue");
		expect(signatureAndroidParams(i.params as Record<string, unknown>)).toBe(
			expectedOf("sign.android.objectValue"),
		);
		i = inputOf("sign.android.bufferBody");
		expect(
			signatureAndroidParams(
				i.params as Record<string, unknown>,
				bufOf("sign.android.bufferBody", "data"),
			),
		).toBe(expectedOf("sign.android.bufferBody"));
		i = inputOf("sign.android.lite");
		process.env.platform = "lite";
		try {
			expect(signatureAndroidParams(i.params as Record<string, unknown>)).toBe(
				expectedOf("sign.android.lite"),
			);
		} finally {
			delete process.env.platform;
		}
		// register / signParams / keys
		i = inputOf("sign.register");
		expect(signatureRegisterParams(i.params as Record<string, unknown>)).toBe(
			expectedOf("sign.register"),
		);
		i = inputOf("sign.signParams");
		expect(
			signParams(i.params as Record<string, unknown>, i.data as string),
		).toBe(expectedOf("sign.signParams"));
		i = inputOf("sign.signKey.defaults");
		expect(signKey(i.hash as string, i.mid as string)).toBe(
			expectedOf("sign.signKey.defaults"),
		);
		i = inputOf("sign.signKey.explicit");
		expect(
			signKey(
				i.hash as string,
				i.mid as string,
				i.userid as number,
				i.appid as number,
			),
		).toBe(expectedOf("sign.signKey.explicit"));
		i = inputOf("sign.signParamsKey.defaults");
		expect(signParamsKey(i.data as string)).toBe(
			expectedOf("sign.signParamsKey.defaults"),
		);
		i = inputOf("sign.signParamsKey.explicit");
		expect(
			signParamsKey(i.data as string, i.appid as number, i.clientver as number),
		).toBe(expectedOf("sign.signParamsKey.explicit"));
		i = inputOf("sign.signCloudKey");
		expect(signCloudKey(i.hash as string, i.pid as string)).toBe(
			expectedOf("sign.signCloudKey"),
		);
	});

	it("signers lite platform", () => {
		process.env.platform = "lite";
		try {
			const k = inputOf("sign.signKey.lite");
			expect(signKey(k.hash as string, k.mid as string)).toBe(
				expectedOf("sign.signKey.lite"),
			);
			const pk = inputOf("sign.signParamsKey.lite");
			expect(signParamsKey(pk.data as string)).toBe(
				expectedOf("sign.signParamsKey.lite"),
			);
		} finally {
			delete process.env.platform;
		}
	});

	it("aes-192 key (original impl crashes here; port generalizes correctly)", () => {
		const k24 = "0123456789abcdefGHIJKLMN";
		const iv24 = "fedcba9876543210";
		const hex = cryptoAesEncrypt("aes-192-test", { key: k24, iv: iv24 });
		expect(cryptoAesDecrypt(hex as string, k24, iv24)).toBe("aes-192-test");
	});

	it("aes rejects unsupported key length", () => {
		expect(() => cryptoAesEncrypt("x", { key: "short", iv: "short" })).toThrow(
			/unsupported AES key length/,
		);
	});

	it("calculateMid", () => {
		const i = inputOf("mid.guid");
		expect(calculateMid(i.guid as string)).toBe(expectedOf("mid.guid"));
	});

	it("krc decode", () => {
		const i = inputOf("krc.decode");
		expect(decodeLyrics(i.blobBase64 as string)).toBe(expectedOf("krc.decode"));
		const bad = inputOf("krc.decode.invalid");
		expect(decodeLyrics(bad.blobBase64 as string)).toBe(
			expectedOf("krc.decode.invalid"),
		);
	});

	it("cookie utils", () => {
		expect(cookieToJson(inputOf("cookie.toJson").cookie as string)).toEqual(
			expectedOf("cookie.toJson"),
		);
		expect(
			parseCookieString(inputOf("cookie.parseString").cookie as string),
		).toBe(expectedOf("cookie.parseString"));
	});

	it("uuid", () => {
		expect(isUUIDv4(inputOf("uuid.isV4.true").s as string)).toBe(true);
		expect(isUUIDv4(inputOf("uuid.isV4.false").s as string)).toBe(false);
		// 原实现 getGuid 并未强制 v4 版本/变体位（文档与代码不符，实测约 1/20 通过 isUUIDv4）：
		// 移植版照搬该行为，此处只断言形状一致，不强求 v4 合法。
		expect(getGuid()).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
		);
	});

	it("random helpers shape", () => {
		expect(randomString(8)).toMatch(/^[0-9A-Z]{8}$/);
		expect(randomNumber(6)).toMatch(/^[0-9]{6}$/);
		expect(generateWebGLHash()).toMatch(/^\d+$/);
	});

	it("webgl browser branch (deterministic fake GL, same stub as vector harness)", () => {
		const pixels = new Uint8Array(200 * 50 * 4);
		for (let i = 0; i < pixels.length; i++) pixels[i] = i % 251;
		const gl = {
			VERTEX_SHADER: 0x8b31,
			FRAGMENT_SHADER: 0x8b30,
			ARRAY_BUFFER: 0x8892,
			STATIC_DRAW: 0x88e4,
			FLOAT: 0x1406,
			COLOR_BUFFER_BIT: 0x4000,
			TRIANGLES: 0x0004,
			RGBA: 0x1908,
			UNSIGNED_BYTE: 0x1401,
			VERSION: 0x1f02,
			createShader: () => ({}),
			shaderSource: () => {},
			compileShader: () => {},
			createProgram: () => ({}),
			attachShader: () => {},
			linkProgram: () => {},
			useProgram: () => {},
			createBuffer: () => ({}),
			bindBuffer: () => {},
			bufferData: () => {},
			getAttribLocation: () => 0,
			enableVertexAttribArray: () => {},
			vertexAttribPointer: () => {},
			viewport: () => {},
			clearColor: () => {},
			clear: () => {},
			drawArrays: () => {},
			readPixels: (
				_x: number,
				_y: number,
				_w: number,
				_h: number,
				_f: number,
				_t: number,
				p: Uint8Array,
			) => {
				p.set(pixels.subarray(0, p.length));
			},
			getExtension: () => ({
				UNMASKED_VENDOR_WEBGL: 0x1f00,
				UNMASKED_RENDERER_WEBGL: 0x1f01,
			}),
			getParameter: (p: number) => {
				if (p === 0x1f02) return "WebGL 1.0 (fake)";
				if (p === 0x1f00) return "Fake Vendor";
				if (p === 0x1f01) return "Fake Renderer";
				return "";
			},
		};
		const g = globalThis as unknown as { document?: unknown };
		const prev = g.document;
		g.document = {
			createElement: () => ({ width: 0, height: 0, getContext: () => gl }),
		};
		try {
			expect(generateWebGLHash()).toBe(expectedOf("webgl.browser"));
		} finally {
			if (prev === undefined) delete g.document;
			else g.document = prev;
		}
	});

	it("webgl browser branch without debug extension (getContext fallback)", () => {
		const pixels = new Uint8Array(200 * 50 * 4);
		for (let i = 0; i < pixels.length; i++) pixels[i] = i % 251;
		const gl = {
			VERTEX_SHADER: 0x8b31,
			FRAGMENT_SHADER: 0x8b30,
			ARRAY_BUFFER: 0x8892,
			STATIC_DRAW: 0x88e4,
			FLOAT: 0x1406,
			COLOR_BUFFER_BIT: 0x4000,
			TRIANGLES: 0x0004,
			RGBA: 0x1908,
			UNSIGNED_BYTE: 0x1401,
			VERSION: 0x1f02,
			createShader: () => ({}),
			shaderSource: () => {},
			compileShader: () => {},
			createProgram: () => ({}),
			attachShader: () => {},
			linkProgram: () => {},
			useProgram: () => {},
			createBuffer: () => ({}),
			bindBuffer: () => {},
			bufferData: () => {},
			getAttribLocation: () => 0,
			enableVertexAttribArray: () => {},
			vertexAttribPointer: () => {},
			viewport: () => {},
			clearColor: () => {},
			clear: () => {},
			drawArrays: () => {},
			readPixels: (
				_x: number,
				_y: number,
				_w: number,
				_h: number,
				_f: number,
				_t: number,
				p: Uint8Array,
			) => {
				p.set(pixels.subarray(0, p.length));
			},
			getExtension: () => null,
			getParameter: (p: number) => (p === 0x1f02 ? "WebGL 1.0 (fake)" : ""),
		};
		let calls = 0;
		const g = globalThis as unknown as { document?: unknown };
		const prev = g.document;
		g.document = {
			createElement: () => ({
				width: 0,
				height: 0,
				getContext: () => {
					calls += 1;
					return calls === 1 ? null : gl;
				},
			}),
		};
		try {
			expect(generateWebGLHash()).toBe(expectedOf("webgl.browser.noext"));
		} finally {
			if (prev === undefined) delete g.document;
			else g.document = prev;
		}
	});

	it("webgl falls back to Node branch when canvas throws", () => {
		const g = globalThis as unknown as { document?: unknown };
		const prev = g.document;
		g.document = {
			createElement: () => {
				throw new Error("no canvas");
			},
		};
		try {
			expect(generateWebGLHash()).toMatch(/^\d+$/);
		} finally {
			if (prev === undefined) delete g.document;
			else g.document = prev;
		}
	});
});
