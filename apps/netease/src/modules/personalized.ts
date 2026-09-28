// 推荐歌单
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 30,
		// offset: query.offset || 0,
		total: true,
		n: 1000,
	};
	return request(
		`/api/personalized/playlist`,
		data,
		createOption(query, "weapi"),
	);
});
