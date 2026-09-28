// Ported from KuGouMusicApi/module/comment_playlist_send.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
import {
	badRequest,
	buildCommentSendConfig,
	extractResolvedResource,
	firstValue,
	PLAYLIST_COMMENT_CODE,
} from "./_comment.js";
import commentPlaylist from "./comment_playlist.js";
// 发送歌单评论

export default defineKgModule(
	async (params: Record<string, any>, useAxios: KgRequestFn) => {
		if (!`${params.content || ""}`.trim()) {
			return badRequest("content 不能为空");
		}

		const playlistId = firstValue(
			params.playlist_id,
			params.special_id,
			params.childrenid,
			params.id,
		);
		if (!playlistId) {
			return badRequest("id 不能为空");
		}

		let name = firstValue(
			params.name,
			params.playlist_name,
			params.childrenname,
		);
		if (!name) {
			const lookupResponse = await commentPlaylist(
				{ ...params, id: playlistId, page: 1, pagesize: 1 },
				useAxios,
			);
			name = extractResolvedResource(lookupResponse).name;
		}

		return useAxios(
			buildCommentSendConfig(
				{
					...params,
					special_id: playlistId,
					name,
				},
				PLAYLIST_COMMENT_CODE,
			),
		);
	},
);
