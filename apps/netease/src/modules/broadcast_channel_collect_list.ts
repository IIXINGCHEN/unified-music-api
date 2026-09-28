// 广播电台 - 我的收藏
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		contentType: "BROADCAST",
		limit: query.limit || "99999",
		timeReverseOrder: "true",
		startDate: "4762584922000",
	};
	return request(
		`/api/content/channel/collect/list`,
		data,
		createOption(query),
	);
});
