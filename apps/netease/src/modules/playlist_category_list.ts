// 歌单分类列表
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		cat: query.cat || "全部",
		limit: query.limit || 24,
		newStyle: true,
	};
	return request(`/api/playlist/category/list`, data, createOption(query));
});
