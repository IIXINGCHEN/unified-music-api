// 相关歌单推荐
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		scene: "playlist_head",
		playlistId: query.id,
		newStyle: "true",
	};
	return request(`/api/playlist/detail/rcmd/get`, data, createOption(query));
});
