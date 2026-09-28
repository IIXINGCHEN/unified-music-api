// 更新歌单标签
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
		tags: query.tags,
	};
	return request(`/api/playlist/tags/update`, data, createOption(query));
});
