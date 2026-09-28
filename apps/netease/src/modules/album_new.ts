// 全部新碟
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 30,
		offset: query.offset || 0,
		total: true,
		area: query.area || "ALL", //ALL:全部,ZH:华语,EA:欧美,KR:韩国,JP:日本
	};
	return request(`/api/album/new`, data, createOption(query, "weapi"));
});
