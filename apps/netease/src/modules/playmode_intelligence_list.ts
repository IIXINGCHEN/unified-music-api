// 智能播放
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		songId: query.id,
		type: "fromPlayOne",
		playlistId: query.pid,
		startMusicId: query.sid || query.id,
		count: query.count || 1,
	};
	return request(`/api/playmode/intelligence/list`, data, createOption(query));
});
