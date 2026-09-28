// Ported from KuGouMusicApi/module/login_qq_qr_create.js — behavior identical to the original.
// QQ 扫码登录 - 生成二维码。原版用 axios（带 resolveProxy 代理）；此处用 fetch/fetchViaProxy 等价实现。
import {
	defineKgModule,
	fetchViaProxy,
	type KgRequestFn,
	type ProxyConfig,
	resolveProxy,
} from "@music-api/kugou-core";
import { cryptoMd5, qq_appid, qq_lite_appid } from "@music-api/kugou-crypto";

const isLite = process.env.platform === "lite";

const APK_SIG_MD5 = "fe4a24d80fcf253a00676a808f62c2c6";
const proxy: ProxyConfig | null = resolveProxy();
const UA =
	"Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

const hash33 = (str: string): number => {
	let e = 0;
	for (let i = 0; i < str.length; i++) {
		e += (e << 5) + str.charCodeAt(i);
	}
	return 2147483647 & e;
};

/** 等价于原版的 axios({url, method: 'GET', proxy, headers, responseType}) */
const axiosGet = async (
	url: string,
	headers: Record<string, string>,
	asBuffer = false,
): Promise<{ data: any; headers: { "set-cookie": string[] } }> => {
	const init = { method: "GET", headers };
	const resp = proxy
		? await fetchViaProxy(url, init, proxy)
		: await fetch(url, init);
	if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${url}`);
	return {
		data: asBuffer ? Buffer.from(await resp.arrayBuffer()) : await resp.text(),
		headers: { "set-cookie": resp.headers.getSetCookie() },
	};
};

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const answer: Record<string, any> = { status: 500, body: {}, cookie: [] };
		return new Promise<any>((resolve: any, reject: any) => {
			void (async () => {
				try {
					const clientId = isLite ? qq_lite_appid : qq_appid;
					const time = Math.floor(Date.now() / 1000);
					const sign = cryptoMd5(`${APK_SIG_MD5}_${time}`);

					const authParams = new URLSearchParams({
						cancel_display: "1",
						sdkp: "a",
						display: "mobile",
						format: "json",
						sign,
						sdkv: "3.5.11.lite",
						response_type: "token",
						status_os: "11",
						client_id: `${clientId}`,
						switch: "1",
						status_version: "30",
						show_download_ui: "true",
						pf: "openmobile_android",
						scope: "all",
						compat_v: "1",
						status_machine: "MEIZU+18+Pro",
						style: "qr",
						time: `${time}`,
						redirect_uri: "auth://tauth.qq.com/",
					});
					const authResp = await axiosGet(
						`https://openmobile.qq.com/oauth2.0/m_authorize?${authParams.toString()}`,
						{
							"User-Agent": UA,
							Referer: "https://xui.ptlogin2.qq.com/",
						},
					);

					const srcMatch = (authResp.data as string)?.match(/src = "([^"]+)"/);
					if (!srcMatch) {
						answer.status = 502;
						answer.body = {
							status: 0,
							msg: "m_authorize 响应异常，未找到 xlogin 地址",
							data: String(authResp.data).slice(0, 300),
						};
						reject(answer);
						return;
					}
					const xloginUrl = srcMatch[1].replace(
						/\\x([0-9A-Fa-f]{2})/g,
						(_m: any, h: string) => String.fromCharCode(parseInt(h, 16)),
					);

					const xloginQuery = xloginUrl.split("?")[1] || "";
					const pt_openlogin_data = encodeURIComponent(xloginQuery);

					const cookieJar: Record<string, string> = {};
					const cookieStr = () =>
						Object.entries(cookieJar)
							.map(([k, v]) => `${k}=${v}`)
							.join("; ");
					const collectCookies = (setCookies: string[]) => {
						for (const c of setCookies) {
							const kv = c.split(";")[0];
							const idx = kv.indexOf("=");
							if (idx > 0) cookieJar[kv.slice(0, idx)] = kv.slice(idx + 1);
						}
					};
					const xloginResp = await axiosGet(xloginUrl, {
						"User-Agent": UA,
						Referer: "https://xui.ptlogin2.qq.com/",
					});
					collectCookies(xloginResp.headers["set-cookie"] || []);
					const pt_login_sig = cookieJar["pt_login_sig"];

					const t = Math.random();
					const qrResp = await axiosGet(
						`https://xui.ptlogin2.qq.com/ssl/ptqrshow?s=8&e=0&appid=716027609&type=0&t=${t}&daid=381&pt_3rd_aid=${clientId}`,
						{
							"User-Agent": UA,
							Referer: xloginUrl,
							Cookie: cookieStr(),
						},
						true,
					);
					collectCookies(qrResp.headers["set-cookie"] || []);
					const qrsig = cookieJar["qrsig"];

					if (!qrsig) {
						answer.status = 502;
						answer.body = { status: 0, msg: "未获取到 qrsig" };
						reject(answer);
						return;
					}

					const ptqrtoken = hash33(qrsig);

					answer.status = 200;
					answer.body = {
						qrcode: (qrResp.data as Buffer).toString("base64"),
						qrsig,
						ptqrtoken,
						pt_login_sig: pt_login_sig || "",
						pt_openlogin_data,
						xlogin_url: xloginUrl,
						cookie: cookieStr(),
					};
					resolve(answer);
				} catch (e: any) {
					answer.status = 502;
					answer.body = { status: 0, msg: e };
					reject(answer);
				}
			})();
		});
	},
);
