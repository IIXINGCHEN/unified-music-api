// Ported from KuGouMusicApi/module/artist_follow.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { cryptoAesEncrypt, rsaEncrypt2 } from "@music-api/kugou-crypto";

// 关注歌手
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const singerid = Number(params.id);
		const token = params?.token || params.cookie?.token || "";
		const userid = Number(params?.userid || params?.cookie?.userid || 0);
		const clienttime = Math.floor(Date.now() / 1000);

		const encrypt = cryptoAesEncrypt({ singerid, token });

		const paramsMap: Record<string, any> = {
			plat: 0,
			userid,
			singerid,
			source: 7,
			p: rsaEncrypt2({ clienttime, key: encrypt.key }),
			params: encrypt.str,
		};

		return useAxios({
			url: "/followservice/v3/follow_singer",
			method: "post",
			data: paramsMap,
			params: { clienttime },
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
