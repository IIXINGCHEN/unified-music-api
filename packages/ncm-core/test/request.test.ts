import { aesEncrypt } from "@music-api/ncm-crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { resetGlobalState } from "../src/globalState.js";
import {
	createRequest,
	type NcmResponse,
	resetRequestState,
} from "../src/request.js";
import { initNcmCore, resetTokenStore } from "../src/tokenStore.js";

interface Captured {
	url: string;
	init: RequestInit & { dispatcher?: unknown };
}

const jsonResponse = (
	body: unknown,
	status = 200,
	headers: Record<string, string> = {},
): Response =>
	new Response(typeof body === "string" ? body : JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json", ...headers },
	});

const makeFetch = (
	respond: (c: Captured) => Response | Promise<Response>,
): { fetchImpl: typeof fetch; captured: Captured[] } => {
	const captured: Captured[] = [];
	const fetchImpl = (async (url: unknown, init: unknown) => {
		const c = { url: String(url), init: init as Captured["init"] };
		captured.push(c);
		return respond(c);
	}) as typeof fetch;
	return { fetchImpl, captured };
};

const reqHeaders = (c: Captured): Record<string, string> =>
	(c.init.headers ?? {}) as Record<string, string>;

beforeEach(() => {
	resetTokenStore();
	resetRequestState();
	resetGlobalState();
	// Like the real app (which generates tmpdir/anonymous_token at boot),
	// tests install a default in-memory loader.
	initNcmCore({
		tokenLoader: () => "TEST_ANONYMOUS_TOKEN",
		xeapiKeyLoader: () => null,
	});
});

describe("crypto branch selection", () => {
	it("weapi: posts to /weapi/<path> with encrypted params", async () => {
		const { fetchImpl, captured } = makeFetch(() =>
			jsonResponse({ code: 200 }),
		);
		await createRequest(
			"/api/song/detail",
			{ ids: "1" },
			{ crypto: "weapi", fetchImpl },
		);
		expect(captured).toHaveLength(1);
		const c = captured[0];
		expect(c.url).toBe("https://music.163.com/weapi/song/detail");
		expect(c.init.method).toBe("POST");
		const body = new URLSearchParams(c.init.body as string);
		expect(body.get("params")).toBeTruthy();
		expect(body.get("encSecKey")).toBeTruthy();
		const h = reqHeaders(c);
		expect(h["User-Agent"]).toContain("Chrome");
		expect(h.Referer).toBe("https://music.163.com");
	});

	it("empty crypto defaults to eapi (APP_CONF.encrypt=true)", async () => {
		const { fetchImpl, captured } = makeFetch(() =>
			jsonResponse({ code: 200 }),
		);
		await createRequest("/api/song/detail", { ids: "1" }, { fetchImpl });
		expect(captured[0].url).toBe(
			"https://interfacepc.music.163.com/eapi/song/detail",
		);
		const body = new URLSearchParams(captured[0].init.body as string);
		expect(body.get("params")).toBeTruthy();
	});

	it("api: posts urlencoded data to interface domain", async () => {
		const { fetchImpl, captured } = makeFetch(() =>
			jsonResponse({ code: 200 }),
		);
		await createRequest(
			"/api/song/url",
			{ id: "123", br: 999000 },
			{ crypto: "api", fetchImpl },
		);
		expect(captured[0].url).toBe(
			"https://interface.music.163.com/api/song/url",
		);
		expect(captured[0].init.body as string).toContain("id=123");
		expect(captured[0].init.body as string).toContain("br=999000");
	});

	it("linuxapi: posts eparams to /api/linux/forward", async () => {
		const { fetchImpl, captured } = makeFetch(() =>
			jsonResponse({ code: 200 }),
		);
		await createRequest(
			"/api/song/detail",
			{ ids: "1" },
			{ crypto: "linuxapi", fetchImpl },
		);
		expect(captured[0].url).toBe("https://music.163.com/api/linux/forward");
		const body = new URLSearchParams(captured[0].init.body as string);
		expect(body.get("eparams")).toBeTruthy();
	});

	it('unknown crypto -> 502 (fetch("") throws)', async () => {
		await expect(
			createRequest("/api/x", {}, { crypto: "bogus" }),
		).rejects.toMatchObject({ status: 502 });
	});
});

