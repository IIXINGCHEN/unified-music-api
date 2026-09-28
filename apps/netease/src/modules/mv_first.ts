// 最新MV
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		// 'offset': query.offset || 0,
		area: query.area || "",
		limit: query.limit || 30,
		total: true,
	};
	return request(`/api/mv/first`, data, createOption(query));
});
