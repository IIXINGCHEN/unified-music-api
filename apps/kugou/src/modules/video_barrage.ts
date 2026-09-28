// Ported from KuGouMusicApi/module/video_barrage.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	badRequest,
	buildVideoBarrageListConfig,
	firstValue,
} from "./_comment.js";
// MV 视频弹幕（底层复用 MV 评论池）

export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		const videoId = firstValue(params.video_id, params.childrenid, params.id);
		const hash = firstValue(params.hash, params.mvhash, params.extdata);

		if (!videoId && !hash) {
			return Promise.resolve(badRequest("video_id 和 hash 至少需要传入一个"));
		}

		return useAxios(buildVideoBarrageListConfig(params));
	},
);
