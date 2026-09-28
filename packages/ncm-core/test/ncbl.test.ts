import { randomBytes } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	buildCookieStr,
	buildMetaJson,
	buildMultipart,
	buildPld,
	buildPlv,
	buildRecord,
	buildRecords,
	chacha20,
	doUpload,
	encryptNCBL,
	extractContext,
	FIELD_SEP,
	getCompress,
	HEADER_FIXED_LEN,
	MAGIC,
	META_BLOCK_TYPE,
	NCBL_VERSION,
	parseCookie,
	randomHex,
	randomUUID,
	rsaWrap,
} from "../src/ncbl.js";

afterEach(() => {
	vi.unstubAllGlobals();
});

const plvCtx = {
	app: { version: "3.1.35", versionCode: "205293", channel: "netease" },
	auth: { vipType: "0" },
};

describe("chacha20", () => {
	it("round-trips (xor twice = identity)", () => {
		const key = randomBytes(32);
		const nonce = randomBytes(12);
		const data = Buffer.from("ncbl chacha20 test payload 0123456789".repeat(4));
		const enc = chacha20(key, 7, nonce, data);
		expect(enc.equals(data)).toBe(false);
		expect(chacha20(key, 7, nonce, enc).equals(data)).toBe(true);
	});
});

describe("rsaWrap", () => {
	it("is deterministic and 32 bytes", () => {
		const keyA = Buffer.alloc(32, 1);
		const a = rsaWrap(keyA);
		const b = rsaWrap(Buffer.alloc(32, 1));
		expect(a).toHaveLength(32);
		expect(a.equals(b)).toBe(true);
	});
});

describe("encryptNCBL", () => {
	const opts = () => ({
		keyA: Buffer.alloc(32, 1),
		uuid: Buffer.alloc(16, 2),
		baseSeq: 42,
	});

	it("produces the NCBL v3 header layout", () => {
		const out = encryptNCBL('{"m":1}', '{"b":2}', opts());
		expect(out.subarray(0, 4).equals(MAGIC)).toBe(true);
		expect(out.readUInt32LE(4)).toBe(NCBL_VERSION);
		const headerLen = out.readUInt16LE(8);
		expect(headerLen).toBeGreaterThan(HEADER_FIXED_LEN);
		// meta block sits right after the fixed header
		expect(out.readUInt16LE(HEADER_FIXED_LEN)).toBe(META_BLOCK_TYPE);
	});

	it("is deterministic with fixed opts", () => {
		const a = encryptNCBL("meta", "body", opts());
		const b = encryptNCBL("meta", "body", opts());
		expect(a.equals(b)).toBe(true);
	});

	it("handles an empty body", () => {
		const out = encryptNCBL("meta", "", opts());
		expect(out.length).toBeGreaterThan(HEADER_FIXED_LEN);
	});
});

describe("records", () => {
	it("buildRecord joins with FIELD_SEP", () => {
		expect(FIELD_SEP).toBe("");
		expect(buildRecord({ time: 123, action: "play", data: { a: 1 } })).toBe(
			'123play{"a":1}',
		);
	});
	it("buildRecord keeps string data as-is", () => {
		expect(buildRecord({ time: 1, action: "a", data: "raw" })).toBe("1araw");
	});
	it("buildRecords concatenates", () => {
		expect(
			buildRecords([
				{ time: 1, action: "a", data: "x" },
				{ time: 2, action: "b", data: "y" },
			]),
		).toBe("1ax2by");
	});
});

describe("PLV/PLD", () => {
	const song = { id: 12345, bitrate: 320000, time: 200000, level: "exhigh" };
	const source = { id: 999, name: "test", type: "playlist" };

	it("buildPlv returns the desktop-client object", () => {
		const plv = buildPlv(plvCtx, song, source);
		expect(plv.id).toBe("12345");
		expect(plv.mode).toBe("circulation");
		expect(plv._addrefer).toContain("[12345:song:x:x|");
		expect(plv.sourceId).toBe(999);
	});

	it("buildPld records played time", () => {
		const pld = buildPld(plvCtx, song, source, 150000);
		expect(pld.id).toBe("12345");
		expect(pld.time).toBe(150000);
		expect(pld.realtime).toBe(150000);
		expect(pld.end).toBe("interrupt");
	});
});

