// 电台新人榜
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 100,
		offset: query.offset || 0,
	};
	return request(
		`/api/dj/toplist/newcomer`,
		data,
		createOption(query, "weapi"),
	);
});
