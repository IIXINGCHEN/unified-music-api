// 每日推荐歌曲
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		afresh: query.afresh,
	};
	return request(
		`/api/v3/discovery/recommend/songs`,
		data,
		createOption(query, "weapi"),
	);
});
