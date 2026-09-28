// MV排行榜
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		area: query.area || "",
		limit: query.limit || 30,
		offset: query.offset || 0,
		total: true,
	};
	return request(`/api/mv/toplist`, data, createOption(query, "weapi"));
});
