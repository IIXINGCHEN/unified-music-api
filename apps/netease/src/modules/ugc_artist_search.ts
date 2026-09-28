// 搜索歌手
// 可传关键字或者歌手id
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		keyword: query.keyword,
		limit: query.limit || 40,
	};
	return request(`/api/rep/ugc/artist/search`, data, createOption(query));
});
