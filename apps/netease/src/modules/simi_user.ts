// 相似用户
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		songid: query.id,
		limit: query.limit || 50,
		offset: query.offset || 0,
	};
	return request(`/api/discovery/simiUser`, data, createOption(query, "weapi"));
});
