// Ported from KuGouMusicApi/module/login_wx_create.js — behavior identical to the original.
// 原版用裸 axios 直调微信开放平台（不走代理）；此处用 fetch 等价实现。
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	cryptoMd5,
	cryptoSha1,
	randomString,
	wx_appid,
	wx_lite_appid,
	wx_lite_secret,
	wx_secret,
} from "@music-api/kugou-crypto";

const isLite = process.env.platform === "lite";

const appid = isLite ? wx_lite_appid : wx_appid;
const secret = isLite ? wx_lite_secret : wx_secret;

/** 等价于原版的 axios({url, params})：GET + query，JSON 解析失败时回退原文（与 axios 一致） */
const axiosGet = async (
	url: string,
	params?: Record<string, string>,
): Promise<{ data: any }> => {
	const qs = params ? `?${new URLSearchParams(params)}` : "";
	const resp = await fetch(`${url}${qs}`);
	const text = await resp.text();
	if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${text}`);
	try {
		return { data: JSON.parse(text) };
	} catch {
		return { data: text };
	}
};

const getAccessToken = () => {
	return axiosGet("https://api.weixin.qq.com/cgi-bin/token", {
		appid,
		secret,
		grant_type: "client_credential",
	});
};

const getTicket = (accessToken: string) =>
	axiosGet("https://api.weixin.qq.com/cgi-bin/ticket/getticket", {
		access_token: accessToken,
		type: "2",
	});

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const answer: Record<string, any> = { status: 500, body: {}, cookie: [] };
		return new Promise<any>((resolve: any, reject: any) => {
			void (async () => {
				try {
					const accessTokenResp = await getAccessToken();
					if (accessTokenResp.data?.access_token) {
						const ticketResp = await getTicket(
							accessTokenResp.data.access_token,
						);

						if (ticketResp.data?.errcode === 0) {
							const ticket = ticketResp.data.ticket;
							const timestamp = Date.now();
							const noncestr = cryptoMd5(randomString());
							const signaturePrams = `appid=${appid}&noncestr=${noncestr}&sdk_ticket=${ticket}&timestamp=${timestamp}`;
							const signature = cryptoSha1(signaturePrams);
							const connectParams = {
								appid,
								noncestr,
								timestamp: `${timestamp}`,
								scope: "snsapi_userinfo",
								signature,
							};
							const connect = await axiosGet(
								"https://open.weixin.qq.com/connect/sdk/qrconnect",
								connectParams,
							);

							if (connect.data?.errcode === 0) {
								answer.status = 200;
								connect.data.qrcode["qrcodeurl"] =
									`https://open.weixin.qq.com/connect/confirm?uuid=${connect.data.uuid}`;
								answer.body = connect.data;
								resolve(answer);
							} else {
								answer.status = 502;
								answer.body = { status: 0, msg: connect.data };
								reject(answer);
							}
						} else {
							answer.status = 502;
							answer.body = { status: 0, msg: ticketResp.data };
							reject(answer);
						}
					} else {
						answer.status = 502;
						answer.body = { status: 0, msg: accessTokenResp.data };
						reject(answer);
					}
				} catch (e: any) {
					answer.status = 502;
					answer.body = { status: 0, msg: e };
					reject(answer);
				}
			})();
		});
	},
);
