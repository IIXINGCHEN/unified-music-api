// 歌曲相关视频
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.mvid || 0,
		type: 2,
		rcmdType: 20,
		limit: query.limit || 10,
		extInfo: JSON.stringify({ songId: query.songid }),
	};
	return request(`/api/mlog/rcmd/feed/list`, data, createOption(query));
});
