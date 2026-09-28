// Ported from KuGouMusicApi/module/brush.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { appid, clientver, signParamsKey } from "@music-api/kugou-crypto";

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const userid = params?.cookie?.userid || params?.userid || 0;
		const vip_type = params?.cookie?.vip_type || params?.vipType || 0;
		const dateTime = Date.now();

		const personal_recommend: Record<string, any> = {
			userid,
			appid,
			playlist_ver: 2,
			clienttime: dateTime,
			mid: params?.cookie?.KUGOU_API_MID,
			new_sync_point: dateTime,
			module_id: 1,
			action: "login",
			vip_type,
			vip_flags: 3,
			recommend_source_locked: 0,
			song_pool_id: Number(params?.song_pool_id || 0),
			callerid: 0,
			m_type: 1,
			kguid: userid,
			platform: "ios",
			area_code: 1,
			fakem: "ca981cfc583a4c37f28d2d49000013c16a0a",
			clientver: 11850,
			mode: params?.mode || "normal",
			active_swtich: "on",
			key: signParamsKey(dateTime),
		};

		const dataMap: Record<string, any> = {
			behaviors: [],
			abtest: {
				abtest: { shuashua: { commentcard: 2 } },
			},
			personal_recommend_params: personal_recommend,
		};

		return useAxios({
			url: "/genesisapi/v1/newepoch_song_rec/feed",
			data: dataMap,
			params: {
				sort_type: 1,
				platform: "ios",
				page: 1,
				content_ver: 4,
				clientver: 11850,
			},
			method: "post",
			encryptType: "android",
			cookie: params?.cookie || {},
		});
	},
);
