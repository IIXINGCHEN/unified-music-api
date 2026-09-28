// 电台节目榜
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 100,
		offset: query.offset || 0,
	};
	return request(`/api/program/toplist/v1`, data, createOption(query, "weapi"));
});
