// 热门歌手
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 50,
		offset: query.offset || 0,
		total: true,
	};
	return request(`/api/artist/top`, data, createOption(query, "weapi"));
});
