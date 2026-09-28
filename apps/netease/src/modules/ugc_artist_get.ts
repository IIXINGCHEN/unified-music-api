// 歌手简要百科信息
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		artistId: query.id,
	};
	return request(`/api/rep/ugc/artist/get`, data, createOption(query));
});
