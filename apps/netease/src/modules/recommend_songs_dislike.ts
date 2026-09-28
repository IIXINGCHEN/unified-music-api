// 每日推荐歌曲-不感兴趣
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		resId: query.id, // 日推歌曲id
		resType: 4,
		sceneType: 1,
	};
	return request(
		`/api/v2/discovery/recommend/dislike`,
		data,
		createOption(query, "weapi"),
	);
});
