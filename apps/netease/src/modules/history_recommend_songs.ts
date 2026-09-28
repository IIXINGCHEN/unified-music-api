// 历史每日推荐歌曲
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {};
	return request(
		`/api/discovery/recommend/songs/history/recent`,
		data,
		createOption(query, "weapi"),
	);
});
