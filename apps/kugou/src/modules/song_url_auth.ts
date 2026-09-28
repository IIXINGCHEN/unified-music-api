// Ported from KuGouMusicApi/module/song_url_auth.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { randomString } from "@music-api/kugou-crypto";

// 获取音乐urls
// quality 支持 魔法音乐
// piano 钢琴
// acappella 人声 伴奏 分离
// subwoofer 乐器
// ancient 尤克里里
// dj dj
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const quality = [
			"piano",
			"acappella",
			"subwoofer",
			"ancient",
			"dj",
			"surnay",
		].includes(params.quality)
			? `magic_${params?.quality}`
			: params.quality;

		const isLite = process.env.platform === "lite";
		const page_id = isLite ? 967177915 : 151369488;
		const ppage_id = isLite
			? params.ppage_id || "356753938,823673182,967485191"
			: "463467626,350369493,788954147";

		const dataMap: Record<string, any> = {
			album_id: Number(params.album_id ?? 0),
			area_code: 1,
			module: "",
			hash: (params?.hash || "").toLowerCase(),
			need_m: 0,
			ssa_flag: "is_fromtrack",
			version: 11430,
			open_time: params?.open_time || 0,
			ptype: 0,
			need_ogg: 1,
			page_id,
			auth: params?.auth || "",
			mtype: 0,
			quality: quality || 128,
			album_audio_id: Number(params.album_audio_id ?? 0),
			behavior: "play",
			pid: isLite ? 411 : 2,
			module_id: 51,
			cmd: 26,
			ppage_id,
			clientver: 11561,
			pidversion: 3001,
			cdnBackup: 1,
		};

		return useAxios({
			url: "/tracker/v5/url",
			method: "GET",
			params: dataMap,
			encryptType: "android",
			encryptKey: true,
			cookie: Object.assign({}, { dfid: randomString(24) }, params?.cookie),
		});
	},
);
