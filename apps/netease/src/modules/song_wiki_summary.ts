// 音乐百科基础信息
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		songId: query.id,
	};
	return request(`/api/song/play/about/block/page`, data, createOption(query));
});
