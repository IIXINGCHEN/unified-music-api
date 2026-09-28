// Ported from KuGouMusicApi/module/user_purchased_albums.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { appid, clientver } from "@music-api/kugou-crypto";
// 已购专辑

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const dataMap: Record<string, any> = {
			appid,
			userid: Number(params?.cookie?.userid) || 0,
			token: params?.cookie?.token || "",
			page: Number(params?.page) || 1,
			pagesize: Number(params?.pagesize) || 15,
			clientver: String(clientver),
			deleted: 0,
		};

		return useAxios({
			url: "/openapi/v1/copyright/get_album_goods",
			method: "POST",
			data: dataMap,
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
