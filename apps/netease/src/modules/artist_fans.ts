// 歌手粉丝
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
		limit: query.limit || 20,
		offset: query.offset || 0,
	};
	return request(`/api/artist/fans/get`, data, createOption(query, "weapi"));
});
