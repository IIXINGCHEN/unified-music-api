// Ported from KuGouMusicApi/module/playhistory_upload.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 提交听歌历史
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const userid = params?.userid || params?.cookie?.userid || 0;
		const token = params?.token || params?.cookie?.token || "";

		const songs = [
			{
				mxid: Number(params.mxid),
				op: 1,
				ot: Number(params.time || Math.floor(Date.now() / 1000)),
				pc: Number(params.pc || 1),
			},
		];
		const dataMap: Record<string, any> = { songs, token, userid };

		return useAxios({
			url: "/playhistory/v1/upload_songs",
			data: dataMap,
			encryptType: "android",
			method: "POST",
			params: { plat: 3 },
			cookie: params?.cookie || {},
		});
	},
);
