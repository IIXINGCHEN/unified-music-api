// 易盾反作弊 Token 注册端点
// 通过易盾官方 Watchman SDK（Web 版，跑在 jsdom 模拟的浏览器环境里）
// 实时调用 getToken(businessId) 获取反作弊 token，供后续带 checkToken 的请求使用
//
// GET  /register/checktoken/v2        → 实时获取新 token（不缓存）
// POST /register/checktoken/v2        → 实时获取新 token
//
// 注意：每次获取都不缓存，模拟真实客户端每次请求使用新鲜 token，
// 避免反作弊 token 复用触发风控。
//
// 移植说明：原实现在模块顶层 require('jsdom')/require('axios')，缺包即整模块
// 加载失败。此处改为调用时动态 import：jsdom 未安装时仅本端点与 getToken
// 抛错（与原 require 位置的语义一致——原 require 也在首次调用链路上），
// 网关其余路由不受影响。axios 统一改为 global fetch。

import { APP_CONF } from "@music-api/ncm-core";
import { logger } from "../logger.js";

// 网易云音乐在易盾的 productNumber 与 businessId
const PRODUCT_NUMBER = "YD00000558929251";
const BUSINESS_ID = "bd5d2f973ef74cd2a61325a412ae54d9";
const TOOL_JS_URL = `${APP_CONF.dunStaticDomain}/tool.min.js`;

// 最小 HTML 外壳，模拟网页环境
const HTML =
	'<!doctype html><html><head><meta charset="UTF-8"></head><body></body></html>';

let toolJs = "";
// biome-ignore lint/suspicious/noExplicitAny: watchman SDK 无类型
let wm: any = null; // Watchman 实例（进程内复用，可反复 getToken）
// biome-ignore lint/suspicious/noExplicitAny: jsdom 实例
let dom: any = null; // jsdom 实例（失败时 close 释放活动句柄，避免泄漏）
let initPromise: Promise<unknown> | null = null;

// 获取 tool.min.js（内存缓存，避免每次初始化重复下载）
async function getToolJs(): Promise<string> {
	if (toolJs) return toolJs;
	const res = await fetch(TOOL_JS_URL, { signal: AbortSignal.timeout(10000) });
	if (!res.ok) {
		throw new Error(`Request failed with status code ${res.status}`);
	}
	toolJs = String(await res.text());
	return toolJs;
}

// 初始化 Watchman（进程内只初始化一次，实例可反复 getToken）
// biome-ignore lint/suspicious/noExplicitAny: watchman SDK 无类型
async function ensureWatchman(): Promise<any> {
	if (wm) return wm;
	if (initPromise) return initPromise;

	initPromise = (async () => {
		const js = await getToolJs();
		// jsdom 未安装时此处抛错，语义与原顶层 require 一致
		const { JSDOM, VirtualConsole } = await import("jsdom");
		const virtualConsole = new VirtualConsole();
		virtualConsole.on("jsdomError", () => {});
		dom = new JSDOM(HTML, {
			url: "https://music.163.com/",
			referrer: "https://music.163.com/",
			contentType: "text/html",
			runScripts: "dangerously",
			resources: "usable", // 允许动态加载 watchman.min.js / JSONP
			pretendToBeVisual: true,
			virtualConsole,
			beforeParse(window: Record<string, unknown>) {
				// 抹掉 headless 特征，避免易盾风控误判
				Object.defineProperty(window.navigator, "webdriver", {
					get: () => undefined,
				});
				(window as Record<string, unknown>).chrome = { runtime: {} };
				(window.navigator as unknown as Record<string, unknown>).languages = [
					"zh-CN",
					"zh",
				];
				(window.navigator as unknown as Record<string, unknown>).plugins = [
					1, 2, 3, 4, 5,
				];
			},
		});
		const script = dom.window.document.createElement("script");
		script.textContent = js;
		dom.window.document.body.appendChild(script);

		return new Promise((resolve, reject) => {
			let settled = false;
			const timer = setTimeout(() => {
				if (settled) return;
				settled = true;
				reject(new Error("watchman 初始化超时"));
			}, 15000);
			dom.window.initWatchman({
				auto: true,
				productNumber: PRODUCT_NUMBER,
				onload(instance: unknown) {
					if (settled) return;
					settled = true;
					clearTimeout(timer);
					wm = instance;
					resolve(instance);
				},
				onerror() {
					if (settled) return;
					settled = true;
					clearTimeout(timer);
					reject(new Error("watchman 初始化失败"));
				},
			});
		});
	})();

	try {
		return await initPromise;
	} catch (e) {
		// 失败路径：关闭 jsdom 释放 rAF/子资源/定时器等活动句柄，防止每次失败泄漏约 30MB
		if (dom) {
			dom.window.close();
			dom = null;
		}
		initPromise = null;
		wm = null;
		throw e;
	}
}

// 获取新 token
async function fetchToken(): Promise<string> {
	const instance = await ensureWatchman();
	const raw = instance.getInstance();

	await new Promise<void>((resolve) => {
		const timer = setTimeout(() => resolve(), 15000);
		raw.I(() => {
			clearTimeout(timer);
			resolve();
		});
	});

	return new Promise<string>((resolve) => {
		const timer = setTimeout(() => resolve(""), 15000);
		instance.getToken(BUSINESS_ID, (tk: unknown) => {
			clearTimeout(timer);
			resolve(typeof tk === "string" ? tk : "");
		});
	});
}

// 端点处理：每次实时获取新 token
// biome-ignore lint/suspicious/noExplicitAny: 端点签名与原实现一致
export default async function checktokenV2(): Promise<any> {
	let token = "";
	try {
		token = await fetchToken();
	} catch (e) {
		logger.warn("[checkToken v2]", (e as Error).message);
	}
	return {
		status: 200,
		body: { code: 200, token, registered: !!token },
	};
}

// 给 request.js 读取用：每次调用实时获取新 token，不缓存
export const getToken = async (): Promise<string> => {
	try {
		return await fetchToken();
	} catch (e) {
		logger.warn("[checkToken v2]", (e as Error).message);
		return "";
	}
};
