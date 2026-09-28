// Ported from KuGouMusicApi/module/video_url.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 获取视频urls
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const paramsMap: Record<string, any> = {
			backupdomain: 1,
			cmd: 123,
			ext: "mp4",
			ismp3: 0,
			hash: params.hash,
			pid: 1,
			type: 1,
		};

		return useAxios({
			url: "/v2/interface/index",
			method: "GET",
			params: paramsMap,
			encryptType: "android",
			encryptKey: true,
			headers: { "x-router": "trackermv.kugou.com" },
		});
	},
);
