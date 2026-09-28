// 云盘歌曲删除
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		songIds: [query.id],
	};
	return request(`/api/cloud/del`, data, createOption(query, "weapi"));
});
