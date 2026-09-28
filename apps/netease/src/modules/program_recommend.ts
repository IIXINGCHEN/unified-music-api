// 推荐节目
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		cateId: query.type,
		limit: query.limit || 10,
		offset: query.offset || 0,
	};
	return request(
		`/api/program/recommend/v1`,
		data,
		createOption(query, "weapi"),
	);
});
