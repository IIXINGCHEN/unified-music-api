// Ported from KuGouMusicApi/module/user_playlist.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取用户歌单

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const userid = params?.cookie?.userid || params?.userid || 0;
		const token = params?.cookie?.token || params?.token || "";

		const dataMap: Record<string, any> = {
			userid,
			token,
			total_ver: 979,
			type: 2,
			page: params?.page || 1,
			pagesize: params?.pagesize || 30,
		};

		return useAxios({
			url: "/v7/get_all_list",
			encryptType: "android",
			method: "post",
			data: dataMap,
			params: { plat: 1, userid: Number(userid), token },
			cookie: params?.cookie,
			headers: { "x-router": "cloudlist.service.kugou.com" },
		});
	},
);