describe("cookie auto-completion", () => {
	it("fills __remember_me/_ntes_nuid/WNMCID/deviceId + anonymous MUSIC_A", async () => {
		initNcmCore({ tokenLoader: () => "ANON_TOKEN_XYZ" });
		const { fetchImpl, captured } = makeFetch(() =>
			jsonResponse({ code: 200 }),
		);
		// weapi keeps the full processed cookie on the wire (api/eapi replace
		// it with the eapi header object, like the original)
		await createRequest("/api/song/detail", {}, { crypto: "weapi", fetchImpl });
		const cookie = reqHeaders(captured[0]).Cookie;
		expect(cookie).toContain("__remember_me=true");
		expect(cookie).toContain("_ntes_nuid=");
		expect(cookie).toContain("WNMCID=");
		expect(cookie).toContain("deviceId=");
		expect(cookie).toContain("MUSIC_A=ANON_TOKEN_XYZ");
	});

	it("applies the os profile defaults (osver/os/channel/appver)", async () => {
		const { fetchImpl, captured } = makeFetch(() =>
			jsonResponse({ code: 200 }),
		);
		await createRequest("/api/x", {}, { crypto: "api", fetchImpl });
		const cookie = reqHeaders(captured[0]).Cookie;
		expect(cookie).toContain(
			"osver=Microsoft-Windows-10-Professional-build-19045-64bit",
		);
		expect(cookie).toContain("os=pc");
		expect(cookie).toContain("appver=3.1.17.204416");
		expect(cookie).toContain("channel=netease");
	});

	it("does not add MUSIC_A when MUSIC_U is present", async () => {
		initNcmCore({ tokenLoader: () => "SHOULD_NOT_BE_USED" });
		const { fetchImpl, captured } = makeFetch(() =>
			jsonResponse({ code: 200 }),
		);
		await createRequest(
			"/api/song/detail",
			{},
			{ crypto: "api", cookie: { MUSIC_U: "REAL_U" }, fetchImpl },
		);
		const cookie = reqHeaders(captured[0]).Cookie;
		expect(cookie).toContain("MUSIC_U=REAL_U");
		expect(cookie).not.toContain("MUSIC_A");
	});

	it("anonymous token is loaded lazily (not at import)", async () => {
		let calls = 0;
		initNcmCore({
			tokenLoader: () => {
				calls++;
				return "LAZY";
			},
		});
		expect(calls).toBe(0);
		const { fetchImpl } = makeFetch(() => jsonResponse({ code: 200 }));
		await createRequest("/api/x", {}, { crypto: "api", fetchImpl });
		expect(calls).toBe(1);
	});

	it("parses string cookies", async () => {
		initNcmCore({ tokenLoader: () => "T" });
		const { fetchImpl, captured } = makeFetch(() =>
			jsonResponse({ code: 200 }),
		);
		await createRequest(
			"/api/x",
			{},
			{ crypto: "api", cookie: "MUSIC_U=abc; os=pc", fetchImpl },
		);
		expect(reqHeaders(captured[0]).Cookie).toContain("MUSIC_U=abc");
	});
});

