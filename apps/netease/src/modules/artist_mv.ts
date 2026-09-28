// 歌手相关MV
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		artistId: query.id,
		limit: query.limit,
		offset: query.offset,
		total: true,
	};
	return request(`/api/artist/mvs`, data, createOption(query, "weapi"));
});
