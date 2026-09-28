// Ported from KuGouMusicApi/module/user_listen.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { cryptoRSAEncrypt } from "@music-api/kugou-crypto";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const token = params?.token || params?.cookie?.token || "";
		const userid = params?.userid || params?.cookie?.userid || "0";

		const clienttime = Math.floor(Date.now() / 1000);

		const p = cryptoRSAEncrypt({ clienttime, token }).toUpperCase();
		const dataMap: Record<string, any> = {
			t_userid: userid,
			userid,
			list_type: params.type || 0,
			area_code: 1,
			cover: 2,
			p,
		};

		return useAxios({
			baseURL: "https://listenservice.kugou.com",
			url: "/v2/get_list",
			data: dataMap,
			params: { clienttime, plat: 0 },
			method: "POST",
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
