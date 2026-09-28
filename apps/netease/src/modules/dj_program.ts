// 电台节目列表
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
	toBoolean,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		radioId: query.rid,
		limit: query.limit || 30,
		offset: query.offset || 0,
		asc: toBoolean(query.asc),
	};
	return request(`/api/dj/program/byradio`, data, createOption(query, "weapi"));
});
