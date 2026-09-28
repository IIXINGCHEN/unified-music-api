import { afterEach, describe, expect, it } from "vitest";
import { createOption } from "../src/option.js";

afterEach(() => {
	delete process.env.NETEASE_COOKIE;
	delete process.env.ENABLE_RANDOM_CN_IP;
});

describe("createOption", () => {
	it("builds the default option bag", () => {
		const opt = createOption({ ids: "1" });
		expect(opt.crypto).toBe("");
		expect(opt.ua).toBe("");
		expect(opt.proxy).toBeUndefined();
		expect(opt.realIP).toBeUndefined();
		expect(opt.randomCNIP).toBe(false);
		expect(opt.e_r).toBeUndefined();
		expect(opt.domain).toBe("");
		expect(opt.checkToken).toBe(false);
		expect(opt.headers).toEqual({});
		expect(opt.timeout).toBe(0);
	});

	it("prefers query.crypto, then the positional arg", () => {
		expect(createOption({}, "weapi").crypto).toBe("weapi");
		expect(createOption({ crypto: "api" }, "weapi").crypto).toBe("api");
	});

	it("falls back to NETEASE_COOKIE", () => {
		process.env.NETEASE_COOKIE = "MUSIC_U=env";
		expect(createOption({}).cookie).toBe("MUSIC_U=env");
		expect(createOption({ cookie: "MUSIC_U=q" }).cookie).toBe("MUSIC_U=q");
	});

	it("positional checkToken is used when query has none", () => {
		expect(createOption({}, "", "v2").checkToken).toBe("v2");
		expect(createOption({ checkToken: "v3" }, "", "v2").checkToken).toBe("v3");
	});

	it("randomCNIP: env on -> default true unless explicitly false", () => {
		process.env.ENABLE_RANDOM_CN_IP = "true";
		expect(createOption({}).randomCNIP).toBe(true);
		expect(createOption({ randomCNIP: false }).randomCNIP).toBe(false);
		expect(createOption({ randomCNIP: "false" }).randomCNIP).toBe(false);
	});

	it("randomCNIP: env off -> default false unless explicitly true", () => {
		expect(createOption({}).randomCNIP).toBe(false);
		expect(createOption({ randomCNIP: true }).randomCNIP).toBe(true);
		expect(createOption({ randomCNIP: "true" }).randomCNIP).toBe(true);
	});

	it("passes through ua/proxy/realIP/headers/timeout/domain/e_r", () => {
		const opt = createOption({
			ua: "UA",
			proxy: "http://p:1",
			realIP: "1.1.1.1",
			headers: { a: "b" },
			timeout: 3000,
			domain: "https://x",
			e_r: true,
		});
		expect(opt.ua).toBe("UA");
		expect(opt.proxy).toBe("http://p:1");
		expect(opt.realIP).toBe("1.1.1.1");
		expect(opt.headers).toEqual({ a: "b" });
		expect(opt.timeout).toBe(3000);
		expect(opt.domain).toBe("https://x");
		expect(opt.e_r).toBe(true);
	});
});
