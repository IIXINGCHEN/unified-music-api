// 独家放送列表
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		offset: query.offset || 0,
		total: "true",
		limit: query.limit || 60,
	};
	return request(
		`/api/v2/privatecontent/list`,
		data,
		createOption(query, "weapi"),
	);
});
