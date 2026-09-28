// 热门电台
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 30,
		offset: query.offset || 0,
	};
	return request(`/api/djradio/hot/v1`, data, createOption(query, "weapi"));
});
