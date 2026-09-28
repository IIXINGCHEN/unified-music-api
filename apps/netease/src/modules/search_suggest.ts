// 搜索建议
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		s: query.keywords || "",
	};
	const type = query.type === "mobile" ? "keyword" : "web";
	return request(
		`/api/search/suggest/${type}`,
		data,
		createOption(query, "weapi"),
	);
});
