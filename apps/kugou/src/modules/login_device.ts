// Ported from KuGouMusicApi/module/login_device.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { cryptoAesEncrypt, cryptoRSAEncrypt } from "@music-api/kugou-crypto";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const clienttime_ms = parseInt(String(new Date().getTime()));
		const encrypt = cryptoAesEncrypt({
			token: params.token || params.cookie?.token,
		});
		const dataMap: Record<string, any> = {
			plat: 1,
			userid: params.userid || params.cookie?.userid || 0,
			clienttime_ms,
			pk: cryptoRSAEncrypt({ clienttime_ms, key: encrypt.key }).toUpperCase(),
			params: encrypt.str,
		};

		return useAxios({
			baseURL: "https://userinfoservice.kugou.com",
			url: "/v2/get_dev",
			encryptType: "android",
			method: "POST",
			data: dataMap,
			cookie: params?.cookie || {},
		});
	},
);
