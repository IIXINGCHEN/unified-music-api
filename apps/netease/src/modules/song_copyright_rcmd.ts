// 灰色歌曲的其他版本推荐
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		songid: query.songid || query.id,
	};
	return request(`/api/song/copyright/rcmd`, data, createOption(query, "eapi"));
});
