// Ported from KuGouMusicApi/module/login_qr_check.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { appid, srcappid } from "@music-api/kugou-crypto";

// 酷狗二维码状态检测
// 0 为二维码过期，1 为等待扫码，2 为待确认，4 为授权登录成功（4 状态码下会返回 token）
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return new Promise<any>((resolve: any, reject: any) => {
			useAxios({
				baseURL: "https://login-user.kugou.com",
				url: "/v2/get_userinfo_qrcode",
				method: "GET",
				params: {
					plat: 4,
					appid,
					srcappid,
					qrcode: params?.key,
					dev: params?.cookie?.KUGOU_API_DEV,
				},
				encryptType: "web",
				cookie: params?.cookie || {},
			})
				.then((resp: any) => {
					// biome-ignore lint/suspicious/noDoubleEquals: 原版语义保留
					if (resp.body?.data?.status == 4) {
						resp.cookie.push(`token=${resp.body?.data?.token}`);
						resp.cookie.push(`userid=${resp.body?.data?.userid}`);
					}
					resolve(resp);
				})
				.catch((e: any) => reject(e));
		});
	},
);
