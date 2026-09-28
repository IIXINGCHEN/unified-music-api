// 公开隐私歌单
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
		privacy: 0,
	};
	return request(`/api/playlist/update/privacy`, data, createOption(query));
});
