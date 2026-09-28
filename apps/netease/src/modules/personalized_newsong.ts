// 推荐新歌
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		type: "recommend",
		limit: query.limit || 10,
		areaId: query.areaId || 0,
	};
	return request(
		`/api/personalized/newsong`,
		data,
		createOption(query, "weapi"),
	);
});
