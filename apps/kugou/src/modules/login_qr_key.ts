// Ported from KuGouMusicApi/module/login_qr_key.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { appid, srcappid } from "@music-api/kugou-crypto";

// 二维码 key 生成接口
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			baseURL: "https://login-user.kugou.com",
			url: "/v2/qrcode",
			method: "GET",
			params: {
				appid: params?.type === "web" ? 1014 : 1001,
				type: 1,
				plat: 4,
				qrcode_txt: `https://h5.kugou.com/apps/loginQRCode/html/index.html?appid=${appid}&`,
				srcappid,
			},
			encryptType: "web",
			cookie: params?.cookie || {},
		});
	},
);