describe("context helpers", () => {
	it("parseCookie parses strings without decoding", () => {
		expect(parseCookie("MUSIC_U=a+b; os=pc")).toEqual({
			MUSIC_U: "a+b",
			os: "pc",
		});
	});
	it("parseCookie passes objects through", () => {
		const obj = { a: "1" };
		expect(parseCookie(obj)).toBe(obj);
	});
	it("parseCookie returns {} for junk", () => {
		expect(parseCookie(undefined)).toEqual({});
	});

	it("extractContext maps cookie fields with defaults", () => {
		const ctx = extractContext({ MUSIC_U: "tok", deviceId: "d1" });
		expect(ctx.auth.token).toBe("tok");
		expect(ctx.device.id).toBe("d1");
		expect(ctx.app.version).toBe("3.1.35");
		expect(ctx.app.versionCode).toBe("205293");
		expect(ctx.device.systemType).toBe("pc");
	});

	it("buildCookieStr / buildMetaJson round-trip the ctx", () => {
		const ctx = extractContext({ MUSIC_U: "tok", deviceId: "d1" });
		const str = buildCookieStr(ctx);
		expect(str).toContain("MUSIC_U=tok");
		expect(str).toContain("deviceId=d1");
		const meta = JSON.parse(buildMetaJson(ctx));
		expect(meta.MUSIC_U).toBe("tok");
		expect(meta.deviceId).toBe("d1");
	});
});

describe("multipart", () => {
	it("buildMultipart wraps the payload", () => {
		const payload = Buffer.from("PAYLOAD");
		const { boundary, fileName, multipartBody } = buildMultipart(payload);
		expect(boundary).toMatch(/^[0-9a-f]{32}$/);
		expect(fileName).toMatch(/^op_\d+_0_\d+$/);
		const text = multipartBody.toString("utf-8");
		expect(text).toContain(`--${boundary}`);
		expect(text).toContain("PAYLOAD");
		expect(text).toContain(`filename="${fileName}"`);
	});
});

describe("misc", () => {
	it("randomUUID is 32 hex chars", () => {
		expect(randomUUID()).toMatch(/^[0-9a-f]{32}$/);
	});
	it("randomHex returns the requested length", () => {
		expect(randomHex(8)).toMatch(/^[0-9a-f]{8}$/);
	});
	it("getCompress picks zstd or gzip", () => {
		const { name, compress } = getCompress();
		expect(["zstd", "gzip"]).toContain(name);
		expect(compress(Buffer.from("x".repeat(1000)))).toBeInstanceOf(Buffer);
	});
});

describe("doUpload", () => {
	it("posts multipart to clientlog3 and reports success", async () => {
		const seen: { url: string; init: RequestInit }[] = [];
		vi.stubGlobal("fetch", (async (url: unknown, init: unknown) => {
			seen.push({ url: String(url), init: init as RequestInit });
			const bodyText = await (init as { body: Blob }).body.text();
			const fileName = bodyText.match(/filename="([^"]+)"/)?.[1] ?? "";
			return new Response(
				JSON.stringify({
					code: 200,
					data: { successfiles: [fileName] },
				}),
				{ status: 200 },
			);
		}) as typeof fetch);

		const ctx = extractContext({ MUSIC_U: "u", deviceId: "d1" });
		const res = await doUpload(ctx, '{"a":1}', '{"r":[]}', "MUSIC_U=u");

		expect(res.success).toBe(true);
		expect(res.fileName).toBeTruthy();
		expect(res.payload.length).toBeGreaterThan(0);
		expect(res.respBody.code).toBe(200);
		expect(seen).toHaveLength(1);
		expect(seen[0].url).toBe(
			"https://clientlog3.music.163.com/api/clientlog/encrypt/upload?multiupload=true",
		);
		expect(seen[0].init.method).toBe("POST");
		const headers = seen[0].init.headers as Record<string, string>;
		expect(headers["Content-Type"]).toContain("multipart/form-data; boundary=");
		expect(headers.Cookie).toBe("MUSIC_U=u");
	});

	it("reports failure when the server disagrees", async () => {
		vi.stubGlobal(
			"fetch",
			(async () =>
				new Response(JSON.stringify({ code: 200, data: {} }), {
					status: 200,
				})) as typeof fetch,
		);
		const ctx = extractContext({});
		const res = await doUpload(ctx, "{}", "{}", "");
		// NOTE: the original returns `undefined` here (code===200 && undefined)
		expect(res.success).toBeFalsy();
	});
});
