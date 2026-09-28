// 用户歌单
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		uid: query.uid,
		limit: query.limit || 30,
		offset: query.offset || 0,
		includeVideo: true,
	};
	return request(`/api/user/playlist`, data, createOption(query, "weapi"));
});
