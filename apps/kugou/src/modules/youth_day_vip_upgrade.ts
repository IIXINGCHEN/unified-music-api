// Ported from KuGouMusicApi/module/youth_day_vip_upgrade.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { srcappid } from "@music-api/kugou-crypto";

//升级vip
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const paramsMap: Record<string, any> = {
			kugouid: Number(params?.userid || params?.cookie?.userid || 0),
			ad_type: 1,
		};

		return useAxios({
			url: "/youth/v1/listen_song/upgrade_vip_reward",
			encryptType: "android",
			method: "post",
			params: paramsMap,
			cookie: params?.cookie,
		});
	},
);
