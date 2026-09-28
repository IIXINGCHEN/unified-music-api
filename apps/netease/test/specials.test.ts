/**
 * P2 特殊手工模块行为测试：contract-check 覆盖不到的部分
 * （真实网络 / 缺失可选依赖 / 有意分歧 / 有意修复）。
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NcmRequestFn } from "@music-api/ncm-core";

// unblockmusic-utils 现为真实依赖：用可控 mock 同时覆盖"缺失降级"与"存在走解锁"两条路径
const unblockState = { mode: "throw" as "throw" | "ok" };
vi.mock("@neteasecloudmusicapienhanced/unblockmusic-utils", () => ({
	matchID: async (..._args: unknown[]) => {
		if (unblockState.mode === "throw") throw new Error("mocked: dep missing");
		return { data: { url: "https://mocked.example/unblock.mp3" } };
	},
}));
beforeEach(() => {
	unblockState.mode = "throw";
});

import voiceUpload from "../src/modules/voice_upload.js";
import cloudUploadToken from "../src/modules/cloud_upload_token.js";
import songUrlV1 from "../src/modules/song_url_v1.js";
import songUrlMatch from "../src/modules/song_url_match.js";
import loginQrCheck from "../src/modules/login_qr_check.js";

const asRequest = (fn: (...args: never[]) => Promise<unknown>): NcmRequestFn =>
	fn as unknown as NcmRequestFn;

// ---------------------------------------------------------------- voice_upload
describe("voice_upload", () => {
	const songFile = {
		name: "test.mp3",
		mimetype: "audio/mpeg",
		size: 100,
		data: Buffer.alloc(100, 0x61),
	};

	const runUpload = async () => {
		const requestCalls: { path: string; data: unknown }[] = [];
		const axiosCalls: { method: string; url: string; data: unknown }[] = [];
		const request = asRequest(async (path: string, data: unknown) => {
			requestCalls.push({ path: path as string, data });
			if ((path as string) === "/api/nos/token/alloc") {
				return {
					status: 200,
					body: { result: { objectKey: "a/b/c.mp3", docId: "doc1", token: "nos-token" } },
					cookie: [],
				};
			}
			return { status: 200, body: { data: { voiceId: "v1" } }, cookie: [] };
		});
		const fakeAxios = async (config: { method: string; url: string; data?: unknown }) => {
			axiosCalls.push({ method: config.method, url: config.url, data: config.data });
			if (config.url.includes("?uploads")) {
				return {
					data: "<InitiateMultipartUploadResult><UploadId>U1</UploadId></InitiateMultipartUploadResult>",
					headers: {},
				};
			}
			if (config.method === "put") {
				return { data: "", headers: { etag: '"etag-part-1"' } };
			}
			return { data: "", headers: {} }; // complete
		};
		const fakeUploadPlugin = async () => ({ imgId: "cover1" });
		const res = (await voiceUpload(
			{ songFile, coverImgId: "cover1", autoPublish: "1", privacy: "0" },
			request,
			{ axios: fakeAxios, uploadPlugin: fakeUploadPlugin },
		)) as { body: { code: number; data: unknown } };
		return { res, requestCalls, axiosCalls };
	};

	it("缺少 songFile 时 500 拒绝", async () => {
		await expect(voiceUpload({}, asRequest(async () => ({})))).rejects.toMatchObject({
			status: 500,
			body: { code: 500, msg: "请上传音频文件" },
		});
	});

	it("分片上传流程：initiate → PUT part → complete → 两次业务请求", async () => {
		const { res, requestCalls, axiosCalls } = await runUpload();
		expect(axiosCalls.map((c) => c.method)).toEqual(["post", "put", "post"]);
		expect(axiosCalls[0].url).toContain("a%2Fb%2Fc.mp3?uploads");
		expect(axiosCalls[1].url).toContain("partNumber=1&uploadId=U1");
		expect(axiosCalls[2].url).toContain("uploadId=U1");
		// complete 请求体包含 etag
		expect(String(axiosCalls[2].data)).toContain("<ETag>\"etag-part-1\"</ETag>");
		expect(requestCalls.map((c) => c.path)).toEqual([
			"/api/nos/token/alloc",
			"/api/voice/workbench/voice/batch/upload/preCheck",
			"/api/voice/workbench/voice/batch/upload/v2",
		]);
		expect(res.body.code).toBe(200);
		expect(res.body.data).toEqual({ voiceId: "v1" });
		// voiceData 语义：autoPublish/privacy 宽松相等
		const voiceData = JSON.parse(
			(requestCalls[2].data as { voiceData: string }).voiceData,
		) as { autoPublish: boolean; privacy: boolean }[];
		expect(voiceData[0].autoPublish).toBe(true);
		expect(voiceData[0].privacy).toBe(false);
	});
});

// ---------------------------------------------------------------- cloud_upload_token
describe("cloud_upload_token", () => {
	beforeEach(() => vi.unstubAllGlobals());

	const baseQuery = {
		md5: "abc123",
		fileSize: 12345,
		filename: "song.mp3",
		bitrate: 128,
		cookie: "MUSIC_U=x",
	};

	it("缺少必要参数时 400 拒绝", async () => {
		await expect(
			cloudUploadToken({ fileSize: 1, filename: "a.mp3" }, asRequest(async () => ({}))),
		).rejects.toMatchObject({ status: 400, body: { code: 400 } });
	});

	it("完整流程：check → token → lbs，拼出上传 URL", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: string) => {
				expect(String(url)).toContain("wanproxy.127.net/lbs");
				return { ok: true, json: async () => ({ upload: ["https://upload.test"] }) };
			}),
		);
		const requestCalls: string[] = [];
		const request = asRequest(async (path: string) => {
			requestCalls.push(path as string);
			if ((path as string) === "/api/cloud/upload/check") {
				return { status: 200, body: { needUpload: true, songId: 0 }, cookie: [] };
			}
			return {
				status: 200,
				body: { result: { token: "tok", objectKey: "x/y.mp3", resourceId: "rid1" } },
				cookie: ["ck=1"],
			};
		});
		const res = (await cloudUploadToken(baseQuery, request)) as {
			body: { code: number; data: Record<string, unknown> };
		};
		expect(requestCalls).toEqual(["/api/cloud/upload/check", "/api/nos/token/alloc"]);
		expect(res.body.code).toBe(200);
		expect(res.body.data.uploadToken).toBe("tok");
		expect(res.body.data.objectKey).toBe("x/y.mp3");
		expect(res.body.data.uploadUrl).toBe(
			"https://upload.test/jd-musicrep-privatecloud-audio-public/x%2Fy.mp3?offset=0&complete=true&version=1.0",
		);
	});

	it("lbs 获取失败时 500 拒绝", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new Error("lbs down");
			}),
		);
		const request = asRequest(async (path: string) => {
			if ((path as string) === "/api/cloud/upload/check") {
				return { status: 200, body: { needUpload: true, songId: 0 }, cookie: [] };
			}
			return {
				status: 200,
				body: { result: { token: "t", objectKey: "k", resourceId: "r" } },
				cookie: [],
			};
		});
		await expect(cloudUploadToken(baseQuery, request)).rejects.toMatchObject({
			status: 500,
			body: { code: 500, msg: "获取上传服务器地址失败" },
		});
	});
});

// ---------------------------------------------------------------- song_url_v1 / song_url_match
describe("song_url unblock 降级", () => {
	it("song_url_v1：unblock=true 但依赖不可用 → 走正常网易接口", async () => {
		const calls: { path: string; data: unknown }[] = [];
		const request = asRequest(async (path: string, data: unknown) => {
			calls.push({ path: path as string, data });
			return { status: 200, body: {}, cookie: [] };
		});
		await songUrlV1({ id: "123", level: "standard", unblock: "true" }, request);
		expect(calls).toHaveLength(1);
		expect(calls[0].path).toBe("/api/song/enhance/player/url/v1");
		expect(calls[0].data).toMatchObject({ ids: "[123]", level: "standard", encodeType: "flac" });
	});

	it("song_url_v1：unblock=true 且依赖可用 → 走解锁路径", async () => {
		unblockState.mode = "ok";
		const calls: unknown[] = [];
		const request = asRequest(async () => {
			calls.push(1);
			return { status: 200, body: {}, cookie: [] };
		});
		const res = (await songUrlV1({ id: "123", level: "standard", unblock: "true" }, request)) as {
			status: number;
			body: { code: number; data: { url: string }[] };
		};
		expect(calls).toHaveLength(0);
		expect(res.status).toBe(200);
		expect(res.body.data[0].url).toBe("https://mocked.example/unblock.mp3");
	});

	it("song_url_v1：sky/vivid 音质分支语义保留", async () => {
		const seen: unknown[] = [];
		const request = asRequest(async (_p: string, data: unknown) => {
			seen.push(data);
			return { status: 200, body: {}, cookie: [] };
		});
		await songUrlV1({ id: "1", level: "sky" }, request);
		expect(seen[0]).toMatchObject({ immerseType: "c51" });
		await songUrlV1({ id: "1", level: "vivid" }, request);
		expect(seen[1]).toMatchObject({ encodeType: "mp3" });
	});

	it("song_url_match：依赖不可用 → 500（与原 require 语义一致）", async () => {
		const res = (await songUrlMatch({ id: "123" }, asRequest(async () => ({})))) as {
			status: number;
			body: { code: number; data: unknown[] };
		};
		expect(res.status).toBe(500);
		expect(res.body.code).toBe(500);
		expect(res.body.data).toEqual([]);
	});

	it("song_url_match：依赖可用 → 返回解锁 URL", async () => {
		unblockState.mode = "ok";
		const res = (await songUrlMatch({ id: "123" }, asRequest(async () => ({})))) as {
			status: number;
			body: { code: number; data: string };
		};
		expect(res.status).toBe(200);
		expect(res.body.data).toBe("https://mocked.example/unblock.mp3");
	});
});

// ---------------------------------------------------------------- login_qr_check（有意修复）
describe("login_qr_check", () => {
	it("成功：cookie 数组 join 为字符串", async () => {
		const request = asRequest(async () => ({
			status: 200,
			body: { code: 803 },
			cookie: ["MUSIC_U=a", "MUSIC_A=b"],
		}));
		const res = (await loginQrCheck({ key: "k" }, request)) as {
			body: { cookie: string };
		};
		expect(res.body.cookie).toBe("MUSIC_U=a;MUSIC_A=b");
	});

	it("请求抛错：返回空 cookie，不触发原实现的 ReferenceError", async () => {
		const request = asRequest(async () => {
			throw new Error("upstream 500");
		});
		const res = (await loginQrCheck({ key: "k" }, request)) as {
			status: number;
			body: object;
			cookie: unknown[];
		};
		expect(res.status).toBe(200);
		expect(res.body).toEqual({});
		expect(res.cookie).toEqual([]);
	});
});
