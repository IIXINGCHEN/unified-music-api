// 历史每日推荐歌曲详情
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		date: query.date || "",
	};
	return request(
		`/api/discovery/recommend/songs/history/detail`,
		data,
		createOption(query, "weapi"),
	);
});
