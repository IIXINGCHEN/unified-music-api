// 更新歌单描述
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
		desc: query.desc,
	};
	return request(`/api/playlist/desc/update`, data, createOption(query));
});
