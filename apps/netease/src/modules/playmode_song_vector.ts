// 云随机播放
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		ids: query.ids,
	};
	return request(`/api/playmode/song/vector/get`, data, createOption(query));
});
