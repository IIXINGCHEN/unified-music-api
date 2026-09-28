// 用户动态
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		getcounts: true,
		time: query.lasttime ?? -1,
		limit: query.limit ?? 30,
		total: false,
		fromRN: "true",
	};
	return request(`/api/event/get/${query.uid}`, data, createOption(query));
});
