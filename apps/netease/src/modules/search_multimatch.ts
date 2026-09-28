// 多类型搜索
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		type: query.type || 1,
		s: query.keywords || "",
	};
	return request(
		`/api/search/suggest/multimatch`,
		data,
		createOption(query, "weapi"),
	);
});
