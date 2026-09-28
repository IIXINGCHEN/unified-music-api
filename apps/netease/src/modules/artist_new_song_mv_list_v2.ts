// 获取关注歌手的新歌曲和 MV
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		startTimestamp: query.startTimestamp || query.before || Date.now(),
		sourceType: query.sourceType || 1,
		limit: query.limit || 10,
		firstRequest: query.firstRequest ?? true,
	};
	return request(
		`/api/sub/artist/new/works/song-mv/list/v2`,
		data,
		createOption(query, "eapi"),
	);
});
