// 通知
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 30,
		time: query.lasttime || -1,
	};
	return request(`/api/msg/notices`, data, createOption(query, "weapi"));
});