describe("checkToken injection", () => {
	it("v2 writes X-antiCheatToken via injected provider", async () => {
		const seen: string[] = [];
		initNcmCore({
			getCheckToken: async (v) => {
				seen.push(v);
				return `token-${v}`;
			},
		});
		const { fetchImpl, captured } = makeFetch(() =>
			jsonResponse({ code: 200 }),
		);
		await createRequest(
			"/api/song/detail",
			{},
			{ crypto: "weapi", checkToken: "v2", fetchImpl },
		);
		expect(seen).toEqual(["v2"]);
		expect(reqHeaders(captured[0])["X-antiCheatToken"]).toBe("token-v2");
	});

	it("v3 writes X-antiCheatToken via per-call provider override", async () => {
		initNcmCore({ getCheckToken: async () => "global-one" });
		const { fetchImpl, captured } = makeFetch(() =>
			jsonResponse({ code: 200 }),
		);
		await createRequest(
			"/api/song/detail",
			{},
			{
				crypto: "weapi",
				checkToken: "v3",
				getCheckToken: async () => "call-one",
				fetchImpl,
			},
		);
		expect(reqHeaders(captured[0])["X-antiCheatToken"]).toBe("call-one");
	});

	it("checkToken without a provider rejects with a clear error", async () => {
		const { fetchImpl } = makeFetch(() => jsonResponse({ code: 200 }));
		await expect(
			createRequest(
				"/api/song/detail",
				{},
				{ crypto: "weapi", checkToken: "v2", fetchImpl },
			),
		).rejects.toThrow(/getCheckToken/);
	});
});

describe("response normalization", () => {
	it("numeric code 200 resolves", async () => {
		const { fetchImpl } = makeFetch(() => jsonResponse({ code: 200, data: 1 }));
		const ans = await createRequest("/api/x", {}, { crypto: "api", fetchImpl });
		expect(ans.status).toBe(200);
		expect(ans.body.code).toBe(200);
	});

	it("string code is Number()-ized", async () => {
		const { fetchImpl } = makeFetch(() =>
			jsonResponse({ code: "200", data: 1 }),
		);
		const ans = await createRequest("/api/x", {}, { crypto: "api", fetchImpl });
		expect(ans.body.code).toBe(200);
		expect(typeof ans.body.code).toBe("number");
	});

	it.each([201, 302, 400, 502, 800, 801, 802, 803])(
		"business code %i resolves as HTTP 200",
		async (code) => {
			const { fetchImpl } = makeFetch(() => jsonResponse({ code }));
			const ans = await createRequest(
				"/api/x",
				{},
				{ crypto: "api", fetchImpl },
			);
			expect(ans.status).toBe(200);
			expect(ans.body.code).toBe(code);
		},
	);

	it("non-200 business code rejects with the answer", async () => {
		const { fetchImpl } = makeFetch(() => jsonResponse({ code: 301 }));
		let thrown: NcmResponse | undefined;
		try {
			await createRequest("/api/x", {}, { crypto: "api", fetchImpl });
		} catch (e) {
			thrown = e as NcmResponse;
		}
		expect(thrown?.status).toBe(301);
		expect(thrown?.body.code).toBe(301);
	});

	it("non-JSON body stays a string", async () => {
		const { fetchImpl } = makeFetch(
			() => new Response("not json", { status: 200 }),
		);
		const ans = await createRequest("/api/x", {}, { crypto: "api", fetchImpl });
		expect(ans.body).toBe("not json");
		expect(ans.status).toBe(200);
	});

	it("out-of-range body code is normalized to 400", async () => {
		const { fetchImpl } = makeFetch(() => jsonResponse({ code: 99 }));
		await expect(
			createRequest("/api/x", {}, { crypto: "api", fetchImpl }),
		).rejects.toMatchObject({ status: 400 });
	});

	it("fetch network failure rejects as 502", async () => {
		const fetchImpl = (async () => {
			throw new Error("socket hang up");
		}) as typeof fetch;
		let thrown: NcmResponse | undefined;
		try {
			await createRequest("/api/x", {}, { crypto: "api", fetchImpl });
		} catch (e) {
			thrown = e as NcmResponse;
		}
		expect(thrown?.status).toBe(502);
		expect(thrown?.body.code).toBe(502);
		expect(thrown?.body.msg).toContain("socket hang up");
		expect(thrown?.cookie).toEqual([]);
	});
});

