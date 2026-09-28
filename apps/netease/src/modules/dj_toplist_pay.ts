// 付费精品
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
		`/api/djradio/toplist/pay`,
		data,
		createOption(query, "weapi"),
	);
});
