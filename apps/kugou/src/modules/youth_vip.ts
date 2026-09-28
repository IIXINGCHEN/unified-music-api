// Ported from KuGouMusicApi/module/youth_vip.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 领取vip 需要登录
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const time = Date.now();
		const dataMap: Record<string, any> = {
			ad_id: 12307537187,
			play_end: time,
			play_start: time - 30000,
		};

		return useAxios({
			url: "/youth/v1/ad/play_report",
			encryptType: "android",
			method: "post",
			data: dataMap,
			cookie: params?.cookie,
		});
	},
);
