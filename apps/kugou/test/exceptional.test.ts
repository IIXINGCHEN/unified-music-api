/**
 * 例外模块独立测试：二维码 / 登录 / 评论 / listen-together / 上传。
 * 使用 stub 的 useAxios + mock 的 global fetch，验证多步流程与二进制语义。
 * 运行：pnpm test（vitest run）
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dist = (name: string) => `../dist/modules/${name}.js`;

// ---------- 通用 stub ----------
const okUseAxios = (handler?: (config: any) => any) => {
	const calls: any[] = [];
	const fn = async (config: any) => {
		calls.push(config);
		if (handler) return handler(config);
		return { status: 200, body: { status: 1, data: {} }, cookie: [] };
	};
	return { fn, calls };
};

type FetchHandler = (url: string, init: any) => any;
const mockFetch = (handler: FetchHandler) => {
	const calls: Array<{ url: string; init: any }> = [];
	const stub = async (url: any, init: any = {}) => {
		calls.push({ url: String(url), init });
		return handler(String(url), init);
	};
	vi.stubGlobal("fetch", stub);
	return calls;
};

const jsonResp = (data: any, status = 200) => ({
	ok: status >= 200 && status < 300,
	status,
	headers: new Headers({ "content-type": "application/json" }),
	json: async () => data,
	text: async () => JSON.stringify(data),
	arrayBuffer: async () => new ArrayBuffer(0),
});

beforeEach(() => {
	vi.unstubAllGlobals();
});
afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

// ============================================================ 二维码
describe("login_qr_create", () => {
	it("无 qrimg 时只返回 URL", async () => {
		const mod = (await import(dist("login_qr_create"))).default;
		const { fn } = okUseAxios();
		const res: any = await mod({ key: "testkey123" }, fn);
		expect(res.body.data.url).toBe(
			"https://h5.kugou.com/apps/loginQRCode/html/index.html?qrcode=testkey123",
		);
		expect(res.body.data.base64).toBe("");
	});

	it("qrimg=1 时返回真实 data URL", async () => {
		const mod = (await import(dist("login_qr_create"))).default;
		const { fn } = okUseAxios();
		const res: any = await mod({ key: "testkey123", qrimg: 1 }, fn);
		expect(res.body.data.base64).toMatch(/^data:image\/png;base64,/);
		// base64 可解码
		const b64 = res.body.data.base64.split(",")[1];
		expect(Buffer.from(b64, "base64").length).toBeGreaterThan(100);
	});
});

// ============================================================ 微信登录
describe("login_wx_check", () => {
	it("成功时解析 JSON body", async () => {
		const mod = (await import(dist("login_wx_check"))).default;
		mockFetch(() => jsonResp({ errcode: 0, errmsg: "ok" }));
		const { fn } = okUseAxios();
		const res: any = await mod({ uuid: "wxuuid123" }, fn);
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ errcode: 0, errmsg: "ok" });
	});

	it("网络失败时 502", async () => {
		const mod = (await import(dist("login_wx_check"))).default;
		mockFetch(() => {
			throw new Error("network down");
		});
		const { fn } = okUseAxios();
		await expect(mod({ uuid: "x" }, fn)).rejects.toMatchObject({
			status: 502,
		});
	});
});

describe("login_wx_create", () => {
	it("三步取 token/ticket/二维码", async () => {
		const mod = (await import(dist("login_wx_create"))).default;
		const calls = mockFetch((url) => {
			if (url.includes("cgi-bin/token"))
				return jsonResp({ access_token: "ACCESSTOKEN", expires_in: 7200 });
			if (url.includes("ticket/getticket"))
				return jsonResp({ errcode: 0, ticket: "TICKET123" });
			if (url.includes("qrconnect"))
				return jsonResp({
					errcode: 0,
					uuid: "WXUUID",
					qrcode: { qrcodeurl: "https://example/qr" },
				});
			throw new Error(`unexpected url ${url}`);
		});
		const { fn } = okUseAxios();
		const res: any = await mod({}, fn);
		expect(res.status).toBe(200);
		expect(calls).toHaveLength(3);
		// 第三步带签名参数
		const qrUrl = new URL(calls[2].url);
		expect(qrUrl.searchParams.get("appid")).toBeTruthy();
		expect(qrUrl.searchParams.get("signature")).toMatch(/^[0-9a-f]{40}$/);
		// 返回的二维码 URL 被改写为 confirm 链接
		expect(res.body.qrcode.qrcodeurl).toBe(
			"https://open.weixin.qq.com/connect/confirm?uuid=WXUUID",
		);
	});

	it("取 token 失败时 502", async () => {
		const mod = (await import(dist("login_wx_create"))).default;
		mockFetch(() => jsonResp({ errcode: 40013, errmsg: "invalid appid" }));
		const { fn } = okUseAxios();
		await expect(mod({}, fn)).rejects.toMatchObject({ status: 502 });
	});
});

// ============================================================ QQ 登录
describe("login_qq_qr_create", () => {
	it("生成二维码 base64", async () => {
		const mod = (await import(dist("login_qq_qr_create"))).default;
		// 三步：m_authorize → xlogin → ptqrshow（返回 PNG 二进制）
		const png = Buffer.from(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
			"base64",
		);
		const calls = mockFetch((url) => {
			if (url.includes("m_authorize"))
				return {
					ok: true,
					status: 200,
					headers: new Headers(),
					json: async () => ({}),
					text: async () =>
						'<html><script>src = "https://xui.ptlogin2.qq.com/cgi-bin/xlogin?x=1"</script></html>',
					arrayBuffer: async () => new ArrayBuffer(0),
				};
			if (url.includes("xlogin"))
				return {
					ok: true,
					status: 200,
					headers: new Headers([
						["set-cookie", "pt_login_sig=SIG123; Path=/"],
					]),
					json: async () => ({}),
					text: async () => "ok",
					arrayBuffer: async () => new ArrayBuffer(0),
				};
			if (url.includes("ptqrshow"))
				return {
					ok: true,
					status: 200,
					headers: new Headers([
						["set-cookie", "qrsig=QRSIG; Path=/"],
					]),
					json: async () => ({}),
					text: async () => "",
					arrayBuffer: async () =>
						png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength),
				};
			throw new Error(`unexpected ${url}`);
		});
		const { fn } = okUseAxios();
		const res: any = await mod({ qrimg: 1 }, fn);
		expect(res.status).toBe(200);
		expect(calls).toHaveLength(3);
		// body.qrcode 为 PNG 二进制的 base64
		expect(typeof res.body.qrcode).toBe("string");
		const decoded = Buffer.from(res.body.qrcode, "base64");
		expect(decoded.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
		expect(res.body.qrsig).toBe("QRSIG");
		expect(res.body.ptqrtoken).toBeGreaterThan(0);
	});
});

// ============================================================ 评论
describe("comment_music", () => {
	it("请求携带签名参数", async () => {
		const mod = (await import(dist("comment_music"))).default;
		const { fn, calls } = okUseAxios();
		await mod({ hash: "abc123", cookie: { userid: "1", token: "t" } }, fn);
		expect(calls.length).toBe(1);
		const cfg = calls[0];
		// 评论接口走 android 签名
		expect(cfg.encryptType).toBe("android");
		expect(cfg.data || cfg.params).toBeTruthy();
	});
});

describe("comment_floor_send", () => {
	it("楼层回复携带被回复信息", async () => {
		const mod = (await import(dist("comment_floor_send"))).default;
		const { fn, calls } = okUseAxios();
		await mod(
			{
				content: "回复测试",
				tid: "999",
				code: "song",
				special_id: "s1",
				childrenid: "c1",
				id: "i1",
				cookie: { userid: "1", token: "t" },
			},
			fn,
		);
		// 先查资源名，再发楼层回复
		expect(calls.length).toBe(2);
		const body = JSON.stringify(calls[1].data || calls[1].params);
		expect(body).toContain("999");
	});
});

// ============================================================ listen-together
describe("listen-together helpers", () => {
	it("_listen_together_common 导出通用参数构造器", async () => {
		const helpers: any = await import("../dist/modules/_listen_together_common.js");
		expect(helpers).toBeTruthy();
		const names = Object.keys(helpers);
		expect(names.length).toBeGreaterThan(0);
	});

	it("_comment 导出评论通用 helper", async () => {
		const helpers: any = await import("../dist/modules/_comment.js");
		expect(helpers.SONG_COMMENT_CODE).toBeTruthy();
		expect(typeof helpers.buildCommentSendConfig).toBe("function");
	});
});

// ============================================================ 歌单封面上传
describe("playlist_pic_upload", () => {
	it("无文件时直接拒绝", async () => {
		const mod = (await import(dist("playlist_pic_upload"))).default;
		const { fn } = okUseAxios();
		await expect(mod({}, fn)).rejects.toMatchObject({
			body: { status: 0 },
		});
	});

	it("二进制直传 octet-stream", async () => {
		const mod = (await import(dist("playlist_pic_upload"))).default;
		const calls = mockFetch(() =>
			jsonResp({ IsSuccess: true, FileName: "pic123.jpg" }),
		);
		const { fn } = okUseAxios();
		const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
		const res: any = await mod(
			{ data: buf, cookie: { userid: "1", token: "t" } },
			fn,
		);
		expect(res.status).toBe(200);
		expect(res.body.FileName).toBe("pic123.jpg");
		expect(calls.length).toBeGreaterThan(0);
		const body = calls[0].init.body;
		expect(Buffer.isBuffer(body) || body instanceof Uint8Array).toBe(true);
		expect(
			calls[0].init.headers["Content-Type"] ||
				calls[0].init.headers["content-type"],
		).toMatch(/octet-stream/);
	});
});

// ============================================================ 头像上传
describe("user_update_avatar", () => {
	it("非图片直接 400（reject）", async () => {
		const mod = (await import(dist("user_update_avatar"))).default;
		const { fn } = okUseAxios();
		await expect(
			mod(
				{ data: Buffer.from("not-an-image"), cookie: { userid: "1", token: "t" } },
				fn,
			),
		).rejects.toMatchObject({ status: 400 });
	});

	it("图片走 multipart 上传再调 user_update", async () => {
		const mod = (await import(dist("user_update_avatar"))).default;
		// 最小合法 PNG（1x1）
		const png = Buffer.from(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
			"base64",
		);
		const fetchCalls = mockFetch((url) => {
			if (url.includes("imgphp.kugou.com"))
				return jsonResp({ IsSuccess: true, FileName: ["avatar123.jpg"] });
			return jsonResp({ status: 1, data: {} });
		});
		const { fn, calls } = okUseAxios();
		const res: any = await mod(
			{ imgFile: png, filename: "avatar.png", cookie: { userid: "1", token: "t" } },
			fn,
		);
		expect(res.status).toBe(200);
		// 图床请求是 multipart
		const imgCall = fetchCalls.find((c) => c.url.includes("imgphp.kugou.com"));
		expect(imgCall).toBeTruthy();
		const ct =
			imgCall!.init.headers["Content-Type"] ||
			imgCall!.init.headers["content-type"];
		expect(ct).toMatch(/^multipart\/form-data; boundary=/);
		const bodyStr = Buffer.isBuffer(imgCall!.init.body)
			? imgCall!.init.body.toString("binary")
			: "";
		expect(bodyStr).toContain('name="file"');
		// body 中包含 PNG 二进制内容
		expect(bodyStr).toContain("PNG");
		// 第二步调了 user_update（useAxios）
		expect(calls.length).toBeGreaterThan(0);
	});
});

// ============================================================ 云盘上传
describe("user_cloud_upload", () => {
	it("无文件二进制时报错", async () => {
		const mod = (await import(dist("user_cloud_upload"))).default;
		const { fn } = okUseAxios();
		const res: any = await mod({ cookie: { userid: "1", token: "t" } }, fn);
		expect(res.status).toBe(500);
		expect(res.body.msg).toContain("请通过请求体传入文件二进制数据");
	});

	it("秒传分支：upload_id 为空则跳过分片", async () => {
		const mod = (await import(dist("user_cloud_upload"))).default;
		const fetchUrls: string[] = [];
		mockFetch((url, init) => {
			fetchUrls.push(url);
			// 步骤1 鉴权 / 步骤2 初始化（upload_id 为空 → 秒传）
			const data = url.includes("/upload/auth")
				? { status: 1, data: { authorization: "AUTH123" } }
				: { status: 1, data: { external_host: "bss.example.com" } };
			return jsonResp(data);
		});
		const { fn } = okUseAxios(() => {
			// 步骤5 add_files 返回 Buffer（AES 加密响应体格式）
			return {
				status: 200,
				body: Buffer.from(JSON.stringify({ status: 1, data: {} })),
				cookie: [],
			};
		});
		const buf = Buffer.alloc(1024, 0x41);
		const res: any = await mod(
			{
				data: buf,
				filename: "test.mp3",
				auto_match: 0,
				cookie: { userid: "1", token: "t" },
			},
			fn,
		);
		// 秒传分支不应出现分片上传请求
		const sliceCalls = fetchUrls.filter((u) => /multipart\/upload/.test(u));
		expect(sliceCalls).toHaveLength(0);
		expect(res.status).toBe(200);
		expect(res.body.uploadInfo).toBeTruthy();
		expect(res.body.uploadInfo.filesize).toBe(1024);
	});
});
