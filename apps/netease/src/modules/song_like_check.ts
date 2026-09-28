// 歌曲是否喜爱
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		trackIds: query.ids,
	};
	return request(`/api/song/like/check`, data, createOption(query));
});
