// 电台最热主播榜
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 100,
		// 不支持 offset
	};
	return request(`/api/dj/toplist/popular`, data, createOption(query, "weapi"));
});
