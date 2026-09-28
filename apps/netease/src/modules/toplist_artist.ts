// 歌手榜
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		type: query.type || 1,
		limit: 100,
		offset: 0,
		total: true,
	};
	return request(`/api/toplist/artist`, data, createOption(query, "weapi"));
});
