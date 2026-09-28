// 私信
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
		total: "true",
	};
	return request(`/api/msg/private/users`, data, createOption(query, "weapi"));
});
