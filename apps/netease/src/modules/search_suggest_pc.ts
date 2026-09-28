// 搜索建议pc端
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		keyword: query.keyword || "",
	};
	return request(
		`/api/search/pc/suggest/keyword/get`,
		data,
		createOption(query),
	);
});
