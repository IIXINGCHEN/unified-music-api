// 电台详情
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.rid,
	};
	return request(`/api/djradio/v2/get`, data, createOption(query, "weapi"));
});
