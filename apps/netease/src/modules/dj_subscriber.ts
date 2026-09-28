// 电台详情
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		time: query.time || "-1",
		id: query.id,
		limit: query.limit || "20",
		total: "true",
	};
	return request(`/api/djradio/subscriber`, data, createOption(query, "weapi"));
});
