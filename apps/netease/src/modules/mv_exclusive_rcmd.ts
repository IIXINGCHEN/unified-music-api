// 网易出品
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		offset: query.offset || 0,
		limit: query.limit || 30,
	};
	return request(`/api/mv/exclusive/rcmd`, data, createOption(query));
});
