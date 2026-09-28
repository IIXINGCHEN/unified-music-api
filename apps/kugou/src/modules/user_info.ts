// Ported from KuGouMusicApi/module/user_info.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	appid,
	clientver,
	cryptoRSAEncrypt,
	signParamsKey,
} from "@music-api/kugou-crypto";
//获取我的详细信息
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const token = params?.token || params?.cookie?.token || "";
		const userid = Number(params?.userid || params?.cookie?.userid || "0");
		const clienttime = Date.now();
		const mid =
			params?.mid || params?.cookie?.mid || params?.cookie?.KUGOU_API_MID || "";
		const p = cryptoRSAEncrypt({
			clienttime: clienttime,
			token: token,
		}).toUpperCase();

		const dataMap: Record<string, any> = {
			p,
			appid,
			mid,
			clientver,
			source: 0,
			clienttime,
			uuid: "-",
			userid,
			key: signParamsKey(clienttime),
		};

		return useAxios({
			baseURL: "http://relation.user.kugou.com",
			url: "/v1/get_my_userinfo",
			method: "POST",
			data: dataMap,
			cookie: params?.cookie || {},
			headers: { Host: "relation.user.kugou.com" },
		});
	},
);
