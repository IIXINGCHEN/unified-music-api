// DIFM电台 - 播放列表
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 5,
		source: query.source || 0,
		channelId: query.channelId,
	};
	return request(`/api/dj/difm/playing/tracks/list`, data, createOption(query));
});
