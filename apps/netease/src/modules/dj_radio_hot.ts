// 类别热门电台
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		cateId: query.cateId,
		limit: query.limit || 30,
		offset: query.offset || 0,
	};
	return request(`/api/djradio/hot`, data, createOption(query, "weapi"));
});
