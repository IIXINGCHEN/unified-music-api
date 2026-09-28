// Ported from KuGouMusicApi/module/user_cloud_url.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import { signCloudKey } from "@music-api/kugou-crypto";
// 获取云盘音乐url

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const hash = String(params.hash).toLocaleLowerCase();
		const paramsMap: Record<string, any> = {
			hash: hash,
			ssa_flag: "is_fromtrack",
			version: "20102",
			ssl: 0,
			album_audio_id: params.album_audio_id ?? 0,
			pid: 20026,
			audio_id: params.audio_id ?? 0,
			kv_id: 2,
			key: signCloudKey(hash, 20026),
			bucket: "musicclound",
			name: params.name ?? "",
			with_res_tag: 0,
		};

		return useAxios({
			url: "/bsstrackercdngz/v2/query_musicclound_url",
			encryptType: "android",
			method: "get",
			params: paramsMap,
			cookie: params?.cookie,
		});
	},
);
