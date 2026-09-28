// 删除歌单
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		ids: `[${query.id}]`,
	};
	return request(`/api/playlist/remove`, data, createOption(query, "weapi"));
});
