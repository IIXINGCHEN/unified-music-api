// Ported from KuGouMusicApi/module/song_barrage.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	badRequest,
	buildSongBarrageListConfig,
	firstValue,
} from "./_comment.js";
// 歌曲弹幕（与歌曲评论 code=fc4... 为不同评论池）

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const specialId = firstValue(
			params.special_id,
			params.childrenid,
			params.id,
		);
		const hash = firstValue(params.hash, params.schash, params.extdata);

		if (!specialId && !hash) {
			return Promise.resolve(badRequest("special_id 和 hash 至少需要传入一个"));
		}

		return useAxios(buildSongBarrageListConfig(params));
	},
);
