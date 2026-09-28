// 电台24小时节目榜
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 100,
		// 不支持 offset
	};
	return request(
		`/api/djprogram/toplist/hours`,
		data,
		createOption(query, "weapi"),
	);
});
