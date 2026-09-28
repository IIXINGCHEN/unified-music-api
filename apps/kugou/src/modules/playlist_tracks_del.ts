// Ported from KuGouMusicApi/module/playlist_tracks_del.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 对歌单删除歌曲

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const userid = params?.userid || params?.cookie?.userid || 0;
		const token = params?.token || params.cookie?.token || "";

		const resource = (params.fileids || "")
			.split(",")
			.map((s: any) => ({ fileid: Number(s) }));

		const dataMap: Record<string, any> = {
			listid: params.listid,
			userid,
			data: resource,
			type: 0,
			token,
			list_ver: 0,
		};

		return useAxios({
			url: "/v4/delete_songs",
			data: dataMap,
			method: "post",
			encryptType: "android",
			cookie: params?.cookie || {},
			headers: { "x-router": "cloudlist.service.kugou.com" },
		});
	},
);