describe("e_r encrypted responses", () => {
	it("decrypts a real eapi-encrypted response (e_r=true)", async () => {
		const plain = JSON.stringify({ code: 200, profile: { userId: 7 } });
		const hex = aesEncrypt(plain, "ecb", "e82ckenh8dichen8", "", "hex");
		const { fetchImpl } = makeFetch(
			() =>
				new Response(Buffer.from(hex, "hex"), {
					status: 200,
					headers: { "content-type": "application/octet-stream" },
				}),
		);
		const ans = await createRequest(
			"/api/user/detail",
			{},
			{ crypto: "eapi", e_r: true, fetchImpl },
		);
		expect(ans.status).toBe(200);
		expect(ans.body.profile.userId).toBe(7);
	});
});

describe("NMTID probing", () => {
	it("collects NMTID from Set-Cookie (Domain stripped) and reuses it", async () => {
		initNcmCore({ tokenLoader: () => "T" });
		const { fetchImpl, captured } = makeFetch((_c) => {
			if (captured.length === 1) {
				return jsonResponse({ code: 200 }, 200, {
					"set-cookie": "NMTID=abc123; Domain=.music.163.com; Path=/",
				});
			}
			return jsonResponse({ code: 200 });
		});
		const first = await createRequest(
			"/api/song/detail",
			{},
			{ crypto: "eapi", fetchImpl },
		);
		expect(first.cookie).toEqual(["NMTID=abc123; Path=/"]);
		expect(first.cookie[0]).not.toContain("Domain=");

		await createRequest("/api/song/detail", {}, { crypto: "eapi", fetchImpl });
		expect(reqHeaders(captured[1]).Cookie).toContain("NMTID=abc123");
	});
});

describe("misc headers", () => {
	it("ip option sets X-Real-IP / X-Forwarded-For", async () => {
		// NOTE: options.randomCNIP -> ip wiring lives in server.js (the app
		// layer), which sets options.ip before calling createRequest.
		const { fetchImpl, captured } = makeFetch(() =>
			jsonResponse({ code: 200 }),
		);
		await createRequest(
			"/api/x",
			{},
			{ crypto: "api", ip: "1.2.3.4", fetchImpl },
		);
		const h = reqHeaders(captured[0]);
		expect(h["X-Real-IP"]).toBe("1.2.3.4");
		expect(h["X-Forwarded-For"]).toBe("1.2.3.4");
	});

	it("realIP option sets X-Real-IP / X-Forwarded-For", async () => {
		const { fetchImpl, captured } = makeFetch(() =>
			jsonResponse({ code: 200 }),
		);
		await createRequest(
			"/api/x",
			{},
			{ crypto: "api", realIP: "9.9.9.9", fetchImpl },
		);
		const h = reqHeaders(captured[0]);
		expect(h["X-Real-IP"]).toBe("9.9.9.9");
		expect(h["X-Forwarded-For"]).toBe("9.9.9.9");
	});

	it("timeout wires AbortSignal.timeout", async () => {
		const { fetchImpl, captured } = makeFetch(() =>
			jsonResponse({ code: 200 }),
		);
		await createRequest(
			"/api/x",
			{},
			{ crypto: "api", timeout: 5000, fetchImpl },
		);
		expect(captured[0].init.signal).toBeInstanceOf(AbortSignal);
	});
});

describe("xeapi", () => {
	it("rejects with a clear error when no public key is available", async () => {
		initNcmCore({ xeapiKeyLoader: () => null });
		const { fetchImpl } = makeFetch(() => jsonResponse({ code: 200 }));
		await expect(
			createRequest("/api/x", {}, { crypto: "xeapi", fetchImpl }),
		).rejects.toThrow("xeapi public key is missing");
	});

	it("loads the xeapi key lazily (not at import)", async () => {
		let calls = 0;
		initNcmCore({
			xeapiKeyLoader: () => {
				calls++;
				return null;
			},
		});
		expect(calls).toBe(0);
		const { fetchImpl } = makeFetch(() => jsonResponse({ code: 200 }));
		await expect(
			createRequest("/api/x", {}, { crypto: "xeapi", fetchImpl }),
		).rejects.toThrow();
		expect(calls).toBe(1);
	});
});
