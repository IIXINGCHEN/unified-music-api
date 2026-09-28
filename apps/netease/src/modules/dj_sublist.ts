// 订阅电台列表
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
		total: true,
	};
	return request(`/api/djradio/get/subed`, data, createOption(query, "weapi"));
});
