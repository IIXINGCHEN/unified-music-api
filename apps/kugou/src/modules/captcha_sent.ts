// Ported from KuGouMusicApi/module/captcha_sent.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 手机验证码发送
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			businessid: 5,
			mobile: `${params?.mobile}`,
			plat: 3,
		};

		return useAxios({
			baseURL: "http://login.user.kugou.com",
			url: "/v7/send_mobile_code",
			method: "POST",
			data: dataMap,
			encryptType: "android",
			cookie: { mid: params?.cookie?.KUGOU_API_MID },
		});
	},
);
