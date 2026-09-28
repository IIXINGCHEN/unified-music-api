// 更新歌单名
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
		name: query.name,
	};
	return request(`/api/playlist/update/name`, data, createOption(query));
});
