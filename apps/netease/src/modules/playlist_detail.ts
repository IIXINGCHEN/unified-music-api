// 歌单详情
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
		n: 100000,
		s: query.s || 8,
	};
	return request(`/api/v6/playlist/detail`, data, createOption(query));
});
