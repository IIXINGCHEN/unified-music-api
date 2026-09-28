// 喜欢歌曲
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const like = query.like !== "false";
	const data = {
		trackId: query.id,
		userid: query.uid,
		like: like,
	};
	return request(`/api/song/like`, data, createOption(query));
});
